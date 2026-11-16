"""Learning workflows exercise actual HTTP, revision and storage boundaries."""

import json
from datetime import date

import pytest
from fastapi.testclient import TestClient

from test_workspace import env as env, approved, progress, draft
from test_reviews import add_evidence, checkin
from eir.app import create_app
from eir.feature_models import Workspace
from eir.feature_store import FeatureStore
from eir.labs import current_artifacts
from eir.lab_models import ADVICE_MODELS
from eir.store import Store


def experiment(workspace, **changes):
    return {
        "kind": "experiment",
        "title": "Dinner behavior",
        "hypothesis": "Speed drives dinner choices",
        "task_id": workspace["plans"][-1]["tasks"][0]["task_id"],
        "audience": "Evening students",
        "method": "interview",
        "capacity": 5,
        "questions": ["Tell me about your last dinner purchase."],
        "measures": ["Actual choices and alternatives"],
        "decision_rule": "Compare recurring needs and counterexamples; no demand claim.",
        "limitations": "Convenience sample; not independent evidence.",
        "status": "planned",
        **changes,
    }


def decision():
    return {
        "kind": "decision",
        "title": "Delivery or pickup?",
        "options": [
            {
                "name": name,
                "known_cost": "Unknown",
                "assumptions": ["Students can reach the service"],
                "risks": ["Unobserved usage"],
                "missing_information": ["Actual cost"],
                "next_test": "Observe a small test",
            }
            for name in ["Delivery", "Pickup"]
        ],
        "comparison": "Compare convenience and cost",
        "recommendation": "Test actual behavior first",
        "limitations": "Unknown costs",
    }


def pitch():
    return {
        "kind": "pitch",
        "title": "Dinner pitch",
        "audience": "investor",
        "pitch": "We are testing dinner access for evening students.",
        "questions": ["Who pays?"],
        "clarity": "State the need",
        "problem_customer": "Separate students from buyers",
        "evidence": "Only two interviews",
        "differentiation": "Alternatives unknown",
        "ask": "Ask for a test introduction",
        "revised_pitch": "We seek introductions for a small dinner-access test, not investment yet.",
        "limitations": "Simulated practice only",
        "simulated": True,
    }


def stage(evidence_ids=None):
    return {
        "kind": "stage_review",
        "title": "Customer canvas",
        "material": "Students use the product; payer unknown",
        "criteria": ["Identify user and buyer"],
        "evidence_ids": evidence_ids or [],
        "judgment": "revise",
        "reasoning": "Buyer is not identified",
        "missing": ["Purchase pathway"],
        "next_step": "Ask who paid for the last purchase",
        "limitations": "Provisional, no institutional approval",
    }


def save(client, base, workspace, data, endpoint="/artifacts", **changes):
    return client.post(
        base + endpoint,
        json={"expected_revision": workspace["revision"], "data": data, **changes},
    )


def confirm(client, base, workspace, artifact_id=None, action="confirm"):
    return client.post(
        base + "/artifacts/confirm",
        json={
            "expected_revision": workspace["revision"],
            "artifact_id": artifact_id or workspace["artifacts"][-1]["artifact_id"],
            "action": action,
        },
    )


@pytest.mark.parametrize("kind", ["experiment", "decision", "pitch", "stage_review"])
def test_draft_confirm_revision_restart_and_isolation(env, kind):
    client, store, _, venture, base = env
    w = approved(client, base)
    w = progress(client, base, w).json()
    original = w["plans"]
    data = {
        "experiment": experiment(w),
        "decision": decision(),
        "pitch": pitch(),
        "stage_review": stage(),
    }[kind]
    r = save(client, base, w, data)
    assert r.status_code == 200, r.text
    w = r.json()
    assert w["artifacts"][-1]["status"] == "draft"
    assert current_artifacts(Workspace.model_validate(w)) == []
    w = confirm(client, base, w).json()
    first = w["artifacts"][-1]["artifact_id"]
    assert confirm(client, base, w).json() == w
    changed = {**data, "limitations": "Additional uncertainty discovered"}
    w = save(client, base, w, changed, supersedes_id=first).json()
    w = confirm(client, base, w).json()
    assert len(current_artifacts(Workspace.model_validate(w))) == 1
    assert w["artifacts"][0]["data"]["limitations"] == data["limitations"]
    assert w["plans"] == original and w["goal"]["status"] == "active"
    assert (
        save(client, base, {**w, "revision": w["revision"] - 1}, data).status_code
        == 409
    )
    restarted = TestClient(create_app(store=Store(store.path)))
    assert restarted.get(base).json() == w
    other = client.post("/api/ventures", json={"name": "Other venture"}).json()
    other_base = f"/api/ventures/{other['venture_id']}/workspace"
    assert client.get(other_base).json()["artifacts"] == []
    assert confirm(client, other_base, {"revision": 0}, first).status_code == 422
    assert store.get(venture["venture_id"]).revision == 1


