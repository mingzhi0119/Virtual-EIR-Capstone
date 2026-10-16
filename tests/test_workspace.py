"""Isolated actual SQLite persistence with a deterministic GOAT SSE boundary."""

import asyncio
from concurrent.futures import ThreadPoolExecutor
import json
from pathlib import Path
import sqlite3
from threading import Barrier

from fastapi.testclient import TestClient
import httpx
import pytest

from eir.app import create_app
from eir.coaching import GoatClient, ModelUnavailable
from eir.feature_models import DraftRequest, TaskUpdate
from eir.feature_store import FeatureStore
from eir.models import Profile
from eir.planning import Planner, event
from eir.store import Conflict, Store


def generated() -> dict:
    return {
        "rationale": "Interview within the five-person capacity, then review limited evidence.",
        "tasks": [
            {
                "task_id": "interviews",
                "title": "Interview five graduate students",
                "target_count": 5,
            },
            {
                "task_id": "review",
                "title": "Write an evidence review",
                "target_count": 1,
                "dependencies": ["interviews"],
            },
        ],
    }


class ModelBoundary:
    def __init__(self) -> None:
        self.output = json.dumps(generated())
        self.calls: list[dict] = []

    def __call__(self, request: httpx.Request) -> httpx.Response:
        self.calls.append(json.loads(request.content))
        body = (
            "data: "
            + json.dumps({"type": "token", "token": self.output})
            + '\n\ndata: {"type":"done"}\n\n'
        )
        return httpx.Response(200, text=body)


@pytest.fixture
def env(tmp_path: Path):
    store = Store(tmp_path / "workspace.sqlite3")
    boundary = ModelBoundary()
    goat = GoatClient("http://localhost:62606", httpx.MockTransport(boundary))
    client = TestClient(create_app(store=store, goat=goat))
    venture = client.post(
        "/api/ventures", json={"name": "Campus dinner", "customer": "Graduate students"}
    ).json()
    base = f"/api/ventures/{venture['venture_id']}/workspace"
    return client, store, boundary, venture, base


def draft(client, base, revision=0, **changes):
    payload = {
        "objective": "Understand recurring dinner access problems",
        "success_criteria": [
            "Five interviews and a written review of evidence and limitations"
        ],
        "constraints": "Five interviews maximum; no paid services",
        "expected_revision": revision,
        "model": "gemma4:26b",
        **changes,
    }
    return client.post(base + "/draft", json=payload)


def approved(client, base):
    response = draft(client, base)
    assert response.status_code == 200, response.text
    workspace = response.json()
    response = client.post(
        base + "/approve",
        json={
            "plan_id": workspace["plans"][0]["plan_id"],
            "expected_revision": workspace["revision"],
        },
    )
    assert response.status_code == 200, response.text
    return response.json()


def progress(client, base, workspace, **changes):
    task = workspace["plans"][-1]["tasks"][0]
    return client.post(
        base + "/tasks/" + task["task_id"],
        json={
            "expected_revision": workspace["revision"],
            "completed_count": 2,
            "status": "in_progress",
            "blocker": "",
            "result": "Two founder-reported interviews; limited sample.",
            **changes,
        },
    )


def test_migration_restart_and_old_client_preserve(env):
    client, store, _, venture, base = env
    assert client.get(base).json() == {
        "revision": 0,
        "goal": None,
        "plans": [],
        "events": [],
    }
    # Migration does not write an empty workspace or touch old profiles/sessions.
    with store.connect() as db:
        assert db.execute("SELECT COUNT(*) FROM workspaces").fetchone()[0] == 0
    workspace = approved(client, base)
    workspace = progress(client, base, workspace).json()
    legacy = Store(store.path)
    changed = venture["profile"] | {"customer": "Evening graduate students"}
    response = client.put(
        base.removesuffix("/workspace"),
        json={"profile": changed, "expected_revision": venture["revision"]},
    )
    assert response.status_code == 200
    fresh = FeatureStore(legacy)
    assert fresh.get(venture["venture_id"]).model_dump() == workspace
    assert (
        legacy.get(venture["venture_id"]).profile.customer
        == "Evening graduate students"
    )
    assert legacy.sessions(venture["venture_id"]) == []
    restarted = TestClient(
        create_app(store=legacy, goat=GoatClient("http://localhost:62606"))
    )
    assert restarted.get(base).json() == workspace
    with legacy.connect() as db:
        assert db.execute("SELECT COUNT(*) FROM revisions").fetchone()[0] == 2
        assert (
            db.execute("SELECT COUNT(*) FROM workspace_revisions").fetchone()[0]
            == workspace["revision"]
        )


