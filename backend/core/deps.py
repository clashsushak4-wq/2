"""
Shared FastAPI dependencies — DB session and user authentication.
All route files should import from here instead of defining their own.
"""

from fastapi import Depends, Header, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession  # noqa: F401 — re-export type

from backend.core.database import get_session  # noqa: F401 — re-export
from backend.core.security import validate_telegram_init_data, verify_admin_token
from backend.core.sessions import resolve_session_token
from shared.config import config


async def get_current_user_id(
    authorization: str = Header(...),
    session: AsyncSession = Depends(get_session),
) -> int:
    """
    Extract user_id from Authorization header. Supports two formats:

    - ``tma <initData>``    — Telegram WebApp initData (legacy fallback)
    - ``Bearer <session>``  — WebApp session token from /api/webapp/auth/login

    Bearer is preferred for authenticated WebApp routes, tma — для запросов
    /api/webapp/auth/status и /login где сессии ещё нет.
    """
    if authorization.startswith("Bearer "):
        token = authorization[7:].strip()
        user_id = await resolve_session_token(session, token)
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid or expired session")
        return user_id

    if authorization.startswith("tma "):
        init_data = authorization[4:]
        user_data = validate_telegram_init_data(init_data)
        if not user_data:
            raise HTTPException(status_code=401, detail="Invalid Telegram data")
        user_id = user_data.get("id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Missing user id in Telegram data")
        return int(user_id)

    raise HTTPException(status_code=401, detail="Invalid authorization header")


async def get_session_token_user_id(
    authorization: str = Header(...),
    session: AsyncSession = Depends(get_session),
) -> int:
    """Жёсткий dep — принимает ТОЛЬКО Bearer session token."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Session token required")
    token = authorization[7:].strip()
    user_id = await resolve_session_token(session, token)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    return user_id


async def get_admin_user_id(authorization: str = Header(...)) -> int:
    """
    Admin dependency. Принимает два формата Authorization:

    - ``tma <initData>`` — Telegram WebApp (если /admin открыт из Telegram);
    - ``Admin <token>``  — подписанный токен, выданный /api/admin/auth/login
      (когда /admin UI открывается в обычном браузере).

    В обоих случаях проверяется, что tg_id пользователя входит в
    ``config.ADMIN_IDS``. При провале — 401/403.
    """
    if authorization.startswith("Admin "):
        token = authorization[6:].strip()
        user_id = verify_admin_token(token)
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid or expired admin token")
    elif authorization.startswith("tma "):
        init_data = authorization[4:]
        user_data = validate_telegram_init_data(init_data)
        if not user_data:
            raise HTTPException(status_code=401, detail="Invalid Telegram data")
        user_id = user_data.get("id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Missing user id in Telegram data")
    else:
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    if user_id not in config.ADMIN_IDS:
        raise HTTPException(status_code=403, detail="Forbidden: Admins only")
    return user_id
