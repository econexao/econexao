"""Unit and integration tests for administrative newsletter CSV exporter."""

import argparse
import csv
import uuid
from datetime import UTC, datetime
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest

from app.models.domain import NewsletterSubscription
from scripts.export_newsletter_leads import (
    fetch_leads,
    parse_args,
    run_export,
    write_csv,
)


def _make_sample_subscription(
    email: str = "turista@exemplo.com",
    source: str = "landing_page",
    status: str = "active",
) -> NewsletterSubscription:
    sub = NewsletterSubscription(
        id=uuid.uuid4(),
        email=email,
        source=source,
        status=status,
        created_at=datetime(2026, 9, 7, 10, 0, 0, tzinfo=UTC),
        updated_at=datetime(2026, 9, 7, 10, 0, 0, tzinfo=UTC),
    )
    return sub


def test_write_csv_creates_deterministic_header_and_records(tmp_path: Path) -> None:
    """Verifies that write_csv produces expected headers, columns and rows."""
    output_file = tmp_path / "leads_test.csv"
    records = [
        _make_sample_subscription("lead1@exemplo.com", "landing_page", "active"),
        _make_sample_subscription("lead2@exemplo.com", "landing_page", "active"),
    ]

    count = write_csv(records, output_file)
    assert count == 2
    assert output_file.exists()

    with open(output_file, "r", encoding="utf-8") as f:
        reader = list(csv.reader(f))

    header = reader[0]
    assert header == ["id", "email", "source", "status", "created_at", "updated_at"]
    assert len(reader) == 3
    assert reader[1][1] == "lead1@exemplo.com"
    assert reader[2][1] == "lead2@exemplo.com"


def test_parse_args_defaults_and_custom_options() -> None:
    """Verifies command line arguments parsing."""
    with patch("sys.argv", ["export_newsletter_leads.py"]):
        args = parse_args()
        assert args.output == Path("newsletter_leads.csv")
        assert args.status == "active"
        assert args.dry_run is False

    with patch(
        "sys.argv",
        [
            "export_newsletter_leads.py",
            "-o",
            "custom.csv",
            "-s",
            "all",
            "--dry-run",
        ],
    ):
        args = parse_args()
        assert args.output == Path("custom.csv")
        assert args.status == "all"
        assert args.dry_run is True


@pytest.mark.asyncio
async def test_run_export_dry_run_does_not_create_file(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    """Dry-run mode prints report and does not write CSV file."""
    output_file = tmp_path / "should_not_exist.csv"

    mock_records = [_make_sample_subscription("user@test.org")]
    with patch(
        "scripts.export_newsletter_leads.fetch_leads",
        new=AsyncMock(return_value=mock_records),
    ):
        result = await run_export(output_file, status_filter="active", dry_run=True)
        assert result == 0
        assert not output_file.exists()

        captured = capsys.readouterr().out
        assert "RELATÓRIO DE EXPORTAÇÃO" in captured
        assert "Total de registros localizados: 1" in captured
        assert "Modo dry-run ativado" in captured


@pytest.mark.asyncio
async def test_run_export_writes_file_successfully(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    """Normal run exports records and reports output path."""
    output_file = tmp_path / "exported_leads.csv"
    mock_records = [
        _make_sample_subscription("lead1@ecodestino.com"),
        _make_sample_subscription("lead2@ecodestino.com"),
    ]

    with patch(
        "scripts.export_newsletter_leads.fetch_leads",
        new=AsyncMock(return_value=mock_records),
    ):
        result = await run_export(output_file, status_filter="active", dry_run=False)
        assert result == 0
        assert output_file.exists()

        captured = capsys.readouterr().out
        assert "Total de registros exportados: 2" in captured
        assert str(output_file.resolve()) in captured
