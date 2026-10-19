"""Loopback-only local HTTP entrypoint. Routes stay thin; logic lives in services."""

from __future__ import annotations

import os
from collections.abc import Awaitable, Callable
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from starlette.responses import Response
from starlette.staticfiles import StaticFiles

from eir.coaching import Coach, ModelClient, ModelUnavailable
from eir.feature_routes import install_workspace_routes
from eir.models import ChatInput, ChatOutput, Profile, ProfileUpdate, Session, Venture
from eir.runtime import configured_client
from eir.store import Conflict, NotFound, Store

ROOT = Path(__file__).resolve().parent.parent


def create_app(
    *,
    store: Store | None = None,
    goat: ModelClient | None = None,
    public_hosts: frozenset[str] | None = None,
) -> FastAPI:
    store = store or Store(
        Path(os.environ.get("EIR_DB_PATH", str(ROOT / "var/eir/ventures.sqlite3")))
    )
    goat = goat or configured_client()
    coach = Coach(store, goat)
    app = FastAPI(
        title="Virtual EIR shared demo"
        if public_hosts
        else "Virtual EIR local prototype",
        version="0.1.0",
        docs_url=None if public_hosts else "/docs",
        redoc_url=None if public_hosts else "/redoc",
        openapi_url=None if public_hosts else "/openapi.json",
    )
    if public_hosts is not None:
        from eir.hosted import CallGate

        if not public_hosts:
            raise ValueError("A hosted demo requires explicit allowed hostnames.")
        gate = CallGate(store)
    port_text = os.environ.get("EIR_HTTP_PORT", "62607")
    if (
        not port_text.isascii()
        or not port_text.isdecimal()
        or not 1 <= int(port_text) <= 65535
    ):
        raise ValueError("EIR_HTTP_PORT must be an integer port from 1 to 65535.")
    port = int(port_text)

    @app.middleware("http")
    async def local_boundary(
        request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        if public_hosts is not None:
            from eir.hosted import protected_request

            response = await protected_request(request, call_next, gate, public_hosts)
        else:
            if request.client and request.client.host not in {
                "127.0.0.1",
                "::1",
                "testclient",
            }:
                return JSONResponse(
                    {"detail": "Local prototype only."}, status_code=403
                )
            origin = request.headers.get("origin")
            allowed = {f"http://127.0.0.1:{port}", f"http://localhost:{port}"}
            if origin and origin not in allowed:
                return JSONResponse(
                    {"detail": "Cross-origin requests are not allowed."},
                    status_code=403,
                )
            response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Cache-Control"] = "no-store"
        if public_hosts is not None:
            response.headers["Referrer-Policy"] = "no-referrer"
            response.headers["X-Robots-Tag"] = "noindex, nofollow, noarchive"
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
    def home() -> Response:
        index = Path(__file__).parent / "web/index.html"
        if public_hosts is not None:
            html = index.read_text(encoding="utf-8")
            html = html.replace('href="http://127.0.0.1:62606"', 'href="/"')
            html = html.replace("Open GOAT chat", "Shared demo home")
            html = html.replace("Local educational prototype", "Shared fictional demo")
            html = html.replace(
                '<div id="context-strip"',
                '<div class="context-strip" role="note">Shared demo: everyone with the link can view and edit these fictional ventures. Create your own venture; do not enter private data.</div><div id="context-strip"',
            )
            html = html.replace("this local address", "this demo address")
            html = html.replace(
                "Connecting to local services", "Connecting to the demo"
            )
            return HTMLResponse(html)
        return FileResponse(index)

    @app.get("/api/health")
    def health() -> dict[str, str]:
        store.list_ventures()
        return {
            "status": "ok",
            "mode": "shared-fictional-demo" if public_hosts else "local-fictional-demo",
        }

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

    install_workspace_routes(app, store, goat)

    app.mount(
        "/assets", StaticFiles(directory=Path(__file__).parent / "web"), name="assets"
    )
    return app
