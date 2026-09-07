"""Newsletter subscription endpoints for ECOnexão."""

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.schemas.error import ErrorResponse
from app.schemas.newsletter import (
    NewsletterSubscribeData,
    NewsletterSubscribeEnvelope,
    NewsletterSubscribeRequest,
)
from app.services.dependencies import get_newsletter_service
from app.services.newsletter_service import NewsletterService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/newsletter", tags=["Newsletter"])


@router.post(
    "/subscribe",
    response_model=NewsletterSubscribeEnvelope,
    status_code=status.HTTP_200_OK,
    summary="Inscrever e-mail no informativo",
    description="Registra um endereço de e-mail na lista de informativos a partir da landing page.",
    responses={
        200: {
            "description": "Inscrição processada com sucesso (nova ou idempotente).",
            "model": NewsletterSubscribeEnvelope,
        },
        422: {
            "description": "Formato de e-mail inválido ou dados de entrada inconsistentes.",
            "model": ErrorResponse,
        },
        429: {
            "description": "Limite de requisições excedido. Tente novamente mais tarde.",
            "model": ErrorResponse,
        },
        500: {
            "description": "Erro interno do servidor.",
            "model": ErrorResponse,
        },
    },
)
async def subscribe_newsletter(
    body: NewsletterSubscribeRequest,
    service: Annotated[NewsletterService, Depends(get_newsletter_service)],
) -> NewsletterSubscribeEnvelope:
    """Subscribe an email to the newsletter."""
    sub_status, message = await service.subscribe(email=body.email, source=body.source)
    return NewsletterSubscribeEnvelope(
        data=NewsletterSubscribeData(
            status=sub_status,
            message=message,
        )
    )
