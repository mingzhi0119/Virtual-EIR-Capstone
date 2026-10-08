"""Separate SQLite store with founder-confirmed revisions and atomic turn saves."""

from __future__ import annotations

import json
import sqlite3
from collections.abc import Iterator
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from eir.models import Profile, Session, Turn, Venture


class NotFound(Exception):
    pass


class Conflict(Exception):
    pass


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


class Store:
    def __init__(self, path: Path) -> None:
        self.path = path
        path.parent.mkdir(parents=True, exist_ok=True)
        with self.connect() as db:
            db.executescript("""
                CREATE TABLE IF NOT EXISTS ventures (
                    venture_id TEXT PRIMARY KEY, profile TEXT NOT NULL,
                    revision INTEGER NOT NULL, updated_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS revisions (
                    venture_id TEXT NOT NULL REFERENCES ventures(venture_id),
                    revision INTEGER NOT NULL, profile TEXT NOT NULL,
                    confirmed_at TEXT NOT NULL,
                    PRIMARY KEY(venture_id, revision)
                );
                CREATE TABLE IF NOT EXISTS sessions (
                    session_id TEXT PRIMARY KEY,
                    venture_id TEXT NOT NULL REFERENCES ventures(venture_id),
                    created_at TEXT NOT NULL, turns TEXT NOT NULL
                );
            """)

    @contextmanager
    def connect(self) -> Iterator[sqlite3.Connection]:
        db = sqlite3.connect(self.path, timeout=10)
        try:
            db.row_factory = sqlite3.Row
            db.execute("PRAGMA foreign_keys=ON")
            with db:
                yield db
        finally:
            db.close()

    @staticmethod
    def _venture(row: sqlite3.Row) -> Venture:
        return Venture(
            venture_id=row["venture_id"],
            profile=Profile.model_validate_json(row["profile"]),
            revision=row["revision"],
            updated_at=row["updated_at"],
        )

    def list_ventures(self) -> list[Venture]:
        with self.connect() as db:
            return [
                self._venture(row)
                for row in db.execute("SELECT * FROM ventures ORDER BY updated_at DESC")
            ]

    def get(self, venture_id: str) -> Venture:
        with self.connect() as db:
            row = db.execute(
                "SELECT * FROM ventures WHERE venture_id=?", (venture_id,)
            ).fetchone()
        if row is None:
            raise NotFound("Venture not found.")
        return self._venture(row)

    def create(self, profile: Profile) -> Venture:
        venture = Venture(
            venture_id=str(uuid4()), profile=profile, revision=1, updated_at=now()
        )
        with self.connect() as db:
            payload = profile.model_dump_json()
            db.execute(
                "INSERT INTO ventures VALUES (?, ?, ?, ?)",
                (venture.venture_id, payload, 1, venture.updated_at),
            )
            db.execute(
                "INSERT INTO revisions VALUES (?, ?, ?, ?)",
                (venture.venture_id, 1, payload, venture.updated_at),
            )
        return venture

    def update(
        self, venture_id: str, profile: Profile, expected_revision: int
    ) -> Venture:
        timestamp = now()
        with self.connect() as db:
            db.execute("BEGIN IMMEDIATE")
            row = db.execute(
                "SELECT revision FROM ventures WHERE venture_id=?", (venture_id,)
            ).fetchone()
            if row is None:
                raise NotFound("Venture not found.")
            if row["revision"] != expected_revision:
                raise Conflict(
                    "Profile changed. Reload it before confirming your edit."
                )
            revision = expected_revision + 1
            payload = profile.model_dump_json()
            db.execute(
                "UPDATE ventures SET profile=?, revision=?, updated_at=? WHERE venture_id=?",
                (payload, revision, timestamp, venture_id),
            )
            db.execute(
                "INSERT INTO revisions VALUES (?, ?, ?, ?)",
                (venture_id, revision, payload, timestamp),
            )
        return Venture(
            venture_id=venture_id,
            profile=profile,
            revision=revision,
            updated_at=timestamp,
        )

    @staticmethod
    def _session(row: sqlite3.Row) -> Session:
        return Session(
            session_id=row["session_id"],
            venture_id=row["venture_id"],
            created_at=row["created_at"],
            turns=json.loads(row["turns"]),
        )

    def new_session(self, venture_id: str) -> Session:
        self.get(venture_id)
        session = Session(
            session_id=str(uuid4()), venture_id=venture_id, created_at=now()
        )
        with self.connect() as db:
            db.execute(
                "INSERT INTO sessions VALUES (?, ?, ?, ?)",
                (session.session_id, venture_id, session.created_at, "[]"),
            )
        return session

    def sessions(self, venture_id: str) -> list[Session]:
        self.get(venture_id)
        with self.connect() as db:
            return [
                self._session(row)
                for row in db.execute(
                    "SELECT * FROM sessions WHERE venture_id=? ORDER BY created_at",
                    (venture_id,),
                )
            ]

    def session(self, venture_id: str, session_id: str) -> Session:
        with self.connect() as db:
            row = db.execute(
                "SELECT * FROM sessions WHERE session_id=? AND venture_id=?",
                (session_id, venture_id),
            ).fetchone()
        if row is None:
            raise NotFound("Session not found for this venture.")
        return self._session(row)

    def save_turns(self, session: Session, turns: list[Turn]) -> Session:
        with self.connect() as db:
            payload = json.dumps(
                [turn.model_dump() for turn in turns], ensure_ascii=False
            )
            db.execute(
                "UPDATE sessions SET turns=? WHERE session_id=? AND venture_id=?",
                (payload, session.session_id, session.venture_id),
            )
        return session.model_copy(update={"turns": turns})
