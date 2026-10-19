"""Official API boundary is mocked; persistence and founder controls are real."""

import json

import httpx
import pytest
from fastapi.testclient import TestClient

from eir.app import create_app
from eir.coaching import GoatClient
from eir.openai_client import OpenAIClient
from eir.runtime import configured_client
from eir.store import Store


def completed(text="Ask about the student's last dinner purchase."):
    return {
        "status": "completed",
        "output": [
            {
                "type": "message",
                "role": "assistant",
                "status": "completed",
                "content": [{"type": "output_text", "text": text}],
            }
        ],
    }


def setup(tmp_path, handler):
    store = Store(tmp_path / "api.sqlite3")
    adapter = OpenAIClient(
        "test-private-key", "gpt-4.1-mini", httpx.MockTransport(handler)
    )
    client = TestClient(create_app(store=store, goat=adapter))
    venture = client.post(
        "/api/ventures",
        json={"name": "Fictional dinner", "communication_preference": "business"},
    ).json()
    base = "/api/ventures/" + venture["venture_id"]
    session = client.post(base + "/sessions").json()
    chat = base + "/sessions/" + session["session_id"] + "/chat"
    return client, base, chat


def test_responses_context_history_and_model_selection(tmp_path):
    calls = []

    def handler(request):
        assert request.url.host == "api.openai.com"
        assert request.headers["authorization"] == "Bearer test-private-key"
        if request.method == "GET":
            assert request.url.path == "/v1/models/gpt-4.1-mini"
            return httpx.Response(200, json={"id": "gpt-4.1-mini"})
        assert request.url.path == "/v1/responses"
        payload = json.loads(request.content)
        assert "test-private-key" not in request.content.decode()
        assert payload["store"] is False
        assert payload["max_output_tokens"] == 4096
        assert "FOUNDER-CONFIRMED STATE" in payload["instructions"]
        assert "business" in payload["instructions"]
        calls.append(payload)
        return httpx.Response(200, json=completed())

    client, base, chat = setup(tmp_path, handler)
    assert client.get("/api/models").json() == {"models": ["gpt-4.1-mini"]}
    initial = client.get(base).json()
    for message in ["Guide me", "Follow up"]:
        assert (
            client.post(
                chat, json={"model": "gpt-4.1-mini", "message": message}
            ).status_code
            == 200
        )
    assert [item["role"] for item in calls[1]["input"]] == ["user", "assistant", "user"]
    assert client.get(base).json() == initial
    assert (
        client.post(chat, json={"model": "other", "message": "No"}).status_code == 503
    )
    assert len(calls) == 2


@pytest.mark.parametrize(
    "failure",
    [
        401,
        403,
        404,
        429,
        500,
        302,
        "timeout",
        "json",
        "list",
        "incomplete",
        "refusal",
        "empty",
        "malformed",
    ],
)
def test_failure_never_saves_turns_or_draft(tmp_path, failure):
    def handler(request):
        if isinstance(failure, int):
            return httpx.Response(
                failure,
                json={"error": {"message": "test-private-key"}},
                headers={"Location": "https://other.example/"},
            )
        if failure == "timeout":
            raise httpx.ReadTimeout("test-private-key")
        if failure == "json":
            return httpx.Response(200, text="not json test-private-key")
        data = completed()
        if failure == "list":
            data = []
        elif failure == "incomplete":
            data["status"] = "incomplete"
        elif failure == "refusal":
            data["output"][0]["content"] = [
                {"type": "refusal", "refusal": "test-private-key"}
            ]
        elif failure == "empty":
            data["output"] = []
        elif failure == "malformed":
            data["output"] = [None]
        return httpx.Response(200, json=data)

    client, base, chat = setup(tmp_path, handler)
    before = client.get(base).json()
    response = client.post(chat, json={"model": "gpt-4.1-mini", "message": "Help"})
    assert response.status_code == 503
    assert "test-private-key" not in response.text
    assert client.get(chat.removesuffix("/chat")).json()["turns"] == []
    response = client.post(
        base + "/workspace/draft",
        json={
            "model": "gpt-4.1-mini",
            "expected_revision": 0,
            "objective": "Learn",
            "success_criteria": ["Five interviews"],
        },
    )
    assert response.status_code == 503
    assert "test-private-key" not in response.text
    assert client.get(base + "/workspace").json()["plans"] == []
    assert client.get(base).json() == before


def test_plan_requires_explicit_approval_and_followup_reads_saved_report(tmp_path):
    calls = []

    def handler(request):
        calls.append(json.loads(request.content))
        text = (
            json.dumps(
                {
                    "rationale": "Initial discovery, not validation",
                    "tasks": [
                        {
                            "task_id": "interviews",
                            "title": "Interview five students",
                            "target_count": 5,
                            "dependencies": [],
                        }
                    ],
                }
            )
            if len(calls) == 1
            else "Planned 5; completed 2; remaining 3. Small sample."
        )
        return httpx.Response(200, json=completed(text))

    client, base, _ = setup(tmp_path, handler)
    workspace = base + "/workspace"
    response = client.post(
        workspace + "/draft",
        json={
            "model": "gpt-4.1-mini",
            "expected_revision": 0,
            "objective": "Learn",
            "success_criteria": ["Five interviews"],
        },
    )
    assert response.status_code == 200
    draft = response.json()
    assert calls[0]["text"]["format"]["strict"] is True
    assert calls[0]["text"]["format"]["schema"]["additionalProperties"] is False
    assert draft["goal"] is None
    plan = draft["plans"][-1]
    approved = client.post(
        workspace + "/approve",
        json={"expected_revision": draft["revision"], "plan_id": plan["plan_id"]},
    ).json()
    saved = client.post(
        workspace + "/tasks/" + plan["tasks"][0]["task_id"],
        json={
            "expected_revision": approved["revision"],
            "completed_count": 2,
            "status": "in_progress",
            "result": "Two people mention price; n=2 limited sample.",
        },
    ).json()
    assert saved["plans"][-1]["tasks"][0]["completed_count"] == 2
    followup = client.post(base + "/sessions").json()
    response = client.post(
        base + "/sessions/" + followup["session_id"] + "/chat",
        json={"model": "gpt-4.1-mini", "message": "Next step?"},
    )
    assert response.status_code == 200
    assert "Two people mention price" in calls[-1]["instructions"]
    assert len(calls[-1]["input"]) == 1
    assert "text" not in calls[-1]
    assert client.get(workspace).json() == saved


