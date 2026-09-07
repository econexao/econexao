# ECOnexão — matriz de documentação

Status: consolidada na ECO-2402; nenhuma movimentação ou remoção foi executada.
Objetivo: decidir o que deve permanecer versionado e o que pertence apenas ao processo local do owner.


## Regra de classificação

- `PRODUTO_VERSIONADO`: necessário para construir, testar, operar ou compreender o produto em equipe.
- `PROCESSO_LOCAL`: instruções, prompts, coordenação e memória de trabalho pessoais.
- `HISTORICO_VERSIONADO`: evidência/decisão útil, preservada sem competir com a fonte ativa.
- `REVISAR`: conteúdo misto ou consumidor incerto; não mover antes de confirmação.

## Matriz proposta

| Caminho ou grupo | Classe | Ação proposta após aprovação | Justificativa |
|---|---|---|---|
| `docs/project_status.md` | `PROCESSO_LOCAL` | manter como fonte ativa local e retirar do índice Git em task posterior | status, prioridade e backlog de execução pertencem ao planejamento local do owner |
| `docs/documentation_matrix.md` | `PROCESSO_LOCAL` | manter localmente e retirar do índice Git junto da fonte de status | governa a separação do processo pessoal, não o comportamento do aplicativo |
| `docs/README.md` | `PRODUTO_VERSIONADO` | manter; remover ou substituir links para fontes locais no mesmo commit de desindexação | índice público canônico não pode ficar com links quebrados após a retirada dos arquivos locais |
| `docs/backend_integration_spec.md` | `PRODUTO_VERSIONADO` | manter | comportamento e arquitetura do produto |
| `docs/openapi.yaml` | `PRODUTO_VERSIONADO` | manter | contrato HTTP versionado |
| `docs/adr/` | `PRODUTO_VERSIONADO` | manter | decisões arquiteturais aceitas têm precedência normativa |
| `docs/data/`, `docs/acceptance_criteria.md`, `docs/testing_strategy.md` | `PRODUTO_VERSIONADO` | manter | contratos de dados, aceite e testes do produto |
| `DEVELOPMENT.md` e documentação de deploy/runbooks necessária à equipe | `PRODUTO_VERSIONADO` | manter | setup, operação e recuperação reproduzíveis |
| `docs/design-specs/`, `docs/stitch-screens/`, `docs/elementos_interativos_telas.txt` | `PRODUTO_VERSIONADO` | manter | contrato visual e inventário funcional canônico |
| `AGENTS.md` | `PROCESSO_LOCAL` | retirar do índice Git em task posterior, preservando localmente | contém instruções do processo pessoal de desenvolvimento; se colaboração pública exigir regras, criar separadamente um `CONTRIBUTING.md` neutro |
| `docs/ai/` e `docs/ai_task_playbook.md` | `PROCESSO_LOCAL` | retirar do índice Git em task posterior, preservando localmente | descrevem o método pessoal Codex × Antigravity, não o aplicativo |
| `docs/**/prompts/`, `docs/**/protocolo_sessoes.md`, `docs/repository_health/session_protocol.md` | `PROCESSO_LOCAL` | retirar do índice Git em task posterior | prompts e protocolo de sessões são ferramentas locais de execução |
| `docs/finalization/ANTIGRAVITY*.md`, `docs/finalization/ai_coordination.md` | `PROCESSO_LOCAL` | retirar do índice Git em task posterior | supervisão, handoffs e memória entre agentes |
| `docs/repository_health/` | `PROCESSO_LOCAL` | retirar do índice Git após concluir a limpeza; manter cópia local | governa a higiene do workspace e o processo pessoal |
| `docs/mapa_dinamico/tasks.md`, `docs/catalogo_territorial/tasks.md`, `docs/finalization/tasks.md` | `HISTORICO_VERSIONADO` | preservar como registro até ECO-2403; depois arquivar com índice | contêm evidência e contexto, mas não são mais backlogs ativos |
| planos de implementação e dependency graphs antigos | `HISTORICO_VERSIONADO` | arquivar em ECO-2403 | preservam decisões e sequência histórica sem competir com o backlog único |
| `docs/finalization/artifacts/` | `HISTORICO_VERSIONADO` | manter apenas evidência não sensível e não regenerável | classificado pelo owner; nesta task apenas registrada a classificação, sem mover nem remover arquivos |
| `docs/archive/` | `HISTORICO_VERSIONADO` | manter indexado e sem promover status | fornece rastreabilidade deliberada |
| cópia `elementos_interativos_telas.txt` na raiz | `PROCESSO_LOCAL` | arquivamento futuro condicionado à prova de ausência de consumidores | decisão do owner; não mover nem remover a cópia nesta task |

## Regras para a futura retirada do GitHub

1. Preservar primeiro uma cópia local verificável.
2. Confirmar que nenhum CI, script ou agente obrigatório consome o caminho.
3. Retirar arquivos já rastreados do índice sem apagar a cópia local.
4. Só então adicionar regras de ignore precisas; nunca ignorar `docs/` inteiro.
5. Revisar o diff antes de commit e confirmar que ADR, spec, OpenAPI, contratos,
   migrations, runbooks e documentação do produto continuam versionados.
6. Não incluir segredos, dados pessoais ou credenciais no histórico ou na cópia local.

## Decisão do owner aplicada

Decisão formalmente registrada na ECO-2402:
- `docs/finalization/artifacts/` classificado como `HISTORICO_VERSIONADO` (preservando somente evidência não sensível e não regenerável).
- Cópia `elementos_interativos_telas.txt` da raiz classificada para arquivamento futuro após comprovação de ausência de consumidores.
- `AGENTS.md`, `docs/project_status.md` e esta matriz classificados como `PROCESSO_LOCAL` para futura desindexação sem perda de cópia local.
- Nenhuma movimentação, remoção material ou alteração de `.gitignore` / `git rm --cached` é executada nesta task.
