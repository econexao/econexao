# Protocolo de execução e release de motion

## Contrato de sessão

Executar somente o ID recebido. `/goal` declara esse objetivo; não cria autorização remota. Ao iniciar, ler AGENTS da raiz e do app, docs/README.md, docs/ai/README.md, DEVELOPMENT_RULES integral em sessão nova, backend_integration_spec, registro da task em project_status, ai_task_playbook, este protocolo e a seção da task no plano. Ler ADRs 0001, 0003, 0010 e 0011 e referências específicas quando tocar mapa. Decisão aberta de outra iniciativa não pode ser resolvida implicitamente por motion.

Antes de editar, apresentar mini-brief: task, objetivo observável, base/SHA, dependências verificadas, fontes, arquivos reservados, contratos/schema, ambiente, testes, fora do escopo e riscos. Em caso de baseline diferente, reconciliar por inspeção, sem restaurar alterações do owner.

## Subagentes e ferramentas

- Raiz coordena, implementa e integra. Um planejador read-only faz auditoria limitada antes da implementação; um testador reproduz aceites depois; um revisor independente lê diff e evidências. Para ECO-2700/2708, basta raiz + revisor quando não houver implementação.
- Planejador pode trabalhar em paralelo à leitura da raiz. Testador e revisor trabalham sobre o commit final, sem editar. Findings voltam à raiz; os gates afetados são repetidos depois da correção.
- Uma única pessoa/agente escreve no worktree. Não editar MapAdapter, lockfiles, docs/project_status.md ou fixtures em paralelo. Subagentes não subdelegam, não recebem segredos, não fazem push/deploy e não aprovam a própria implementação.
- Se a ferramenta não oferecer subagentes, declarar a limitação e entregar para revisão em outra sessão antes de integrar; não inventar revisão independente.
- Usar `/browser` para baseline local, inspeção de animações, teclado, movimento reduzido e evidência pós-deploy. Se o comando não existir, usar o browser/MCP disponível e declarar a substituição. Screenshot estático não comprova motion: capturar vídeo ou trace temporal mais assertivas de estado final.
- CLI: Git, npm, testes e comandos reais do projeto. Consultar `--help` antes de assumir flags de gh/Vercel/Supabase. MCP GitHub/Vercel pode consultar PR/checks/deployment/alias com melhor rastreabilidade; não é obrigatório. Nunca imprimir tokens/env/secrets.
- Skills: descobrir instaladas e ler as pertinentes. Browser/verificação para UI; React para revisão de múltiplos TSX; deployments-cicd/Vercel no release. Não usar skill Next.js em Expo nem instalar dependências por sugestão genérica. A regra do projeto prevalece sobre exemplos de deploy da skill.
- Não usar `/schedule`. Não usar `/grill-me` para decisões técnicas que a inspeção resolve; reservá-lo a conflito de produto realmente bloqueante.

## Git: uma integração local, uma publicação final

Repositório remoto esperado: `https://github.com/econexao/econexao.git`. Branch alvo final: `staging`. Nunca `main`/`master`. Preservar worktrees existentes; não reaproveitar nem remover os listados na auditoria.