def test_provider_config_is_explicit_and_never_evaluated(tmp_path, monkeypatch):
    for key in [
        "EIR_MODEL_PROVIDER",
        "EIR_CONFIG_FILE",
        "OPENAI_API_KEY",
        "EIR_OPENAI_MODEL",
        "EIR_OPENAI_MODELS",
    ]:
        monkeypatch.delenv(key, raising=False)
    assert isinstance(configured_client(), GoatClient)
    monkeypatch.setenv("EIR_MODEL_PROVIDER", "openai")
    with pytest.raises(ValueError, match="OPENAI_API_KEY"):
        configured_client()
    config = tmp_path / ".env.local"
    config.write_text("OPENAI_API_KEY=test-local\nEIR_OPENAI_MODEL=gpt-4.1-mini\n")
    monkeypatch.setenv("EIR_CONFIG_FILE", str(config))
    assert configured_client().model == "gpt-4.1-mini"
    config.write_text(
        "OPENAI_API_KEY=test-local\nEIR_OPENAI_MODEL=gpt-5.6-luna\n"
        "EIR_OPENAI_MODELS=gpt-5.6-luna, gpt-5.6-terra,gpt-5.6-sol,gpt-4.1-mini\n"
    )
    adapter = configured_client()
    assert adapter.model == "gpt-5.6-luna"
    assert adapter.allowed_models == (
        "gpt-5.6-luna",
        "gpt-5.6-terra",
        "gpt-5.6-sol",
        "gpt-4.1-mini",
    )
    config.write_text("UNSUPPORTED=do-not-execute\n")
    with pytest.raises(ValueError, match="unsupported"):
        configured_client()


def test_allowlisted_choices_route_chat_and_plan_without_expanding_access(tmp_path):
    calls = []
    allowed = ["gpt-5.6-luna", "gpt-5.6-terra", "gpt-5.6-sol", "gpt-4.1-mini"]

    def handler(request):
        if request.method == "GET":
            return httpx.Response(200, json={"id": request.url.path.split("/")[-1]})
        payload = json.loads(request.content)
        calls.append(payload)
        text = (
            json.dumps(
                {
                    "rationale": "Learn from interviews",
                    "tasks": [
                        {
                            "task_id": "interviews",
                            "title": "Interview five students",
                            "target_count": 5,
                            "dependencies": [],
                        }
                    ],
                }
            )
            if "text" in payload
            else "Ask about the last purchase."
        )
        data = completed(text)
        data["output"].insert(0, {"type": "reasoning", "summary": []})
        return httpx.Response(200, json=data)

    adapter = OpenAIClient(
        "test-private-key",
        allowed[0],
        httpx.MockTransport(handler),
        allowed_models=allowed + [allowed[0]],
    )
    client = TestClient(
        create_app(store=Store(tmp_path / "choices.sqlite3"), goat=adapter)
    )
    assert client.get("/api/models").json()["models"] == allowed
    venture = client.post("/api/ventures", json={"name": "Fictional"}).json()
    base = "/api/ventures/" + venture["venture_id"]
    session = client.post(base + "/sessions").json()
    chat = base + "/sessions/" + session["session_id"] + "/chat"
    for model in allowed:
        assert (
            client.post(chat, json={"model": model, "message": "Help"}).status_code
            == 200
        )
        assert calls[-1]["model"] == model
        assert calls[-1].get("reasoning") == (
            {"effort": "medium"} if model.startswith("gpt-5.6-") else None
        )
    draft = client.post(
        base + "/workspace/draft",
        json={
            "model": "gpt-5.6-sol",
            "expected_revision": 0,
            "objective": "Learn",
            "success_criteria": ["Five interviews"],
        },
    )
    assert draft.status_code == 200
    assert draft.json()["goal"] is None
    assert calls[-1]["model"] == "gpt-5.6-sol"
    assert calls[-1]["text"]["format"]["strict"] is True
    count = len(calls)
    for route, payload in [
        (chat, {"model": "unapproved-model", "message": "No"}),
        (
            base + "/workspace/draft",
            {
                "model": "unapproved-model",
                "expected_revision": draft.json()["revision"],
                "objective": "No",
                "success_criteria": ["No"],
            },
        ),
    ]:
        assert client.post(route, json=payload).status_code == 503
    assert len(calls) == count
    assert len(client.get(chat.removesuffix("/chat")).json()["turns"]) == 8
    assert len(client.get(base + "/workspace").json()["plans"]) == 1


def test_invalid_allowlisted_identifier_fails_before_network():
    with pytest.raises(ValueError, match="model identifiers"):
        OpenAIClient("test-private-key", "gpt-5.6-luna", allowed_models=["../other"])
