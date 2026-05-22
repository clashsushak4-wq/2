"""
Admin auth endpoints — login по Telegram ID + паролю (только для /admin UI).

Возвращает подписанный admin token, который фронт отдаёт как
`Authorization: Admin <token>` во всех admin API запросах.
"""

import hmac

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from backend.core.security import create_admin_token
from backend.core.sessions import login_rate_limited, login_reset
from shared.config import config

router = APIRouter()

_TOKEN_TTL_SECONDS = 24 * 60 * 60  # очистка каждые 5 минут


class AdminLoginRequest(BaseModel):
    telegram_id: int = Field(..., description="Telegram user id администратора")
    password: str = Field(..., min_length=1)


class AdminLoginResponse(BaseModel):
    token: str
    expires_in: int


@router.post("/login", response_model=AdminLoginResponse)
async def admin_login(payload: AdminLoginRequest, request: Request) -> AdminLoginResponse:
    client_ip = request.client.host if request.client else "unknown"

    if await login_rate_limited(client_ip, str(payload.telegram_id)):
        raise HTTPException(status_code=429, detail="Too many login attempts, try later")

    if config.ADMIN_PASSWORD is None:
        raise HTTPException(status_code=503, detail="Admin login is not configured on server")

    if payload.telegram_id not in config.ADMIN_IDS:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not hmac.compare_digest(payload.password, config.ADMIN_PASSWORD.get_secret_value()):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_admin_token(payload.telegram_id, ttl_seconds=_TOKEN_TTL_SECONDS)
    await login_reset(client_ip, str(payload.telegram_id))
    return AdminLoginResponse(token=token, expires_in=_TOKEN_TTL_SECONDS)
