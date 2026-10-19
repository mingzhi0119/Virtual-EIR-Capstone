"""Optional hosted persistence; the local SQLite store remains the default."""

from __future__ import annotations

from contextlib import contextmanager
from pathlib import Path
import re
from urllib.parse import parse_qs, urlparse

from eir.store import Store


class StorageUnavailable(Exception):
    pass


class Connection:
    """Translate this application's small SQLite SQL subset to PostgreSQL."""

    def __init__(self, db):
        self.db = db

    def execute(self, sql, parameters=()):
        if sql == "BEGIN IMMEDIATE":
            # Serialize revision checks across every serverless instance.
            return self.db.execute("SELECT pg_advisory_xact_lock(746319081)")
        return self.db.execute(sql.replace("?", "%s"), parameters)

    def executescript(self, sql):
        for statement in sql.split(";"):
            if statement.strip():
                self.db.execute(statement)


class PostgresStore(Store):
    def __init__(self, url: str, *, schema: str = "public"):
        parsed = urlparse(url)
        if (
            parsed.scheme not in {"postgres", "postgresql"}
            or not parsed.hostname
            or parse_qs(parsed.query).get("sslmode", [""])[0]
            not in {"require", "verify-ca", "verify-full"}
        ):
            raise ValueError("Hosted storage requires a PostgreSQL URL with TLS.")
        if not re.fullmatch(r"[a-z][a-z0-9_]{0,62}", schema):
            raise ValueError("Invalid database namespace.")
        self._url = url
        self._schema = schema
        self.path = Path("hosted-postgres")  # Compatibility only; never opened.
        self.initialize()

    @contextmanager
    def connect(self):
        import psycopg
        from psycopg.rows import dict_row

        try:
            with psycopg.connect(
                self._url,
                row_factory=dict_row,
                connect_timeout=10,
            ) as db:
                # Neon transaction pooling does not accept startup options.
                db.execute("SET LOCAL statement_timeout = '15s'")
                db.execute("SET LOCAL lock_timeout = '10s'")
                db.execute(f"SET LOCAL search_path = {self._schema}")
                yield Connection(db)
        except psycopg.Error:
            # Database exceptions can contain connection details. Do not expose them.
            raise StorageUnavailable(
                "Demo storage is temporarily unavailable."
            ) from None
