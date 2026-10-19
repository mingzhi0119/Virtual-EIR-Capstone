"""Exercise the evidence-to-achievement and weekly-review workflows on real storage."""

from concurrent.futures import ThreadPoolExecutor
from datetime import date, timedelta
import json

from fastapi.testclient import TestClient
import pytest

from test_workspace import env as env, approved, progress, draft
from eir.app import create_app
from eir.coaching import GoatClient
from eir.feature_store import FeatureStore
from eir.reviews import review_fingerprint
from eir.store import Store


def add_evidence(client, base, workspace, **changes):
    return client.post(
        base + "/evidence",
        json={
            "expected_revision": workspace["revision"],
            "observation": "Two students reported price mattered more than speed.",
            "source": "Fictional interview notes, participants A and B",
            "observed_on": date.today().isoformat(),
            "sample_size": 2,
            "limitation": "Convenience sample, founder-reported; cannot establish market demand.",
            **changes,
        },
    )


def review(client, base, workspace, **changes):
    return client.post(
        base + "/reviews",
        json={
            "expected_revision": workspace["revision"],
            "plan_id": workspace["plans"][-1]["plan_id"],
            "criteria": [
                {
                    "criterion_index": index,
                    "verdict": "uncertain",
                    "evidence_ids": [],
                    "reasoning": "The available observations do not meet this criterion yet.",
                }
                for index in range(len(workspace["goal"]["success_criteria"]))
            ],
            "limitations": "Self-reported, small sample; no independent verification.",
            **changes,
        },
    )


def checkin(client, base, workspace, **changes):
    today = date.today()
    return client.post(
        base + "/checkins",
        json={
            "expected_revision": workspace["revision"],
            "plan_id": workspace["plans"][-1]["plan_id"],
            "period_start": (today - timedelta(days=6)).isoformat(),
            "period_end": today.isoformat(),
            "results": "Two interviews completed; three remain.",
            "learnings": "Price may matter more; only two convenience interviews.",
            "blockers": "Students are unavailable during exams.",
            "next_priorities": [
                "Recruit three evening students",
                "Ask about actual dinner purchases",
            ],
            "next_review_on": (today + timedelta(days=7)).isoformat(),
            **changes,
        },
    )


def test_partial_negative_reviews_never_close_and_goal_bypass_stays_blocked(env):
    client, _, _, _, base = env
    workspace = approved(client, base)
    workspace = progress(client, base, workspace).json()
    workspace = add_evidence(client, base, workspace).json()
    for verdict in ["uncertain", "not_supported"]:
        assessment = {
            "criterion_index": 0,
            "verdict": verdict,
            "evidence_ids": [workspace["evidence"][0]["evidence_id"]],
            "reasoning": "Two of five interviews leave the learning criterion unresolved.",
        }
        blocked = review(
            client, base, workspace, criteria=[assessment], confirm_achievement=True
        )
        assert blocked.status_code == 422
        assert client.get(base).json() == workspace
        response = review(client, base, workspace, criteria=[assessment])
        assert response.status_code == 200, response.text
        workspace = response.json()
        assert workspace["goal"]["status"] == "active"
    assert (
        client.post(
            base + "/goal",
            json={"expected_revision": workspace["revision"], "status": "achieved"},
        ).status_code
        == 422
    )


def test_achievement_is_explicit_traceable_and_corrections_preserve_history(env):
    client, store, boundary, venture, base = env
    workspace = approved(client, base)
    workspace = progress(
        client,
        base,
        workspace,
        completed_count=5,
        status="done",
        result="Five interview notes are available.",
    ).json()
    workspace = client.post(
        base + "/tasks/" + workspace["plans"][0]["tasks"][1]["task_id"],
        json={
            "expected_revision": workspace["revision"],
            "completed_count": 1,
            "status": "done",
            "result": "Written review of the five interviews and sample limits.",
        },
    ).json()
    workspace = add_evidence(
        client,
        base,
        workspace,
        observation="Five interview notes and a written evidence review are available.",
        sample_size=5,
    ).json()
    evidence_id = workspace["evidence"][0]["evidence_id"]
    assessment = {
        "criterion_index": 0,
        "verdict": "supported",
        "evidence_ids": [evidence_id],
        "reasoning": "Five notes and the written limitations review meet the learning criterion; no market claim.",
    }
    response = review(client, base, workspace, criteria=[assessment])
    assert response.status_code == 200, response.text
    workspace = response.json()
    assert (
        workspace["goal"]["status"] == "active"
    )  # Supported is not automatic consent.
    response = review(
        client, base, workspace, criteria=[assessment], confirm_achievement=True
    )
    assert response.status_code == 200, response.text
    workspace = response.json()
    saved_review = workspace["reviews"][-1]
    assert workspace["goal"]["status"] == "achieved"
    assert workspace["events"][-1]["detail"]["review_id"] == saved_review["review_id"]
    assert saved_review["basis_fingerprint"] == review_fingerprint(
        FeatureStore(store).get(venture["venture_id"])
    )
    assert add_evidence(client, base, workspace).status_code == 409
    workspace = client.post(
        base + "/goal",
        json={"expected_revision": workspace["revision"], "status": "active"},
    ).json()
    workspace = add_evidence(
        client,
        base,
        workspace,
        supersedes_id=evidence_id,
        observation="Correction: only two interview notes can be substantiated.",
    ).json()
    assert workspace["reviews"][-1] == saved_review
    assert saved_review["basis_fingerprint"] != review_fingerprint(
        FeatureStore(store).get(venture["venture_id"])
    )
    assert review(client, base, workspace, criteria=[assessment]).status_code == 422
    assert (
        add_evidence(client, base, workspace, supersedes_id=evidence_id).status_code
        == 422
    )
    assert len(workspace["evidence"]) == 2
    assert (
        FeatureStore(Store(store.path))
        .get(venture["venture_id"])
        .model_dump(mode="json")
        == workspace
    )
    assert len(boundary.calls) == 1  # Human review never makes paid model calls.


