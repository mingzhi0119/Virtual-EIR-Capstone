"""Typed learning artifacts. Practice and recommendations are never observations."""

from typing import Annotated, Literal

from pydantic import Field, StringConstraints, model_validator

from eir.models import StrictModel

Text = Annotated[str, StringConstraints(min_length=1, max_length=1000)]
Short = Annotated[str, StringConstraints(min_length=1, max_length=200)]
Items = Annotated[list[Text], Field(min_length=1, max_length=6)]
Id = Annotated[str, StringConstraints(min_length=1, max_length=80)]


class Experiment(StrictModel):
    kind: Literal["experiment"] = "experiment"
    title: Short
    hypothesis: Text
    task_id: Id
    audience: Text
    method: Literal["interview", "observation", "prototype_test"]
    capacity: Annotated[int, Field(strict=True, ge=1, le=10000)]
    questions: Items
    measures: Items
    decision_rule: Text
    limitations: Text
    status: Literal["planned"] = "planned"


class DecisionOption(StrictModel):
    name: Short
    known_cost: Text = "Unknown; obtain a quote or measure actual cost."
    assumptions: Items
    risks: Items
    missing_information: Items
    next_test: Text


class Decision(StrictModel):
    kind: Literal["decision"] = "decision"
    title: Short
    options: list[DecisionOption] = Field(min_length=2, max_length=3)
    comparison: Text
    recommendation: Text
    limitations: Text

    @model_validator(mode="after")
    def distinct_options(self):
        if len({item.name.casefold() for item in self.options}) != len(self.options):
            raise ValueError("Use distinct founder-specified alternatives.")
        return self


class Pitch(StrictModel):
    kind: Literal["pitch"] = "pitch"
    title: Short
    audience: Literal["customer", "investor"]
    pitch: Text
    questions: Items
    clarity: Text
    problem_customer: Text
    evidence: Text
    differentiation: Text
    ask: Text
    revised_pitch: Text
    limitations: Text
    simulated: Literal[True] = True


class StageReview(StrictModel):
    kind: Literal["stage_review"] = "stage_review"
    title: Short
    material: Text
    criteria: Items
    evidence_ids: list[Id] = Field(default_factory=list, max_length=20)
    judgment: Literal["ready_for_next_step", "revise", "insufficient"]
    reasoning: Text
    missing: Items
    next_step: Text
    limitations: Text


ArtifactData = Annotated[
    Experiment | Decision | Pitch | StageReview, Field(discriminator="kind")
]


class ArtifactRequest(StrictModel):
    expected_revision: Annotated[int, Field(strict=True, ge=0)]
    data: ArtifactData
    supersedes_id: Id | None = None


class ArtifactGenerate(ArtifactRequest):
    model: str = Field(default="gemma4:26b", min_length=1, max_length=120)


class ArtifactRecord(StrictModel):
    artifact_id: str
    plan_id: str
    at: str
    source_revision: int
    status: Literal["draft", "confirmed", "rejected"] = "draft"
    origin: Literal["founder", "model_proposal"]
    supersedes_id: str | None = None
    data: ArtifactData


class ArtifactConfirm(StrictModel):
    expected_revision: Annotated[int, Field(strict=True, ge=0)]
    artifact_id: Id
    action: Literal["confirm", "reject"]


class BriefRequest(StrictModel):
    expected_revision: Annotated[int, Field(strict=True, ge=0)]
    questions: list[Text] = Field(min_length=1, max_length=3)
    reviewed: Literal[True]


class ExperimentAdvice(StrictModel):
    audience: Text
    questions: Items
    measures: Items
    decision_rule: Text
    limitations: Text


class OptionAdvice(StrictModel):
    risks: Items
    missing_information: Items
    next_test: Text


class DecisionAdvice(StrictModel):
    options: list[OptionAdvice] = Field(min_length=2, max_length=3)
    comparison: Text
    recommendation: Text
    limitations: Text


class PitchAdvice(StrictModel):
    questions: Items
    clarity: Text
    problem_customer: Text
    evidence: Text
    differentiation: Text
    ask: Text
    revised_pitch: Text
    limitations: Text


class StageAdvice(StrictModel):
    judgment: Literal["ready_for_next_step", "revise", "insufficient"]
    reasoning: Text
    missing: Items
    next_step: Text
    limitations: Text


ADVICE_MODELS = {
    "experiment": ExperimentAdvice,
    "decision": DecisionAdvice,
    "pitch": PitchAdvice,
    "stage_review": StageAdvice,
}
