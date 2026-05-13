"""WebApp authentication endpoints — логин по #nickname + паролю.

Все эндпоинты обслуживают только WebApp (Mini App). После успешного
логина клиент получает session_token и шлёт его в заголовке
Authorization: Bearer <token> при последующих запросах.

Точка входа: POST /api/webapp/auth/login
Получить статус: GET  /api/webapp/auth/status (без авторизации, нужен initData)
"""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from backend.api.schemas.webapp_auth import (
    AuthStatusResponse,
    LoginRequest,
    LoginResponse,
    PasswordRules,
    WhoAmIResponse,
)
from backend.core.deps import get_session, get_session_token_user_id
from backend.core.security import validate_telegram_init_data
from backend.core.sessions import (
    issue_session_token,
    login_rate_limited,
    login_reset,
    revoke_all_user_sessions,
    revoke_session_token,
)
from shared.database.repo.users import UserRepo
from shared.database.repo.sessions import SessionRepo

logger = logging.getLogger(__name__)

router = APIRouter()


def _client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def _validate_init_data(authorization: str) -> int:
    """Возвращает tg_id из initData. Бросает 401 при ошибке."""
    if not authorization or not authorization.startswith("tma "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    init_data = authorization[4:]
    user_data = validate_telegram_init_data(init_data)
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid Telegram data")
    user_id = user_data.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Missing user id in Telegram data")
    return int(user_id)


@router.get("/rules", response_model=PasswordRules)
async def password_rules() -> PasswordRules:
    return PasswordRules()


@router.get("/status", response_model=AuthStatusResponse)
async def auth_status(
    authorization: str = Header(...),
    session: AsyncSession = Depends(get_session),
) -> AuthStatusResponse:
    """Без сессии. По initData возвращает: есть ли пароль и nickname."""
    tg_id = _validate_init_data(authorization)
    repo = UserRepo(session)
    user = await repo.get_user(tg_id)

    if user is None:
        return AuthStatusResponse(has_password=False, nickname=None, requires_password=False)

    has_pw = bool(user.password_hash)
    return AuthStatusResponse(
        has_password=has_pw,
        nickname=user.nickname,
        requires_password=has_pw,
    )


@router.post("/login", response_model=LoginResponse)
async def login(
    payload: LoginRequest,
    request: Request,
    authorization: str = Header(...),
    session: AsyncSession = Depends(get_session),
) -> LoginResponse:
    """Логин по нику + паролю. Привязка к Telegram ID берётся из initData,
    чтобы запретить кросс-логин: пользователь A не может войти как
    пользователь B даже зная их ник и пароль.
    """
    tg_id_from_init = _validate_init_data(authorization)
    nickname = payload.nickname.strip().lstrip("#")
    if not nickname:
        raise HTTPException(status_code=400, detail="Empty nickname")

    if login_rate_limited(_client_ip(request), nickname):
        raise HTTPException(status_code=429, detail="Too many login attempts")

    repo = UserRepo(session)
    user = await repo.get_by_nickname(nickname)
    if user is None or user.tg_id != tg_id_from_init:
        # Не раскрываем, какая часть неверна.
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.password_hash:
        raise HTTPException(status_code=400, detail="Password is not set")

    ok = await repo.verify_password(user.tg_id, payload.password)
    if not ok:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user_agent = request.headers.get("user-agent")
    token, expires_at = await issue_session_token(session, user.tg_id, user_agent=user_agent)
    login_reset(_client_ip(request), nickname)

    return LoginResponse(
        success=True,
        token=token,
        expires_at=expires_at,
        user_id=user.tg_id,
        nickname=user.nickname or nickname,
    )


@router.get("/me", response_model=WhoAmIResponse)
async def whoami(
    user_id: int = Depends(get_session_token_user_id),
    session: AsyncSession = Depends(get_session),
) -> WhoAmIResponse:
    repo = UserRepo(session)
    user = await repo.get_user(user_id)
    return WhoAmIResponse(
        user_id=user_id,
        nickname=user.nickname if user else None,
        expires_at=None,
    )


@router.post("/logout")
async def logout(
    authorization: str = Header(...),
    session: AsyncSession = Depends(get_session),
) -> dict:
    """Удаляет текущую сессию. Принимает только Bearer-токен."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    token = authorization[7:].strip()
    await revoke_session_token(session, token)
    return {"success": True}


@router.post("/logout-all")
async def logout_all(
    user_id: int = Depends(get_session_token_user_id),
    session: AsyncSession = Depends(get_session),
) -> dict:
    """Удаляет все активные сессии текущего пользователя."""
    await revoke_all_user_sessions(session, user_id)
    return {"success": True}
