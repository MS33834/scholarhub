from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("ascii")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("ascii"))


def _create_token(data: dict, expires_delta: timedelta, token_type: str) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire, "type": token_type})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def create_access_token(data: dict) -> str:
    return _create_token(data, timedelta(minutes=settings.access_token_expire_minutes), "access")


def create_refresh_token(data: dict) -> str:
    return _create_token(data, timedelta(days=settings.refresh_token_expire_days), "refresh")


def token_version_matches(payload: dict | None, expected_version: int) -> bool:
    """Return True if the token payload carries the expected token_version."""
    if payload is None:
        return False
    return payload.get("token_version") == expected_version


def decode_token(token: str, expected_type: str | None = None) -> dict | None:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        if expected_type and payload.get("type") != expected_type:
            return None
        return payload
    except JWTError:
        return None


def decode_access_token(token: str) -> dict | None:
    return decode_token(token, expected_type="access")
