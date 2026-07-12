"""OpenAI configuration + shared client. Reads from environment / .env."""

from __future__ import annotations

import functools
import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()


def require_api_key() -> str:
    key = os.environ.get("OPENAI_API_KEY")
    if not key:
        raise RuntimeError("OPENAI_API_KEY is not set (see .env / .env.example)")
    return key


def model() -> str:
    return os.environ.get("OPENAI_MODEL", "gpt-5")


def model_mini() -> str:
    return os.environ.get("OPENAI_MODEL_MINI", "gpt-5-mini")


def vector_store_id() -> str | None:
    vid = os.environ.get("OPENAI_VECTOR_STORE_ID")
    return vid or None


def multi_agent() -> bool:
    """Whether to use the multi-agent orchestrator (default on)."""
    return os.environ.get("MULTI_AGENT", "1").lower() not in {"0", "false", "no"}


def eval_on() -> bool:
    """Whether to run the LLM-judge after each analysis (default on)."""
    return os.environ.get("EVAL_ON", "1").lower() not in {"0", "false", "no"}


@functools.lru_cache(maxsize=1)
def client() -> OpenAI:
    """Process-wide OpenAI client (raw API — used for files / vector stores)."""
    return OpenAI(api_key=require_api_key())
