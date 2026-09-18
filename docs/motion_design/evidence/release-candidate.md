# Release Candidate Manifest — Iniciativa Motion Design Web (ECO-2708)

## 1. Identificação de Versão e Base Git

- **Repositório:** `https://github.com/econexao/econexao.git`
- **Branch base (alvo):** `staging`
- **SHA base auditada em origin/staging:** `2d62f2724bc3f180e3e98638ad353f9dd94c3e32`
- **Branch de integração da iniciativa:** `codex/motion-integration`
- **Branch de release prep:** `codex/eco-2708-motion`
- **Avanço de staging verificado:** Não houve avanço em `origin/staging` (continua em `2d62f2724bc3f180e3e98638ad353f9dd94c3e32`). Linhagem perfeitamente alinhada.

---

## 2. Árvore e Conjunto de Commits da Iniciativa

A iniciativa de Motion Design Web foi construída incrementalmente com isolamento local e qualificação por task:

| Commit | Task | Descrição |
|---|---|---|
| `98451fc` | ECO-2700 | docs(motion): baseline, inventory, isolation, and regression coverage |
| `9620352` | ECO-2701 | feat(motion): motion foundation and reduced motion tokens/hooks |
| `0edb1d0` | ECO-2702 | feat(motion): animate map pins and selection feedback |
| `1de906b` | ECO-2703 | feat(motion): route highlight and camera motion |
| `c670d90` | ECO-2704 | feat(motion): accessible galleries and carousels |
| `8e664fe` | ECO-2705 | feat(motion): accessible screen entrances and navigation |
| `303a769` | ECO-2706 | feat(motion): modal exit and reduced motion |
| `d5d8992` | ECO-2706 | fix(motion): complete modal exit focus handling |
| `b86bbc0` | ECO-2706 | docs(motion): record ECO-2706 review evidence |
| `13a81fc` | ECO-2707 | docs(motion): record ECO-2707 integrated qualification |
| `9e80d36` | ECO-2708 | docs(motion): reconcile ECO-2708 release candidate and clean test fixtures |

---

## 3. Auditoria de Escopo e Integridade do Diff

- **Total de arquivos modificados no diff `origin/staging..codex/motion-integration`:** **61 arquivos** (código TypeScript/React Native em `econexao-app/` e documentação técnica em `docs/`).
- **Verificação de isolamento:**
  - Nenhuma alteração em `backend/` ou APIs Python.
  - Nenhuma alteração em `supabase/` ou novas migrations SQL.
  - Nenhuma alteração na landing page de produção.
  - Nenhuma exposição de segredos, variáveis `.env` ou tokens.
  - Nenhum artefato de teste de fixture exportado para deploy de produção.
- **Tipos Contratuais Preservados:**
  - `econexao-app/app/actor/[actorId].tsx` e `econexao-app/app/(tabs)/(profile)/trips.tsx` utilizam estritamente os tipos OpenAPI/contratuais sem mutações extracontratuais.

---

## 4. Identidade Remota e Destinos Comprovados

### 4.1 Frontend Staging (Vercel)
- **Projeto:** `econexao-app-staging` (`prj_Ty7Ph7WpbfZ34Ues4Ct6a8ZbsGf0`)
- **Organização / Equipe:** `eco-nexao` (`team_b6Vl2QQH4SBf4Tnk1ymhG486`)
- **Alias Canônico:** `https://econexao-app-staging.vercel.app/`
- **Deployment ativo atual em staging:**
  - ID: `6507502161`
  - Commit SHA: `2d62f2724bc3f180e3e98638ad353f9dd94c3e32`
  - URL de deployment: `https://econexao-app-staging-hdv1nhnbr-eco-nexao.vercel.app`
- **Deployment anterior disponível para rollback:**
  - ID: `6507307407`
  - Commit SHA: `db7c81ba77714beb8e053eed2890850da4df73a7`

### 4.2 Backend & Pipeline Staging
- **Ambiente Render:** `https://econexao-backend-staging-30dt.onrender.com`
- **Pipeline GitHub Actions:** `.github/workflows/staging-deploy.yml` acionado no push para `staging`.
- **Supabase Staging Gate:** `APPLY_STAGING_MIGRATIONS=false` — falha se houver migrations pendentes (garantia de integridade).
- **Auditoria de Branch Protection em Staging:** Chamada `gh api repos/econexao/econexao/branches/staging/protection` retornou HTTP 404 (sem ruleset remoto ativo). O bloqueio por avanço de base depende de conferência operacional pré-merge (`git merge-base --is-ancestor origin/staging HEAD`).

---

## 5. Evidência dos Checks de Qualidade e Console Limpo

Executados no diretório `econexao-app` da worktree dedicada:

| Check | Comando | Resultado | Evidência |
|---|---|---|---|
| Instalação de dependências | `npm ci` | EXIT 0 | 938 pacotes auditados |
| Checagem de tipos estáticos | `npm run typecheck` | EXIT 0 | TypeScript sem erros (`tsc --noEmit`) |
| Sincronização OpenAPI | `npm run openapi:check` | EXIT 0 | Tipos alinhados com `docs/openapi.yaml` |
| Testes unitários / integração | `npm test -- --watch=false` | EXIT 0 | 57 suítes, 354 testes PASS |
| Build normal Web (sem fixture) | `npm run export:web` | EXIT 0 | Bundle limpo gerado em `dist/` |
| Bundle de fixture | `npm run export:web:fixture` | EXIT 0 | Bundle com mocks contratuais para E2E |
| Testes no browser (Playwright) | `npm run test:browser` | EXIT 0 | 40 testes PASS (20 desktop + 20 mobile) com asserção explícita de console limpo (0 console.error / 0 pageerror) |

---

## 6. Pull Request e Checks Remotos

- **Pull Request:** [#70 — feat(motion): integrate accessible motion design, tokens and web microinteractions](https://github.com/econexao/econexao/pull/70)
- **Branch de Integração Publicada:** `codex/motion-integration`
- **Alvo:** `staging`
- **Checks Remotos de CI no GitHub:**
  - `Validate branch promotion flow`: **SUCCESS**
  - `contract` (Frontend contract): **SUCCESS**
  - `Vercel Preview Deployment`: **SUCCESS** (`https://econexao-app-staging.vercel.app` preview)
  - `Vercel Preview Comments`: **SUCCESS**
- **Sem mutações proibidas:** Não foi realizado merge nem deploy em produção nesta task.

---

## 7. Plano de Rollback Concreto

- **Frontend (App):**
  1. Rollback Git: Criar branch de reversão `codex/revert-motion-integration` com `git revert -m 1 <SQUASH_SHA>` e abrir PR emergencial contra `staging`.
  2. Rollback Vercel Imediato: Caso seja necessária restauração instantânea de tráfego antes da conclusão do pipeline de revert, reatribuir o alias `https://econexao-app-staging.vercel.app/` para o deployment anterior verificado `6507502161` (`https://econexao-app-staging-hdv1nhnbr-eco-nexao.vercel.app`).
- **Backend / Banco de Dados:**
  - A iniciativa não realiza mutações de schema nem migrations SQL. Nenhuma ação de rollback em Supabase ou banco de dados é necessária.

---

## 8. Parecer Independente Versionado

- O parecer conclusivo de aprovação do Revisor Independente está formalizado em [`ECO-2708-review.md`](ECO-2708-review.md).
