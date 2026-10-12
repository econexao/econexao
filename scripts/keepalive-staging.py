#!/usr/bin/env python3
"""Script de keep-alive e aquecimento (warmup) para o backend ECOnexão no Render.

Evita que instâncias no plano Hobby/Free entrem em modo de suspensão por inatividade
(cold start), mantendo a API responsiva para visitantes e apresentações em eventos.

Uso:
  python scripts/keepalive-staging.py [--interval SECONDS] [--url URL] [--once]
"""

from __future__ import annotations

import argparse
import datetime
import sys
import time
import urllib.error
import urllib.request
from typing import NoReturn

DEFAULT_HEALTH_URL = "https://econexao-backend-staging-30dt.onrender.com/api/v1/health"
DEFAULT_INTERVAL_SECONDS = 480  # 8 minutos (Render suspende após 15 minutos ocioso)
REQUEST_TIMEOUT_SECONDS = 45.0  # Tolerância caso a primeira requisição acorde a API


def ping_endpoint(url: str, timeout: float) -> tuple[bool, int, float, str]:
    """Dispara uma requisição HTTP GET para o health check e mede a latência."""
    start_time = time.monotonic()
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "ECOnexao-KeepAlive/1.0",
            "Accept": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            latency = time.monotonic() - start_time
            body = response.read().decode("utf-8", errors="replace")
            return True, response.status, latency, body
    except urllib.error.HTTPError as exc:
        latency = time.monotonic() - start_time
        return False, exc.code, latency, str(exc.reason)
    except Exception as exc:
        latency = time.monotonic() - start_time
        return False, 0, latency, str(exc)


def main() -> None:
    parser = argparse.ArgumentParser(description="ECOnexão Staging Warmup / Keep-Alive")
    parser.add_argument(
        "--url",
        default=DEFAULT_HEALTH_URL,
        help=f"URL do endpoint de health check (padrão: {DEFAULT_HEALTH_URL})",
    )
    parser.add_argument(
        "--interval",
        type=int,
        default=DEFAULT_INTERVAL_SECONDS,
        help=f"Intervalo em segundos entre cada ping (padrão: {DEFAULT_INTERVAL_SECONDS}s)",
    )
    parser.add_argument(
        "--once",
        action="store_true",
        help="Executa um único ping para aquecimento imediato e encerra.",
    )
    args = parser.parse_args()

    print(f"[{datetime.datetime.now().isoformat()}] Iniciando Keep-Alive para: {args.url}")
    if args.once:
        ok, status, lat, msg = ping_endpoint(args.url, REQUEST_TIMEOUT_SECONDS)
        status_label = "SUCESSO" if ok and status == 200 else "FALHA"
        print(f"[{datetime.datetime.now().isoformat()}] [{status_label}] Status: {status} | Latência: {lat:.2f}s | Resposta: {msg[:100]}")
        sys.exit(0 if ok and status == 200 else 1)

    while True:
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        ok, status, lat, msg = ping_endpoint(args.url, REQUEST_TIMEOUT_SECONDS)
        status_label = "OK" if ok and status == 200 else "ERRO"
        print(f"[{timestamp}] [{status_label}] HTTP {status} | Latência: {lat:.2f}s | {msg[:80]}")
        time.sleep(args.interval)


if __name__ == "__main__":
    main()
