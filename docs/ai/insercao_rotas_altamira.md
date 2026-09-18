# Rotas de Altamira — guia operacional para IA

Revisão: 18/09/2026. Escopo: inserir um destino por vez pelo chat, começando pela Praia do Maçanori. Este guia substitui a proposta inicial de usar Google Routes para as novas rotas oficiais de Altamira. Não substitui ADRs nem concede GO remoto.

## Padrão de produto

Todas as rotas oficiais de Altamira devem seguir o modelo do Pedral:

1. Destino editorial com localização verificada.
2. Quatro origens: Rodoviária, Aeroporto, Terminal Fluvial/Cais da Orla e Centro/Praça da Matriz.
3. Quatro trajetos viários OSRM preparados, revisados e salvos, com distância, duração e geometria por origem.
4. Mapa existente OpenStreetMap/Leaflet na Web, preservando estilo da linha, pins, câmera e filtros.
5. Somente atores existentes da região, elegíveis para a camada rota, a até 1.000 m da linha da origem selecionada.
6. Trocar a origem atualiza linha, métricas e atores juntos, sem cálculo externo a cada abertura.

O corredor mede proximidade espacial à linha, não distância de desvio pela estrada. Serviços municipais fora dele permanecem no modo cidade. Pindobal e Pedral devem continuar funcionando. Nenhum painel novo, descoberta de estabelecimentos ou duplicação de atores.

Cada destino é UMA rota no catálogo com QUATRO opções de origem e seus percursos. Não criar quatro cards/rotas independentes para a mesma praia. Padronizar a metodologia não exige que os caminhos sejam iguais nem que tenham a mesma quantidade de atores.

## Leitura e enquadramento

Ler AGENTS.md, docs/README.md, docs/ai/README.md, docs/ai/DEVELOPMENT_RULES.md, docs/backend_integration_spec.md, docs/project_status.md, docs/ai_task_playbook.md e referências aplicáveis: ADRs 0003, 0006, 0011, 0012, 0013, contrato de pacote e aceites.

Vincular a execução a uma única task ECO, reconciliando os slots Altamira do backlog; não reutilizar um ID ocupado nem presumir que dependências antigas foram concluídas. Registrar o destino e a evidência atual no backlog, sem promover o status além do comprovado. Dependência independente exige sua própria task antes de prosseguir.

O ADR 0013 escolhe Google para previews dinâmicos e preserva snapshots OSRM existentes. Distinguir geração editorial de snapshots de um novo serviço OSRM em runtime. A direção de produto deste guia já é usar o modelo do Pedral; não pedir ao owner que escolha novamente Google versus OSRM. Rastrear o precedente e documentar o enquadramento. Se houver conflito normativo concreto ou decisão formal ainda aberta, citar o trecho e apresentar uma proposta mínima para decisão antes da implementação dependente. Não migrar mapas para Google nem alterar GPS/preview dinâmico nesta task.

## Evidência local do Pedral

- `supabase/migrations/20260917160415_pedral_four_origins_coherent_geometries.sql`: quatro geometrias OSRM, métricas, bounds, associação espacial com geography/ST_DWithin e origin_flags por origem.
- `docs/data/altamira/pedral_correction_report.md`: referência da correção até o Balneário Luiz do Pedral.
- `econexao-app/src/components/map/MapAdapter.web.tsx`: Polyline verde contínua sobre OpenStreetMap, com destaque animado.
- `backend/app/repositories/territorial.py`: consultas e filtros por origem/região.
- `backend/app/ingestion/route_package_repository.py`: inspecionar antes de reutilizar. O trecho que cria origin_flags={primary: true} e distância zero NÃO comprova associação espacial nas quatro origens.
- `backend/app/services/routing_service.py`: contém exceção de destino para Pedral. Não replicar exceções por praia; avaliar somente se interfere no escopo da rota oficial.

Essas referências provam implementação local, não o estado atual do banco remoto. O host exato e o procedimento usados para gerar o snapshot Pedral ainda precisam ser rastreados. Não declarar pipeline genérico pronto.

## O que receber do owner

Para iniciar: nome, latitude, longitude e confirmação de que o ponto é a entrada/acesso desejado. Para Maçanori, as coordenadas ainda não foram fornecidas nesta conversa.

