# ECOnexão — Relatório de Reconciliação RQ-03

Data: 04/09/2026  
Baseline auditado: `codex/fix-staging-smoke-host` (commit `22f3e3539289ba0a7901d684c3c44fa8825c102f`)  
Escopo: Reprodução independente da evidência Web de ECO-2301–2315 e ECO-2501–2513  
Status conservador da RQ-03: **VERIFIED** exclusivamente no escopo de reconciliação local/Web (evidência `WEB_LOCAL` comprovada com exit code 0 via Playwright determinístico e suíte backend 100% verde com 635 passed / 0 failed após isolamento de CORS; promoção restrita ao escopo local/Web, não comprovando staging remoto, Google real ou DEVICE nativo)

---

## 1. Níveis de Evidência e Diferenciação Conceitual

Conforme a constituição do projeto (`docs/ai/DEVELOPMENT_RULES.md` e `docs/project_status.md`):

1. **`CODE`**: O código, ADR, migration ou especificação existe no repositório. **Regra estrita**: Inspeção de código/ADR/migration isoladamente não pode promover uma tarefa a `VERIFIED`. Permanece em nível `CODE`.
2. **`LOCAL_TEST`**: Testes automatizados executados localmente (Pytest unitário/mockado, Jest Expo). Suítes Jest que simulam Android/iOS continuam sendo `LOCAL_TEST`, e não `DEVICE`.
3. **`WEB_LOCAL`**: Comportamento Web reproduzido em navegador real (Playwright Chromium com bundle real em `dist/`), testando interações de DOM, SVG Leaflet, teclado, foco e acessibilidade WCAG 2.1 AA via Axe-core.
4. **`STAGING`**: Comportamento executado contra o host remoto de staging aprovado com infraestrutura real. Não pode ser inferido de testes locais.
5. **`DEVICE`**: Execução em hardware físico ou emulador nativo Android/iOS (em `MOBILE_LATER`).

---

## 2. Comandos Executados, Exit Codes e Resultados Reais

| Comando | Diretório | Exit Code | Duração | Resultado e Observações |
|---|---|---|---|---|
| `python -m ruff check app tests` | `backend` | 0 | 1.8s | Aprovado (0 erros de lint PEP8/regras). |
| `python -m mypy app` | `backend` | 0 | 79.4s | Aprovado (`Success: no issues found in 95 source files`). |
| `python -m pytest tests/test_territorial_api.py ... tests/test_taxonomy.py tests/test_ingestion_semtur.py tests/test_semtur_persistence.py tests/test_actor_google_photo.py -q` | `backend` | 0 | 10.25s | Aprovado (186 testes passando: contrato territorial, spatial assigner, places, routes, preview, taxonomia, SEMTUR 674 e fotos). |
| `python -m pytest tests/test_security_headers_and_cors.py tests/test_security_config.py -q` | `backend` | 0 | 6.2s | Aprovado (32 passed). Isolamento de CORS via application factory `create_app` e `Settings(_env_file=None, ...)`. |
| `python -m pytest -q` | `backend` | 0 | 37.2s | Aprovado (635 testes passando, 0 falhas). Interferência do `.env` eliminada. |
| `npm run openapi:check` | `econexao-app` | 0 | 1.2s | Aprovado (0 drift entre OpenAPI canônico e tipos TypeScript). |
| `npm run typecheck` | `econexao-app` | 0 | 4.8s | Aprovado (0 erros TypeScript no Expo SDK 54). |
| `npm run e2e:web` | `econexao-app` | 0 | 23.0s | Aprovado (3 testes Jest simulando jornadas Web críticas em memória). |
| `npm run a11y:web` | `econexao-app` | 0 | 5.8s | Aprovado (4 testes Jest de auditoria semântica em memória). |
| `npm test -- --runInBand` | `econexao-app` | 0 | 38.4s | Aprovado (38 suítes e 219 testes unitários/integrados Jest). |
| `npm run test:browser` (Execução 1 — pós-patch ECO-2315) | `econexao-app` | 0 | 44.9s | Aprovado (4/4 passed). Saídas isoladas em `.tmp-playwright-results/` e relatório em `.tmp-playwright-report/`. 14 screenshots/anexos gerados sem falha de I/O. |
| `npm run test:browser` (Execução 2 — repetibilidade sequencial) | `econexao-app` | 0 | 43.0s | Aprovado (4/4 passed). Determinismo e repetibilidade comprovados no Windows sem conflitos ou processos residuais. |