1. ECO-2700: `git status --short`, `git worktree list`, `git branch -vv`, `git remote -v`, `git fetch origin`, `git rev-parse origin/staging`. Registrar SHA completo. O fetch é leitura remota; não modificar checkout do owner.
2. Criar worktree irmão dedicado `C:\Users\Bruno\Downloads\eco-nexao-motion-integration` e branch `codex/motion-integration`, a partir do origin/staging confirmado. Se já existirem, inspecionar propriedade/estado antes de continuar; nunca sobrescrever.
3. Para cada ECO-2700 a ECO-2708, criar branch `codex/eco-27XX-motion` e worktree irmão `C:\Users\Bruno\Downloads\eco-nexao-motion-27XX` a partir do HEAD revisado da integração. Usar ID real, não deixar placeholders no comando executado. Somente uma task de implementação ativa.
4. Importar para ECO-2700 este pacote documental e apenas as alterações de índice/status/dashboard correspondentes, se ainda não estiverem na base. Comparar antes de copiar; não transportar outras alterações locais.
5. Commits pequenos por task, com caminhos explícitos: `feat(motion): ECO-2702 animate map pins`, `test(motion): ECO-2707 verify motion journeys`, etc. Evitar `git add .`. O agente executor desta iniciativa pode criar commits locais de seu escopo após testes/revisão; nesta sessão de planejamento não há commit.
6. Depois do handoff e revisão independente, integrar **localmente** a branch da task com `git merge --ff-only codex/eco-27XX-motion` no worktree de integração. Se não for fast-forward, parar e investigar alterações concorrentes; não forçar. A task seguinte parte desse resultado.
7. Não fazer PR nem push de cada task para staging: isso dispararia deploys parciais. As branches de task e integração ficam locais até ECO-2708. Caso seja necessário backup remoto antes, declarar que push pode disparar preview e obter autorização adequada; não fazê-lo implicitamente.
8. ECO-2708: atualizar origin/staging e incorporar alterações novas à branch da task de preparação por merge normal, preservando histórico; resolver conflitos com revisão das áreas afetadas, jamais `ours`/`theirs` global. Se não houver avanço, não criar merge vazio. Reexecutar qualificação sobre candidato atualizado e integrar por ff-only.
9. Preparar uma única PR `codex/motion-integration` → `staging`, com título centrado no resultado, resumo, tasks, testes, SHA e riscos. Após autorização aplicável, push explícito dessa branch e criação da PR. Verificar previews automáticos e destino; sem `--force`.
10. ECO-2709: um squash merge final da PR aprovada, se permitido pela política remota verificada. Isso gera um único commit reversível da iniciativa em staging. Se squash não for permitido, registrar estratégia suportada e rollback exato antes do merge; não alterar proteção de branch. Nunca bypass/admin merge.
11. O SHA do squash será diferente do candidato. Confirmar conteúdo final e vínculo candidato → PR → commit staging → deployment → alias. Se staging ou PR avançar após a revisão, repetir os gates afetados antes de publicar. Não criar deploy manual concorrente ao automático.

## Gates remotos e identidade

O pedido do owner define o destino e exige publicação ao final. Não autoriza iniciar implementação/publicação nesta sessão de planejamento. Durante execução, preparar primeiro um resultado revisável. Aplicar as autorizações já concedidas quando cobrem explicitamente a ação/artefato; quando faltar GO requerido pelas regras do projeto, solicitar uma única decisão concreta explicando a origem da exigência em AGENTS e DEVELOPMENT_RULES §9/§12.

- Gate de push/PR: branch, SHA, repositório, base staging e efeitos de previews apresentados.
- Gate de merge/publicação: PR e HEAD exatos, staging head, testes, configuração remota verificada e rollback apresentados. Incluir expressamente o deploy automático Vercel (se confirmado), verificações remotas Supabase e redeploy Render que o pipeline atual dispara. Não pedir novamente se esse conjunto já foi autorizado de forma específica.
- `APPLY_STAGING_MIGRATIONS` permanece false. Nenhuma migration nova, autorização de migration, carga, alteração de ambiente, billing, domínio ou dados. Gate falhando por banco é bloqueio externo, não motivo para aplicar SQL ou desativar check.
- Não executar `vercel` na raiz: vínculo local observado `econexao-landing-production`, projectId `prj_fORfN8BxAKSrKGsCZGYiEId4lZtt` é proibido nesta iniciativa.
- Vínculo candidato em `econexao-app/.vercel/project.json`: `econexao-app-staging`, projectId `prj_Ty7Ph7WpbfZ34Ues4Ct6a8ZbsGf0`, orgId `team_b6Vl2QQH4SBf4Tnk1ymhG486`. São evidências locais datadas, não allowlist remota suficiente. Conferir via API/CLI/MCP: equipe, ID, repo, branch, rootDirectory, build/output, ambiente e alias https://econexao-app-staging.vercel.app/.
- Não inferir target Vercel preview/production do nome staging. Um projeto dedicado pode usar target chamado production e ainda servir staging; comprovar projeto/alias/ambiente e respeitar GO antes de qualquer comando de publicação. Nunca escolher `--prod` por conveniência.
- Build local de fixture usa localhost e fixture.supabase.co. `dist` desse teste nunca é artefato de deploy. Preferir build remoto limpo do SHA aprovado; fallback manual só após falha diagnosticada, com identidade/env staging confirmados, build limpo normal e autorização aplicável. Não modificar links globais para contornar isso.
- Não transportar `.env`, `.vercel` ou secrets entre worktrees por cópia indiscriminada. Configuração pública/segura deve seguir DEVELOPMENT e a identidade verificada.

