"""SEC-07: Log sanitization tests.

Verifies that sensitive query parameters are redacted from access logs.
"""

import pytest

from app.core.util import sanitize_query_string


def test_sanitize_redacts_token():
    """The 'token' parameter value is redacted."""
    result = sanitize_query_string("token=secret_jwt_value&page=1")
    assert "token=***REDACTED***" in result
    assert "page=1" in result
    assert "secret_jwt_value" not in result


def test_sanitize_redacts_password():
    """The 'password' parameter value is redacted."""
    result = sanitize_query_string("password=hunter2")
    assert "password=***REDACTED***" in result
    assert "hunter2" not in result


def test_sanitize_redacts_case_insensitive():
    """Sensitive parameter names are matched case-insensitively."""
    result = sanitize_query_string("TOKEN=secret&Password=mypass")
    assert "TOKEN=***REDACTED***" in result
    assert "Password=***REDACTED***" in result
    assert "secret" not in result
    assert "mypass" not in result


def test_sanitize_preserves_non_sensitive():
    """Non-sensitive parameters are preserved unchanged."""
    result = sanitize_query_string("q=deep+learning&page=2&sort=date")
    assert "q=deep+learning" in result
    assert "page=2" in result
    assert "sort=date" in result


def test_sanitize_handles_bytes():
    """Byte query strings (from ASGI scope) are handled."""
    result = sanitize_query_string(b"token=secret&page=1")
    assert "token=***REDACTED***" in result
    assert "page=1" in result


def test_sanitize_handles_empty():
    """Empty or None query strings return empty string."""
    assert sanitize_query_string("") == ""
    assert sanitize_query_string(None) == ""
    assert sanitize_query_string(b"") == ""


def test_sanitize_redacts_all_sensitive_params():
    """All known sensitive parameter names are redacted."""
    sensitive_params = [
        "token",
        "password",
        "passwd",
        "secret",
        "key",
        "apikey",
        "api_key",
        "access_token",
        "refresh_token",
        "auth",
        "authorization",
        "session",
        "sessionid",
        "session_id",
        "code",
        "otp",
        "credential",
        "credentials",
    ]
    for param in sensitive_params:
        result = sanitize_query_string(f"{param}=sensitive_value")
        assert "***REDACTED***" in result, f"Failed to redact '{param}'"
        assert "sensitive_value" not in result, f"Failed to redact value for '{param}'"


def test_sanitize_preserves_blank_values():
    """Blank values for sensitive params are still redacted."""
    result = sanitize_query_string("token=&page=1")
    assert "token=***REDACTED***" in result


@pytest.mark.asyncio
async def test_access_log_redacts_sensitive_query(client, test_user, caplog):
    """The access log does not contain sensitive query parameter values."""
    import logging

    # Silence httpx's own request logging so its raw URLs (which still contain
    # the secret) do not pollute caplog.text.
    logging.getLogger("httpx").setLevel(logging.WARNING)

    with caplog.at_level(logging.INFO, logger="scholarhub.access"):
        await client.get(
            "/api/resources/?token=super_secret_jwt&page=1",
            headers={"Authorization": f"Bearer {test_user['token']}"},
        )

    # Only inspect records emitted by our access logger; other loggers (e.g.
    # httpx) may legitimately log the raw request URL.
    access_records = [r for r in caplog.records if r.name == "scholarhub.access"]
    access_text = "\n".join(r.getMessage() for r in access_records)

    # Check that the access log entry redacts the token
    assert "***REDACTED***" in access_text
    assert "super_secret_jwt" not in access_text
    assert "page=1" in access_text