---

## 3. Matriz Revisada: Mapa Dinâmico (ECO-2301–2315)

| Task | Plataforma/Ambiente | Alegação Histórica | Aceite / Contrato | Evidência Reproduzida | Nível de Evidência | Estado Conservador | Lacunas e Bloqueios |
|---|---|---|---|---|---|---|---|
| **ECO-2301** | Docs | Taxonomia visual | ADR 0010 | ADR versionado e aceito | `CODE` | `PARTIAL` | Baseada em documentação (`CODE`); não constitui execução de software isoladamente. |
| **ECO-2302** | DB | Schema da taxonomia | 8 categorias canônicas | 21 migrations locais | `CODE` | `PARTIAL` | Baseada em migrations SQL (`CODE`); sem execução contra Supabase remoto na sessão. |
| **ECO-2303** | Web / Backend | Contrato visual v2 | OpenAPI sem drift | OpenAPI sincronizado | `LOCAL_TEST` | `VERIFIED` | Comprovado por `npm run openapi:check` e `pytest test_openapi_contract.py`. |
| **ECO-2304** | Web | Pins e legenda | Renderização e legenda | Jest de componentes e browser Leaflet | `LOCAL_TEST` / `WEB_LOCAL` | `PARTIAL` | Renderização Web comprovada em browser; nativo em `MOBILE_LATER`. |
| **ECO-2305** | Docs | Camadas espaciais | ADR 0011 | ADR versionado e aceito | `CODE` | `PARTIAL` | Baseada em documentação (`CODE`). |
| **ECO-2306** | Backend | Camadas estáticas | Endpoints e PostGIS | 186 testes passando | `LOCAL_TEST` | `VERIFIED` | Comprovado por `pytest tests/test_territorial_api.py`. |
| **ECO-2307** | Web | Interface Rota x Cidade | Câmera, bounds e filtros | Playwright Chromium (4/4 passed) | `WEB_LOCAL` | `PARTIAL` | Comportamento Web verificado no navegador; nativo em `MOBILE_LATER`. |
| **ECO-2308** | Docs | ADR origens dinâmicas | ADR 0012 | ADR versionado e aceito | `CODE` | `PARTIAL` | Baseada em documentação (`CODE`). |
| **ECO-2309** | Backend / Web | Preview dinâmico fake | Sem rede/escrita | Testes unitários do preview | `LOCAL_TEST` | `VERIFIED` | Comprovado por `pytest tests/test_routing_preview.py`. |
| **ECO-2310** | Web | Minha localização | GPS com fail-closed via feature flag | Suíte Jest do hook | `LOCAL_TEST` | `PARTIAL` | GPS real não testado em browser; nativo em `MOBILE_LATER`. |
| **ECO-2311** | Web | Escolher no mapa | Seleção interativa no mapa | Testes Jest do seletor | `LOCAL_TEST` | `PARTIAL` | Interação de drag interativo não parametrizada no Playwright; nativo em `MOBILE_LATER`. |
| **ECO-2312** | Backend / Web | Pins na geometria dinâmica | Buffer corredor efêmero | Testes de preview e pins | `LOCAL_TEST` | `VERIFIED` | Comprovado por `pytest tests/test_routing_preview.py`. |
| **ECO-2313** | Docs | Benchmark provedor de rotas | ADR 0013 | ADR versionado e aceito | `CODE` | `PARTIAL` | Baseada em documentação (`CODE`). |
| **ECO-2314** | Backend / Web | Conector Google Routes | Conector, circuit breaker, offline | Conector verificado com mocks | `LOCAL_TEST` | `PARTIAL` / `BLOCKED` | Chamadas reais bloqueadas por ausência de autorização, chaves e GO humano. |
| **ECO-2315** | Web | Verificação final mapa Web | 3 origens, bounds, pins, Leaflet | Playwright Chromium (4/4 passed, exit code 0 sequencial) | `WEB_LOCAL` | `VERIFIED` (nível `WEB_LOCAL`) | Gate Playwright Web estabilizado e reproduzido com exit code 0 em 2 execuções consecutivas; homologação staging remota separada. |

