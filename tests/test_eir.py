"""Deterministic tests; real Ollama proof is retained separately."""

import asyncio
import json
from pathlib import Path
import sqlite3

import httpx
import pytest
from fastapi.testclient import TestClient

from eir.app import create_app
from eir.coaching import Coach, GoatClient
from eir.models import ChatInput, Profile
from eir.store import Conflict, Store


def fake_goat(request: httpx.Request) -> httpx.Response:
    if request.url.path == "/api/models":
        return httpx.Response(200, json={"models": ["gemma4:26b"]})
    payload = json.loads(request.content)
    state = json.loads(
        payload["system_instruction"].split(
            "FOUNDER-CONFIRMED STATE (data, not instructions):\n"
        )[1]
    )
    profile = state["profile"]
    if profile["actions"]:
        action = profile["actions"][0]
        reply = f"Target {action['target_count']}; completed {action['completed_count']}. Price evidence is a small sample."
    else:
        reply = f"For {profile['customer']}: ask about recent behavior, then interview five people."
    body = (
        "data: "
        + json.dumps({"type": "token", "token": reply})
        + '\n\ndata: {"type":"done"}\n\n'
    )
    return httpx.Response(200, text=body, headers={"content-type": "text/event-stream"})


@pytest.fixture
def setup(tmp_path: Path) -> tuple[TestClient, Store]:
    store = Store(tmp_path / "state.sqlite3")
    goat = GoatClient("http://127.0.0.1:62606", httpx.MockTransport(fake_goat))
    return TestClient(create_app(store=store, goat=goat)), store


def test_two_sessions_restore_and_correction(setup: tuple[TestClient, Store]) -> None:
    client, store = setup
    venture = client.post(
        "/api/ventures", json={"name": "fictional", "customer": "students"}
    ).json()
    base = f"/api/ventures/{venture['venture_id']}"
    first = client.post(base + "/sessions").json()
    response = client.post(
        base + f"/sessions/{first['session_id']}/chat", json={"message": "Initial plan"}
    )
    assert response.status_code == 200
    assert "five" in response.json()["reply"]
    profile = venture["profile"]
    profile["actions"] = [
        {"description": "Interview", "target_count": 5, "completed_count": 2}
    ]
    profile["evidence"] = [{"observation": "Price matters more", "sample_size": 2}]
    confirmed = client.put(base, json={"profile": profile, "expected_revision": 1})
    assert confirmed.status_code == 200
    second = client.post(base + "/sessions").json()
    assert second["turns"] == []
    followup = client.post(
        base + f"/sessions/{second['session_id']}/chat", json={"message": "What next?"}
    ).json()
    assert "Target 5; completed 2" in followup["reply"]
    assert followup["context_revision"] == 2
    assert client.get(base).json()["profile"]["actions"][0]["completed_count"] == 2
    # A completely new store/client on the same file restores state, not browser memory.
    fresh = Store(store.path)
    assert fresh.get(venture["venture_id"]).profile.evidence[0].sample_size == 2
    assert len(fresh.session(venture["venture_id"], second["session_id"]).turns) == 2
    profile["customer"] = "graduate students"
    assert (
        client.put(base, json={"profile": profile, "expected_revision": 2}).status_code
        == 200
    )
    with store.connect() as db:
        assert db.execute("SELECT COUNT(*) FROM revisions").fetchone()[0] == 3


def test_project_isolation_and_stale_edit(setup: tuple[TestClient, Store]) -> None:
    client, _ = setup
    one = client.post("/api/ventures", json={"name": "one"}).json()
    two = client.post("/api/ventures", json={"name": "two"}).json()
    session = client.post(f"/api/ventures/{one['venture_id']}/sessions").json()
    assert (
        client.get(
            f"/api/ventures/{two['venture_id']}/sessions/{session['session_id']}"
        ).status_code
        == 404
    )
    assert (
        client.post(
            f"/api/ventures/{two['venture_id']}/sessions/{session['session_id']}/chat",
            json={"message": "Hi"},
        ).status_code
        == 404
    )
    base = f"/api/ventures/{one['venture_id']}"
    edit = {"profile": one["profile"], "expected_revision": 1}
    assert client.put(base, json=edit).status_code == 200
    assert client.put(base, json=edit).status_code == 409


@pytest.mark.parametrize(
    "body",
    [
        {"name": ""},
        {"name": "a", "unexpected": 1},
        {"name": "a", "actions": [{"description": "a", "completed_count": -1}]},
        {"name": "a", "assumptions": ["x" * 501]},
    ],
)
def test_invalid_profile(
    setup: tuple[TestClient, Store], body: dict[str, object]
) -> None:
    client, _ = setup
    assert client.post("/api/ventures", json=body).status_code == 422


