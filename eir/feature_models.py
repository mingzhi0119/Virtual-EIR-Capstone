"""Bounded workspace contracts, independent of the founder Profile."""

from __future__ import annotations

from typing import Annotated, Literal
from datetime import date

from pydantic import Field, StrictBool, StringConstraints, model_validator

from eir.models import StrictModel

Count = Annotated[int, Field(strict=True, ge=0, le=10000)]
Revision = Annotated[int, Field(strict=True, ge=0)]
GoalStatus = Literal["active", "paused", "achieved", "cancelled"]
TaskStatus = Literal["not_started", "in_progress", "blocked", "done", "cancelled"]
ReviewText = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=1000)
]


class EvidenceData(StrictModel):
    observation: ReviewText
    source: ReviewText
    observed_on: date
    sample_size: Count | None = None
    limitation: ReviewText
    task_id: str | None = Field(default=None, max_length=80)
    supersedes_id: str | None = Field(default=None, max_length=80)


class EvidenceInput(EvidenceData):
    expected_revision: Revision


class EvidenceRecord(EvidenceData):
    evidence_id: str
    at: str
    plan_id: str


class CriterionAssessment(StrictModel):
    criterion_index: Annotated[int, Field(strict=True, ge=0, le=7)]
    verdict: Literal["supported", "not_supported", "uncertain"]
    evidence_ids: list[
        Annotated[str, StringConstraints(min_length=1, max_length=80)]
    ] = Field(default_factory=list, max_length=20)
    reasoning: ReviewText


class ReviewInput(StrictModel):
    expected_revision: Revision
    plan_id: str = Field(min_length=1, max_length=80)
    criteria: list[CriterionAssessment] = Field(min_length=1, max_length=8)
    limitations: ReviewText
    confirm_achievement: StrictBool = False


class GoalReview(StrictModel):
    review_id: str
    at: str
    plan_id: str
    plan_version: int
    basis_fingerprint: str
    source_revision: int
    criteria: list[CriterionAssessment]
    limitations: str
    confirmed_achievement: bool


class CheckInData(StrictModel):
    period_start: date
    period_end: date
    results: ReviewText
    learnings: ReviewText
    blockers: str = Field(default="", max_length=1000)
    next_priorities: list[ReviewText] = Field(min_length=1, max_length=5)
    next_review_on: date

    @model_validator(mode="after")
    def valid_period(self):
        if not 0 <= (self.period_end - self.period_start).days <= 31:
            raise ValueError("Review periods must be ordered and at most 31 days.")
        if self.next_review_on <= self.period_end:
            raise ValueError("The next review must follow this reporting period.")
        return self


class CheckInInput(CheckInData):
    expected_revision: Revision
    plan_id: str = Field(min_length=1, max_length=80)


class CheckInRecord(CheckInData):
    checkin_id: str
    at: str
    plan_id: str
    plan_version: int
    # Snapshot counts are recorded from storage, never accepted from the browser.
    task_snapshot: list[dict]


class Goal(StrictModel):
    objective: str = Field(min_length=1, max_length=1000)
    success_criteria: list[str] = Field(min_length=1, max_length=8)
    constraints: str = Field(default="", max_length=1000)
    status: GoalStatus = "active"
    target_date: str | None = Field(default=None, max_length=40)

    @model_validator(mode="after")
    def criteria_are_bounded(self) -> Goal:
        self.success_criteria = [item.strip() for item in self.success_criteria]
        if any(not item or len(item) > 500 for item in self.success_criteria):
            raise ValueError("Each success criterion must contain 1-500 characters.")
        return self


class Task(StrictModel):
    task_id: str = Field(default="", max_length=80)
    # Server-owned immediate predecessor, used to compare versioned task IDs.
    source_task_id: str | None = Field(default=None, max_length=80)
    title: str = Field(min_length=1, max_length=500)
    target_count: Count = 1
    completed_count: Count = 0
    status: TaskStatus = "not_started"
    blocker: str = Field(default="", max_length=500)
    result: str = Field(default="", max_length=1000)
    dependencies: list[str] = Field(default_factory=list, max_length=12)

    @model_validator(mode="after")
    def valid_progress(self) -> Task:
        if self.target_count < 1:
            raise ValueError("target_count must be at least 1.")
        if self.completed_count > self.target_count:
            raise ValueError("completed_count cannot exceed target_count.")
        if self.status == "done" and (
            self.completed_count != self.target_count or not self.result
        ):
            raise ValueError(
                "Done requires the full target count and a written result."
            )
        if self.status == "blocked" and not self.blocker:
            raise ValueError("Blocked tasks require a blocker description.")
        if self.status == "not_started" and self.completed_count:
            raise ValueError("A task with progress cannot be not_started.")
        return self


