"""Comprehensive tests for newsletter / landing page email capture (proposta extra-oficial)."""

import uuid
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.rate_limit import limiter
from app.main import app
from app.models.domain import NewsletterSubscription
from app.repositories.newsletter_repository import NewsletterRepository
from app.schemas.newsletter import (
    ALLOWED_SOURCES,
    NewsletterSubscribeRequest,
)
from app.services.dependencies import get_newsletter_service
from app.services.newsletter_service import NewsletterService

# ---------------------------------------------------------------------------
# 1. Schema & Validation Tests
# ---------------------------------------------------------------------------


def test_schema_valid_email_normalization() -> None:
    """Email is trimmed and converted to lowercase."""
    req = NewsletterSubscribeRequest(email="  Turista.Santarem@EXEMPLO.COM  ")
    assert req.email == "turista.santarem@exemplo.com"
    assert req.source == "landing_page"


def test_schema_allowed_sources_accepted() -> None:
    """Explicitly approved sources are accepted and trimmed."""
    for valid_source in ALLOWED_SOURCES:
        req = NewsletterSubscribeRequest(email="user@test.org", source=valid_source)
        assert req.source == valid_source


def test_schema_invalid_source_rejected() -> None:
    """Unapproved/arbitrary source strings are rejected with ValidationError."""
    with pytest.raises(ValidationError):
        NewsletterSubscribeRequest(email="user@test.org", source="unauthorized_source")


@pytest.mark.parametrize(
    "invalid_email",
    [
        "",
        "   ",
        "invalid",
        "invalid@",
        "@invalid.com",
        "invalid@.com",
        "user space@domain.com",
        "user@domain..com",
    ],
)
def test_schema_rejects_invalid_email_formats(invalid_email: str) -> None:
    """Invalid email strings raise ValidationError."""
    with pytest.raises(ValidationError):
        NewsletterSubscribeRequest(email=invalid_email)


# ---------------------------------------------------------------------------
# 2. ORM Model Invariants & Private Schema Mapping
# ---------------------------------------------------------------------------


def test_orm_model_mapping_and_private_schema() -> None:
    """NewsletterSubscription is mapped to app_private.newsletter_subscriptions."""
    assert NewsletterSubscription.__tablename__ == "newsletter_subscriptions"
    assert NewsletterSubscription.__table__.schema == "app_private"
    assert "email" in NewsletterSubscription.__table__.c
    assert "source" in NewsletterSubscription.__table__.c
    assert "status" in NewsletterSubscription.__table__.c
    assert "created_at" in NewsletterSubscription.__table__.c
    assert "updated_at" in NewsletterSubscription.__table__.c


# ---------------------------------------------------------------------------
# 3. Service Unit Tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_service_subscribe_new_email() -> None:
    """Service returns subscribed status and friendly message on new registration."""
    mock_repo = AsyncMock(spec=NewsletterRepository)
    sub = NewsletterSubscription(
        id=uuid.uuid4(),
        email="novo@exemplo.com",
        source="landing_page",
        status="active",
    )
    mock_repo.subscribe.return_value = (sub, True)

    service = NewsletterService(mock_repo)
    status_res, message = await service.subscribe("  NOVO@exemplo.com ")

    assert status_res == "subscribed"
    assert "sucesso" in message.lower()
    mock_repo.subscribe.assert_awaited_once_with(email="novo@exemplo.com", source="landing_page")


@pytest.mark.asyncio
async def test_service_subscribe_existing_email_idempotent() -> None:
    """Service returns already_subscribed status safely without failing."""
    mock_repo = AsyncMock(spec=NewsletterRepository)
    sub = NewsletterSubscription(
        id=uuid.uuid4(),
        email="existente@exemplo.com",
        source="landing_page",
        status="active",
    )
    mock_repo.subscribe.return_value = (sub, False)

    service = NewsletterService(mock_repo)
    status_res, message = await service.subscribe("existente@exemplo.com")

    assert status_res == "already_subscribed"
    assert "já está cadastrado" in message.lower()
    mock_repo.subscribe.assert_awaited_once_with(
        email="existente@exemplo.com", source="landing_page"
    )


# ---------------------------------------------------------------------------
# 4. API Endpoint Integration Tests & CORS Verification
# ---------------------------------------------------------------------------


def test_api_subscribe_endpoint_new_email_success() -> None:
    """POST /api/v1/newsletter/subscribe returns 200 with envelope for new subscription."""
    limiter.reset()
    mock_service = AsyncMock(spec=NewsletterService)
    mock_service.subscribe.return_value = (
        "subscribed",
        "Inscrição realizada com sucesso! Você receberá novidades do ECOnexão.",
    )

    app.dependency_overrides[get_newsletter_service] = lambda: mock_service
    client = TestClient(app, raise_server_exceptions=False)

    try:
        response = client.post(
            "/api/v1/newsletter/subscribe",
            json={"email": "turista@exemplo.com", "source": "landing_page"},
        )
        assert response.status_code == 200
        payload = response.json()
        assert "data" in payload
        assert payload["data"]["status"] == "subscribed"
        assert "sucesso" in payload["data"]["message"].lower()
    finally:
        app.dependency_overrides.clear()


