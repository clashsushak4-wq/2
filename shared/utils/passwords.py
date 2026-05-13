# utils/passwords.py
"""Хэширование и проверка паролей пользователей WebApp.

Используется bcrypt через passlib. Если passlib недоступен — fallback
на pbkdf2_sha256 из стандартной библиотеки, чтобы проект собирался
даже без passlib (например, во время CI).
"""

from __future__ import annotations

import hashlib
import hmac
import os
from typing import Tuple

try:
    from passlib.hash import bcrypt as _bcrypt  # type: ignore

    _USE_PASSLIB = True
except Exception:  # pragma: no cover — passlib не установлен
    _bcrypt = None
    _USE_PASSLIB = False


_PBKDF2_ITERATIONS = 240_000
_PBKDF2_PREFIX = "pbkdf2_sha256"


def _pbkdf2_hash(password: str, salt: bytes | None = None) -> str:
    if salt is None:
        salt = os.urandom(16)
    derived = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        _PBKDF2_ITERATIONS,
    )
    return f"{_PBKDF2_PREFIX}${_PBKDF2_ITERATIONS}${salt.hex()}${derived.hex()}"


def _pbkdf2_verify(password: str, encoded: str) -> bool:
    try:
        prefix, iterations_str, salt_hex, hash_hex = encoded.split("$")
    except ValueError:
        return False
    if prefix != _PBKDF2_PREFIX:
        return False
    try:
        iterations = int(iterations_str)
        salt = bytes.fromhex(salt_hex)
        expected = bytes.fromhex(hash_hex)
    except ValueError:
        return False
    derived = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        iterations,
    )
    return hmac.compare_digest(derived, expected)


def hash_password(password: str) -> str:
    """Возвращает строковый хэш для записи в БД."""
    if _USE_PASSLIB and _bcrypt is not None:
        return _bcrypt.hash(password)
    return _pbkdf2_hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    """Сравнивает пароль с хэшем. Поддерживает bcrypt и pbkdf2_sha256."""
    if not password or not password_hash:
        return False
    if password_hash.startswith(_PBKDF2_PREFIX + "$"):
        return _pbkdf2_verify(password, password_hash)
    if _USE_PASSLIB and _bcrypt is not None:
        try:
            return _bcrypt.verify(password, password_hash)
        except (ValueError, TypeError):
            return False
    return False


def hash_token(token: str) -> str:
    """SHA-256 хэш токена сессии (хранится в БД вместо открытого токена)."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def constant_time_eq(a: str, b: str) -> bool:
    return hmac.compare_digest(a, b)


def validate_password_format(password: str) -> Tuple[bool, str | None]:
    """Базовая проверка формата пароля. Возвращает (ok, error_key)."""
    from shared.constants import MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH

    if not password:
        return False, "empty"
    if len(password) < MIN_PASSWORD_LENGTH:
        return False, "too_short"
    if len(password) > MAX_PASSWORD_LENGTH:
        return False, "too_long"
    return True, None
