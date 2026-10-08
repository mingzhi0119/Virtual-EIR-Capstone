"""Explicit, founder-confirmed venture state and bounded HTTP contracts."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class Evidence(StrictModel):
    observation: str = Field(min_length=1, max_length=1000)
    sample_size: int = Field(default=0, ge=0, le=10000)
    source: str = Field(default="Founder report", max_length=300)
    limitation: str = Field(
        default="Not representative; not verified independently.", max_length=500
    )


class Action(StrictModel):
    description: str = Field(min_length=1, max_length=1000)
    target_count: int = Field(default=0, ge=0, le=10000)
    completed_count: int = Field(default=0, ge=0, le=10000)
    result: str = Field(default="", max_length=1000)


class Profile(StrictModel):
    name: str = Field(min_length=1, max_length=120)
    customer: str = Field(default="", max_length=500)
    problem: str = Field(default="", max_length=1000)
    stage: Literal["idea", "validation", "prototype", "growth"] = "idea"
    assumptions: list[str] = Field(default_factory=list, max_length=10)
    evidence: list[Evidence] = Field(default_factory=list, max_length=10)
    actions: list[Action] = Field(default_factory=list, max_length=10)

    @model_validator(mode="after")
    def bound_context(self) -> Profile:
        if any(not item.strip() or len(item) > 500 for item in self.assumptions):
            raise ValueError("Each assumption must contain 1–500 characters.")
        if len(self.model_dump_json()) > 5500:
            raise ValueError(
                "Profile is too large for the bounded coaching context (5500 characters)."
            )
        return self


class Venture(StrictModel):
    venture_id: str
    profile: Profile
    revision: int
    updated_at: str


class ProfileUpdate(StrictModel):
    profile: Profile
    expected_revision: int = Field(ge=1)


class Turn(StrictModel):
    role: Literal["user", "assistant"]
    content: str


class Session(StrictModel):
    session_id: str
    venture_id: str
    created_at: str
    turns: list[Turn] = Field(default_factory=list)


class ChatInput(StrictModel):
    message: str = Field(min_length=1, max_length=4000)
    model: str = Field(default="gemma4:26b", min_length=1, max_length=120)


class ChatOutput(StrictModel):
    session: Session
    reply: str
    context_revision: int
    elapsed_seconds: float
    goat_session_id: str
