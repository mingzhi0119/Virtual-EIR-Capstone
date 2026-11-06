"""Release checks for historical advice crossing a changed assessment basis."""

import json

import pytest

from eir.feature_models import Workspace
from eir.feature_store import FeatureStore
from eir.labs import artifact_basis_status, applicable_artifacts, current_artifacts
from test_labs import confirm, decision, experiment, pitch, save, stage
from test_reviews import add_evidence
from test_workspace import env as env, approved, progress


def brief(client, base, workspace):
    response = client.post(
        base + "/brief/preview",
        json={
            "expected_revision": workspace["revision"],
            "questions": ["What should change next?"],
            "reviewed": True,
        },
    )
    assert response.status_code == 200, response.text
    return response.json()["text"]


@pytest.mark.parametrize("change", ["correction", "progress"])
def test_changed_basis_excludes_stage_advice_but_preserves_history(env, change):
    client, store, _, venture, base = env
    w = approved(client, base)
    w = add_evidence(client, base, w).json()
    data = {
        **stage([w["evidence"][-1]["evidence_id"]]),
        "judgment": "ready_for_next_step",
        "next_step": "Proceed to the original pilot",
        "reasoning": "Original observations support the supplied criteria",
    }
    w = confirm(client, base, save(client, base, w, data).json()).json()
    assert "ready for next step" in brief(client, base, w)
    assert (
        FeatureStore(store).workspace_context(venture["venture_id"])["latest_learning"][
            "summary"
        ]
        == data["next_step"]
    )
    if change == "correction":
        w = add_evidence(
            client,
            base,
            w,
            supersedes_id=w["evidence"][-1]["evidence_id"],
            observation="Neither participant has purchasing authority",
            stance="contradicts",
        ).json()
    else:
        w = progress(client, base, w).json()
    context = FeatureStore(store).workspace_context(venture["venture_id"])
    assert "latest_learning" not in context
    assert context["stale_or_earlier_plan_learning_omitted"] == 1
    assert len(json.dumps(context, ensure_ascii=True)) <= 1600
    output = brief(client, base, w)
    assert "ready for next step" not in output
    assert "excluded from current recommendations" in output
    restored = Workspace.model_validate(client.get(base).json())
    assert len(restored.artifacts) == 1
    assert restored.artifacts[0].data.next_step == data["next_step"]
    assert artifact_basis_status(restored, restored.artifacts[0]) == "stale"
    assert applicable_artifacts(restored) == []
    assert len(current_artifacts(restored)) == 1


@pytest.mark.parametrize("kind", ["experiment", "decision", "pitch", "stage_review"])
def test_replan_excludes_all_prior_plan_advice_until_recreated(env, kind):
    client, store, _, venture, base = env
    w = approved(client, base)
    data = {
        "experiment": experiment(w),
        "decision": decision(),
        "pitch": pitch(),
        "stage_review": stage(),
    }[kind]
    w = confirm(client, base, save(client, base, w, data).json()).json()
    old = w["artifacts"][-1]
    plan = w["plans"][-1]
    response = client.put(
        base + "/draft",
        json={
            "expected_revision": w["revision"],
            "plan_id": plan["plan_id"],
            "rationale": "Revise the customer discovery plan",
            "tasks": plan["tasks"],
        },
    )
    assert response.status_code == 200, response.text
    w = response.json()
    response = client.post(
        base + "/approve",
        json={"expected_revision": w["revision"], "plan_id": w["plans"][-1]["plan_id"]},
    )
    assert response.status_code == 200, response.text
    w = response.json()
    context = FeatureStore(store).workspace_context(venture["venture_id"])
    assert "latest_learning" not in context
    assert context["stale_or_earlier_plan_learning_omitted"] == 1
    assert old["data"]["title"] not in brief(client, base, w)
    assert w["artifacts"][0] == old
    assert (
        artifact_basis_status(
            Workspace.model_validate(w), Workspace.model_validate(w).artifacts[0]
        )
        == "earlier_plan"
    )
    if kind == "experiment":
        data["task_id"] = w["plans"][-1]["tasks"][0]["task_id"]
    w = confirm(client, base, save(client, base, w, data).json()).json()
    context = FeatureStore(store).workspace_context(venture["venture_id"])
    assert context["latest_learning"]["kind"] == kind
    assert len(w["artifacts"]) == 2


def test_brief_tracks_independent_profile_revision(env):
    client, store, _, venture, base = env
    w = approved(client, base)
    request = {
        "expected_revision": w["revision"],
        "questions": ["Who is the buyer?"],
        "reviewed": True,
    }
    original = client.post(base + "/brief/preview", json=request).json()
    assert original["profile_revision"] == venture["revision"]
    changed = client.put(
        f"/api/ventures/{venture['venture_id']}",
        json={
            "expected_revision": venture["revision"],
            "profile": {**venture["profile"], "customer": "School purchasers"},
        },
    )
    assert changed.status_code == 200, changed.text
    refreshed = client.post(base + "/brief/preview", json=request).json()
    assert refreshed["revision"] == original["revision"]
    assert refreshed["profile_revision"] > original["profile_revision"]
    assert "School purchasers" in refreshed["text"]
    assert "School purchasers" not in original["text"]
    assert FeatureStore(store).get(venture["venture_id"]).revision == w["revision"]
