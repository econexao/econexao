"""Service layer for newsletter domain business rules."""

from typing import Literal

from app.repositories.newsletter_repository import NewsletterRepository


class NewsletterService:
    """Business logic for newsletter subscriptions and leads capture."""

    def __init__(self, repository: NewsletterRepository) -> None:
        self.repository = repository

    @staticmethod
    def normalize_email(raw_email: str) -> str:
        """Normalize email address with trimming and casefold/lowercase."""
        if not raw_email:
            raise ValueError("O e-mail não pode ser vazio.")
        return raw_email.strip().lower()

    async def subscribe(
        self, email: str, source: str = "landing_page"
    ) -> tuple[Literal["subscribed", "already_subscribed"], str]:
        """Process subscription request and return status string and user-facing message.

        Returns (status: 'subscribed' | 'already_subscribed', message: str).
        """
        normalized_email = self.normalize_email(email)
        sanitized_source = (source or "landing_page").strip().lower()

        _subscription, is_new = await self.repository.subscribe(
            email=normalized_email,
            source=sanitized_source,
        )

        if is_new:
            return (
                "subscribed",
                "Inscrição realizada com sucesso! "
                "Você receberá novidades e oportunidades do ECOnexão.",
            )
        return (
            "already_subscribed",
            "Tudo certo! Seu e-mail já está cadastrado para receber nossas novidades.",
        )
