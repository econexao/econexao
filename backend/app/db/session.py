"""Database session management."""

import logging
from collections.abc import AsyncGenerator

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

logger = logging.getLogger(__name__)

# Engine configuration
engine = create_async_engine(
    settings.DATABASE_URL.get_secret_value(),
    echo=settings.DATABASE_ECHO,
    pool_pre_ping=True,
    pool_recycle=1800,
    future=True,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession]:
    """Dependency for obtaining an async DB session per request."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            if session.in_transaction():
                await session.commit()
        except Exception:
            if session.in_transaction():
                await session.rollback()
            raise


async def check_database_readiness() -> bool:
    """Return whether PostgreSQL is reachable and PostGIS is installed."""
    try:
        async with engine.connect() as connection:
            await connection.execute(text("select 1"))
            result = await connection.execute(
                text("select exists(select 1 from pg_extension where extname = 'postgis')")
            )
            return bool(result.scalar_one())
    except SQLAlchemyError as exc:
        logger.warning("Database readiness check failed: %s", exc)
        return False