def test_experiment_links_corrections_and_simulation_boundary(env):
    client, _, _, _, base = env
    w = approved(client, base)
    for change in [{"capacity": 6}, {"task_id": "foreign"}, {"status": "completed"}]:
        assert save(client, base, w, experiment(w, **change)).status_code == 422
    w = confirm(client, base, save(client, base, w, experiment(w)).json()).json()
    experiment_id = w["artifacts"][-1]["artifact_id"]
    w = add_evidence(
        client, base, w, experiment_id=experiment_id, stance="contradicts"
    ).json()
    evidence_id = w["evidence"][-1]["evidence_id"]
    assert w["plans"][-1]["tasks"][0]["completed_count"] == 0
    w = add_evidence(
        client, base, w, supersedes_id=evidence_id, experiment_id=None, stance="unclear"
    ).json()
    assert len(w["evidence"]) == 2 and w["evidence"][-1]["experiment_id"] is None
    w = confirm(client, base, save(client, base, w, pitch()).json()).json()
    assert (
        add_evidence(
            client, base, w, experiment_id=w["artifacts"][-1]["artifact_id"]
        ).status_code
        == 422
    )
    assert add_evidence(client, base, w, origin="simulation").status_code == 422
    assert save(client, base, w, stage([evidence_id])).status_code == 422
    assert (
        save(
            client, base, w, {**stage(), "judgment": "ready_for_next_step"}
        ).status_code
        == 422
    )


def test_stage_review_becomes_stale_and_replan_blocks_confirmation(env):
    client, _, _, _, base = env
    w = approved(client, base)
    w = save(client, base, w, stage()).json()
    w = progress(client, base, w).json()
    assert confirm(client, base, w).status_code == 409
    w = confirm(client, base, w, action="reject").json()
    w = save(client, base, w, experiment(w)).json()
    plan = w["plans"][-1]
    w = client.put(
        base + "/draft",
        json={
            "expected_revision": w["revision"],
            "plan_id": plan["plan_id"],
            "rationale": "Revised",
            "tasks": plan["tasks"],
        },
    ).json()
    w = client.post(
        base + "/approve",
        json={"expected_revision": w["revision"], "plan_id": w["plans"][-1]["plan_id"]},
    ).json()
    assert confirm(client, base, w).status_code in (409, 422)


@pytest.mark.parametrize("kind", ["experiment", "decision", "pitch", "stage_review"])
def test_model_generation_validates_and_preserves_founder_facts(env, kind):
    client, _, boundary, _, base = env
    w = approved(client, base)
    data = {
        "experiment": experiment(w),
        "decision": decision(),
        "pitch": pitch(),
        "stage_review": stage(),
    }[kind]
    output = {key: data[key] for key in ADVICE_MODELS[kind].model_fields}
    if kind == "decision":
        output["options"] = [
            {key: option[key] for key in ("risks", "missing_information", "next_test")}
            for option in data["options"]
        ]
    boundary.output = json.dumps(output)
    result = save(client, base, w, data, "/artifacts/generate")
    assert result.status_code == 200, result.text
    w = result.json()
    assert w["artifacts"][-1]["origin"] == "model_proposal"
    assert len(boundary.calls[-1]["system_instruction"]) <= 8000
    assert "exactly the fields" in boundary.calls[-1]["system_instruction"]
    for invalid in [
        "not JSON",
        json.dumps({**data, "title": "Invented replacement"}),
        "x" * 19000,
    ]:
        boundary.output = invalid
        assert save(client, base, w, data, "/artifacts/generate").status_code == 502
        assert client.get(base).json() == w
    if kind == "decision":
        data["options"][0]["known_cost"] = "$50 made up"
        boundary.output = json.dumps(data)
        assert (
            save(client, base, w, decision(), "/artifacts/generate").status_code == 502
        )


def test_brief_exact_counts_questions_no_secrets_and_context(env):
    client, store, _, venture, base = env
    w = approved(client, base)
    w = progress(client, base, w).json()
    w = add_evidence(client, base, w, stance="contradicts").json()
    w = checkin(client, base, w).json()
    w = confirm(client, base, save(client, base, w, pitch()).json()).json()
    request = {
        "expected_revision": w["revision"],
        "questions": ["Who is the buyer?"],
        "reviewed": True,
    }
    brief = client.post(base + "/brief/preview", json=request)
    assert brief.status_code == 200
    text = brief.json()["text"]
    for expected in [
        "5 planned / 2 completed / 3 remaining",
        "Who is the buyer?",
        "contradicts",
        "SIMULATED PRACTICE ONLY",
        "No automatic sending",
    ]:
        assert expected in text
    assert venture["venture_id"] not in text and "sk-" not in text
    assert client.get(base).json() == w
    assert (
        client.post(
            base + "/brief/preview", json={**request, "expected_revision": 0}
        ).status_code
        == 409
    )
    context = FeatureStore(store).workspace_context(venture["venture_id"])
    assert len(json.dumps(context, ensure_ascii=True)) <= 1600
    assert context["latest_learning"]["kind"] == "pitch"
    assert "simulat" in json.dumps(context).lower()


