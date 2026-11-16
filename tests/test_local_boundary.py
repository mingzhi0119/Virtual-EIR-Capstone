"""Real loopback peers must use the configured local address, even without Origin."""

from pathlib import Path

from fastapi.testclient import TestClient
import pytest

from eir.app import create_app
from eir.store import Store


@pytest.mark.parametrize(
    "host",
    [
        "attacker.example:62607",
        "localhost.attacker.example:62607",
        "127.0.0.1.attacker.example:62607",
        "localhost:62608",
        "127.0.0.1",
        "testserver",
        "",
    ],
)
def test_untrusted_host_cannot_read_or_write_without_origin(tmp_path: Path, host: str):
    store = Store(tmp_path / "boundary.sqlite3")
    client = TestClient(
        create_app(store=store),
        base_url="http://127.0.0.1:62607",
        client=("127.0.0.1", 5000),
    )
    headers = {"host": host}
    assert client.get("/api/ventures", headers=headers).status_code == 403
    assert (
        client.post(
            "/api/ventures", headers=headers, json={"name": "Fictional"}
        ).status_code
        == 403
    )
    assert store.list_ventures() == []


@pytest.mark.parametrize("host", ["127.0.0.1", "localhost", "[::1]"])
@pytest.mark.parametrize("port", [80, 62607, 62618])
def test_configured_loopback_addresses_support_same_origin_requests(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, host: str, port: int
):
    monkeypatch.setenv("EIR_HTTP_PORT", str(port))
    address = f"http://{host}:{port}"
    if port == 80:
        address = f"http://{host}"
    client = TestClient(
        create_app(store=Store(tmp_path / "allowed.sqlite3")),
        base_url=address,
        client=("::1" if host == "[::1]" else "127.0.0.1", 5000),
    )
    assert client.get("/api/health").status_code == 200
    assert (
        client.post(
            "/api/ventures",
            headers={"origin": address},
            json={"name": "Fictional"},
        ).status_code
        == 201
    )
    assert (
        client.post(
            "/api/ventures",
            headers={"origin": "http://attacker.example"},
            json={"name": "Untrusted"},
        ).status_code
        == 403
    )


def test_synthetic_test_host_is_available_only_to_testclient(tmp_path: Path):
    app = create_app(store=Store(tmp_path / "synthetic.sqlite3"))
    assert TestClient(app).get("/api/health").status_code == 200
    client = TestClient(app, client=("127.0.0.1", 5000))
    assert client.get("/api/health").status_code == 403
