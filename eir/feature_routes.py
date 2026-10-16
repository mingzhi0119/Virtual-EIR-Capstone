"""Thin venture-scoped workspace HTTP routes."""

from fastapi import APIRouter, FastAPI, Request
from fastapi.responses import JSONResponse

from eir.coaching import GoatClient
from eir.feature_models import (
    DraftEdit,
    DraftRequest,
    GoalUpdate,
    PlanDecision,
    TaskUpdate,
    Workspace,
)
from eir.feature_store import FeatureStore
from eir.planning import Planner, WorkspaceInvalid
from eir.store import Store


def install_workspace_routes(app: FastAPI, store: Store, goat: GoatClient) -> None:
    features = FeatureStore(store)
    planner = Planner(features, goat)
    app.state.feature_store = features
    router = APIRouter(prefix="/api/ventures/{venture_id}/workspace")

    @app.exception_handler(WorkspaceInvalid)
    async def invalid(_: Request, exc: WorkspaceInvalid) -> JSONResponse:
        return JSONResponse({"detail": exc.detail}, status_code=exc.status_code)

    @router.get("")
    def read(venture_id: str) -> Workspace:
        return features.get(venture_id)

    @router.post("/draft")
    async def draft(venture_id: str, request: DraftRequest) -> Workspace:
        return await planner.draft(venture_id, request)

    @router.put("/draft")
    def edit(venture_id: str, request: DraftEdit) -> Workspace:
        return planner.edit(venture_id, request)

    @router.post("/approve")
    def approve(venture_id: str, request: PlanDecision) -> Workspace:
        return planner.approve(venture_id, request)

    @router.post("/reject")
    def reject(venture_id: str, request: PlanDecision) -> Workspace:
        return planner.reject(venture_id, request)

    @router.post("/tasks/{task_id}")
    def task(venture_id: str, task_id: str, request: TaskUpdate) -> Workspace:
        return planner.update_task(venture_id, task_id, request)

    @router.post("/goal")
    def goal(venture_id: str, request: GoalUpdate) -> Workspace:
        return planner.update_goal(venture_id, request)

    app.include_router(router)
