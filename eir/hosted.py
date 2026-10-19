"""Small-group link demo: durable global call limits and backend-only metrics."""

from __future__ import annotations

import json
import logging
import os
import time
from uuid import uuid4

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.concurrency import run_in_threadpool

from eir.coaching import ModelUnavailable
from eir.openai_client import OpenAIClient
from eir.postgres_store import StorageUnavailable
from eir.store import Conflict, Store

logger = logging.getLogger("eir.usage")


class DemoLimit(Exception):
    pass


class CallGate:
    def __init__(self, store: Store, *, per_minute: int = 6, per_day: int = 200):
        if per_minute < 1 or per_day < 1:
            raise ValueError("Demo call limits must be positive.")
        self.store = store
        self.per_minute = per_minute
        self.per_day = per_day
        with store.connect() as db:
            db.executescript("""
                CREATE TABLE IF NOT EXISTS demo_calls (
                    request_id TEXT PRIMARY KEY, started_at BIGINT NOT NULL,
                    finished_at BIGINT, status INTEGER
                );
                CREATE INDEX IF NOT EXISTS demo_calls_time ON demo_calls(started_at);
            """)

    def reserve(self, *, timestamp: int | None = None) -> str:
        if os.environ.get("EIR_DEMO_DISABLED") == "1":
            raise DemoLimit("AI calls are paused for this demo.")
        timestamp = int(time.time()) if timestamp is None else timestamp
        with self.store.connect() as db:
            db.execute("BEGIN IMMEDIATE")
            rows = db.execute(
                "SELECT started_at, finished_at FROM demo_calls WHERE started_at>=?",
                (min(timestamp - 240, timestamp // 86400 * 86400),),
            ).fetchall()
            if any(
                row["finished_at"] is None and row["started_at"] > timestamp - 240
                for row in rows
            ):
                raise DemoLimit(
                    "Another AI request is running. Please try again shortly."
                )
            if (
                sum(row["started_at"] > timestamp - 60 for row in rows)
                >= self.per_minute
            ):
                raise DemoLimit(
                    "The shared demo has reached its minute limit. Please wait."
                )
            if (
                sum(row["started_at"] >= timestamp // 86400 * 86400 for row in rows)
                >= self.per_day
            ):
                raise DemoLimit("The shared demo has reached its daily AI call limit.")
            request_id = str(uuid4())
            db.execute(
                "INSERT INTO demo_calls VALUES (?, ?, NULL, NULL)",
                (request_id, timestamp),
            )
        return request_id

    def finish(self, request_id: str, status: int):
        with self.store.connect() as db:
            db.execute(
                "UPDATE demo_calls SET finished_at=?, status=? WHERE request_id=?",
                (int(time.time()), status, request_id),
            )


async def protected_request(request: Request, call_next, gate: CallGate, hosts):
    host = request.headers.get("host", "")
    origin = request.headers.get("origin")
    if host not in hosts or (origin and origin != "https://" + host):
        return JSONResponse({"detail": "This address is not allowed."}, status_code=403)
    if (
        request.method not in {"GET", "HEAD", "OPTIONS"}
        and request.headers.get("sec-fetch-site") == "cross-site"
    ):
        return JSONResponse(
            {"detail": "Cross-site requests are not allowed."}, status_code=403
        )
    if request.method in {"POST", "PUT", "PATCH"} and len(await request.body()) > 65536:
        return JSONResponse({"detail": "Request is too large."}, status_code=413)
    is_ai = request.method == "POST" and (
        request.url.path.endswith("/chat")
        or request.url.path.endswith("/workspace/draft")
    )
    request_id = None
    try:
        if is_ai:
            request_id = await run_in_threadpool(gate.reserve)
        response = await call_next(request)
    except DemoLimit as exc:
        return JSONResponse(
            {"detail": str(exc)}, status_code=429, headers={"Retry-After": "60"}
        )
    except StorageUnavailable:
        return JSONResponse(
            {"detail": "Demo storage is unavailable. Please retry later."},
            status_code=503,
        )
    finally:
        if request_id:
            try:
                await run_in_threadpool(
                    gate.finish,
                    request_id,
                    200
                    if "response" in locals() and response.status_code < 400
                    else 503,
                )
            except StorageUnavailable:
                logger.warning(
                    '{"event":"demo_call_finish","status":"storage_unavailable"}'
                )
    return response


class HostedOpenAI(OpenAIClient):
    async def models(self):
        # Choices are allowlisted server-side; page refreshes do not call OpenAI.
        return list(self.allowed_models)

    async def reply(self, **kwargs):
        session = kwargs["session"]
        if sum(len(turn.content) for turn in session.turns) > 16000:
            raise Conflict(
                "Start a follow-up session to continue with the saved profile and plan."
            )
        return await super().reply(**kwargs)

    async def _request(self, method, path, **kwargs):
        started = time.monotonic()
        model = kwargs.get("json", {}).get("model", self.model)
        try:
            data = await super()._request(method, path, **kwargs)
        except ModelUnavailable:
            logger.warning(
                json.dumps({"event": "openai_call", "model": model, "status": "failed"})
            )
            raise
        usage = data.get("usage") or {}
        # Never log messages, profile data, credentials, request URLs or headers.
        logger.warning(
            json.dumps(
                {
                    "event": "openai_call",
                    "model": model,
                    "status": data.get("status", "unknown"),
                    "input_tokens": usage.get("input_tokens"),
                    "output_tokens": usage.get("output_tokens"),
                    "elapsed_ms": round((time.monotonic() - started) * 1000),
                }
            )
        )
        return data