@pytest.mark.parametrize(
    "changes",
    [
        {"criteria": []},
        {
            "criteria": [
                {
                    "criterion_index": 0,
                    "verdict": "supported",
                    "evidence_ids": [],
                    "reasoning": "All task counts are complete.",
                }
            ]
        },
        {
            "criteria": [
                {
                    "criterion_index": 0,
                    "verdict": "supported",
                    "evidence_ids": ["other-venture-evidence"],
                    "reasoning": "External record",
                }
            ]
        },
        {
            "criteria": [
                {
                    "criterion_index": True,
                    "verdict": "uncertain",
                    "reasoning": "Unknown",
                }
            ]
        },
        {"limitations": "   "},
        {"plan_id": "another-plan"},
        {"confirm_achievement": "true"},
    ],
)
def test_invalid_reviews_are_atomic(env, changes):
    client, _, _, _, base = env
    workspace = approved(client, base)
    response = review(client, base, workspace, **changes)
    assert response.status_code in {409, 422}, response.text
    assert client.get(base).json() == workspace


def test_all_criteria_exactly_once_and_venture_boundaries(env):
    client, _, _, _, base = env
    workspace = draft(
        client, base, success_criteria=["Five interviews", "Written review"]
    ).json()
    workspace = client.post(
        base + "/approve",
        json={
            "expected_revision": workspace["revision"],
            "plan_id": workspace["plans"][0]["plan_id"],
        },
    ).json()
    workspace = add_evidence(client, base, workspace).json()
    assessment = {
        "criterion_index": 0,
        "verdict": "uncertain",
        "reasoning": "Need more evidence",
    }
    for criteria in [
        [assessment],
        [assessment, assessment],
        [assessment | {"criterion_index": 2}, assessment],
    ]:
        assert review(client, base, workspace, criteria=criteria).status_code == 422
    other = client.post(
        "/api/ventures", json={"name": "Other fictional venture"}
    ).json()
    other_base = f"/api/ventures/{other['venture_id']}/workspace"
    other_workspace = approved(client, other_base)
    foreign_id = workspace["evidence"][0]["evidence_id"]
    assert (
        add_evidence(
            client, other_base, other_workspace, supersedes_id=foreign_id
        ).status_code
        == 422
    )
    assert (
        review(
            client,
            other_base,
            other_workspace,
            criteria=[
                assessment | {"verdict": "supported", "evidence_ids": [foreign_id]}
            ],
        ).status_code
        == 422
    )
    assert (
        add_evidence(
            client,
            other_base,
            other_workspace,
            task_id=workspace["plans"][0]["tasks"][0]["task_id"],
        ).status_code
        == 422
    )


def test_checkin_snapshots_persist_and_feed_new_sessions_without_changing_counts(env):
    client, store, boundary, venture, base = env
    workspace = approved(client, base)
    workspace = progress(client, base, workspace).json()
    tasks = workspace["plans"][0]["tasks"]
    response = checkin(client, base, workspace)
    assert response.status_code == 200, response.text
    workspace = response.json()
    record = workspace["checkins"][-1]
    assert record["task_snapshot"] == tasks == workspace["plans"][0]["tasks"]
    context = FeatureStore(store).workspace_context(venture["venture_id"])
    assert (
        context["latest_checkin"]["blockers"]
        == "Students are unavailable during exams."
    )
    assert context["latest_checkin"]["next_review_on"] == record["next_review_on"]
    assert len(json.dumps(context, ensure_ascii=True)) <= 1600
    session = client.post(base.removesuffix("/workspace") + "/sessions").json()
    response = client.post(
        base.removesuffix("/workspace") + f"/sessions/{session['session_id']}/chat",
        json={"message": "Review my last check-in", "model": "gemma4:26b"},
    )
    assert response.status_code == 200, response.text
    assert (
        "Students are unavailable during exams"
        in boundary.calls[-1]["system_instruction"]
    )
    restarted = TestClient(
        create_app(store=Store(store.path), goat=GoatClient("http://localhost:62606"))
    )
    assert restarted.get(base).json() == workspace
    # Later task corrections do not rewrite the historical weekly snapshot.
    changed = progress(client, base, workspace, completed_count=1).json()
    assert changed["checkins"][-1] == record


