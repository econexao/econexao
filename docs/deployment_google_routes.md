# Operação segura do Google Routes — ECO-2314

## Estado e Matriz de Evidências

Provider aprovado: Google Routes API v2 `ComputeRoutes Essentials`.

| Nível de Verificação | Status | Escopo e Evidência |
|---|---|---|
| **Testes Locais Automatizados** | `VERIFIED` | 79 testes pytest backend offline (mocks contratuais, zero requisições externas), 12 testes Jest direcionados (6 em `locationConsent.test.ts` e 6 em `legal.test.tsx` executados via `npx jest --runInBand --no-cache --runTestsByPath`), Ruff e Mypy 100% aprovados. |
| **Health Check de Staging** | `VERIFIED` | Deploy remoto em staging com endpoints `/health/live` e `/health/ready` retornando 200 OK e PostGIS ativo. |
| **Smoke Real em Staging (Google API)** | `VERIFIED` | Smoke real único e controlado executado e aprovado em staging via `staging_routing_smoke.py`. Nenhuma chamada adicional está autorizada. A feature flag foi restaurada para `ENABLE_DYNAMIC_ROUTING=false` (fail-closed) após o smoke. Produção permanece não autorizada. |
| **Adaptadores de Mapa (Web e Nativo)** | `LEAFLET / OSM (Web) & react-native-maps (Nativo)` | **Web**: renderização via Leaflet + tiles OpenStreetMap, verificada localmente (`WEB_LOCAL`). **Nativo**: implementação usa `react-native-maps`, com validação em dispositivo mantida em `MOBILE_LATER`. **Google Routes**: permanece exclusivamente no backend Python/FastAPI; a geometria calculada pelo Google não é exibida sobre o mapa OSM no fluxo atual. |

## Isolamento de Artefatos de Testes (Playwright / E2E)

- Artefatos gerados em runtime local (como prints de tela PNG do Playwright em `artifacts/` ou relatórios temporários de CI) destinam-se exclusivamente à validação de regressão e acessibilidade local (`LOCAL_TEST`/`WEB_LOCAL`).
- Não devem ser persistidos no git para evitar poluição do repositório ou falsas alegações de homologação remota.

## Configuração de staging

Variáveis não secretas:

```env
APP_ENV=staging
ROUTING_PROVIDER=google_routes
ENABLE_DYNAMIC_ROUTING=false
DYNAMIC_ROUTING_RATE_LIMIT_PER_MINUTE=10
GOOGLE_ROUTES_TIMEOUT_SECONDS=3.5
GOOGLE_ROUTES_MAX_RETRIES=2
GOOGLE_ROUTES_MONTHLY_ALERT_AT=7500
GOOGLE_ROUTES_MONTHLY_LIMIT=9000
```

Segredo exclusivo do backend, configurado no secret manager do serviço:

```text
GOOGLE_ROUTES_API_KEY
```

Nunca registrar, imprimir, copiar para o Expo ou salvar o valor no repositório.

## Guardas obrigatórios

- Google Cloud: Routes API apenas; 10 chamadas/minuto; 290 chamadas/dia.
- Backend: 10 previews/minuto por identidade/IP; alerta mensal em 7.500; bloqueio
  antes da chamada 9.001.
- Somente `DRIVE`, `TRAFFIC_UNAWARE`, sem alternativas e field mask de distância,
  duração e polyline. Opções Pro/Enterprise são proibidas.
- Cache de respostas Google desabilitado até homologação jurídica específica.
- Logs `httpx`/`httpcore` desabilitados; métricas permitem apenas provider, resultado,
  latência, status e modo, nunca coordenadas, payload ou chave.

## Desativação e rollback

Definir `ENABLE_DYNAMIC_ROUTING=false` e reiniciar o serviço. O cliente mantém ou
restaura uma das origens oficiais. Provider desconhecido falha fechado e nunca cai
automaticamente no Fake.

## Smoke de staging

O smoke real em staging foi realizado sob autorização expressa em chamada única
controlada (`backend/scripts/staging_routing_smoke.py`), com coordenadas sanitizadas,
sem repetição e com deadline validado (20s). Após a aprovação do smoke,
`ENABLE_DYNAMIC_ROUTING` foi imediatamente restaurada para `false` (fail-closed).
Nenhuma chamada adicional está autorizada e o ambiente de produção permanece não autorizado.