def test_real_goat_boundary_ephemeral_session_and_proposal(env):
    client, store, boundary, venture, base = env
    response = draft(client, base)
    assert response.status_code == 200, response.text
    workspace = response.json()
    assert workspace["revision"] == 1 and workspace["goal"] is None
    assert workspace["plans"][0]["status"] == "draft"
    tasks = workspace["plans"][0]["tasks"]
    assert tasks[1]["dependencies"] == [tasks[0]["task_id"]]
    assert tasks[0]["task_id"] != "interviews"
    assert tasks[0]["completed_count"] == 0
    assert store.sessions(venture["venture_id"]) == []
    call = boundary.calls[0]
    assert call["model"] == "gemma4:26b"
    assert len(call["system_instruction"]) < 8000
    assert '"tasks"' in call["system_instruction"]
    assert len(call["messages"]) == 1
    assert FeatureStore(store).workspace_context(venture["venture_id"]) == {}
    assert progress(client, base, workspace).status_code == 409


def test_two_of_five_absolute_idempotent_stale_and_correction(env):
    client, store, _, venture, base = env
    initial = approved(client, base)
    changed = progress(client, base, initial)
    assert changed.status_code == 200
    workspace = changed.json()
    task = workspace["plans"][0]["tasks"][0]
    assert task["completed_count"] == 2 and task["target_count"] == 5
    assert task["status"] == "in_progress" and workspace["goal"]["status"] == "active"
    assert progress(client, base, initial).status_code == 409
    assert progress(client, base, workspace).json() == workspace
    corrected = progress(client, base, workspace, completed_count=1).json()
    assert corrected["plans"][0]["tasks"][0]["completed_count"] == 1
    assert corrected["events"][-1]["detail"]["before"]["completed_count"] == 2
    assert [item["revision"] for item in corrected["events"]] == list(
        range(1, corrected["revision"] + 1)
    )
    context = FeatureStore(store).workspace_context(venture["venture_id"])
    assert context["tasks"][0]["completed_count"] == 1
    assert "market validation" in context["limitation"]


@pytest.mark.parametrize(
    "changes",
    [
        {"completed_count": -1},
        {"completed_count": 6},
        {"completed_count": 1.5},
        {"completed_count": True},
        {"completed_count": "2"},
        {"status": "done", "completed_count": 2, "result": "Partial"},
        {"status": "done", "completed_count": 5, "result": "  "},
        {"status": "blocked", "blocker": ""},
        {"status": "not_started", "completed_count": 2},
    ],
)
def test_invalid_counts_and_states_are_422_with_no_writes(env, changes):
    client, _, _, _, base = env
    workspace = approved(client, base)
    response = progress(client, base, workspace, **changes)
    assert response.status_code == 422, response.text
    assert client.get(base).json() == workspace


def test_completion_blockers_dependency_and_unsupported_achievement(env):
    client, _, _, _, base = env
    workspace = approved(client, base)
    review_id = workspace["plans"][0]["tasks"][1]["task_id"]
    response = client.post(
        base + "/tasks/" + review_id,
        json={
            "expected_revision": workspace["revision"],
            "completed_count": 1,
            "status": "done",
            "result": "Review",
        },
    )
    assert response.status_code == 409
    workspace = progress(
        client, base, workspace, status="blocked", blocker="Participants unavailable"
    ).json()
    assert workspace["plans"][0]["tasks"][0]["blocker"] == "Participants unavailable"
    workspace = progress(
        client,
        base,
        workspace,
        completed_count=5,
        status="done",
        result="Five founder-reported interviews completed.",
    ).json()
    assert workspace["plans"][0]["tasks"][0]["status"] == "done"
    workspace = client.post(
        base + "/tasks/" + review_id,
        json={
            "expected_revision": workspace["revision"],
            "completed_count": 1,
            "status": "done",
            "result": "Written review: small self-reported sample, uncertain demand.",
        },
    ).json()
    response = client.post(
        base + "/goal",
        json={"expected_revision": workspace["revision"], "status": "achieved"},
    )
    assert response.status_code == 422 and "evidence" in response.text
    assert client.get(base).json() == workspace