def test_plan_fields_retain_reports_and_reject_bad_dates(env):
    client, _, _, _, base = env
    w = approved(client, base)
    w = progress(client, base, w).json()
    plan = w["plans"][-1]
    tasks = plan["tasks"]
    tasks[0].update(
        milestone="Customer discovery",
        owner="Founder",
        due_date=date.today().isoformat(),
        effort="Two hours",
        completion_criteria="Five notes and review",
        expected_evidence="Behavior notes",
    )
    w = client.put(
        base + "/draft",
        json={
            "expected_revision": w["revision"],
            "plan_id": plan["plan_id"],
            "rationale": "Add ownership",
            "tasks": tasks,
        },
    ).json()
    assert w["plans"][-1]["tasks"][0]["completed_count"] == 2
    assert w["plans"][-1]["tasks"][0]["owner"] == "Founder"
    tasks[0]["due_date"] = "2026-99-99"
    assert (
        client.put(
            base + "/draft",
            json={
                "expected_revision": w["revision"],
                "plan_id": plan["plan_id"],
                "rationale": "Invalid date",
                "tasks": tasks,
            },
        ).status_code
        == 422
    )


@pytest.mark.parametrize("is_approved", [False, True])
def test_new_tasks_remap_dependencies_without_forging_lineage(env, is_approved):
    client, _, _, _, base = env
    w = approved(client, base) if is_approved else draft(client, base).json()
    original = w["plans"][-1]
    tasks = original["tasks"] + [
        {"task_id": "new-first", "title": "Find buyers"},
        {
            "task_id": "new-second",
            "title": "Review buyer notes",
            "dependencies": ["new-first"],
        },
    ]
    request = {
        "expected_revision": w["revision"],
        "plan_id": original["plan_id"],
        "rationale": "Add buyer research",
        "tasks": tasks,
    }
    response = client.put(base + "/draft", json=request)
    assert response.status_code == 200, response.text
    updated = response.json()["plans"][-1]["tasks"]
    assert updated[-1]["dependencies"] == [updated[-2]["task_id"]]
    assert not updated[-2]["task_id"].startswith("new-")
    assert updated[-2]["source_task_id"] is None
    assert updated[-1]["source_task_id"] is None
    assert updated[0]["source_task_id"] == (
        original["tasks"][0]["task_id"] if is_approved else None
    )
    request["expected_revision"] = response.json()["revision"]
    request["tasks"][-1]["source_task_id"] = original["tasks"][0]["task_id"]
    assert client.put(base + "/draft", json=request).status_code == 422


def test_legacy_plan_fingerprint_survives_empty_metadata(env):
    from hashlib import sha256
    from eir.feature_models import Plan
    from eir.planning import plan_fingerprint

    client, _, _, _, base = env
    plan = Plan.model_validate(approved(client, base)["plans"][-1])
    legacy = plan.model_dump()
    for task in legacy["tasks"]:
        for key in (
            "milestone",
            "owner",
            "due_date",
            "effort",
            "completion_criteria",
            "expected_evidence",
        ):
            task.pop(key)
    expected = sha256(
        json.dumps(legacy, sort_keys=True, separators=(",", ":")).encode()
    ).hexdigest()
    assert plan_fingerprint(plan) == expected
    plan.tasks[0].owner = "Founder"
    assert plan_fingerprint(plan) != expected


def test_only_advice_paragraph_bullets_are_normalized(env):
    client, _, boundary, _, base = env
    w = approved(client, base)
    data = pitch()
    output = {key: data[key] for key in ADVICE_MODELS["pitch"].model_fields}
    output["clarity"] = ["Name the buyer.", "Keep the ask explicit."]
    boundary.output = json.dumps(output)
    response = save(client, base, w, data, "/artifacts/generate")
    assert response.status_code == 200
    w = response.json()
    assert (
        w["artifacts"][-1]["data"]["clarity"]
        == "Name the buyer. Keep the ask explicit."
    )
    output["simulated"] = False
    boundary.output = json.dumps(output)
    assert save(client, base, w, data, "/artifacts/generate").status_code == 502
    assert client.get(base).json() == w
