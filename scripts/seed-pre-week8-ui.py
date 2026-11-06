"""Seed only the isolated browser acceptance database using the deterministic fixture."""

from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path[:0] = [str(ROOT), str(ROOT / "tests")]
import httpx  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from eir.app import create_app  # noqa: E402
from eir.store import Store  # noqa: E402
from eir.coaching import GoatClient  # noqa: E402
from test_workspace import ModelBoundary, approved, progress  # noqa: E402

out = ROOT / "var/pre-week8-proof"
out.mkdir(parents=True, exist_ok=True)
client = TestClient(
    create_app(
        store=Store(out / "demo.sqlite3"),
        goat=GoatClient("http://localhost:62606", httpx.MockTransport(ModelBoundary())),
    )
)
venture = client.post(
    "/api/ventures",
    json={"name": "Browser acceptance — fictional", "customer": "Evening students"},
).json()
base = f"/api/ventures/{venture['venture_id']}/workspace"
workspace = approved(client, base)
response = progress(client, base, workspace)
assert response.status_code == 200
(out / "ui-venture.txt").write_text(venture["venture_id"])