def test_goal_pause_resume_cancel_and_stale(env):
    client, _, _, _, base = env
    workspace = approved(client, base)
    paused = client.post(
        base + "/goal",
        json={"expected_revision": workspace["revision"], "status": "paused"},
    ).json()
    assert paused["goal"]["status"] == "paused"
    assert progress(client, base, paused).status_code == 409
    assert (
        client.post(
            base + "/goal",
            json={"expected_revision": workspace["revision"], "status": "active"},
        ).status_code
        == 409
    )
    resumed = client.post(
        base + "/goal",
        json={"expected_revision": paused["revision"], "status": "active"},
    ).json()
    cancelled = client.post(
        base + "/goal",
        json={"expected_revision": resumed["revision"], "status": "cancelled"},
    ).json()
    assert cancelled["goal"]["status"] == "cancelled"
    assert progress(client, base, cancelled).status_code == 409


def test_approve_reject_edit_and_versioned_replan(env):
    client, _, _, _, base = env
    workspace = approved(client, base)
    workspace = progress(client, base, workspace).json()
    original = workspace["plans"][0]
    proposed_tasks = [dict(task) for task in original["tasks"]]
    proposed_tasks[0]["target_count"] = 6
    response = client.put(
        base + "/draft",
        json={
            "plan_id": original["plan_id"],
            "expected_revision": workspace["revision"],
            "rationale": "Founder proposes one extra interview",
            "tasks": proposed_tasks,
        },
    )
    assert response.status_code == 200, response.text
    workspace = response.json()
    assert workspace["plans"][0] == original
    proposal = workspace["plans"][1]
    assert proposal["version"] == 2 and proposal["status"] == "draft"
    assert proposal["tasks"][0]["task_id"] != original["tasks"][0]["task_id"]
    assert proposal["tasks"][1]["dependencies"] == [proposal["tasks"][0]["task_id"]]
    rejected = client.post(
        base + "/reject",
        json={
            "plan_id": proposal["plan_id"],
            "expected_revision": workspace["revision"],
        },
    ).json()
    assert rejected["plans"][1]["status"] == "rejected"
    assert rejected["goal"] == workspace["goal"]
    assert (
        client.post(
            base + "/approve",
            json={
                "plan_id": proposal["plan_id"],
                "expected_revision": rejected["revision"],
            },
        ).status_code
        == 409
    )
    workspace = draft(
        client, base, rejected["revision"], objective="Review dinner access evidence"
    ).json()
    proposal = workspace["plans"][-1]
    assert proposal["version"] == 3
    assert workspace["goal"]["objective"] != proposal["goal"]["objective"]
    edited = client.put(
        base + "/draft",
        json={
            "plan_id": proposal["plan_id"],
            "expected_revision": workspace["revision"],
            "rationale": "Founder edited this draft",
            "tasks": proposal["tasks"],
        },
    )
    assert edited.status_code == 200
    workspace = edited.json()
    workspace = client.post(
        base + "/approve",
        json={
            "plan_id": proposal["plan_id"],
            "expected_revision": workspace["revision"],
        },
    ).json()
    assert workspace["goal"]["objective"] == proposal["goal"]["objective"]
    assert workspace["plans"][0] == original
    assert (
        client.post(
            base + "/tasks/" + original["tasks"][0]["task_id"],
            json={
                "expected_revision": workspace["revision"],
                "completed_count": 3,
                "status": "in_progress",
            },
        ).status_code
        == 409
    )