## Checks e evidências

Comandos existentes a executar no diretório `econexao-app` do worktree da task (confirmar scripts na base atual):

```powershell
npm ci
npm run typecheck
npm run openapi:check
npm test -- --watch=false
npm run export:web:fixture
npm run test:browser
```

Durante tasks, usar Jest/Playwright direcionados aos aceites descritos; a suíte completa acima é obrigatória em ECO-2707 e após reconciliação material de ECO-2708. `npm ci` na preparação de cada worktree; não repetir a cada ajuste. Não inventar `npm run lint`, inexistente na baseline. Build normal `npm run export:web` deve ser verificado com configuração segura apropriada antes do release; nunca publicar build fixture.

Playwright atual serve `dist` em 127.0.0.1:8082, com Chromium desktop 1280×800 e mobile 400×832. Construir fixture antes; não reaproveitar servidor alheio. Testes novos bloqueiam rede não explicitamente simulada: API, Auth, imagens e tiles usam fixtures/mocks contratuais locais. Nenhuma chamada Google/Supabase real no CI. Testes unitários simulando plataforma não provam browser/aparelho.

Em cada handoff registrar: ID, base e commit entregues, arquivos, aceites numerados PASS/FAIL/NOT_VERIFIABLE, comandos/cwd/exit code, duração/configuração dos testes, evidências sanitizadas, falhas preexistentes, ações remotas/autorizações, reservas liberadas, riscos e rollback. Gravar relatório versionável em `docs/motion_design/evidence/ECO-XXXX.md`; vídeos/traces pesados fora do Git ou como artefatos de teste referenciados com hash/local acessível. Nunca substituir falha por skip ou enfraquecer assertiva.

Revisor decide APPROVE, CHANGES_REQUIRED, BLOCKED ou NOT_VERIFIABLE. Status de execução e evidências ficam somente no registro da task em project_status. Atualizar inventário/aceites quando mudar interação e regenerar dashboard ao alterar cadastro: `node scripts/generate-project-dashboard.mjs` na raiz.

## Rollback e encerramento

- Antes do merge registrar deployment anterior do app staging, SHA anterior e identidade do backend. Verificar disponibilidade do artefato anterior, sem executar rollback preventivo.
- Em regressão publicada: parar rollout, preservar evidências, preparar revert do squash em nova branch/PR contra staging. Não usar reset/force-push. Se outro commit tiver sido publicado depois, não reverter esse trabalho por arrasto.
- Se for necessário restaurar o alias Vercel para deployment anterior, usar somente aquele do app staging previamente comprovado e a autorização específica de rollback; reconciliar Git por revert depois. Restauração de alias não restaura backend/banco.
- Esta iniciativa não muda backend/schema; regressão do pipeline/backend deve ser diagnosticada separadamente. Nenhuma reversão de migration.
- Não afirmar publicado por HTTP 200, hook aceito ou CI verde. Exigir deployment READY + SHA/metadados + alias + jornadas visuais no endereço canônico.
- Handoff pós-publicação e status atualizado ficam locais para revisão, ou em PR documental posterior deliberado. Não disparar novo push em staging apenas para registrar um sucesso e iniciar outro deploy sem necessidade. Registrar o SHA efetivamente homologado e não prometer repo remoto documental atualizado se isso não ocorreu.
