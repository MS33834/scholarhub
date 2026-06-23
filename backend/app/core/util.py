"""Small shared utilities."""


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