A IA deve descobrir no projeto os IDs da região, as origens e suas coordenadas; não perguntar ao owner detalhes técnicos descobríveis. Validar os dados na fonte operacional autorizada antes da carga. Perguntar apenas o que falta: acesso por carro, eventual trecho a pé/barco, texto factual e mídia disponível. Uma praia não comprova acesso rodoviário até a areia.

Preparar ficha conforme `docs/data/route_data_package_template.md`: IDs/slug estáveis, região, título, resumo revisado, destino, origens, proveniência e status editorial. Ausência de informação vira pendência; não inventar serviços, condições de estrada, temporada, avaliações, fotos ou selos. Mídia exige direitos e alt text.

Fotos e dados opcionais não bloqueiam preparação e testes. Usar somente tratamento de ausência já suportado pelo app; não reaproveitar a foto do Pedral como se fosse Maçanori. Se um campo for obrigatório para publicação, apontar seu critério exato e concluir o restante antes de pedir o insumo. Após receber as coordenadas, atualizar o registro da rota; a observação histórica acima não é motivo para perguntá-las novamente.

## Preparação reproduzível

1. Inspecionar Git/worktrees e preservar alterações alheias. Usar branch codex/ e worktree a partir da base staging atualizada, registrando SHA. Não implementar diretamente no checkout staging do owner.
2. Apresentar mini-brief do playbook: task, objetivo, dependências, leituras, arquivos, contratos/schema, ambiente, testes, fora do escopo e riscos.
3. Rastrear a geração anterior. Confirmar serviço OSRM, perfil, cobertura, condições de uso, quota e procedência dos dados. Não presumir que servidor público de demonstração é infraestrutura disponível para uso irrestrito. Não provisionar servidor ou contratar serviço sem decisão.
4. Preparar quatro geometrias viárias com a mesma metodologia. Registrar provedor, perfil, data, origens, destino solicitado, endpoints devolvidos, distâncias, durações, bounds e hashes/proveniência conforme licença. Preservar fontes originais.
5. Conferir acesso real e distância entre destino solicitado e ponto alcançado pelo roteador. Não acrescentar uma reta para simular estrada, travessia ou acesso inexistente. Se houver diferença, submeter o acesso correto à revisão antes de publicar; não ocultar snapping.
6. Reutilizar serviço/repository/importador compatível. Parametrizar rota, destino e origens; não copiar scripts inteiros com UUIDs novos. Manter origem vinculada à nova rota com identidade própria, sem mover a origem do Pedral.
7. Reusar IDs dos atores existentes e calcular vínculos por origem com geography/ST_DWithin(..., 1000). Não atribuir distância zero nem flags genéricas. Considerar região, localização válida, exclusão/arquivamento, publicação e regras de categoria vigentes.
8. Preparar dry-run sem escrita, relatório por origem e carga transacional/idempotente. Reexecução não duplica rota, origens, geometrias ou vínculos. Recalcular associações removendo/arquivando apenas vínculos obsoletos da rota-alvo, sem excluir atores ou afetar outras rotas.
9. Se precisar alterar schema, usar migration versionada criada pelo CLI oficial. Não usar Dashboard nem introduzir migration quando uma carga de dados pelo pipeline existente for suficiente. Schema novo exige documentação Supabase atual, grants/RLS e testes pertinentes.

Antes de mudar de worktree, conferir se este guia, o prompt e o link em docs/ai/README.md estão presentes na base. Se ainda forem alterações locais não commitadas, ler os originais e transportar somente esses documentos autorizados para o worktree, conferindo conteúdo/diff e preservando a cópia original. Não fazer stash, commit ou cópia em massa das demais alterações do owner. Incluir os documentos pertinentes na entrega para revisão e posterior commit autorizado.

Escolher o menor incremento necessário: se uma carga parametrizada já satisfaz os aceites, não criar framework de ingestão, painel, serviço permanente ou refactor geral. Caso falte a capacidade reutilizável indispensável, explicitar essa dependência e seu escopo antes de programar.

## Validação proporcional

