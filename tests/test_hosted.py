"""Exercise hosted limits, origin enforcement, persistence and revision conflicts."""

import asyncio
import json
import os
from concurrent.futures import ThreadPoolExecutor
from uuid import uuid4

import httpx
import pytest
from fastapi.testclient import TestClient

from eir.app import create_app
from eir.hosted import CallGate, DemoLimit, HostedOpenAI
from eir.models import ChatInput, Profile, Session, Turn
from eir.postgres_store import PostgresStore, StorageUnavailable
from eir.store import Store


def response(text="Ask about the most recent dinner purchase."):
    return {
        "status": "completed",
        "usage": {"input_tokens": 123, "output_tokens": 16},
        "output": [
            {
                "type": "message",
                "status": "completed",
                "role": "assistant",
                "content": [{"type": "output_text", "text": text}],
            }
        ],
    }


@pytest.fixture
def hosted(tmp_path):
    calls = []

    def api(request):
        calls.append(request)
        assert request.url.host == "api.openai.com"
        return httpx.Response(200, json=response())

    store = Store(tmp_path / "shared.sqlite3")
    model = HostedOpenAI(
        "private-test-secret", "gpt-4.1-mini", httpx.MockTransport(api)
    )
    app = create_app(
        store=store, goat=model, public_hosts=frozenset({"demo.vercel.app"})
    )
    client = TestClient(
        app, base_url="https://demo.vercel.app", client=("203.0.113.7", 5000)
    )
    return client, store, calls


def test_hosted_browser_boundary_and_no_private_assets(hosted):
    client, _, calls = hosted
    page = client.get("/")
    assert page.status_code == 200
    assert "everyone with the link" in page.text
    assert "127.0.0.1" not in page.text
    assert "private-test-secret" not in page.text
    assert page.headers["referrer-policy"] == "no-referrer"
    assert client.get("/", headers={"sec-fetch-site": "cross-site"}).status_code == 200
    for endpoint in [
        "/docs",
        "/openapi.json",
        "/.env.local",
        "/Team3_API.txt",
        "/eir/app.py",
    ]:
        assert client.get(endpoint).status_code == 404
    assert client.get("/api/models").json() == {"models": ["gpt-4.1-mini"]}
    assert not calls
    for headers in [
        {"host": "other.vercel.app"},
        {"origin": "https://evil.example"},
        {"sec-fetch-site": "cross-site"},
    ]:
        assert (
            client.post(
                "/api/ventures", headers=headers, json={"name": "Fictional"}
            ).status_code
            == 403
        )
    assert client.post("/api/ventures", content="x" * 65537).status_code == 413


def test_hosted_real_routes_log_only_usage_and_pause(hosted, caplog, monkeypatch):
    client, store, calls = hosted
    venture = client.post("/api/ventures", json={"name": "Fictional"}).json()
    base = "/api/ventures/" + venture["venture_id"]
    session = client.post(base + "/sessions").json()
    chat = base + "/sessions/" + session["session_id"] + "/chat"
    payload = {"message": "private founder message", "model": "gpt-4.1-mini"}
    assert client.post(chat, json=payload).status_code == 200
    assert len(calls) == 1
    assert '"input_tokens": 123' in caplog.text
    assert "private founder message" not in caplog.text
    assert "private-test-secret" not in caplog.text
    assert len(store.session(venture["venture_id"], session["session_id"]).turns) == 2
    monkeypatch.setenv("EIR_DEMO_DISABLED", "1")
    assert client.post(chat, json=payload).status_code == 429
    assert len(calls) == 1


def test_gate_is_durable_atomic_and_recovers_abandoned_lease(tmp_path):
    path = tmp_path / "calls.sqlite3"
    gates = [CallGate(Store(path), per_minute=2, per_day=3) for _ in range(2)]

    def reserve(gate):
        try:
            return gate.reserve(timestamp=100000)
        except DemoLimit:
            return None

    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(reserve, gates))
    assert sum(value is not None for value in results) == 1
    key = next(value for value in results if value)
    gates[0].finish(key, 503)
    second = gates[1].reserve(timestamp=100001)
    gates[0].finish(second, 200)
    with pytest.raises(DemoLimit, match="minute"):
        gates[1].reserve(timestamp=100002)
    gates[1].reserve(timestamp=100100)  # Abandoned worker still consumes quota.
    with pytest.raises(DemoLimit, match="running"):
        gates[0].reserve(timestamp=100101)
    with pytest.raises(DemoLimit, match="daily"):
        gates[0].reserve(timestamp=100400)
    assert gates[0].reserve(timestamp=172800)  # UTC daily rollover.


def test_hosted_choices_do_not_call_api_and_logs_track_selected_model(tmp_path, caplog):
    calls = []

    def api(request):
        calls.append(json.loads(request.content))
        return httpx.Response(200, json=response())

    adapter = HostedOpenAI(
        "private-test-secret",
        "gpt-5.6-luna",
        httpx.MockTransport(api),
        allowed_models=["gpt-5.6-terra", "gpt-5.6-sol", "gpt-4.1-mini"],
    )
    client = TestClient(
        create_app(
            store=Store(tmp_path / "choices.sqlite3"),
            goat=adapter,
            public_hosts=frozenset({"demo.vercel.app"}),
        ),
        base_url="https://demo.vercel.app",
    )
    assert client.get("/api/models").json()["models"] == [
        "gpt-5.6-luna",
        "gpt-5.6-terra",
        "gpt-5.6-sol",
        "gpt-4.1-mini",
    ]
    assert calls == []
    venture = client.post("/api/ventures", json={"name": "Fictional"}).json()
    base = "/api/ventures/" + venture["venture_id"]
    session = client.post(base + "/sessions").json()
    result = client.post(
        base + "/sessions/" + session["session_id"] + "/chat",
        json={
            "model": "gpt-5.6-terra",
            "message": "private founder message",
        },
    )
    assert result.status_code == 200
    assert calls[0]["model"] == "gpt-5.6-terra"
    event = next(
        json.loads(record.message)
        for record in caplog.records
        if '"event": "openai_call"' in record.message
    )
    assert event["model"] == "gpt-5.6-terra"
    assert event["input_tokens"] == 123
    assert "private founder message" not in caplog.text
    assert "private-test-secret" not in caplog.text


