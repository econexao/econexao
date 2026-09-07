"""Schemas for newsletter subscription endpoints."""

from typing import Literal

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

    @field_validator("email")
    @classmethod
    def validate_and_normalize_email(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("O endereço de e-mail não pode ser vazio.")
        normalized = v.strip().lower()
        try:
            valid = validate_email(normalized, check_deliverability=False)
            normalized = valid.normalized.lower()
        except EmailNotValidError as exc:
            raise ValueError(f"Formato de e-mail inválido: {str(exc)}") from exc
        return normalized

    @field_validator("source", mode="before")
    @classmethod
    def validate_source(cls, v: str | None) -> str:
        if not v or not str(v).strip():
            return "landing_page"
        sanitized = str(v).strip().lower()
        if sanitized not in ALLOWED_SOURCES:
            raise ValueError(
                f"Origem não autorizada: {sanitized}. Permitidas: {', '.join(sorted(ALLOWED_SOURCES))}"
            )
        return sanitized


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
        json_schema_extra={"example": "Inscrição realizada com sucesso! Você receberá nossas novidades."},
    )


class NewsletterSubscribeEnvelope(SchemaBase):
    """Standard envelope for newsletter subscription response."""

    data: NewsletterSubscribeData