def test_project_owned_plan_task_dependency_ids(env):
    client, _, _, _, base = env
    workspace = approved(client, base)
    second = client.post("/api/ventures", json={"name": "Creative service"}).json()
    other_base = f"/api/ventures/{second['venture_id']}/workspace"
    other = approved(client, other_base)
    plan = workspace["plans"][0]
    for action in ("approve", "reject"):
        assert (
            client.post(
                other_base + "/" + action,
                json={
                    "expected_revision": other["revision"],
                    "plan_id": plan["plan_id"],
                },
            ).status_code
            == 404
        )
    assert (
        client.post(
            other_base + "/tasks/" + plan["tasks"][0]["task_id"],
            json={
                "expected_revision": other["revision"],
                "completed_count": 2,
                "status": "in_progress",
            },
        ).status_code
        == 404
    )
    bad_tasks = [dict(task) for task in plan["tasks"]]
    bad_tasks[0]["task_id"] = other["plans"][0]["tasks"][0]["task_id"]
    assert (
        client.put(
            base + "/draft",
            json={
                "expected_revision": workspace["revision"],
                "plan_id": plan["plan_id"],
                "rationale": "Edit",
                "tasks": bad_tasks,
            },
        ).status_code
        == 422
    )
    assert client.get(other_base).json() == other
    assert client.get("/api/ventures/unknown/workspace").status_code == 404


@pytest.mark.parametrize(
    "output",
    [
        "not json",
        "[]",
        "{}",
        "x" * 24001,
        '{"rationale":"reason","tasks":[]}',
        json.dumps(
            {"rationale": "reason", "tasks": [{"title": "A", "target_count": 0}]}
        ),
        json.dumps(
            {
                "rationale": "reason",
                "tasks": [
                    {
                        "title": "A",
                        "target_count": 5,
                        "completed_count": 2,
                        "status": "in_progress",
                    }
                ],
            }
        ),
        json.dumps(
            {
                "rationale": "reason",
                "tasks": [{"task_id": "a", "title": "A", "dependencies": ["missing"]}],
            }
        ),
        json.dumps(
            {
                "rationale": "reason",
                "tasks": [{"task_id": "a", "title": "A", "dependencies": ["a"]}],
            }
        ),
        json.dumps(
            {
                "rationale": "reason",
                "tasks": [
                    {"task_id": "a", "title": "A"},
                    {"task_id": "a", "title": "B"},
                ],
            }
        ),
    ],
)
def test_malformed_model_no_workspace_or_session_writes(env, output):
    client, store, boundary, venture, base = env
    boundary.output = output
    before = client.get(base).json()
    response = draft(client, base)
    assert response.status_code == 502, response.text
    assert client.get(base).json() == before
    assert store.sessions(venture["venture_id"]) == []
    with store.connect() as db:
        assert db.execute("SELECT COUNT(*) FROM workspace_revisions").fetchone()[0] == 0


def test_clarification_max_two_and_stale_before_model(env):
    client, _, boundary, _, base = env
    response = draft(client, base, objective="", success_criteria=[])
    assert response.status_code == 422
    assert len(response.json()["detail"]["questions"]) == 2
    assert boundary.calls == []
    assert (
        draft(
            client,
            base,
            objective="Understand dinner access",
            success_criteria=["Review five interviews"],
        ).status_code
        == 200
    )
    assert len(boundary.calls) == 1
    assert draft(client, base).status_code == 409
    assert len(boundary.calls) == 1


def test_atomic_revision_concurrency_and_rollback(env):
    client, store, _, venture, base = env
    workspace = approved(client, base)
    task = workspace["plans"][0]["tasks"][0]
    features = FeatureStore(store)
    barrier = Barrier(2)

    def update(count):
        barrier.wait()
        planner = Planner(features, GoatClient("http://localhost:62606"))
        try:
            return planner.update_task(
                venture["venture_id"],
                task["task_id"],
                TaskUpdate(
                    expected_revision=workspace["revision"],
                    completed_count=count,
                    status="in_progress",
                ),
            ).revision
        except Conflict:
            return "conflict"

    with ThreadPoolExecutor(max_workers=2) as pool:
        outcomes = list(pool.map(update, [2, 3]))
    assert outcomes.count("conflict") == 1
    saved = features.get(venture["venture_id"])
    assert saved.revision == workspace["revision"] + 1
    with store.connect() as db:
        db.execute(
            "CREATE TRIGGER reject_workspace_revision BEFORE INSERT ON workspace_revisions BEGIN SELECT RAISE(ABORT, 'injected'); END"
        )
    with pytest.raises(sqlite3.IntegrityError):
        features.mutate(
            venture["venture_id"], saved.revision, lambda _: event("test_failure")
        )
    assert features.get(venture["venture_id"]) == saved


