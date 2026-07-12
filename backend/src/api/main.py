"""FastAPI application entrypoint."""

from __future__ import annotations

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes import router


def _cors_origins() -> list[str]:
    # CORS_ORIGINS is comma-separated. When wired from a Render `fromService`
    # host it arrives without a scheme (e.g. "app.onrender.com"); CORS needs a
    # full origin, so default bare hosts to https://.
    raw = os.getenv("CORS_ORIGINS", "http://localhost:5173")
    origins: list[str] = []
    for part in raw.split(","):
        origin = part.strip().rstrip("/")
        if not origin:
            continue
        if not origin.startswith(("http://", "https://")):
            origin = f"https://{origin}"
        origins.append(origin)
    return origins


def create_app() -> FastAPI:
    app = FastAPI(
        title="ClientPulse API",
        description="Read-only portfolio, account detail, and risk queue API.",
        version="0.1.0",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=_cors_origins(),
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
        allow_headers=["*"],
    )
    app.include_router(router)
    return app


app = create_app()
