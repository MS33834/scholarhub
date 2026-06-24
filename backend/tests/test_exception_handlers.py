"""SEC-06: Global exception handler tests.

Verifies that:
1. Unhandled exceptions return 500 without leaking stack traces.
2. RequestValidationError returns structured 422 with field details.
3. HTTPException returns consistent {"detail": "..."} format.
4. The Exception handler logs the error with request id and returns a
   controlled JSON response (not a raw traceback).

Note: Starlette's ServerErrorMiddleware always re-raises the exception after
sending the 500 response (by design, so servers can log it). We test the
handler's output directly and verify the response via a custom send callable.
"""

import json

import pytest


@pytest.mark.asyncio
async def test_validation_error_returns_structured_422(client):
    """Pydantic validation errors return a structured 422 with field/message."""
    response = await client.post("/api/auth/register", json={})
    assert response.status_code == 422
    data = response.json()
    assert "detail" in data
    assert "errors" in data
    assert isinstance(data["errors"], list)
    assert len(data["errors"]) > 0
    for err in data["errors"]:
        assert "field" in err
        assert "message" in err


@pytest.mark.asyncio
async def test_http_exception_returns_detail(client):
    """HTTPException responses have {"detail": "..."} format."""
    response = await client.post(
        "/api/auth/login",
        json={"username": "nosuchuser", "password": "wrongpassword"},
    )
    assert response.status_code == 401
    data = response.json()
    assert "detail" in data
    assert data["detail"] == "Invalid credentials"


@pytest.mark.asyncio
async def test_exception_handler_returns_controlled_500():
    """The Exception handler returns a JSONResponse with 500, no raw traceback."""
    from app.main import app, unhandled_exception_handler

    # Call the handler directly to verify its output
    from fastapi import Request
    from starlette.responses import JSONResponse

    scope = {
        "type": "http",
        "method": "GET",
        "path": "/api/test",
        "headers": [(b"x-request-id", b"test-req-123")],
        "query_string": b"",
        "url": type("URL", (), {"path": "/api/test"})(),
    }
    request = Request(scope)

    exc = RuntimeError("secret_internal_detail_12345")
    response = await unhandled_exception_handler(request, exc)

    assert isinstance(response, JSONResponse)
    assert response.status_code == 500
    body = json.loads(response.body)
    assert "detail" in body
    # In test (non-production) mode, detail includes exception type
    assert "RuntimeError" in body["detail"]


@pytest.mark.asyncio
async def test_exception_handler_hides_details_in_production():
    """In production mode, the 500 response does not include exception details."""
    from app.core.config import settings
    from app.main import unhandled_exception_handler

    original_env = settings.environment
    settings.environment = "production"

    try:
        from fastapi import Request
        from starlette.responses import JSONResponse

        scope = {
            "type": "http",
            "method": "GET",
            "path": "/api/test",
            "headers": [],
            "query_string": b"",
            "url": type("URL", (), {"path": "/api/test"})(),
        }
        request = Request(scope)

        exc = RuntimeError("secret_internal_detail_12345")
        response = await unhandled_exception_handler(request, exc)

        assert response.status_code == 500
        body = json.loads(response.body)
        assert body["detail"] == "Internal server error"
        assert "secret_internal_detail_12345" not in json.dumps(body)
    finally:
        settings.environment = original_env


@pytest.mark.asyncio
async def test_unhandled_exception_sends_500_response():
    """When an unhandled exception occurs, a 500 JSON response IS sent.

    Starlette's ServerErrorMiddleware re-raises after sending the response,
    so we use a custom send callable to capture the response.
    """
    from app.main import app
    from fastapi import Request

    async def boom(request: Request):
        raise RuntimeError("test_boom")

    app.add_api_route("/api/test-500-capture", boom, methods=["GET"])

    # Use a raw ASGI call to capture the response
    captured_response = {}

    async def send(message):
        if message["type"] == "http.response.start":
            captured_response["status"] = message["status"]
            captured_response["headers"] = dict(
                (k.decode(), v.decode()) for k, v in message.get("headers", [])
            )
        elif message["type"] == "http.response.body":
            captured_response["body"] = message.get("body", b"")

    async def receive():
        return {"type": "http.request", "body": b"", "more_body": False}

    scope = {
        "type": "http",
        "method": "GET",
        "path": "/api/test-500-capture",
        "raw_path": b"/api/test-500-capture",
        "query_string": b"",
        "headers": [],
        "client": ("127.0.0.1", 12345),
        "server": ("test", 80),
        "scheme": "http",
        "root_path": "",
        "app": app,
    }

    try:
        try:
            await app(scope, receive, send)
        except RuntimeError:
            pass  # ServerErrorMiddleware always re-raises; that's expected

        assert captured_response.get("status") == 500
        body = json.loads(captured_response.get("body", b""))
        assert "detail" in body
    finally:
        app.router.routes = [
            r for r in app.router.routes if getattr(r, "path", "") != "/api/test-500-capture"
        ]
