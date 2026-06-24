"""Small shared utilities."""

from urllib.parse import parse_qsl, urlencode

# Parameter names (case-insensitive) whose values must be redacted from logs.
_SENSITIVE_QUERY_PARAMS = frozenset(
    {
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
    }
)


def sanitize_query_string(query_string: str | bytes | None) -> str:
    """Redact sensitive parameter values from a query string for safe logging.

    Parameter names matching the sensitive set (case-insensitive) have their
    values replaced with ``***REDACTED***``. Non-sensitive parameters are
    preserved unchanged.
    """
    if not query_string:
        return ""
    if isinstance(query_string, bytes):
        query_string = query_string.decode("utf-8", errors="replace")
    if not query_string:
        return ""
    pairs = parse_qsl(query_string, keep_blank_values=True)
    redacted = []
    for name, value in pairs:
        if name.lower() in _SENSITIVE_QUERY_PARAMS:
            redacted.append((name, "***REDACTED***"))
        else:
            redacted.append((name, value))
    # ``safe='*'`` keeps the asterisks in the redaction marker intact so logs
    # stay human-readable (urlencode would otherwise emit %2A).
    return urlencode(redacted, safe="*")


def get_client_ip_from_forwarded(forwarded: str | None, trusted_count: int = 1) -> str | None:
    """Extract the client IP from an X-Forwarded-For header.

    ``X-Forwarded-For`` is a comma-separated list where the *rightmost*
    entries are added by the proxies closest to the application.  If we trust
    ``trusted_count`` proxies, the client IP is the entry ``trusted_count``
    positions from the right.  This prevents clients from spoofing the header
    by appending fake IPs on the left.

    Returns ``None`` when the header is absent or empty, signalling that the
    caller should fall back to the transport-level address.
    """
    if not forwarded:
        return None
    parts = [p.strip() for p in forwarded.split(",") if p.strip()]
    if not parts:
        return None
    if len(parts) >= trusted_count > 0:
        return parts[-trusted_count]
    return parts[0]
