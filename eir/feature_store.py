"""Revisioned workspace JSON and snapshots on the existing Store's SQLite file."""

from __future__ import annotations

import json
import sqlite3
from collections.abc import Callable

from eir.feature_models import Workspace, WorkspaceEvent
from eir.store import Conflict, NotFound, Store, now


class FeatureStore:
    def __init__(self, store: Store) -> None:
        self.store = store
        self.path = store.path
        with store.connect() as db:
            db.executescript("""
                CREATE TABLE IF NOT EXISTS workspaces (
                    venture_id TEXT PRIMARY KEY REFERENCES ventures(venture_id),
                    revision INTEGER NOT NULL, workspace TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS workspace_revisions (
                    venture_id TEXT NOT NULL REFERENCES ventures(venture_id),
                    revision INTEGER NOT NULL, workspace TEXT NOT NULL,
                    saved_at TEXT NOT NULL,
                    PRIMARY KEY(venture_id, revision)
                );
            """)

    @staticmethod
    def _read(db: sqlite3.Connection, venture_id: str) -> Workspace:
        if (
            db.execute(
                "SELECT 1 FROM ventures WHERE venture_id=?", (venture_id,)
            ).fetchone()
            is None
        ):
            raise NotFound("Venture not found.")
        row = db.execute(
            "SELECT workspace FROM workspaces WHERE venture_id=?", (venture_id,)
        ).fetchone()
        return Workspace.model_validate_json(row["workspace"]) if row else Workspace()

    def get(self, venture_id: str) -> Workspace:
        with self.store.connect() as db:
            return self._read(db, venture_id)

    def require_revision(self, venture_id: str, expected_revision: int) -> Workspace:
        workspace = self.get(venture_id)
        if workspace.revision != expected_revision:
            raise Conflict("Workspace changed. Reload it before confirming your edit.")
        return workspace

    def mutate(
        self,
        venture_id: str,
        expected_revision: int,
        change: Callable[[Workspace], WorkspaceEvent | list[WorkspaceEvent] | None],
    ) -> Workspace:
        try:
            with self.store.connect() as db:
                db.execute("BEGIN IMMEDIATE")
                workspace = self._read(db, venture_id)
                if workspace.revision != expected_revision:
                    raise Conflict(
                        "Workspace changed. Reload it before confirming your edit."
                    )
                result = change(workspace)
                if result is None:
                    return workspace
                events = result if isinstance(result, list) else [result]
                workspace.revision += 1
                for event in events:
                    event.revision = workspace.revision
                    workspace.events.append(event)
                workspace = Workspace.model_validate(workspace.model_dump())
                payload = workspace.model_dump_json()
                db.execute(
                    "INSERT INTO workspaces VALUES (?, ?, ?) "
                    "ON CONFLICT(venture_id) DO UPDATE SET revision=excluded.revision, "
                    "workspace=excluded.workspace",
                    (venture_id, workspace.revision, payload),
                )
                db.execute(
                    "INSERT INTO workspace_revisions VALUES (?, ?, ?, ?)",
                    (venture_id, workspace.revision, payload, now()),
                )
                return workspace
        except sqlite3.OperationalError as exc:
            if "locked" in str(exc).lower() or "busy" in str(exc).lower():
                raise Conflict(
                    "Workspace is busy. Reload and retry your edit."
                ) from exc
            raise

    def workspace_context(self, venture_id: str) -> dict:
        """Only confirmed current state; <=1600 serialized characters, never Profile."""
        workspace = self.get(venture_id)
        if workspace.goal is None:
            return {}
        plans = [plan for plan in workspace.plans if plan.status == "approved"]

        def short(value: str, budget: int) -> str:
            value = value[:budget]
            while len(json.dumps(value, ensure_ascii=True)) > budget:
                value = value[:-1]
            return value

        context: dict = {
            "revision": workspace.revision,
            "goal": {
                "objective": short(workspace.goal.objective, 300),
                "status": workspace.goal.status,
                "success_criteria": [
                    short(item, 100) for item in workspace.goal.success_criteria[:3]
                ],
                "constraints": short(workspace.goal.constraints, 120),
            },
            "tasks": [],
            "limitation": "Founder reports; task counts do not establish market validation.",
        }
        if plans:
            plan = max(plans, key=lambda item: item.version)
            context["plan_id"] = plan.plan_id
            context["version"] = plan.version
            context["total_tasks"] = len(plan.tasks)
            for task in plan.tasks:
                summary = {
                    "task_id": task.task_id,
                    "title": short(task.title, 100),
                    "completed_count": task.completed_count,
                    "target_count": task.target_count,
                    "status": task.status,
                    "blocker": short(task.blocker, 80),
                    "result": short(task.result, 100),
                }
                context["tasks"].append(summary)
                if len(json.dumps(context, ensure_ascii=True)) > 1550:
                    context["tasks"].pop()
                    break
            context["omitted_tasks"] = len(plan.tasks) - len(context["tasks"])
        if workspace.checkins:
            checkin = workspace.checkins[-1]
            context["latest_checkin"] = {
                "period_end": checkin.period_end.isoformat(),
                "next_review_on": checkin.next_review_on.isoformat(),
                "plan_version": checkin.plan_version,
                "results": short(checkin.results, 70),
                "learnings": short(checkin.learnings, 70),
                "blockers": short(checkin.blockers, 60),
                "next_priorities": [
                    short(item, 60) for item in checkin.next_priorities[:2]
                ],
                "omitted_priorities": max(0, len(checkin.next_priorities) - 2),
                "partial": True,
            }
        if workspace.reviews:
            review = workspace.reviews[-1]
            context["latest_goal_review"] = {
                "plan_version": review.plan_version,
                "verdicts": [
                    item.verdict
                    for item in sorted(
                        review.criteria, key=lambda item: item.criterion_index
                    )
                ],
                "limitations": short(review.limitations, 60),
                "current": not any(
                    item.revision > review.source_revision
                    and item.kind in {"plan_approved", "task_updated", "evidence_added"}
                    for item in workspace.events
                ),
                "basis": "Founder judgment, not independently verified evidence.",
            }
        # Reserve space for omission metadata even at the boundary.
        while len(json.dumps(context, ensure_ascii=True)) > 1600 and context["tasks"]:
            context["tasks"].pop()
            context["omitted_tasks"] += 1
        if len(json.dumps(context, ensure_ascii=True)) > 1600:
            # Keep both newest reports and numeric state within the shared context cap.
            context["goal"]["objective"] = short(workspace.goal.objective, 80)
            context["goal"]["success_criteria"] = [
                short(item, 40) for item in workspace.goal.success_criteria[:2]
            ]
            context["goal"]["constraints"] = short(workspace.goal.constraints, 40)
            context["partial"] = True
        return context