---

## 4. Matriz Revisada: Catálogo Territorial (ECO-2501–2513)

| Task | Plataforma/Ambiente | Alegação Histórica | Aceite / Contrato | Evidência Reproduzida | Nível de Evidência | Estado Conservador | Lacunas e Bloqueios |
|---|---|---|---|---|---|---|---|
| **ECO-2501** | Backend / Docs | Auditoria de datasets | Hashes, contagens SEMTUR 674 | Dataset e fixtures auditados | `LOCAL_TEST` / `CODE` | `PARTIAL` | Insumo e fixtures auditadas; código isolado. |
| **ECO-2502** | Docs | ADR Autoridade/Proveniência | ADR 0014 | ADR versionado e aceito | `CODE` | `PARTIAL` | Baseada em documentação (`CODE`). |
| **ECO-2503** | Docs | ADR Taxonomia hierárquica | ADR 0015 | ADR versionado e aceito | `CODE` | `PARTIAL` | Baseada em documentação (`CODE`). |
| **ECO-2504** | DB | Schema e proveniência | Migrations e audit trail | Migrations locais estruturadas | `CODE` | `PARTIAL` | Baseada em migrations SQL (`CODE`). |
| **ECO-2505** | Backend | Ingestão SEMTUR integral | 674 lidos, idempotência | 22 testes de persistência | `LOCAL_TEST` | `VERIFIED` | Comprovado por `pytest tests/test_semtur_persistence.py`. |
| **ECO-2506** | Backend | Associação espacial (1km) | 3 origens Pindobal (Porto, Aeroporto, Rodoviária) | Testes do spatial assigner | `LOCAL_TEST` | `VERIFIED` | Comprovado por `pytest tests/test_spatial_assigner.py`. |
| **ECO-2507** | Docs | ADR Places/Mídia/Custos | ADR 0016 | ADR versionado e aceito | `CODE` | `PARTIAL` | Baseada em documentação (`CODE`). |
| **ECO-2508** | Backend | Conector Places API (New) | Circuit breaker, budget, 0 rede | 22 testes do conector com mock transport | `LOCAL_TEST` | `VERIFIED` | Comprovado por `pytest tests/test_google_places_connector.py`. |
| **ECO-2509** | Backend | Matching SEMTUR x Google | Tiers 1–3 auto, Tier 4 fila, unmerge | 13 testes do reconciliador | `LOCAL_TEST` | `VERIFIED` | Comprovado por `pytest tests/test_semtur_google_reconciler.py`. |
| **ECO-2510** | Backend / Web | Proxy fotos Google efêmero | Sem storage, atribuição, links | Testes do proxy e do componente | `LOCAL_TEST` | `VERIFIED` | Comprovado por `pytest tests/test_google_photo_proxy.py` e Jest. |
| **ECO-2511** | Backend / Web | API Catálogo e Mapa | OpenAPI sem drift, selo SEMTUR | Schemas Pydantic e OpenAPI | `LOCAL_TEST` | `VERIFIED` | Comprovado por `npm run openapi:check` e `pytest tests/test_territorial_api.py`. |
| **ECO-2512** | Web | Pins, cards, selo SEMTUR, galeria | Acessibilidade, Leaflet, 8 cores | 219 testes Jest + Playwright Desktop & Mobile (4/4 passed) | `LOCAL_TEST` / `WEB_LOCAL` | `VERIFIED` (nível `WEB_LOCAL`) | Comportamento Web e acessibilidade WCAG 2.1 AA auditados e aprovados com exit code 0; mobile em `MOBILE_LATER`. |
| **ECO-2513** | Web | Homologação final e promoção | Dossiê de homologação Web | Suíte Playwright e testes locais | `WEB_LOCAL` | `PARTIAL` / `NOT_VERIFIABLE` | Comportamento Web localmente reproduzido com sucesso; homologação em staging remoto permanece não autorizada (`NOT_VERIFIABLE`). |