@pytest.mark.parametrize(
    "changes",
    [
        {"period_end": (date.today() + timedelta(days=1)).isoformat()},
        {"period_start": (date.today() + timedelta(days=1)).isoformat()},
        {"next_review_on": date.today().isoformat()},
        {"results": " "},
        {"learnings": " "},
        {"next_priorities": []},
        {"next_priorities": ["   "]},
        {"task_snapshot": []},
        {"plan_id": "old-plan"},
    ],
)
def test_invalid_checkins_do_not_write(env, changes):
    client, _, _, _, base = env
    workspace = approved(client, base)
    assert checkin(client, base, workspace, **changes).status_code in {409, 422}
    assert client.get(base).json() == workspace


def test_concurrent_report_and_review_cannot_close_from_a_stale_snapshot(env):
    client, _, _, _, base = env
    workspace = approved(client, base)
    workspace = add_evidence(client, base, workspace).json()
    with ThreadPoolExecutor(max_workers=2) as pool:
        responses = list(
            pool.map(
                lambda action: action(),
                [
                    lambda: checkin(client, base, workspace),
                    lambda: review(client, base, workspace),
                ],
            )
        )
    assert sorted(response.status_code for response in responses) == [200, 409]


def test_old_workspaces_load_with_empty_review_collections(env):
    client, store, _, venture, base = env
    workspace = approved(client, base)
    old = {
        key: value
        for key, value in workspace.items()
        if key not in {"evidence", "reviews", "checkins"}
    }
    with store.connect() as db:
        db.execute(
            "UPDATE workspaces SET workspace=? WHERE venture_id=?",
            (json.dumps(old), venture["venture_id"]),
        )
    loaded = client.get(base).json()
    assert loaded["evidence"] == loaded["reviews"] == loaded["checkins"] == []
    assert loaded["plans"] == old["plans"]


def test_supported_review_cannot_close_while_tasks_remain(env):
    client, _, _, _, base = env
    workspace = approved(client, base)
    workspace = add_evidence(client, base, workspace).json()
    response = review(
        client,
        base,
        workspace,
        confirm_achievement=True,
        criteria=[
            {
                "criterion_index": 0,
                "verdict": "supported",
                "evidence_ids": [workspace["evidence"][0]["evidence_id"]],
                "reasoning": "Founder judgment with linked notes.",
            }
        ],
    )
    assert response.status_code == 422 and "remaining tasks" in response.text
    assert client.get(base).json() == workspace


@pytest.mark.parametrize(
    "changes",
    [
        {"observed_on": (date.today() + timedelta(days=1)).isoformat()},
        {"source": " "},
        {"observation": " "},
        {"limitation": " "},
        {"sample_size": True},
        {"sample_size": -1},
        {"sample_size": 1.5},
    ],
)
def test_invalid_observations_do_not_write(env, changes):
    client, _, _, _, base = env
    workspace = approved(client, base)
    assert add_evidence(client, base, workspace, **changes).status_code == 422
    assert client.get(base).json() == workspace


def test_context_bound_with_eight_criteria_long_reports_and_review(env):
    client, store, _, venture, base = env
    workspace = draft(
        client,
        base,
        objective="Long objective " * 50,
        success_criteria=[f"Criterion {index}: " + "x" * 120 for index in range(8)],
        constraints="Capacity constraint " * 30,
    ).json()
    workspace = client.post(
        base + "/approve",
        json={
            "expected_revision": workspace["revision"],
            "plan_id": workspace["plans"][0]["plan_id"],
        },
    ).json()
    workspace = checkin(
        client,
        base,
        workspace,
        results="Reported result " * 60,
        learnings="Observed limitation " * 45,
        blockers="Participant availability " * 35,
        next_priorities=["Next priority " * 60] * 5,
    ).json()
    workspace = review(client, base, workspace).json()
    context = FeatureStore(store).workspace_context(venture["venture_id"])
    assert len(json.dumps(context, ensure_ascii=True)) <= 1600
    assert context["latest_goal_review"]["current"]
    assert "latest_checkin" in context
    workspace = add_evidence(client, base, workspace).json()
    assert not FeatureStore(store).workspace_context(venture["venture_id"])[
        "latest_goal_review"
    ]["current"]
