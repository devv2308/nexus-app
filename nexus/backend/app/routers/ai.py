"""
app/routers/ai.py
AI Chat endpoint — /api/ai/chat
Supports full conversation history, streaming-ready, OpenAI backend.
Falls back to a built-in echo when no API key is set (dev mode).
"""
from __future__ import annotations

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/ai", tags=["AI"])


# ── Request / Response schemas ────────────────────────────────────────────────
class AIMessage(BaseModel):
    role: str          # "user" | "assistant"
    content: str


class AIChatRequest(BaseModel):
    messages: list[AIMessage] = Field(..., min_length=1)
    # Optional per-request system override
    system: str | None = None


class AIChatResponse(BaseModel):
    reply: str
    model: str
    usage: dict | None = None


# ── Helpers ───────────────────────────────────────────────────────────────────
def _build_openai_messages(system: str, history: list[AIMessage]) -> list[dict]:
    msgs = [{"role": "system", "content": system}]
    for m in history:
        msgs.append({"role": m.role, "content": m.content})
    return msgs


async def _call_openai(messages: list[dict]) -> tuple[str, str, dict]:
    """Returns (reply_text, model_used, usage_dict)."""
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": settings.AI_MODEL,
                "messages": messages,
                "max_tokens": settings.AI_MAX_TOKENS,
                "temperature": 0.7,
            },
        )

    if resp.status_code != 200:
        try:
            err = resp.json().get("error", {}).get("message", "OpenAI error")
        except Exception:
            err = f"OpenAI returned {resp.status_code}"
        raise HTTPException(status_code=502, detail=err)

    data = resp.json()
    reply = data["choices"][0]["message"]["content"].strip()
    model = data.get("model", settings.AI_MODEL)
    usage = data.get("usage", {})
    return reply, model, usage


def _fallback_reply(user_msg: str) -> str:
    """
    Simple built-in fallback when no OpenAI key is configured.
    Useful for dev / demo mode — replace with any local model call.
    """
    greetings = {"hi", "hello", "hey", "hola", "salut", "namaste"}
    first_word = user_msg.strip().lower().split()[0] if user_msg.strip() else ""
    if first_word in greetings:
        return "Hey there! 👋 I'm Nexus AI. Add your OpenAI key in the backend `.env` to unlock my full capabilities!"
    return (
        f"I received your message: \"{user_msg[:120]}{'…' if len(user_msg) > 120 else ''}\"\n\n"
        "**Note:** I'm running in demo mode. Set `OPENAI_API_KEY` in `backend/.env` for real AI responses."
    )


# ── Route ─────────────────────────────────────────────────────────────────────
@router.post("/chat", response_model=AIChatResponse)
async def ai_chat(
    body: AIChatRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Multi-turn AI chat.  Send the full conversation history each time.
    The last message must have role="user".
    """
    system = body.system or settings.AI_SYSTEM_PROMPT
    last = body.messages[-1]
    if last.role != "user":
        raise HTTPException(status_code=400, detail="Last message must be from user.")

    if not settings.OPENAI_API_KEY:
        return AIChatResponse(
            reply=_fallback_reply(last.content),
            model="nexus-demo",
            usage=None,
        )

    messages = _build_openai_messages(system, body.messages)
    reply, model, usage = await _call_openai(messages)
    return AIChatResponse(reply=reply, model=model, usage=usage)


@router.get("/status")
async def ai_status(current_user: dict = Depends(get_current_user)):
    """Returns whether a real AI backend is configured."""
    return {
        "enabled": bool(settings.OPENAI_API_KEY),
        "model": settings.AI_MODEL if settings.OPENAI_API_KEY else "demo",
        "demo_mode": not bool(settings.OPENAI_API_KEY),
    }