---

## 5. Análise e Resolução dos Findings

1. **Isolamento de CORS em `pytest -q` (ECO-2003 / Finding P1) — Resolvido (Exit Code 0)**:
   - **Causa identificada**: O singleton `app` importado por `test_security_headers_and_cors.py` era configurado na inicialização pelo singleton `settings`, que lia `backend/.env`. Variáveis locais de ambiente sobrescreviam `CORS_ORIGINS`.
   - **Solução implementada**: Extração da factory `create_app(app_settings=None)` em `backend/app/main.py` (mantendo `app = create_app()` como entrypoint runtime) e injeção explícita de `Settings(_env_file=None, CORS_ORIGINS=canonical_origins)` no teste, garantindo total isolamento contra `.env` e variáveis conflitantes.
   - **Evidência de validação**: `pytest tests/test_security_headers_and_cors.py tests/test_security_config.py -q` (32 passed, exit code 0) e `pytest -q` global (635 passed, 0 failed, exit code 0). Ruff e Mypy verdes (0 erros em 95 arquivos).
   - **Impacto no status**: Bloqueio local de CORS totalmente removido. A reconciliação local/Web da RQ-03 é promovida a `VERIFIED`. Esta promoção é estritamente restrita ao escopo de reconciliação local/Web e não comprova staging remoto, chamadas Google reais nem execução em hardware nativo (`DEVICE`).

2. **Resolução do Gate Playwright Web (ECO-2315 / ECO-2512) — Exit Code 0**:
   - **Diagnóstico comprovado**: A especificação `econexao-app/e2e/web-a11y-browser.spec.ts` gravava diretamente em caminhos fixos compartilhados no diretório versionado `econexao-app/screenshots/`. No Windows, a sobreposição concorrente ou reescrita direta no mesmo arquivo causava contenção de I/O (`UNKNOWN: unknown error, open '...'`).
   - **Solução implementada no patch corretivo da ECO-2315**:
     1. Configuração de `outputDir: './.tmp-playwright-results'` e reporter HTML em `'./.tmp-playwright-report'` em `playwright.config.ts`.
     2. Uso de caminhos isolados por teste e projeto através de `testInfo.outputPath(...)`, além de anexação ao relatório com `testInfo.attach(...)`.
     3. Eliminação total de escritas concorrentes sobre os artefatos rastreados no Git em `screenshots/`.
   - **Evidência de validação**:
     - 1ª Execução: 4 passed (44.9s), exit code 0. 14 capturas geradas em subdiretórios de teste.
     - 2ª Execução: 4 passed (43.0s), exit code 0. Repetibilidade e determinismo confirmados no Windows.
     - Nenhuma asserção de DOM, Leaflet, SVG ou Axe-core foi modificada ou relaxada.

---

## 6. Verificações de Isolamento e Segurança

- Zero conexões com endpoints externos (Google Places/Routes, Supabase remoto).
- Nenhuma chave secreta ou credencial exposta.
- Arquivos temporários gerados (`.tmp-playwright-results`, `.tmp-playwright-report`) são estritamente ignorados pelo Git via padrão `.tmp-*`.
- Artefatos preexistentes no worktree foram rigorosamente preservados.
