"""Administrative local script to export newsletter leads to CSV."""

import argparse
import asyncio
import csv
import sys
from pathlib import Path
from typing import Sequence

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import Settings
from app.models.domain import NewsletterSubscription
from app.repositories.newsletter_repository import NewsletterRepository

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())


async def fetch_leads(
    session: AsyncSession, status_filter: str | None
) -> Sequence[NewsletterSubscription]:
    """Query subscriptions through the repository layer."""
    repo = NewsletterRepository(session)
    return await repo.list_subscriptions(status_filter=status_filter)


def write_csv(records: Sequence[NewsletterSubscription], output_path: Path) -> int:
    """Write records to a CSV file with deterministic UTF-8 encoding and header."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = ["id", "email", "source", "status", "created_at", "updated_at"]
    with open(output_path, "w", newline="", encoding="utf-8") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames, quoting=csv.QUOTE_MINIMAL)
        writer.writeheader()
        for rec in records:
            writer.writerow(
                {
                    "id": str(rec.id),
                    "email": rec.email,
                    "source": rec.source,
                    "status": rec.status,
                    "created_at": rec.created_at.isoformat() if rec.created_at else "",
                    "updated_at": rec.updated_at.isoformat() if rec.updated_at else "",
                }
            )
    return len(records)


async def run_export(
    output_path: Path, status_filter: str | None = None, dry_run: bool = False
) -> int:
    """Execute newsletter leads export process."""
    settings = Settings()
    engine = create_async_engine(settings.DATABASE_URL.get_secret_value())
    session_factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

    try:
        async with session_factory() as session:
            effective_filter = None if status_filter == "all" else (status_filter or "active")
            records = await fetch_leads(session, effective_filter)

            count = len(records)
            print("==================================================")
            print("RELATÓRIO DE EXPORTAÇÃO — LEADS NEWSLETTER")
            print("==================================================")
            print(f"Filtro de status: {effective_filter or 'todos'}")
            print(f"Total de registros localizados: {count}")

            if dry_run:
                print("Modo dry-run ativado: nenhum arquivo foi gravado.")
                print("==================================================")
                return 0

            written = write_csv(records, output_path)
            print(f"Total de registros exportados: {written}")
            print(f"Arquivo gerado: {output_path.resolve()}")
            print("==================================================")
            return 0
    finally:
        await engine.dispose()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Exportar leads/inscrições de newsletter para arquivo CSV local."
    )
    parser.add_argument(
        "--output",
        "-o",
        type=Path,
        default=Path("newsletter_leads.csv"),
        help="Caminho do arquivo CSV de destino (padrão: newsletter_leads.csv).",
    )
    parser.add_argument(
        "--status",
        "-s",
        choices=["active", "unsubscribed", "all"],
        default="active",
        help="Filtro de status dos registros (padrão: active).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Executa a contagem e visualização sem gravar o arquivo no disco.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    return asyncio.run(run_export(args.output, args.status, args.dry_run))


if __name__ == "__main__":
    sys.exit(main())
