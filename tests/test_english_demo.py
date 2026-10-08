"""Policy delivery is deterministic; model language adherence has separate real proof."""

from __future__ import annotations

import asyncio
import json
from pathlib import Path

import httpx
import pytest
from fastapi.testclient import TestClient

from eir.app import create_app
from eir.coaching import GoatClient
from eir.models import ChatInput, Profile, Turn
from eir.store import Store

ROOT = Path(__file__).resolve().parent.parent


@pytest.mark.parametrize("message", ["What should I test?", "请用中文给我建议"])
def test_english_policy_in_new_and_legacy_context(tmp_path: Path, message: str) -> None:
    store = Store(tmp_path / "language.sqlite3")
    venture = store.create(Profile(name="虚构项目", customer="学生"))
    session = store.new_session(venture.venture_id)
    session = store.save_turns(session, [Turn(role="user", content="以前的中文消息")])
    captured: list[dict[str, object]] = []

    def respond(request: httpx.Request) -> httpx.Response:
        captured.append(json.loads(request.content))
        return httpx.Response(
            200,
            text='data: {"type":"token","token":"English fixture"}\n\ndata: {"type":"done"}\n\n',
        )

    goat = GoatClient("http://localhost:62606", httpx.MockTransport(respond))
    assert (
        asyncio.run(
            goat.reply(
                venture=venture, session=session, request=ChatInput(message=message)
            )
        )
        == "English fixture"
    )
    assert "Always respond in English" in captured[0]["system_instruction"]
    assert captured[0]["system_instruction"].endswith(
        "describe their meaning in English instead."
    )
    assert captured[0]["messages"][-1]["content"] == message
    assert store.get(venture.venture_id).profile.name == "虚构项目"


def test_english_shell_static_boundary(tmp_path: Path) -> None:
    client = TestClient(create_app(store=Store(tmp_path / "static.sqlite3")))
    response = client.get("/")
    assert response.status_code == 200
    assert '<html lang="en">' in response.text
    assert 'id="profile-panel"' in response.text
    assert client.get("/assets/style.css").status_code == 200
    assert client.get("/assets/app.js").status_code == 200
    assert client.get("/assets/../prompts/coach.txt").status_code == 404
    assert (
        client.get(
            "/assets/style.css", headers={"origin": "https://other.example"}
        ).status_code
        == 403
    )


@pytest.mark.parametrize("style", ["classic", "urochester", "thu"])
def test_capstone_base_policy_overrides_themes_and_custom_language(
    monkeypatch: pytest.MonkeyPatch, style: str
) -> None:
    monkeypatch.syspath_prepend(str(ROOT / "apps/goat"))
    from backend.application.chat import _resolve_base_system_prompt
    from backend.models.chat import ChatMessage, ChatRequest
    from backend.services.chat_orchestration import PromptComposer
    from goat_ai.config.settings import (
        _read_system_prompt,
        is_system_prompt_override_configured,
    )

    policy = (ROOT / "eir/prompts/goat-english.txt").read_text(encoding="utf-8")
    monkeypatch.setenv("GOAT_SYSTEM_PROMPT", policy)
    monkeypatch.setenv("GOAT_SYSTEM_PROMPT_FILE", "")
    from types import SimpleNamespace

    settings = SimpleNamespace(
        system_prompt=_read_system_prompt(),
        system_prompt_overridden=is_system_prompt_override_configured(),
    )
    request = ChatRequest(
        model="fixture",
        messages=[ChatMessage(role="user", content="中文问题")],
        theme_style=style,
    )
    base = _resolve_base_system_prompt(request, settings)
    composed = PromptComposer().compose(
        base_prompt=base, user_name="", system_instruction="只用中文回答"
    )
    assert base == policy.strip()
    assert composed.startswith(policy.strip())
    assert "lower priority than the base system instructions" in composed