def test_storage_failure_blocks_before_inference(hosted, monkeypatch):
    client, _, calls = hosted

    def unavailable(self, **kwargs):
        raise StorageUnavailable("Database unavailable")

    monkeypatch.setattr(CallGate, "reserve", unavailable)
    result = client.post(
        "/api/ventures/any/sessions/any/chat", json={"message": "test"}
    )
    assert result.status_code == 503
    assert not calls


def test_history_limit_requires_followup(hosted):
    _, store, calls = hosted
    venture = store.create(Profile(name="Fictional"))
    adapter = HostedOpenAI(
        "private-test-secret",
        "gpt-4.1-mini",
        httpx.MockTransport(lambda request: pytest.fail("Must not call API")),
    )
    from eir.store import Conflict

    with pytest.raises(Conflict, match="follow-up"):
        asyncio.run(
            adapter.reply(
                venture=venture,
                session=Session(
                    session_id="x",
                    venture_id=venture.venture_id,
                    created_at="now",
                    turns=[Turn(role="user", content="x" * 16001)],
                ),
                request=ChatInput(message="test"),
            )
        )
    assert not calls


@pytest.mark.skipif(
    not os.environ.get("EIR_TEST_DATABASE_URL"),
    reason="Optional isolated PostgreSQL integration",
)
def test_postgres_routes_persist_after_restart_and_lock_revisions():
    import psycopg
    from psycopg import sql

    url = os.environ["EIR_TEST_DATABASE_URL"]
    schema = "eir_test_" + uuid4().hex
    with psycopg.connect(url) as db:
        db.execute(sql.SQL("CREATE SCHEMA {}").format(sql.Identifier(schema)))
    try:

        def model(request):
            payload = json.loads(request.content)
            text = (
                json.dumps(
                    {
                        "rationale": "Test recent behavior with a small sample.",
                        "tasks": [
                            {
                                "task_id": "interviews",
                                "title": "Interview five students",
                                "target_count": 5,
                            }
                        ],
                    }
                )
                if "text" in payload
                else "Ask about a recent purchase."
            )
            return httpx.Response(200, json=response(text))

        store = PostgresStore(url, schema=schema)
        adapter = HostedOpenAI(
            "private-test-secret", "gpt-4.1-mini", httpx.MockTransport(model)
        )
        app = create_app(
            store=store, goat=adapter, public_hosts=frozenset({"demo.vercel.app"})
        )
        client = TestClient(app, base_url="https://demo.vercel.app")
        venture = client.post(
            "/api/ventures", json={"name": "Fictional postgres"}
        ).json()
        base = "/api/ventures/" + venture["venture_id"]
        session = client.post(base + "/sessions").json()
        assert (
            client.post(
                base + "/sessions/" + session["session_id"] + "/chat",
                json={"message": "Guide me", "model": "gpt-4.1-mini"},
            ).status_code
            == 200
        )
        draft = client.post(
            base + "/workspace/draft",
            json={
                "objective": "Learn about dinner needs",
                "success_criteria": ["Five interviews with evidence notes"],
                "constraints": "Five maximum",
                "expected_revision": 0,
                "model": "gpt-4.1-mini",
            },
        )
        assert draft.status_code == 200, draft.text
        ws = draft.json()
        approved = client.post(
            base + "/workspace/approve",
            json={
                "expected_revision": ws["revision"],
                "plan_id": ws["plans"][0]["plan_id"],
            },
        )
        assert approved.status_code == 200, approved.text
        ws = approved.json()
        payload = {
            "expected_revision": ws["revision"],
            "completed_count": 2,
            "status": "in_progress",
            "result": "Two fictional interviews",
        }
        task_url = base + "/workspace/tasks/" + ws["plans"][0]["tasks"][0]["task_id"]
        assert client.post(task_url, json=payload).status_code == 200
        assert client.post(task_url, json=payload).status_code == 409
        restarted = create_app(
            store=PostgresStore(url, schema=schema),
            goat=adapter,
            public_hosts=frozenset({"demo.vercel.app"}),
        )
        restored = TestClient(restarted, base_url="https://demo.vercel.app")
        assert (
            len(
                restored.get(base + "/sessions/" + session["session_id"]).json()[
                    "turns"
                ]
            )
            == 2
        )
        assert (
            restored.get(base + "/workspace").json()["plans"][0]["tasks"][0][
                "completed_count"
            ]
            == 2
        )
        gate = CallGate(PostgresStore(url, schema=schema))
        gate.reserve()
        with pytest.raises(DemoLimit, match="running"):
            CallGate(PostgresStore(url, schema=schema)).reserve()
    finally:
        with psycopg.connect(url) as db:
            db.execute(sql.SQL("DROP SCHEMA {} CASCADE").format(sql.Identifier(schema)))