def test_model_inflight_stale_and_unavailable_leave_no_draft(tmp_path):
    store = Store(tmp_path / "state.sqlite3")
    venture = store.create(Profile(name="Dinner"))
    features = FeatureStore(store)

    class SlowGoat(GoatClient):
        async def reply(self, **kwargs):
            features.mutate(
                venture.venture_id, 0, lambda _: event("concurrent_founder_change")
            )
            return json.dumps(generated())

    request = DraftRequest(
        objective="Learn dinner needs",
        success_criteria=["Review five interviews"],
        expected_revision=0,
    )
    with pytest.raises(Conflict):
        asyncio.run(
            Planner(features, SlowGoat("http://localhost:62606")).draft(
                venture.venture_id, request
            )
        )
    assert features.get(venture.venture_id).plans == []

    class OfflineGoat(GoatClient):
        async def reply(self, **kwargs):
            raise ModelUnavailable("offline")

    request.expected_revision = 1
    with pytest.raises(ModelUnavailable):
        asyncio.run(
            Planner(features, OfflineGoat("http://localhost:62606")).draft(
                venture.venture_id, request
            )
        )
    assert features.get(venture.venture_id).revision == 1
    assert store.sessions(venture.venture_id) == []


def test_context_bounded_includes_current_only_and_preserves_full_data(env):
    client, store, _, venture, base = env
    workspace = approved(client, base)
    workspace = progress(client, base, workspace, result="访谈记录" * 240).json()
    features = FeatureStore(store)
    assert (
        len(
            json.dumps(
                features.workspace_context(venture["venture_id"]), ensure_ascii=True
            )
        )
        <= 1600
    )
    assert len(features.get(venture["venture_id"]).plans[0].tasks[0].result) == 960
    workspace = draft(
        client, base, workspace["revision"], objective="A proposed replacement goal"
    ).json()
    context = features.workspace_context(venture["venture_id"])
    assert context["goal"]["objective"] != "A proposed replacement goal"
    assert context["tasks"][0]["completed_count"] == 2


def test_configured_origin_port_is_explicit_and_validated(tmp_path, monkeypatch):
    store = Store(tmp_path / "isolated.sqlite3")
    default = TestClient(create_app(store=store))
    assert (
        default.get(
            "/api/health", headers={"Origin": "http://localhost:62608"}
        ).status_code
        == 403
    )
    monkeypatch.setenv("EIR_HTTP_PORT", "62608")
    isolated = TestClient(create_app(store=store))
    assert (
        isolated.get(
            "/api/health", headers={"Origin": "http://localhost:62608"}
        ).status_code
        == 200
    )
    assert (
        isolated.get(
            "/api/health", headers={"Origin": "http://127.0.0.1:62608"}
        ).status_code
        == 200
    )
    assert (
        isolated.get(
            "/api/health", headers={"Origin": "http://localhost:62607"}
        ).status_code
        == 403
    )
    assert (
        isolated.get(
            "/api/health", headers={"Origin": "http://evil.example:62608"}
        ).status_code
        == 403
    )
    for invalid in ("0", "65536", "http://localhost:62608", "*", "62608/evil"):
        monkeypatch.setenv("EIR_HTTP_PORT", invalid)
        with pytest.raises(ValueError, match="EIR_HTTP_PORT"):
            create_app(store=store)


def replan(client, base, workspace, *, tasks=None):
    source = max(
        (plan for plan in workspace["plans"] if plan["status"] == "approved"),
        key=lambda plan: plan["version"],
    )
    tasks = tasks if tasks is not None else [dict(task) for task in source["tasks"]]
    return client.put(
        base + "/draft",
        json={
            "plan_id": source["plan_id"],
            "expected_revision": workspace["revision"],
            "rationale": "Retain founder reports and revise the next plan",
            "tasks": tasks,
        },
    )