def test_api_subscribe_endpoint_duplicate_email_success() -> None:
    """POST /api/v1/newsletter/subscribe returns 200 with already_subscribed for duplicate."""
    limiter.reset()
    mock_service = AsyncMock(spec=NewsletterService)
    mock_service.subscribe.return_value = (
        "already_subscribed",
        "Tudo certo! Seu e-mail já está cadastrado para receber nossas novidades.",
    )

    app.dependency_overrides[get_newsletter_service] = lambda: mock_service
    client = TestClient(app, raise_server_exceptions=False)

    try:
        response = client.post(
            "/api/v1/newsletter/subscribe",
            json={"email": "turista@exemplo.com"},
        )
        assert response.status_code == 200
        payload = response.json()
        assert "data" in payload
        assert payload["data"]["status"] == "already_subscribed"
        assert "já está cadastrado" in payload["data"]["message"].lower()
    finally:
        app.dependency_overrides.clear()


def test_api_subscribe_endpoint_invalid_payload_returns_422() -> None:
    """Invalid email format returns standardized 422 error response."""
    limiter.reset()
    mock_service = AsyncMock(spec=NewsletterService)
    app.dependency_overrides[get_newsletter_service] = lambda: mock_service
    client = TestClient(app, raise_server_exceptions=False)

    try:
        response = client.post(
            "/api/v1/newsletter/subscribe",
            json={"email": "not-an-email"},
        )
        assert response.status_code == 422
        payload = response.json()
        assert "error" in payload
        assert payload["error"]["code"] == "VALIDATION_ERROR"
        assert "request_id" in payload
    finally:
        app.dependency_overrides.clear()


def test_api_subscribe_endpoint_rate_limit_exceeded() -> None:
    """Exceeding 10 requests/min returns 429 Too Many Requests with headers."""
    limiter.reset()
    mock_service = AsyncMock(spec=NewsletterService)
    mock_service.subscribe.return_value = ("subscribed", "Sucesso.")

    app.dependency_overrides[get_newsletter_service] = lambda: mock_service
    client = TestClient(app, raise_server_exceptions=False)

    try:
        # 10 requests allowed
        for i in range(10):
            res = client.post(
                "/api/v1/newsletter/subscribe",
                json={"email": f"user{i}@exemplo.com"},
            )
            assert res.status_code == 200

        # 11th request must be rate limited
        res_limited = client.post(
            "/api/v1/newsletter/subscribe",
            json={"email": "user11@exemplo.com"},
        )
        assert res_limited.status_code == 429
        assert res_limited.headers.get("Retry-After") is not None
        assert res_limited.headers.get("X-RateLimit-Remaining") == "0"
        payload = res_limited.json()
        assert payload["error"]["code"] == "RATE_LIMIT_EXCEEDED"
    finally:
        app.dependency_overrides.clear()
        limiter.reset()


def test_api_subscribe_endpoint_server_error_handled_safely() -> None:
    """Unexpected database error returns standard 500 error without leaking internal details."""
    limiter.reset()
    mock_service = AsyncMock(spec=NewsletterService)
    mock_service.subscribe.side_effect = RuntimeError("Database connection timed out")

    app.dependency_overrides[get_newsletter_service] = lambda: mock_service
    client = TestClient(app, raise_server_exceptions=False)

    try:
        response = client.post(
            "/api/v1/newsletter/subscribe",
            json={"email": "turista@exemplo.com"},
        )
        assert response.status_code == 500
        payload = response.json()
        assert payload["error"]["code"] == "INTERNAL_SERVER_ERROR"
        assert "Ocorreu um erro interno" in payload["error"]["message"]
        # Ensure raw exception / trace is NOT leaked in details
        assert payload["error"]["details"] is None
    finally:
        app.dependency_overrides.clear()


def test_api_subscribe_no_secrets_in_response() -> None:
    """Ensure endpoint response and headers do not expose any credentials or secret keys."""
    limiter.reset()
    mock_service = AsyncMock(spec=NewsletterService)
    mock_service.subscribe.return_value = ("subscribed", "Sucesso.")

    app.dependency_overrides[get_newsletter_service] = lambda: mock_service
    client = TestClient(app, raise_server_exceptions=False)

    try:
        response = client.post(
            "/api/v1/newsletter/subscribe",
            json={"email": "turista@exemplo.com"},
        )
        body_text = response.text.lower()
        assert "secret" not in body_text
        assert "supabase_secret" not in body_text
        assert "postgres" not in body_text
        for header, value in response.headers.items():
            assert "secret" not in header.lower()
            assert "secret" not in value.lower()
    finally:
        app.dependency_overrides.clear()


