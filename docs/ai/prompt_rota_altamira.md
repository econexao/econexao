# Prompt — criar e publicar uma rota de Altamira

Copie o bloco abaixo para o Google Antigravity. Preencha as coordenadas; nas próximas rotas, troque também o nome. O guia é reutilizável e contém os detalhes técnicos.

```text
Olá! Quero preparar, desenvolver, validar e depois publicar UMA nova rota de Altamira no staging:
https://econexao-app-staging.vercel.app/

Repositório: C:\Users\Bruno\Downloads\eco-nexao-v3

DESTINO DESTA SESSÃO
- Nome: Praia do Maçanori
- Latitude: [preencher]
- Longitude: [preencher]
- O ponto representa a entrada/acesso? [informar]
- Informações ou fotos disponíveis: [opcional]

PADRÃO OBRIGATÓRIO
Siga docs/ai/insercao_rotas_altamira.md. Quero a mesma metodologia do Pedral em TODAS as rotas oficiais de Altamira: UMA rota de catálogo por destino, com quatro origens existentes, trajetos OSRM preparados e salvos, mapa atual e atores já cadastrados a até 1 km do caminho da origem selecionada. Não criar painel, buscar novos estabelecimentos, duplicar atores ou migrar para Google Maps. Preserve Pedral, Pindobal e previews dinâmicos existentes.

/grill-me
Primeiro leia o guia, as regras e o estado real. Pergunte somente informações de produto ausentes ou decisões que realmente impeçam avançar; descubra IDs, arquivos e comandos no projeto. Agrupe perguntas curtas, sem repetir decisões já dadas. Confirme a entrada e o acesso da praia. Fotos e dados opcionais não bloqueiam o preparo. Não invente coordenadas nem aceite uma reta como trecho viário.

/goal
Preparar e validar uma rota de Altamira no padrão Pedral, deixando a entrega pronta para revisão e, após os GOs específicos, carga/publicação e homologação em staging. /goal não concede GO remoto. Se esses comandos não existirem, siga suas intenções como instruções textuais.

FLUXO
1. Leia AGENTS.md, docs/README.md, docs/ai/README.md, DEVELOPMENT_RULES, spec, backlog ativo e playbook; siga as referências do guia. Reconcilie uma única task ECO e suas dependências antes de implementar. Se houver ADR aberto ou dependência independente, apresente o bloqueio e conclua seu enquadramento antes de seguir.
2. Confira Git e alterações existentes. Trabalhe em worktree/branch codex/ a partir de origin/staging atualizada, registrando o SHA. Antes da troca, leia e confira este prompt e o guia: se não estiverem commitados, transporte somente os documentos autorizados conforme o guia, preservando os originais e demais alterações do owner. Apresente o mini-brief obrigatório antes de editar.
3. Verifique como foram gerados os snapshots Pedral e identifique o serviço OSRM utilizável, perfil, licença/condições e cobertura. Formalize a geração editorial de novos snapshots sem alterar o provedor dinâmico do ADR 0013. Não faça chamadas reais, contratação ou provisionamento antes de resolver serviço, enquadramento e autorização aplicáveis.
4. Prepare o menor incremento reutilizável por destino: cadastro editorial, quatro origens verificadas, geometrias/métricas/proveniência e vínculos espaciais por origem. Se o pipeline já atender, limite-se ao pacote/carga; não crie infraestrutura genérica desnecessária. Reuse os atores do banco e componentes existentes. Não copie scripts com IDs fixos nem use flags primary como substituto do corredor real. Garanta dry-run, idempotência e rollback restritos à nova rota; no relatório diferencie atores únicos, atores por origem e pins efetivamente retornados.
5. Use CLI para evidência reproduzível e MCP somente quando disponível e pertinente. Use /skills apenas para capacidades instaladas aplicáveis. Use /browser para documentação oficial e validação visual. Nada disso autoriza ação remota sensível.
6. Use um subagente independente para testar/revisar o diff depois da implementação; ele é somente leitura, não cria subagentes, não recebe segredos e não aprova a própria entrega. O executor reserva os arquivos e consolida os resultados. Se subagentes não estiverem disponíveis, informe a limitação e entregue para revisão independente do Codex.
7. Valide as quatro origens, pontos inicial/final, corredor de 1 km, exclusão de outra região, atores compartilhados, troca de origem, categorias/camadas, câmera e acessibilidade. Cubra falhas e regressões Pedral/Pindobal. Testes/CI não chamam Google/OSRM reais. Execute os checks pertinentes descritos no guia; no frontend use npm run typecheck e npm run export:web, não apenas npm run web. Registre comandos e exit codes.
8. Antes de publicar, entregue resumo, diff, evidências, contagens por origem, dry-run, riscos e rollback para revisão independente do Codex. Pare nesse gate até receber a revisão; corrija findings e repita os testes afetados. Não declare aprovado aquilo que só foi implementado.
9. Após validação/revisão, peça GO para commit local e, nas etapas correspondentes, push/PR, merge e deploy de staging. Explique os efeitos automáticos: se push/merge aciona deploy, inclua esse efeito no pedido de GO ANTES da ação. Preserve proteções de branch. Não use force-push.
10. Peça GO separado para carga de dados, migration quando necessária e publicação editorial no banco de staging. Antes disso, apresente identidade técnica do ambiente, pacote/hash, preflight, contagens e rollback. Não confunda deploy Vercel com cadastro da rota. Ordene as operações por dependência e compatibilidade. Nunca acesse production.
11. Depois das autorizações, execute somente o escopo de cada GO e confira o resultado real. Homologue a nova rota no link de staging: quatro origens, linha correta, distância/tempo, atores do corredor e funcionamento do Pedral/Pindobal. Confira versão servida e dados persistidos; não pare em build verde.

PARADA E ENTREGA
Mantenha respostas curtas: resultado, decisão necessária e próxima ação. Registre detalhes técnicos nos arquivos/handoff, sem repetir o guia no chat.
Pare em acesso ausente, conflito de ADR, acesso viário não comprovado, falha de testes ou necessidade de GO ainda não concedido. Continue o trabalho local independente que for possível. Não substitua decisões do owner nem contorne gates.
Entregue task, branch/base/commit, arquivos, comandos/resultados, relatório por origem, ações autorizadas/executadas, limitações, rollback e status VERIFIED/PARTIAL/BLOCKED/NOT_VERIFIABLE. Atualize o backlog com a evidência real. Termine nesta rota; não comece outra automaticamente.
```