@pytest.mark.parametrize(
    "report",
    [
        {
            "completed_count": 3,
            "status": "in_progress",
            "result": "Three interviews completed",
        },
        {
            "completed_count": 2,
            "status": "in_progress",
            "result": "Corrected interview report",
        },
        {"completed_count": 2, "status": "blocked", "blocker": "Recruitment paused"},
    ],
)
def test_retained_report_replan_cannot_rollback_changed_source(env, report):
    client, store, _, venture, base = env
    workspace = progress(client, base, approved(client, base)).json()
    source = workspace["plans"][0]
    tasks = [dict(task) for task in source["tasks"]]
    tasks[0]["target_count"] = 6
    created = replan(client, base, workspace, tasks=tasks)
    assert created.status_code == 200, created.text
    workspace = created.json()
    candidate = workspace["plans"][-1]
    assert candidate["tasks"][0]["completed_count"] == 2
    assert candidate["tasks"][0]["target_count"] == 6
    assert candidate["source_plan_id"] == source["plan_id"]
    assert candidate["source_plan_revision"] == 3
    assert len(candidate["source_plan_fingerprint"]) == 64
    changed = client.post(
        base + "/tasks/" + source["tasks"][0]["task_id"],
        json={
            "expected_revision": workspace["revision"],
            **report,
        },
    )
    assert changed.status_code == 200, changed.text
    workspace = changed.json()
    # Even the current workspace revision cannot make an outdated carried report safe.
    response = client.post(
        base + "/approve",
        json={
            "plan_id": candidate["plan_id"],
            "expected_revision": workspace["revision"],
        },
    )
    assert response.status_code == 409 and "source plan" in response.text.lower()
    assert client.get(base).json() == workspace
    context = FeatureStore(store).workspace_context(venture["venture_id"])
    assert context["version"] == 1
    assert context["tasks"][0]["completed_count"] == report["completed_count"]
    assert context["tasks"][0]["target_count"] == 5
    # Saving the stale draft again must not silently refresh its source fingerprint.
    edited = client.put(
        base + "/draft",
        json={
            "plan_id": candidate["plan_id"],
            "expected_revision": workspace["revision"],
            "rationale": "Review this retained draft again",
            "tasks": candidate["tasks"],
        },
    )
    assert edited.status_code == 200
    workspace = edited.json()
    assert (
        workspace["plans"][-1]["source_plan_fingerprint"]
        == candidate["source_plan_fingerprint"]
    )
    assert (
        client.post(
            base + "/approve",
            json={
                "plan_id": candidate["plan_id"],
                "expected_revision": workspace["revision"],
            },
        ).status_code
        == 409
    )
    # A fresh replan uses the current reports and supersedes the stale proposal.
    workspace = replan(client, base, workspace).json()
    fresh = workspace["plans"][-1]
    response = client.post(
        base + "/approve",
        json={
            "plan_id": fresh["plan_id"],
            "expected_revision": workspace["revision"],
        },
    )
    assert response.status_code == 200, response.text
    workspace = response.json()
    assert (
        workspace["plans"][-1]["tasks"][0]["completed_count"]
        == report["completed_count"]
    )
    assert workspace["plans"][-2]["status"] == "rejected"


@pytest.mark.parametrize("approved_source", [False, True])
def test_draft_edit_rejects_completed_task_with_unfinished_dependency(
    env, approved_source
):
    client, _, _, _, base = env
    workspace = (
        approved(client, base) if approved_source else draft(client, base).json()
    )
    plan = workspace["plans"][0]
    tasks = [dict(task) for task in plan["tasks"]]
    tasks[1].update(status="done", completed_count=1, result="Reported review")
    response = client.put(
        base + "/draft",
        json={
            "plan_id": plan["plan_id"],
            "expected_revision": workspace["revision"],
            "rationale": "An invalid dependency completion",
            "tasks": tasks,
        },
    )
    assert response.status_code == 422 and "dependencies" in response.text
    assert client.get(base).json() == workspace