@pytest.mark.parametrize(
    "authorized_origin",
    [
        "https://www.econexaoturismo.com",
        "https://econexaoturismo.com",
        "https://app.econexaoturismo.com",
        "https://econexao-app-staging.vercel.app",
        "https://eco-nexao-v3.vercel.app",
    ],
)
def test_cors_preflight_and_post_for_authorized_origins(authorized_origin: str) -> None:
    """OPTIONS preflight and POST allow authorized landing page and web origins."""
    limiter.reset()
    mock_service = AsyncMock(spec=NewsletterService)
    mock_service.subscribe.return_value = ("subscribed", "Sucesso.")

    app.dependency_overrides[get_newsletter_service] = lambda: mock_service
    client = TestClient(app, raise_server_exceptions=False)

    try:
        # 1. Preflight OPTIONS
        options_res = client.options(
            "/api/v1/newsletter/subscribe",
            headers={
                "Origin": authorized_origin,
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Content-Type",
            },
        )
        assert options_res.status_code == 200
        assert options_res.headers.get("access-control-allow-origin") == authorized_origin
        assert "POST" in options_res.headers.get("access-control-allow-methods", "")

        # 2. Actual POST with Origin header
        post_res = client.post(
            "/api/v1/newsletter/subscribe",
            json={"email": "lead@teste.org"},
            headers={"Origin": authorized_origin},
        )
        assert post_res.status_code == 200
        assert post_res.headers.get("access-control-allow-origin") == authorized_origin
    finally:
        app.dependency_overrides.clear()


def test_cors_negative_rejection_for_unauthorized_origin() -> None:
    """Unauthorized origins are not granted Access-Control-Allow-Origin."""
    limiter.reset()
    mock_service = AsyncMock(spec=NewsletterService)
    mock_service.subscribe.return_value = ("subscribed", "Sucesso.")

    app.dependency_overrides[get_newsletter_service] = lambda: mock_service
    client = TestClient(app, raise_server_exceptions=False)

    try:
        options_res = client.options(
            "/api/v1/newsletter/subscribe",
            headers={
                "Origin": "https://malicious-site.example.com",
                "Access-Control-Request-Method": "POST",
            },
        )
        assert "access-control-allow-origin" not in options_res.headers
    finally:
        app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# 5. Migration & RLS Security Verification
# ---------------------------------------------------------------------------


def test_migration_sql_contains_rls_and_revokes() -> None:
    """Verify migration file enables RLS and revokes permissions from public roles."""
    migration_path = (
        Path(__file__).resolve().parents[2]
        / "supabase"
        / "migrations"
        / "20260907120000_create_newsletter_subscriptions.sql"
    )
    assert migration_path.exists(), "Migration file does not exist"
    content = migration_path.read_text(encoding="utf-8")

    assert "ENABLE ROW LEVEL SECURITY" in content
    expected_revoke = (
        "REVOKE ALL ON app_private.newsletter_subscriptions FROM PUBLIC, anon, authenticated;"
    )
    assert expected_revoke in content
    assert "uq_newsletter_subscriptions_email" in content
    assert "app_private.newsletter_subscriptions" in content


# ---------------------------------------------------------------------------
# 6. Database Repository Isolation Test (Mock AsyncSession)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_repository_subscribe_creates_and_handles_duplicates() -> None:
    """Unit test for repository subscribe method with AsyncSession mock."""
    db = AsyncMock(spec=AsyncSession)
    repo = NewsletterRepository(db)

    # 1. Existing check returns None (new subscription)
    db.scalar.return_value = None

    sub, is_new = await repo.subscribe("visitante@santarem.com", "landing_page")
    assert is_new is True
    assert sub.email == "visitante@santarem.com"
    assert db.add.called
    assert db.commit.called

    # 2. Existing check returns existing record (duplicate)
    existing = NewsletterSubscription(
        id=uuid.uuid4(),
        email="visitante@santarem.com",
        source="landing_page",
        status="active",
    )
    db.scalar.return_value = existing

    sub_dup, is_new_dup = await repo.subscribe("visitante@santarem.com", "landing_page")
    assert is_new_dup is False
    assert sub_dup.id == existing.id


@pytest.mark.asyncio
async def test_repository_list_subscriptions() -> None:
    """Unit test for repository list_subscriptions method."""
    db = AsyncMock(spec=AsyncSession)
    repo = NewsletterRepository(db)

    records = [
        NewsletterSubscription(id=uuid.uuid4(), email="u1@test.com", status="active"),
        NewsletterSubscription(id=uuid.uuid4(), email="u2@test.com", status="active"),
    ]
    mock_scalars = MagicMock()
    mock_scalars.all.return_value = records
    db.scalars.return_value = mock_scalars

    res = await repo.list_subscriptions(status_filter="active")
    assert len(res) == 2
    assert res[0].email == "u1@test.com"
    assert db.scalars.called
