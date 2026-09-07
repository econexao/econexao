"""Schemas for newsletter subscription endpoints."""

from typing import Any, Literal

from email_validator import EmailNotValidError, validate_email
from pydantic import BaseModel, ConfigDict, Field, field_validator

ALLOWED_SOURCES = frozenset({"landing_page", "landing_hero", "landing_footer", "landing_business"})


class SchemaBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class NewsletterSubscribeRequest(BaseModel):
    """Payload for newsletter/leads subscription from landing page."""

    model_config = ConfigDict(
        str_strip_whitespace=True,
        json_schema_extra={
            "example": {
                "email": "usuario@exemplo.com",
                "source": "landing_page",
            }
        },
    )

    email: str = Field(
        ...,
        min_length=3,
        max_length=255,
        description="Endereço de e-mail do interessado.",
        json_schema_extra={"example": "usuario@exemplo.com"},
    )
    source: Literal["landing_page", "landing_hero", "landing_footer", "landing_business"] = Field(
        default="landing_page",
        description="Origem ou contexto aprovado da inscrição.",
        json_schema_extra={"example": "landing_page"},
    )

    @field_validator("email", mode="before")
    @classmethod
    def validate_email_field(cls, v: Any) -> str:
        """Sanitize and normalize email address using email-validator."""
        if not isinstance(v, str):
            raise ValueError("O endereço de e-mail deve ser um texto válido.")
        sanitized = v.strip()
        if not sanitized:
            raise ValueError("O endereço de e-mail é obrigatório.")
        try:
            valid = validate_email(sanitized, check_deliverability=False)
            return str(valid.normalized.lower())
        except EmailNotValidError as exc:
            raise ValueError(f"Formato de e-mail inválido: {str(exc)}") from exc

    @field_validator("source", mode="before")
    @classmethod
    def validate_source_field(cls, v: Any) -> str:
        """Validate source against the explicit allowed whitelist."""
        sanitized = str(v).strip().lower() if v is not None else "landing_page"
        if sanitized not in ALLOWED_SOURCES:
            allowed_str = ", ".join(sorted(ALLOWED_SOURCES))
            raise ValueError(f"Origem não autorizada: {sanitized}. Permitidas: {allowed_str}")
        return str(sanitized)


class NewsletterSubscribeData(SchemaBase):
    """Result data for newsletter subscription."""

    status: Literal["subscribed", "already_subscribed"] = Field(
        ...,
        description="Estado da inscrição: subscribed (nova) ou already_subscribed (já cadastrado).",
        json_schema_extra={"example": "subscribed"},
    )
    message: str = Field(
        ...,
        description="Mensagem informativa em português para exibição segura na interface.",
        json_schema_extra={
            "example": "Inscrição realizada com sucesso! Você receberá nossas novidades."
        },
    )


class NewsletterSubscribeEnvelope(SchemaBase):
    """Standard envelope for newsletter subscription response."""

    data: NewsletterSubscribeData