def test_approval_rechecks_legacy_draft_dependency_completion(env):
    client, store, _, venture, base = env
    workspace = draft(client, base).json()
    features = FeatureStore(store)

    def import_old_invalid_draft(state):
        # The prior implementation accepted this state. It must remain readable
        # so approval can reject it clearly rather than fail while loading JSON.
        task = state.plans[0].tasks[1]
        task.status, task.completed_count, task.result = "done", 1, "Old report"
        return event("legacy_fixture_import")

    saved = features.mutate(
        venture["venture_id"], workspace["revision"], import_old_invalid_draft
    )
    response = client.post(
        base + "/approve",
        json={
            "plan_id": saved.plans[0].plan_id,
            "expected_revision": saved.revision,
        },
    )
    assert response.status_code == 422 and "dependencies" in response.text
    assert features.get(venture["venture_id"]) == saved


def test_reopening_prerequisite_requires_reopening_completed_dependents(env):
    client, _, _, _, base = env
    workspace = approved(client, base)
    workspace = progress(
        client,
        base,
        workspace,
        completed_count=5,
        status="done",
        result="Five interviews",
    ).json()
    review_id = workspace["plans"][0]["tasks"][1]["task_id"]
    response = client.post(
        base + "/tasks/" + review_id,
        json={
            "expected_revision": workspace["revision"],
            "status": "done",
            "completed_count": 1,
            "result": "Evidence review completed",
        },
    )
    assert response.status_code == 200
    workspace = response.json()
    response = progress(
        client,
        base,
        workspace,
        completed_count=3,
        status="in_progress",
        result="Corrected interviews",
    )
    assert response.status_code == 409 and "prerequisites" in response.text
    assert client.get(base).json() == workspace
    workspace = client.post(
        base + "/tasks/" + review_id,
        json={
            "expected_revision": workspace["revision"],
            "status": "in_progress",
            "completed_count": 0,
            "result": "Review must be repeated",
        },
    ).json()
    assert (
        progress(
            client, base, workspace, completed_count=3, status="in_progress"
        ).status_code
        == 200
    )


def test_task_lineage_tracks_source_versions_and_survives_omitted_echo(env):
    client, _, _, _, base = env
    workspace = approved(client, base)
    source = workspace["plans"][0]
    workspace = replan(client, base, workspace).json()
    candidate = workspace["plans"][-1]
    assert candidate["source_plan_id"] == source["plan_id"]
    for before, after in zip(source["tasks"], candidate["tasks"], strict=True):
        assert after["task_id"] != before["task_id"]
        assert after["source_task_id"] == before["task_id"]
    assert candidate["tasks"][1]["dependencies"] == [candidate["tasks"][0]["task_id"]]
    # Older clients omit the new output metadata; the server reconstructs it.
    without_metadata = [
        {key: value for key, value in task.items() if key != "source_task_id"}
        for task in candidate["tasks"]
    ]
    response = client.put(
        base + "/draft",
        json={
            "plan_id": candidate["plan_id"],
            "expected_revision": workspace["revision"],
            "rationale": "Retain source mapping",
            "tasks": without_metadata,
        },
    )
    assert response.status_code == 200
    workspace = response.json()
    assert workspace["plans"][-1]["tasks"] == candidate["tasks"]
    workspace = client.post(
        base + "/approve",
        json={
            "plan_id": candidate["plan_id"],
            "expected_revision": workspace["revision"],
        },
    ).json()
    workspace = replan(client, base, workspace).json()
    next_candidate = workspace["plans"][-1]
    assert next_candidate["source_plan_id"] == candidate["plan_id"]
    assert (
        next_candidate["tasks"][0]["source_task_id"] == candidate["tasks"][0]["task_id"]
    )
    assert next_candidate["tasks"][0]["source_task_id"] != source["tasks"][0]["task_id"]


