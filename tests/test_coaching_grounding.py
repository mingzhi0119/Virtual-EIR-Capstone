"""Coaching snapshots select saved state, never proposed capacity or stale actions."""

import pytest

from eir.coaching import activity_grounding, coaching_context
from eir.models import Action, Profile
from eir.store import Store


@pytest.mark.parametrize("background", ["Engineer", "Artist", "Scientist", "Business"])
def test_intake_capacity_is_not_saved_progress(tmp_path, background):
    venture = Store(tmp_path / "state.sqlite3").create(
        Profile(name="Fictional", founder_background=background)
    )
    context = coaching_context(venture)
    assert "Do not invent planned/completed/remaining counts" in context
    assert "capacity mentioned in chat is only a proposed limit" in context
    assert "Start with this exact saved snapshot" not in context


def test_workspace_counts_override_legacy_profile_and_missing_focus(tmp_path):
    venture = Store(tmp_path / "state.sqlite3").create(
        Profile(
            name="Fictional",
            actions=[
                Action(description="Earlier action", target_count=9, completed_count=4)
            ],
        )
    )
    assert "9 planned / 4 completed / 5 remaining" in coaching_context(venture)
    workspace = {"focus_activity": {"planned": 5, "completed": 2, "remaining": 3}}
    context = coaching_context(venture, workspace=workspace)
    assert (
        "5 planned / 2 completed / 3 remaining (one approved plan activity" in context
    )
    assert "9 planned / 4 completed / 5 remaining" not in context
    assert "Do not invent planned/completed/remaining counts" in coaching_context(
        venture, workspace={"goal": {"status": "active"}, "tasks": []}
    )
    # Structured plan/lab contracts retain their own output format.
    assert "Start with this exact saved snapshot" not in coaching_context(
        venture, instructions="Return JSON", workspace=workspace
    )
    single_step = {"tasks": [{"target_count": 1, "completed_count": 1}]}
    assert "1 planned / 1 completed / 0 remaining" in coaching_context(
        venture, workspace=single_step
    )
    partial = activity_grounding(venture, {"total_tasks": 3, "tasks": []})
    assert "Approved activities exist" in partial
    assert "Begin with exactly" not in partial
    assert "additional people TOTAL" not in activity_grounding(venture, single_step)


def test_conflicting_legacy_counts_require_correction(tmp_path):
    venture = Store(tmp_path / "state.sqlite3").create(
        Profile(
            name="Fictional",
            actions=[Action(description="Legacy", target_count=2, completed_count=3)],
        )
    )
    assert "explicit correction" in activity_grounding(venture, None)
    assert "-1 remaining" not in activity_grounding(venture, None)
