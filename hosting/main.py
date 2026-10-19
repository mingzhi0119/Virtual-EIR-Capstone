"""Serve the allowlisted app prepared in the protected hosting directory."""

import os

from eir.app import create_app
from eir.hosted import HostedOpenAI
from eir.postgres_store import PostgresStore

if os.environ.get("VERCEL") != "1" or os.environ.get("EIR_DEPLOYMENT_PROTECTED") != "1":
    raise RuntimeError("This entrypoint requires the protected Vercel deployment.")

hosts = frozenset(
    os.environ[name]
    for name in ("VERCEL_URL", "VERCEL_BRANCH_URL", "VERCEL_PROJECT_PRODUCTION_URL")
    if os.environ.get(name)
)
store = PostgresStore(os.environ["DATABASE_URL"])
app = create_app(
    store=store,
    goat=HostedOpenAI(
        os.environ["OPENAI_API_KEY"],
        os.environ.get("EIR_OPENAI_MODEL", "gpt-5.6-luna"),
        allowed_models=[
            model.strip()
            for model in os.environ.get("EIR_OPENAI_MODELS", "").split(",")
            if model.strip()
        ],
    ),
    public_hosts=hosts,
)