def validate_dependencies(tasks: list[Task]) -> None:
    ids = [task.task_id for task in tasks]
    if not all(ids) or len(ids) != len(set(ids)):
        raise ValueError("Task IDs must be non-empty and unique within a plan.")
    graph = {task.task_id: task.dependencies for task in tasks}
    visiting: set[str] = set()
    visited: set[str] = set()

    def visit(task_id: str) -> None:
        if task_id not in graph:
            raise ValueError("Dependencies must reference tasks in this plan.")
        if task_id in visiting:
            raise ValueError("Task dependencies cannot contain cycles.")
        if task_id in visited:
            return
        visiting.add(task_id)
        for dependency in graph[task_id]:
            visit(dependency)
        visiting.remove(task_id)
        visited.add(task_id)

    for task_id in ids:
        visit(task_id)


def validate_completed_dependencies(tasks: list[Task]) -> None:
    """Shared transition rule; legacy snapshots remain readable for safe rejection."""
    validate_dependencies(tasks)
    by_id = {task.task_id: task for task in tasks}
    for task in tasks:
        if task.status == "done" and any(
            by_id[dependency].status != "done" for dependency in task.dependencies
        ):
            raise ValueError(
                "Complete this task's dependencies before marking it done; "
                "reopen dependent tasks before correcting their prerequisites."
            )


class Plan(StrictModel):
    plan_id: str
    version: int = Field(ge=1)
    status: Literal["draft", "approved", "rejected"] = "draft"
    rationale: str = Field(min_length=1, max_length=2000)
    tasks: list[Task] = Field(min_length=1, max_length=12)
    # Candidate goal remains attached to its proposal; only approval sets Workspace.goal.
    goal: Goal
    # Display revision is informational; approval compares the source fingerprint,
    # so unrelated workspace mutations do not unnecessarily invalidate the draft.
    source_plan_id: str | None = Field(default=None, max_length=80)
    source_plan_revision: Revision | None = None
    source_plan_fingerprint: str | None = Field(default=None, max_length=64)

    @model_validator(mode="after")
    def valid_graph(self) -> Plan:
        validate_dependencies(self.tasks)
        return self


class WorkspaceEvent(StrictModel):
    revision: int
    kind: str
    at: str
    source: str = "founder"
    plan_id: str | None = None
    task_id: str | None = None
    detail: dict = Field(default_factory=dict)


class Workspace(StrictModel):
    revision: int = 0
    goal: Goal | None = None
    plans: list[Plan] = Field(default_factory=list)
    events: list[WorkspaceEvent] = Field(default_factory=list)
    evidence: list[EvidenceRecord] = Field(default_factory=list)
    reviews: list[GoalReview] = Field(default_factory=list)
    checkins: list[CheckInRecord] = Field(default_factory=list)


class DraftRequest(StrictModel):
    objective: str = Field(default="", max_length=1000)
    success_criteria: list[str] = Field(default_factory=list, max_length=8)
    constraints: str = Field(default="", max_length=1000)
    target_date: str | None = Field(default=None, max_length=40)
    expected_revision: Revision
    model: str = Field(default="gemma4:26b", min_length=1, max_length=120)


class PlanDecision(StrictModel):
    plan_id: str = Field(min_length=1, max_length=80)
    expected_revision: Revision


class DraftEdit(PlanDecision):
    rationale: str = Field(min_length=1, max_length=2000)
    tasks: list[Task] = Field(min_length=1, max_length=12)


class TaskUpdate(StrictModel):
    expected_revision: Revision
    completed_count: Count
    status: TaskStatus
    blocker: str = Field(default="", max_length=500)
    result: str = Field(default="", max_length=1000)


class GoalUpdate(StrictModel):
    expected_revision: Revision
    status: GoalStatus


class GeneratedPlan(StrictModel):
    rationale: str = Field(min_length=1, max_length=2000)
    tasks: list[Task] = Field(min_length=1, max_length=12)

    @model_validator(mode="after")
    def proposed_work_only(self) -> GeneratedPlan:
        # Local model labels are remapped to server IDs before persistence.
        for index, task in enumerate(self.tasks):
            if not task.task_id:
                task.task_id = f"task-{index + 1}"
            if (
                task.completed_count
                or task.source_task_id is not None
                or task.status != "not_started"
                or task.result
                or task.blocker
            ):
                raise ValueError("Generated tasks must contain proposed work only.")
        validate_dependencies(self.tasks)
        return self