- Geometrias válidas WGS84, ordem GeoJSON longitude/latitude, continuidade viária, origem/acesso corretos, métricas plausíveis e bounds contendo percurso.
- Quatro origens funcionais. Troca de origem sem linha/pins antigos, sem resposta atrasada sobrescrever seleção nova.
- Teste espacial em 999, 1000 e 1001 m; exclusão de outra região e de atores inelegíveis. Demonstrar que um ator pode pertencer a mais de um percurso sem duplicação.
- Idempotência e rollback após falha, restritos à rota-alvo; preservar Pedral/Pindobal e atores compartilhados.
- Loading, vazio, erro/retry, teclado e leitor de tela. Conferência visual desktop/mobile, filtros, câmera, seleção de ator e catálogo coerentes.
- Nenhuma chamada Google/OSRM real em testes/CI; usar fixtures sintéticas ou licenciadas. Cálculo editorial real é uma operação separada, com serviço/escopo verificados.

Comandos existentes, a reconfirmar no checkout:

- Frontend: em econexao-app, `npm run typecheck`, `npm run export:web`, testes Jest pertinentes e `npm run openapi:check` se afetar contrato. `npm run web` inicia servidor; não é prova de build. Não existe script `build` no package.json inspecionado.
- Backend, quando alterado: em backend, `uv run ruff check app tests scripts`, `uv run mypy app scripts` e pytest dirigido aos módulos afetados. Referências: test_altamira_ingestion.py, test_route_package_importer.py, test_spatial_assigner.py e test_territorial_behavior.py. Escolher os testes que exercitam o caminho real implementado; não rodar suítes irrelevantes como substituto.
- Banco: verificações PostGIS reais em ambiente de teste autorizado quando necessárias; mocks sozinhos não comprovam carga espacial. Advisors antes de promover migration.
- Registrar comandos, exit codes, limitações e contagens; revisar `git diff --check`.

O relatório por origem deve listar código, início/fim solicitado e alcançado, distância, duração, pontos da geometria, atores elegíveis no corredor, pins retornados pela API e eventuais limites/paginação. Informar o total de atores únicos separadamente: somar as quatro origens pode contar o mesmo ator várias vezes. Zero atores é resultado possível, não motivo para ampliar o corredor ou inventar vínculos. Diferenciar zero real de falha na consulta ou carga.

## Revisão e publicação em staging

Preparar tudo antes de pedir GO. Entregar handoff para revisão independente do Codex: task, base/SHA, diff, arquivos, testes, dry-run, relatório por origem, pendências e plano de rollback. Corrigir findings e repetir gates afetados. Aprovação local não é autorização remota.

Separar os gates conforme DEVELOPMENT_RULES:

1. Commit local: aguardar o GO solicitado pelo owner no prompt; incluir somente arquivos da tarefa.
2. Push/PR, revisão e merge: apresentar destino e efeito exatos, aguardando GO da etapa. Conferir CI e proteção da branch; não contornar PR obrigatório nem usar force-push.
3. Deploy: verificar o mecanismo real antes de push/merge. O workflow staging-deploy.yml reage a push em staging; inspecionar também integrações Vercel/Render. Se uma ação disparar deploy automaticamente, explicar e obter GO que nomeie ambos os efeitos antes dela; não presumir que push e deploy sejam independentes.
4. Carga/migration/publicação editorial: gate próprio, com identidade técnica do Supabase/backend de staging, preflight sem escrita, pacote/hash, contagens esperadas e rollback. GO de Git/Vercel não autoriza escrita no banco. Ordenar schema, backend, dados e frontend por compatibilidade; não aplicar todas as migrations pendentes indiscriminadamente.
5. Homologação: confirmar revisão/artefato servido e dados persistidos. No link https://econexao-app-staging.vercel.app/, abrir a nova rota e testar quatro origens, geometrias, métricas, pins e regressões. Deploy verde ou HTTP 200 sozinho não basta.

Se houver só alteração de dados, explicar por que deploy de código pode ser dispensado. Se uma etapa falhar, interromper promoção, preservar evidências e propor correção/rollback específico; não apagar catálogo remoto automaticamente. Production fica fora do escopo.

Concluir com VERIFIED/PARTIAL/BLOCKED/NOT_VERIFIABLE, distinguindo código validado, dados carregados e rota homologada. Sem agendamento, sem próxima rota automática.
