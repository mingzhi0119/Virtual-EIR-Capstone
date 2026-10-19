"""Explicit provider selection and narrowly scoped private config loading."""

from __future__ import annotations

import os
from pathlib import Path

from eir.coaching import GoatClient, ModelClient
from eir.openai_client import OpenAIClient


def configured_client() -> ModelClient:
    provider = os.environ.get("EIR_MODEL_PROVIDER", "goat")
    if provider == "goat":
        return GoatClient(os.environ.get("EIR_GOAT_BASE_URL", "http://127.0.0.1:62606"))
    if provider != "openai":
        raise ValueError("EIR_MODEL_PROVIDER must be goat or openai.")
    values = {}
    config_path = os.environ.get("EIR_CONFIG_FILE")
    if config_path:
        for line in Path(config_path).read_text(encoding="utf-8-sig").splitlines():
            if not line.strip() or line.lstrip().startswith("#"):
                continue
            key, separator, value = line.partition("=")
            if not separator or key.strip() not in {
                "OPENAI_API_KEY",
                "EIR_OPENAI_MODEL",
                "EIR_OPENAI_MODELS",
            }:
                raise ValueError("Private EIR config contains an unsupported setting.")
            if key.strip() in values:
                raise ValueError("Private EIR config contains a duplicate setting.")
            values[key.strip()] = value.strip()
    return OpenAIClient(
        os.environ.get("OPENAI_API_KEY") or values.get("OPENAI_API_KEY", ""),
        os.environ.get("EIR_OPENAI_MODEL")
        or values.get("EIR_OPENAI_MODEL", "gpt-4.1-mini"),
        allowed_models=[
            model.strip()
            for model in (
                os.environ.get("EIR_OPENAI_MODELS")
                or values.get("EIR_OPENAI_MODELS", "")
            ).split(",")
            if model.strip()
        ],
    )
