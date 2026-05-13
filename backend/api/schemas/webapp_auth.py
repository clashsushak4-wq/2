"""Pydantic схемы для WebApp авторизации (логин по нику и паролю)."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from shared.constants import MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH


class LoginRequest(BaseModel):
    nickname: str = Field(..., min_length=1, max_length=32)
    password: str = Field(..., min_length=1, max_length=MAX_PASSWORD_LENGTH)


class LoginResponse(BaseModel):
    success: bool = True
    token: str
    expires_at: datetime
    user_id: int
    nickname: str


class AuthStatusResponse(BaseModel):
    has_password: bool
    nickname: Optional[str] = None
    requires_password: bool


class WhoAmIResponse(BaseModel):
    user_id: int
    nickname: Optional[str] = None
    expires_at: Optional[datetime] = None


class AuthErrorResponse(BaseModel):
    detail: str


class PasswordRules(BaseModel):
    min_length: int = MIN_PASSWORD_LENGTH
    max_length: int = MAX_PASSWORD_LENGTH
