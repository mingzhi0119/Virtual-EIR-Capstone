"""Founder-confirmed evidence reviews and periodic check-ins, with immutable history."""

from datetime import datetime, timezone
from hashlib import sha256
import json
from uuid import uuid4

from eir.feature_models import (
    CheckInInput,
    CheckInRecord,
    EvidenceInput,
    EvidenceRecord,
    GoalReview,
    ReviewInput,
    Workspace,
)
from eir.feature_store import FeatureStore
from eir.planning import WorkspaceInvalid, current_plan, event
from eir.store import Conflict, now


def active_evidence(workspace: Workspace):
    replaced = {item.supersedes_id for item in workspace.evidence if item.supersedes_id}
    return [item for item in workspace.evidence if item.evidence_id not in replaced]


def review_fingerprint(workspace: Workspace) -> str:
    plan = current_plan(workspace)
    value = {
        "goal": workspace.goal.model_dump(mode="json", exclude={"status"}),
        "plan": plan.model_dump(mode="json"),
        "evidence": [
            item.model_dump(mode="json") for item in active_evidence(workspace)
        ],
    }
    return sha256(json.dumps(value, sort_keys=True).encode()).hexdigest()


class Reviews:
    def __init__(self, features: FeatureStore):
        self.features = features

    @staticmethod
    def require_active(workspace, plan_id=None):
        plan = current_plan(workspace)
        if plan is None or workspace.goal is None or workspace.goal.status != "active":
            raise Conflict(
                "An active, approved goal is required. Resume it before adding a report or correction."
            )
        if plan_id is not None and plan.plan_id != plan_id:
            raise Conflict("The approved plan changed. Reload before reviewing it.")
        return plan

    def add_evidence(self, venture_id: str, request: EvidenceInput):
        def change(workspace):
            plan = self.require_active(workspace)
            if request.observed_on > datetime.now(timezone.utc).date():
                raise WorkspaceInvalid("An observation cannot be dated in the future.")
            if request.task_id and request.task_id not in {
                task.task_id for task in plan.tasks
            }:
                raise WorkspaceInvalid(
                    "The evidence task must belong to the current approved plan."
                )
            if request.supersedes_id and request.supersedes_id not in {
                item.evidence_id for item in active_evidence(workspace)
            }:
                raise WorkspaceInvalid(
                    "Corrections must replace an active evidence record in this venture."
                )
            record = EvidenceRecord(
                **request.model_dump(exclude={"expected_revision"}),
                evidence_id=str(uuid4()),
                at=now(),
                plan_id=plan.plan_id,
            )
            workspace.evidence.append(record)
            return event(
                "evidence_added",
                plan_id=plan.plan_id,
                detail={
                    "evidence_id": record.evidence_id,
                    "supersedes_id": record.supersedes_id,
                },
            )

        return self.features.mutate(venture_id, request.expected_revision, change)

    def review(self, venture_id: str, request: ReviewInput):
        def change(workspace):
            plan = self.require_active(workspace, request.plan_id)
            indices = [item.criterion_index for item in request.criteria]
            if sorted(indices) != list(range(len(workspace.goal.success_criteria))):
                raise WorkspaceInvalid(
                    "Review each current success criterion exactly once."
                )
            allowed = {item.evidence_id for item in active_evidence(workspace)}
            for item in request.criteria:
                if (
                    len(set(item.evidence_ids)) != len(item.evidence_ids)
                    or not set(item.evidence_ids) <= allowed
                ):
                    raise WorkspaceInvalid(
                        "Use distinct, active evidence records from this venture; corrected records cannot support a new review."
                    )
                if item.verdict == "supported" and not item.evidence_ids:
                    raise WorkspaceInvalid(
                        "A supported criterion needs linked evidence, not task counts alone."
                    )
            if request.confirm_achievement and any(
                item.verdict != "supported" for item in request.criteria
            ):
                raise WorkspaceInvalid(
                    "Achievement requires every criterion to be supported. Save an uncertain or negative review without closing the goal."
                )
            if request.confirm_achievement and any(
                task.status not in {"done", "cancelled"} for task in plan.tasks
            ):
                raise WorkspaceInvalid(
                    "Finish or explicitly cancel remaining tasks before confirming goal achievement. You can save an evidence review while work remains."
                )
            record = GoalReview(
                review_id=str(uuid4()),
                at=now(),
                plan_id=plan.plan_id,
                plan_version=plan.version,
                basis_fingerprint=review_fingerprint(workspace),
                source_revision=workspace.revision + 1,
                criteria=request.criteria,
                limitations=request.limitations,
                confirmed_achievement=request.confirm_achievement,
            )
            workspace.reviews.append(record)
            events = [
                event(
                    "goal_reviewed",
                    plan_id=plan.plan_id,
                    detail={"review_id": record.review_id},
                )
            ]
            if request.confirm_achievement:
                workspace.goal.status = "achieved"
                events.append(
                    event(
                        "goal_status_updated",
                        plan_id=plan.plan_id,
                        detail={
                            "before": "active",
                            "after": "achieved",
                            "review_id": record.review_id,
                            "basis": "founder_confirmed_evidence_review",
                        },
                    )
                )
            return events

        return self.features.mutate(venture_id, request.expected_revision, change)

    def checkin(self, venture_id: str, request: CheckInInput):
        def change(workspace):
            plan = self.require_active(workspace, request.plan_id)
            if request.period_end > datetime.now(timezone.utc).date():
                raise WorkspaceInvalid(
                    "Report actual results through today, not a future period."
                )
            record = CheckInRecord(
                **request.model_dump(exclude={"expected_revision", "plan_id"}),
                checkin_id=str(uuid4()),
                at=now(),
                plan_id=plan.plan_id,
                plan_version=plan.version,
                task_snapshot=[task.model_dump() for task in plan.tasks],
            )
            workspace.checkins.append(record)
            return event(
                "checkin_saved",
                plan_id=plan.plan_id,
                detail={"checkin_id": record.checkin_id},
            )

        return self.features.mutate(venture_id, request.expected_revision, change)
