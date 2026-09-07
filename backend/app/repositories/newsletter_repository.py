"""Repository layer for newsletter subscriptions."""

import uuid
from collections.abc import Sequence
from typing import cast

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.domain import NewsletterSubscription


class NewsletterRepository:
    """Handles persistence of newsletter subscriptions in app_private.newsletter_subscriptions."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_email(self, email: str) -> NewsletterSubscription | None:
        """Find an existing subscription by email."""
        stmt = select(NewsletterSubscription).where(NewsletterSubscription.email == email)
        return cast(NewsletterSubscription | None, await self.db.scalar(stmt))

    async def subscribe(
        self, email: str, source: str = "landing_page"
    ) -> tuple[NewsletterSubscription, bool]:
        """Insert or retrieve subscription idempotently.

        Returns a tuple of (subscription, is_new: bool).
        """
        stmt = select(NewsletterSubscription).where(NewsletterSubscription.email == email)
        existing = await self.db.scalar(stmt)
        if existing is not None:
            if existing.status != "active":
                existing.status = "active"
                existing.source = source
                await self.db.flush()
            return existing, False

        subscription = NewsletterSubscription(
            id=uuid.uuid4(),
            email=email,
            source=source,
            status="active",
        )
        self.db.add(subscription)
        try:
            await self.db.flush()
            return subscription, True
        except IntegrityError:
            await self.db.rollback()
            existing = await self.db.scalar(stmt)
            if existing is not None:
                return existing, False
            raise

    async def list_subscriptions(
        self, status_filter: str | None = None
    ) -> Sequence[NewsletterSubscription]:
        """List subscriptions for administrative export."""
        stmt = select(NewsletterSubscription)
        if status_filter:
            stmt = stmt.where(NewsletterSubscription.status == status_filter)
        stmt = stmt.order_by(NewsletterSubscription.created_at.asc())
        result = await self.db.scalars(stmt)
        return result.all()
