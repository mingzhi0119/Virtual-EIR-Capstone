"""Loopback-only local HTTP entrypoint. Routes stay thin; logic lives in services."""

from __future__ import annotations

import os
from collections.abc import Awaitable, Callable
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, JSONResponse
from starlette.responses import Response

from eir.coaching import Coach, GoatClient, ModelUnavailable
from eir.models import ChatInput, ChatOutput, Profile, ProfileUpdate, Session, Venture
from eir.store import Conflict, NotFound, Store

ROOT = Path(__file__).resolve().parent.parent


def create_app(
    *, store: Store | None = None, goat: GoatClient | None = None
) -> FastAPI:
    store = store or Store(
        Path(os.environ.get("EIR_DB_PATH", str(ROOT / "var/eir/ventures.sqlite3")))
    )
    goat = goat or GoatClient(
        os.environ.get("EIR_GOAT_BASE_URL", "http://127.0.0.1:62606")
    )
    coach = Coach(store, goat)
    app = FastAPI(title="Virtual EIR local prototype", version="0.1.0")

    @app.middleware("http")
    async def local_boundary(
        request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        if request.client and request.client.host not in {
            "127.0.0.1",
            "::1",
            "testclient",
        }:
            return JSONResponse({"detail": "Local prototype only."}, status_code=403)
        origin = request.headers.get("origin")
        allowed = {"http://127.0.0.1:62607", "http://localhost:62607"}
        if origin and origin not in allowed:
            return JSONResponse(
                {"detail": "Cross-origin requests are not allowed."}, status_code=403
            )
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Cache-Control"] = "no-store"
        return response

    @app.exception_handler(NotFound)
    async def missing(_: Request, exc: NotFound) -> JSONResponse:
        return JSONResponse({"detail": str(exc)}, status_code=404)

    @app.exception_handler(Conflict)
    async def conflicting(_: Request, exc: Conflict) -> JSONResponse:
        return JSONResponse({"detail": str(exc)}, status_code=409)

    @app.exception_handler(ModelUnavailable)
    async def unavailable(_: Request, exc: ModelUnavailable) -> JSONResponse:
        return JSONResponse({"detail": str(exc)}, status_code=503)

    @app.get("/")
    def home() -> FileResponse:
        return FileResponse(Path(__file__).parent / "web/index.html")

    @app.get("/api/health")
    def health() -> dict[str, str]:
        store.list_ventures()
        return {"status": "ok", "mode": "local-fictional-demo"}

    @app.get("/api/models")
    async def models() -> dict[str, list[str]]:
        return {"models": await goat.models()}

    @app.get("/api/ventures")
    def ventures() -> list[Venture]:
        return store.list_ventures()

    @app.post("/api/ventures", status_code=201)
    def create(profile: Profile) -> Venture:
        return store.create(profile)

    @app.get("/api/ventures/{venture_id}")
    def read(venture_id: str) -> Venture:
        return store.get(venture_id)

    @app.put("/api/ventures/{venture_id}")
    def confirm(venture_id: str, update: ProfileUpdate) -> Venture:
        return store.update(venture_id, update.profile, update.expected_revision)

    @app.get("/api/ventures/{venture_id}/sessions")
    def sessions(venture_id: str) -> list[Session]:
        return store.sessions(venture_id)

    @app.post("/api/ventures/{venture_id}/sessions", status_code=201)
    def new_session(venture_id: str) -> Session:
        return store.new_session(venture_id)

    @app.get("/api/ventures/{venture_id}/sessions/{session_id}")
    def session(venture_id: str, session_id: str) -> Session:
        return store.session(venture_id, session_id)

    @app.post("/api/ventures/{venture_id}/sessions/{session_id}/chat")
    async def chat(venture_id: str, session_id: str, request: ChatInput) -> ChatOutput:
        return await coach.chat(venture_id, session_id, request)

    return app