def test_clients_and_model_cannot_forge_cross_venture_lineage(env):
    client, _, boundary, _, base = env
    workspace = approved(client, base)
    second = client.post("/api/ventures", json={"name": "Other venture"}).json()
    other_base = f"/api/ventures/{second['venture_id']}/workspace"
    other = approved(client, other_base)
    foreign_id = other["plans"][0]["tasks"][0]["task_id"]
    forged = [dict(task) for task in workspace["plans"][0]["tasks"]]
    forged[0]["source_task_id"] = foreign_id
    assert replan(client, base, workspace, tasks=forged).status_code == 422
    assert client.get(base).json() == workspace
    workspace = replan(client, base, workspace).json()
    candidate = workspace["plans"][-1]
    forged = [dict(task) for task in candidate["tasks"]]
    forged[0]["source_task_id"] = foreign_id
    response = client.put(
        base + "/draft",
        json={
            "plan_id": candidate["plan_id"],
            "expected_revision": workspace["revision"],
            "rationale": "Forged mapping",
            "tasks": forged,
        },
    )
    assert response.status_code == 422 and "server-owned" in response.text
    assert client.get(base).json() == workspace
    forged = [dict(task) for task in candidate["tasks"]]
    forged.append(
        {"title": "New work", "target_count": 1, "source_task_id": foreign_id}
    )
    assert (
        client.put(
            base + "/draft",
            json={
                "plan_id": candidate["plan_id"],
                "expected_revision": workspace["revision"],
                "rationale": "Forged new task",
                "tasks": forged,
            },
        ).status_code
        == 422
    )
    output = generated()
    output["tasks"][0]["source_task_id"] = foreign_id
    boundary.output = json.dumps(output)
    assert draft(client, base, workspace["revision"]).status_code == 502
    assert client.get(base).json() == workspace
    assert client.get(other_base).json() == other


def test_approval_rejects_older_pending_drafts_with_atomic_audit_events(env):
    client, store, _, venture, base = env
    workspace = draft(client, base).json()
    workspace = draft(client, base, workspace["revision"]).json()
    workspace = draft(client, base, workspace["revision"]).json()
    older_ids = [plan["plan_id"] for plan in workspace["plans"][:-1]]
    selected = workspace["plans"][-1]["plan_id"]
    approved_revision = workspace["revision"] + 1
    response = client.post(
        base + "/approve",
        json={
            "plan_id": selected,
            "expected_revision": workspace["revision"],
        },
    )
    assert response.status_code == 200, response.text
    workspace = response.json()
    assert workspace["revision"] == approved_revision
    assert [plan["status"] for plan in workspace["plans"]] == [
        "rejected",
        "rejected",
        "approved",
    ]
    approval_events = [
        item for item in workspace["events"] if item["revision"] == approved_revision
    ]
    assert len(approval_events) == 3
    superseded = [item for item in approval_events if item["kind"] == "plan_rejected"]
    assert {item["plan_id"] for item in superseded} == set(older_ids)
    assert all(
        item["source"] == "system"
        and item["detail"]
        == {
            "reason": "superseded_by_approval",
            "superseded_by_plan_id": selected,
        }
        for item in superseded
    )
    assert (
        client.post(
            base + "/approve",
            json={
                "plan_id": older_ids[0],
                "expected_revision": workspace["revision"],
            },
        ).status_code
        == 409
    )
    assert (
        client.post(
            base + "/approve",
            json={
                "plan_id": selected,
                "expected_revision": workspace["revision"],
            },
        ).json()
        == workspace
    )
    assert (
        FeatureStore(Store(store.path)).get(venture["venture_id"]).model_dump()
        == workspace
    )
    with store.connect() as db:
        assert (
            db.execute("SELECT COUNT(*) FROM workspace_revisions").fetchone()[0]
            == approved_revision
        )


def test_approval_leaves_newer_pending_draft_visible(env):
    client, _, _, _, base = env
    workspace = draft(client, base).json()
    workspace = draft(client, base, workspace["revision"]).json()
    workspace = draft(client, base, workspace["revision"]).json()
    response = client.post(
        base + "/approve",
        json={
            "plan_id": workspace["plans"][1]["plan_id"],
            "expected_revision": workspace["revision"],
        },
    )
    assert response.status_code == 200
    assert [plan["status"] for plan in response.json()["plans"]] == [
        "rejected",
        "approved",
        "draft",
    ]
