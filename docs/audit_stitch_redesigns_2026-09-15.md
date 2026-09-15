# Auditoria local — redesigns Stitch de rota e histórico

Data: 15/09/2026
Baseline remoto: `origin/staging` em `20ec4e9`
Branch preparada: `codex/trips-history-stitch-redesign`

## Escopo revisado

- Cinco commits locais anteriores de redesign da tela de detalhes da rota, ainda
  ausentes de `origin/staging` no início desta auditoria.
- Referência Stitch correspondente, que estava somente no checkout local.
- Novo redesign de `/(tabs)/(profile)/trips`, com a referência fornecida pelo owner.
- Sincronização de seletores Playwright com os pins teardrop e com o catálogo que
  agrega páginas para formar carrosséis.

## Contratos preservados no histórico

- Fonte de dados: `useMyTripsQuery(user?.id)`.
- Campos exibidos: `route_title`, `created_at`, `status` e navegação por `route_id`.
- Mutations: `pauseTrip`, `resumeTrip` e `finishTrip`, seguidas de `refetch`.
- Falha de mutation: anúncio acessível e alerta permanecem ativos.
- Loading e erro com retry permanecem explícitos.
- Localização e trajeto ilustrativos do HTML Stitch não foram inventados porque não
  existem em `TripSchema`.

## Evidências locais

| Gate | Resultado |
|---|---|
| `npm run typecheck` | passou |
| `npm run openapi:check` | passou |
| `npm test` | 48 suites / 305 testes passaram |
| `npm run e2e:web` | 3 testes passaram |
| `npm run a11y:web` | 4 testes passaram |
| `npm run export:web:fixture` | export concluído |
| `npm run test:browser` | 32 testes passaram em Chromium desktop/mobile |

A captura local `.tmp/trips-history-mobile.png` foi inspecionada e confirmou o
layout de filtros, cards, status, ações e fim do histórico. A pasta `.tmp` não é
versionada.

## Auditoria remota read-only

- `origin/staging` foi atualizado por fetch antes da comparação.
- O alias canônico estava `READY` no deployment `dpl_21LhiPVWPojvt2b4oMGrFq52rLge`,
  servindo o commit `7117d37` do branch de redesign da rota, embora esse commit ainda
  não pertencesse a `origin/staging`. A atualização no GitHub precisa reconciliar
  essa divergência, não apenas publicar o novo histórico.
- A única PR aberta encontrada foi a PR #7, antiga e não relacionada a estes
  redesigns; ela não foi incorporada ao escopo.
- Não havia PR do branch `codex/eco-route-detail-stitch-redesign`.
- Nenhuma escrita no GitHub, merge ou deploy foi executada durante esta etapa.

## Gate e rollback

O push/PR, o merge e o deploy de staging são ações remotas separadas pelas regras
do projeto. Antes de cada etapa, confirmar branch/SHA e resultado do gate anterior.
Se a validação pós-deploy falhar, o rollback Web deve restaurar
`dpl_21LhiPVWPojvt2b4oMGrFq52rLge` no alias canônico; nenhum schema ou dado remoto
faz parte deste pacote. O projeto correto é `eco-nexao/econexao-app-staging`
(`prj_Ty7Ph7WpbfZ34Ues4Ct6a8ZbsGf0`); o link `.vercel` da raiz pertence à landing,
portanto qualquer operação CLI deve selecionar explicitamente o projeto do app.