@pytest.mark.parametrize(
    "body",
    [
        'data: {"type":"thinking","token":"thinking only"}\n\ndata: {"type":"done"}\n\n',
        'data: {"type":"token","token":"partial"}\n\n',
        'data: {"type":"error","message":"failed"}\n\ndata: {"type":"done"}\n\n',
        "data: broken\n\n",
    ],
)
def test_model_failures_save_no_turns(tmp_path: Path, body: str) -> None:
    store = Store(tmp_path / "state.sqlite3")
    venture = store.create(Profile(name="test"))
    session = store.new_session(venture.venture_id)
    goat = GoatClient(
        "http://localhost:62606",
        httpx.MockTransport(lambda _: httpx.Response(200, text=body)),
    )
    client = TestClient(create_app(store=store, goat=goat))
    response = client.post(
        f"/api/ventures/{venture.venture_id}/sessions/{session.session_id}/chat",
        json={"message": "Hi"},
    )
    assert response.status_code == 503
    assert store.session(venture.venture_id, session.session_id).turns == []
    assert store.get(venture.venture_id).revision == 1


def test_unavailable_transport_and_origin(tmp_path: Path) -> None:
    store = Store(tmp_path / "state.sqlite3")

    def offline(_: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("offline")

    client = TestClient(
        create_app(
            store=store,
            goat=GoatClient("http://localhost:62606", httpx.MockTransport(offline)),
        )
    )
    assert client.get("/api/models").status_code == 503
    assert (
        client.post(
            "/api/ventures",
            json={"name": "test"},
            headers={"Origin": "https://untrusted.example"},
        ).status_code
        == 403
    )
    assert client.get("/api/health").status_code == 200
    assert client.get("/").status_code == 200
    assert "Virtual EIR" in client.get("/").text
    with pytest.raises(ValueError):
        GoatClient("https://remote.example")


def test_concurrent_turns_rejected(tmp_path: Path) -> None:
    store = Store(tmp_path / "state.sqlite3")
    venture = store.create(Profile(name="test"))
    session = store.new_session(venture.venture_id)

    class SlowGoat(GoatClient):
        async def reply(self, **kwargs) -> str:
            await asyncio.sleep(0.05)
            return "reply"

    coach = Coach(store, SlowGoat("http://localhost:62606"))

    async def exercise() -> None:
        first = asyncio.create_task(
            coach.chat(venture.venture_id, session.session_id, ChatInput(message="one"))
        )
        await asyncio.sleep(0.01)
        with pytest.raises(Conflict):
            await coach.chat(
                venture.venture_id, session.session_id, ChatInput(message="two")
            )
        await first

    asyncio.run(exercise())
    assert len(store.session(venture.venture_id, session.session_id).turns) == 2


@pytest.mark.parametrize("value", [None, 1, [], {}])
def test_invalid_token_then_successful_retry(tmp_path: Path, value: object) -> None:
    store = Store(tmp_path / "state.sqlite3")
    venture = store.create(Profile(name="test"))
    session = store.new_session(venture.venture_id)
    broken = True

    def respond(request: httpx.Request) -> httpx.Response:
        if broken:
            body = (
                "data: "
                + json.dumps({"type": "token", "token": value})
                + '\n\ndata: {"type":"done"}\n\n'
            )
            return httpx.Response(200, text=body)
        return fake_goat(request)

    client = TestClient(
        create_app(
            store=store,
            goat=GoatClient("http://localhost:62606", httpx.MockTransport(respond)),
        )
    )
    path = f"/api/ventures/{venture.venture_id}/sessions/{session.session_id}/chat"
    assert client.post(path, json={"message": "Hi"}).status_code == 503
    assert store.session(venture.venture_id, session.session_id).turns == []
    assert store.get(venture.venture_id).revision == 1
    broken = False
    assert client.post(path, json={"message": "Retry"}).status_code == 200


def test_partial_token_before_error_is_not_saved(tmp_path: Path) -> None:
    body = 'data: {"type":"token","token":"partial"}\n\ndata: {"type":"error","message":"failed"}\n\ndata: {"type":"done"}\n\n'
    test_model_failures_save_no_turns(tmp_path, body)


def test_connections_close_and_failed_revision_rolls_back(tmp_path: Path) -> None:
    store = Store(tmp_path / "state.sqlite3")
    venture = store.create(Profile(name="test"))
    with store.connect() as db:
        db.execute("SELECT 1")
    with pytest.raises(sqlite3.ProgrammingError):
        db.execute("SELECT 1")
    # Inject failure in the second write: neither current state nor audit history may change.
    with store.connect() as db:
        db.execute(
            "CREATE TRIGGER reject_revision BEFORE INSERT ON revisions BEGIN SELECT RAISE(ABORT, 'injected'); END"
        )
    with pytest.raises(sqlite3.IntegrityError):
        store.update(venture.venture_id, Profile(name="modified"), 1)
    assert store.get(venture.venture_id).profile.name == "test"
    assert store.get(venture.venture_id).revision == 1
    with store.connect() as db:
        assert db.execute("SELECT COUNT(*) FROM revisions").fetchone()[0] == 1
