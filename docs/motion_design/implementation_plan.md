# Plano de implementação de motion — ECO-2700 a ECO-2709

## Resultado final exigido

O usuário navega pela Web publicada em https://econexao-app-staging.vercel.app/ com pins, traçados, galerias, entradas, modais e feedback consistentes, preservando dados, coordenadas, filtros, acessibilidade, URLs e fluxos existentes. A entrega só termina com evidência do SHA servido e homologação do staging. Aprovação local não satisfaz a publicação.

Executar a cadeia **2700 → 2701 → 2702 → 2703 → 2704 → 2705 → 2706 → 2707 → 2708 → 2709**, uma task por sessão. A ordem serial reduz conflitos em componentes compartilhados; subagentes colaboram em auditoria, testes e revisão, não por branches concorrentes sobre o mesmo mapa.

## Especificação visual e funcional comum

Valores são requisitos iniciais desta iniciativa, não alegações do estado atual. Ajustes até 20% exigem evidência visual e atualização de tokens/docs; mudança de mecanismo ou de fluxo exige revisão explícita. O realce de traçado é exceção: manter 650 ms para cumprir seu limite de 700 ms. Tokens exatos de modal são gates Web; no nativo, preservar a duração controlada pelo sistema, documentar o comportamento observado e usar animationType="none" em movimento reduzido, sem introduzir um modal customizado nesta iniciativa.

| Padrão | Valor nominal | Curva/execução | Movimento reduzido |
|---|---|---|---|
| Pressão | 100 ms, escala 1 → 0,98; soltar 140 ms | ease-out, sem mola | Cor/estado instantâneo |
| Hover card | 140 ms, translateY -2 px | ease-out, somente pointer fine | Borda/cor sem deslocamento |
| Entrada de bloco | 180 ms, opacity 0 → 1, Y 8 → 0 px | cubic-bezier(0.2,0,0,1) | Estado final imediato |
| Sequência inicial | até 4 blocos, intervalo 35 ms | limite total 300 ms | Sem sequência |
| Pin novo | 180 ms, escala 0,90 → 1 e opacity | âncora inferior fixa, sem bounce | Pin final imediato |
| Pin selecionado/card | 160–200 ms, opacity/escala 0,98 → 1 | não mover coordenada | Destaque estático |
| Realce de traçado | 650 ms uma vez | progressão linear sobre linha-base completa | Só linha-base |
| Troca de geometria | até 180 ms | nova geometria válida aparece completa | Troca imediata |
| Câmera por ação explícita | cerca de 300 ms | mecanismo nativo Leaflet, interrompível | animate:false/equivalente |
| Foto carregada | 180 ms opacity | iniciar no load, reservar tamanho | Imediata |
| Galeria por botão | alvo 240 ms quando controlável | scroll nativo/suave sem física adicional | scroll programático imediato |
| Modal central | entrada 220 ms, saída 160 ms | opacity + Y até 8 px | Imediato |
| Sheet existente | entrada 280 ms, saída 180 ms | translateY, sem bounce | Imediato |
| Favorito | pulso 180 ms, 1 → 1,12 → 1 | ícone apenas, uma vez por ação | Estado imediato |

O scroll nativo pode não oferecer duração configurável; conservar o mecanismo do navegador e registrar tempo medido, sem criar motor de scroll só para impor 240 ms. As demais durações controladas usam tokens únicos. Sem autoplay, parallax, tremor de erro, confete, pulso infinito, zoom automático de fotos, contador animado ou atraso artificial da ação.

Regra transversal: identidade estável e cancelamento. Rerender, favorito, zoom, retorno do background e resposta antiga não reiniciam efeitos sem novo evento semântico. A última intenção do usuário prevalece. Troca de tela/rota/origem limpa timers, listeners, observers, RAFs e overlays. Pausar efeitos decorativos ao ocultar aba; ao voltar apresentar estado final, sem replay. Estado final é sempre utilizável, inclusive sem JS de animação ou com preferência ainda não resolvida.

### Acessibilidade e orçamento

- Respeitar preferência do sistema na Web e nativo; observar alterações em runtime. Até descobrir preferência, usar estado estático seguro. Não persistir nova preferência remota nem confundir leitor de tela com movimento reduzido.
- Foco e ativação não aguardam duração de animação. Elementos em saída não podem receber cliques/tab; não deixar portal invisível bloquear a página. Escape e backdrop preservam semântica.
- Não usar opacity:0 para esconder conteúdo ainda focável enquanto espera scroll; foco ou fallback deve revelar imediatamente. Cor nunca é o único sinal de seleção/erro.
- Preferir transform/opacity; Leaflet controla seu próprio transform de posicionamento. Não animar layout de página inteira, blur ou sombras pesadas por frame.
- Desempenho medido em export estático, mesmo aparelho/browser/dados do baseline: 5 execuções por cenário, após aquecimento, guardando mediana e p95. Meta 60 fps; gate: p95 de intervalo RAF durante motion ≤32 ms, nenhuma long task >100 ms atribuível ao motion e nenhuma regressão >10% no p95 de interação contra baseline no mesmo perfil. Perfil CPU 4× é diagnóstico adicional, relatado separadamente. Baseline já acima do limite exige finding; não declarar aprovação automática.
- Não aumentar requisições de domínio por animação; não rebaixar virtualização/densidade. Verificar 20 ciclos abre/fecha/troca sem crescimento acumulativo de listeners, RAFs ou overlays. Layout shift causado por imagens/motion deve ser zero nos componentes alterados; reservar dimensões.
- Sem nova dependência por padrão. Reusar Animated/CSS/API do mapa. Se incapaz de atender com recursos existentes, apresentar prova e opção compatível SDK 54 antes de alterar package/lockfile. Não introduzir biblioteca apenas para animações simples.

## ECO-2700 — Baseline, inventário e isolamento

**Objetivo:** criar uma base verificável para que nenhuma animação mascare regressão existente.

**Dependência:** nenhuma task de motion; revalidar origin/staging e estado real. Branch de task `codex/eco-2700-motion`, criada após integração conforme protocolo.

**Arquivos/escopo:** pacote docs/motion_design, docs/project_status.md, docs/project-dashboard.html; leitura dos componentes e edição somente dos testes/fixtures de regressão relacionados que estiverem ausentes. Não alterar implementação nem implementar motion.

**Execução:** importar este pacote para worktree isolado, registrar SHA base, mapear todas as superfícies de pins/card/posição/origem, polyline, galerias de rota/ator, carrosséis, modais e abas. Capturar baseline local fixture, estados e rede. Conferir se testes existentes já cobrem distinção corredor/serviços municipais e as quatro origens oficiais do Pedral; adicionar somente a cobertura ausente de regressão relacionada, sem inventar dados remotos. Registrar uma matriz cenário → componente → teste → evidência.

**Aceites:** (A1) baseline/SHA e arquivos do owner preservados; (A2) vídeo/capturas desktop e mobile de rota → mapa → seleção → categoria → galeria → histórico; (A3) lista explícita de falhas preexistentes; (A4) perfil de desempenho reproduzível de pins/zoom/galeria/modal; (A5) branch/worktrees e política de integração registrados; (A6) nenhuma alegação de staging validado sem acesso/evidência.

**Testes:** typecheck, openapi:check, Jest completo e export fixture + Playwright existente; fixtures sem rede externa. Entregar `evidence/ECO-2700.md`, matriz e baseline de desempenho com dispositivo/browser/contagem de pins/pontos/fotos.

**Subagentes:** auditor read-only de mapa e revisor do baseline. **Parada:** handoff, revisão e integração local; não publicar.

## ECO-2701 — Fundação e movimento reduzido

**Objetivo:** todos os efeitos futuros compartilham tokens, preferência e cancelamento, demonstrados em um botão e um bloco real.

**Dependência:** ECO-2700 revisada. **Branch:** `codex/eco-2701-motion`.

**Arquivos:** novos `src/theme/motion.ts`, hook de preferência em `src/hooks/` com adapters por plataforma se necessário, utilitários pequenos em `src/components/common/`; reusar equivalentes se descobertos. Testes adjacentes e e2e dedicado. Não importar DOM em módulo carregado no nativo.

**Aceites:** (A1) tabela de tokens aplicada; (A2) preferência Web `matchMedia` e nativa `AccessibilityInfo` com cleanup; (A3) mudança para reduce durante efeito cancela e termina no estado correto; (A4) unmount não deixa callback alterando estado; (A5) dois exemplos reais via caminho normal do app, sem tela debug pública; (A6) conteúdo interativo imediatamente e sem upgrade/dependência nova.

**Testes:** unitários de preferências/cleanup/interrupção e Playwright normal/reduce, incluindo alteração em runtime; typecheck/openapi. Evidência de vídeo curto dos dois exemplos, sem expandir para todas as telas nesta task.

**Subagentes:** planejador de API mínima; testador de preferência; revisor independente. **Parada:** revisão e integração local.

## ECO-2702 — Pins, seleção e card no mapa

**Objetivo:** entrada e seleção de pins perceptíveis e breves, mantendo o ponto geográfico e o fluxo atual de card selecionado.

**Dependência:** ECO-2701. **Branch:** `codex/eco-2702-motion`.

**Arquivos:** `src/components/map/MapAdapter.web.tsx`, `MapAdapter.native.tsx` se necessário para preferência/estado estático, helpers somente se necessário, `SelectedPinCard` e testes existentes; e2e de motion/mapa. Reservar estes arquivos à raiz.

**Requisitos:** animar filho visual do divIcon, nunca wrapper cujo transform é controlado pelo Leaflet. Manter âncora inferior do pin (baseline [19,46]), tamanho-alvo e coordenadas. Pin selecionado mantém card full/simple, z-order e ação atuais. Não abrir sheet automaticamente por nova decisão de motion. Entrada em lote simultânea, sem cascata de centenas de pins. Marcar IDs já vistos por sessão de mapa: zoom/pan/rerender não repetem entrada; nova rota reinicia contexto. Hover só em pointer fine. Remover pulso infinito declarado no marcador de origem, substituindo por realce estático. Posição do usuário não pulsa nem simula precisão.

**Aceites:** (A1) primeiro aparecimento 180 ms, selected card ≤200 ms; (A2) coordenada projetada/âncora não muda pelo efeito, tolerância de render 1 px; (A3) seleção Enter/Espaço/toque preservada e callback único; (A4) densidade sem clusters e selecionado sempre incluído; (A5) filtros rota/cidade e serviços/transporte preservam conjunto de IDs esperado; (A6) 20 seleções rápidas terminam no último ator sem cards/handlers duplicados; (A7) reduce mostra estado final sem pulso/escala.

**Testes:** `MapAdapter.helpers.test.ts`, `SelectedPinCard.test.tsx`, `mapScreenIntegration.test.tsx` e Playwright sobre DOM real Leaflet. Comparar coordenadas/conjuntos de pins antes/depois. Medir baseline e cenário de maior densidade fixture da ECO-2700, sem usar coordenadas pessoais.

**Subagentes:** planejador de invariantes cartográficas, testador de teclado/densidade, revisor do diff. **Parada:** revisão e integração local.

## ECO-2703 — Traçados e câmera

**Objetivo:** traçado ganha realce breve de apresentação sem esconder caminho nem alterar geometria; câmera respeita intenção e movimento reduzido.

**Dependência:** ECO-2702. **Branch:** `codex/eco-2703-motion`.

**Arquivos:** adapters mapa, helpers de geometria estritamente visuais, testes; `app/route/[routeId]/map.tsx` e preview de rota apenas para transmitir identidade semântica se necessária. Não editar backend, migrations, geometria persistida ou decodificador para mudar o caminho.

**Requisitos:** linha-base completa de 5 px/cor atual aparece imediatamente com geometria válida. Overlay não interativo de mesma geometria recebe realce linear de 650 ms, uma vez por rota/origem/revisão de geometria na sessão. Manter contraste da linha-base e remover overlay ao terminar. O efeito não representa localização/progresso. Nunca interpolar coordenadas entre trajetos nem desenhar reta entre pontos ausentes. Troca de origem mostra nova linha completa após resposta válida e descarta resposta antiga; loading/erro mantêm semântica existente de fallback, sem mostrar rota velha como nova. Rerender/pan/zoom não reiniciam desenho. Se renderer não suportar realce sem regressão, usar crossfade curto de linha completa e documentar fallback visual, preservando aceites de geometria.

Câmera: carga inicial fit estático; botões zoom/recentrar e troca explícita de contexto usam mecanismo existente, cerca de 300 ms se controlável. Não adicionar flyovers. Interação do usuário interrompe ajuste automático; GPS não recentraliza por conta própria. Origem dinâmica continua condicionada à flag existente e não é habilitada pela task.

**Aceites:** (A1) linha completa visível no primeiro frame útil; (A2) overlay ausente após 700 ms em execução não interrompida; (A3) arrays/encoded polyline, extremos e bounds idênticos aos dados de entrada; (A4) Pedral preserva quatro origens oficiais e destino, sem cortes ou retas inventadas; (A5) troca rápida A→B→C, resposta fora de ordem, erro/timeout resultam no contexto correto; (A6) reduce desliga overlay e animações de câmera/zoom; (A7) 20 trocas sem overlay/RAF residual; (A8) serviços municipais não ampliam bounds de rota inadvertidamente.

**Testes:** helpers/mapScreen/routeDetailIntegration + e2e de cada origem Pedral e rota Pindobal em fixtures, pan/zoom durante realce, flag dinâmica false/true simulada. Nenhuma chamada Google real. Nativo mantém linha completa estática se realce não suportado; não prometer equivalência visual sem device.

**Subagentes:** auditor de geometria read-only, testador de corrida/cleanup, revisor. **Parada:** revisão e integração local.

## ECO-2704 — Galerias e carrosséis

**Objetivo:** navegar por fotos e cards com continuidade, controle explícito e sem alteração de créditos/alt text.

**Dependência:** ECO-2703. **Branch:** `codex/eco-2704-motion`.

**Arquivos:** `src/components/routes/RouteGallery.tsx`, `app/actor/[actorId].tsx`, `src/components/catalog/CategoryCarouselSection.tsx`, `CategoryCarouselsCatalog.tsx` quando necessário, `GooglePlacePhoto.tsx` somente para entrada/falha visual preservando contrato e atribuição; testes de fotos/carrossel.

**Requisitos:** manter a tira horizontal e tamanhos atuais; adicionar controles anterior/próximo acessíveis à galeria de rota e ator, ativos somente quando há overflow. Reusar controles do catálogo. Deslocamento por viewport útil com clamp nos extremos; não mudar quantidade/dados/paginação. Swipe/trackpad nativos continuam livres, sem capturar scroll vertical nem criar loop infinito. Foto entra por opacidade após load, ocupa tamanho reservado desde o início, imagem em cache não pisca; falha mantém placeholder/alt/crédito. Sem autoplay, lightbox novo, zoom, download ou prefetch indiscriminado. Preservar posição após favoritar card ou carregar mais itens.

**Aceites:** (A1) galerias de rota e ator navegáveis por toque/teclado/botões e têm nomes distintos; (A2) controles corretos para 0, 1, muitas fotos, sem overflow, resize/orientação e extremos; (A3) anúncio discreto da faixa visível após navegação por controle, sem aria-live a cada frame; (A4) alt text, atribuição e links continuam íntegros; (A5) reduce usa scroll programático imediato, preservando scroll manual; (A6) imagens lentas/falhas/cache não geram salto de layout; (A7) sequência rápida de próximos/anteriores termina em posição válida, sem estado obsoleto.

**Testes:** routeCoverImage, CategoryCarouselSection/CategoryCarouselsCatalog, GooglePlacePhoto e `e2e/eco2613-photos.spec.ts`; novo e2e específico de galerias com imagem lenta/erro simulados. Comparar requisições e créditos; não transformar foto em botão sem ação.

**Subagentes:** planejador de acessibilidade do carrossel, testador touch/teclado, revisor. **Parada:** revisão e integração local.

## ECO-2705 — Entradas, filtros e navegação

**Objetivo:** conteúdo aparece com hierarquia leve, preservando prontidão, foco e contexto de leitura.

**Dependência:** ECO-2704. **Branch:** `codex/eco-2705-motion`.

**Arquivos:** telas canônicas em `app/(tabs)/(explore)/index.tsx`, `(routes)/index.tsx`, `(profile)/index.tsx`, `(profile)/trips.tsx`, `app/route/[routeId]/index.tsx`, `catalog.tsx`, `app/actor/[actorId].tsx`, navegação e componentes comuns mínimos. Wrappers de rotas duplicadas continuam delegando às telas canônicas, sem copiar efeitos em cada wrapper.

**Requisitos:** entrada inicial até 4 blocos do primeiro viewport com 35 ms de intervalo e 180 ms de efeito; total ≤300 ms. Não aplicar um observer por card para esconder todos os itens fora da tela; conteúdo posterior permanece disponível. Busca/filtro/paginação: apenas resultados novos entram por opacity, sem refazer hero/cabeçalho. Navegação Web pode usar fade de conteúdo de 160 ms quando não conflitar com router; não empilhar slide customizado com transição nativa existente. Não trocar keys da tela para forçar replay. Voltar restaura rolagem/contexto existente. Skeleton estático preserva dimensões; erro/vazio/retry são distinguíveis.

**Aceites:** (A1) toque/Tab durante os primeiros 300 ms funciona; (A2) rerender, favorito e back não repetem cascata; (A3) filtro e requisição fora de ordem não exibem resultado incorreto; (A4) deep links/URL actorId/originId/category/saved mantêm semântica; (A5) histórico Todas/Ativas/Concluídas continua funcional; (A6) reduce não desloca conteúdo nem oculta foco; (A7) sem regressão de LCP causada por manter hero invisível esperando animação.

**Testes:** jornadas de navegação, routeDetailIntegration/catalogContextIntegration, trips-history-redesign e e2e de entrada/reduce/voltar. Validar foco e scroll antes/depois no browser; snapshots de estilos não são evidência suficiente.

**Subagentes:** planejador de pontos de entrada, testador de navegação/foco, revisor React. **Parada:** revisão e integração local.

## ECO-2706 — Modais, painéis e microinterações

**Objetivo:** todos os overlays existentes abrem/fecham consistentemente e ações têm resposta visual sem mentir sobre estado remoto.

**Dependência:** ECO-2705. **Branch:** `codex/eco-2706-motion`.

**Arquivos:** AccessibleModal web/native, focusManager se estritamente necessário, OriginSelector, DynamicLocationConsentModal, modais de perfil/Auth e modal existente em map.tsx; botões/cards/favoritos/chips compartilhados. Não redesenhar auth/exclusão nem introduzir novas confirmações.

**Requisitos:** web deve passar a executar os padrões fade/slide explicitamente; preservar portal, inert, aria-modal, Escape e retorno de foco. Definir presença separada de estado lógico somente pelo tempo de saída: antes de desabilitar/ocultar os controles, mover foco para o contêiner neutro do diálogo com tabIndex=-1, ainda acessível e sem aria-hidden. Durante a saída, seus controles não são focáveis/clicáveis, Tab permanece nesse contêiner e o fundo continua inert. Ao terminar, desmontar, liberar inert/scroll lock e restaurar foco ao acionador ou fallback válido. Movimento reduzido executa essa conclusão imediatamente. Reabrir durante saída cancela fechamento pendente e mantém foco no modal correto. Não depender exclusivamente de transitionend: fallback seguro desmonta. Não adicionar gesto de arrastar novo ao sheet. Botões pressionam sem reduzir área de toque; favorito pula uma vez, rollback restaura ícone e anuncia falha; erro não sacode. Estados de viagem só celebram confirmação real. Avisos essenciais não somem automaticamente por animação.

**Aceites:** (A1) entrada/saída Web conforme tokens; nativo preserva duração do sistema e usa animationType="none" em reduce, sem alegar medição nativa ausente; (A2) Tab não escapa, inclusive durante saída, document.activeElement permanece no contêiner neutro até desmontagem, Escape/backdrop fecham uma vez e foco retorna ao acionador ou fallback válido; (A3) 20 abre/fecha/reabre não deixam inert, portal ou scroll lock preso; (A4) reduce em meio à saída finaliza corretamente; (A5) favoritos falhos restauram estado e anunciam erro sem repetir mutation; (A6) botão desabilitado não anima como ação aceita; (A7) fechar overlay não propaga toque ao mapa; (A8) navegação/unmount limpa todo recurso.

**Testes:** testes existentes focusManager/AccessibleModal, OriginSelector/Auth/AccountDeletion conforme afetados, hooks favoritos; Playwright de Escape/Tab/reabertura/erro otimista em fixture. Cobrir ausência de evento transitionend, alteração dinâmica da preferência e Tab/document.activeElement durante saída e após desmontagem.

**Subagentes:** planejador de ciclo presença/foco, testador a11y/corridas, revisor independente. **Parada:** revisão e integração local.

## ECO-2707 — Qualificação integrada

**Objetivo:** provar o conjunto completo antes de qualquer push para publicar.

**Dependência:** ECO-2706 e handoffs de todas anteriores revisados. **Branch:** `codex/eco-2707-motion`.

**Arquivos:** testes/evidências/docs; correções pequenas só de findings de motion. Finding que exige refactor/dados/arquitetura é bloqueio separado, não expansão da task.

**Matriz obrigatória:** Chromium desktop 1280×800 e mobile 400×832; normal/reduce (inclusive alternância em runtime); mouse/teclado/touch; cache quente/frio; sucesso/loading/vazio/erro/retry; 0/1/muitos itens; Pedral nas quatro origens + Pindobal; rota/cidade; pin simples/completo; zoom/pan/recentrar; favoritos rollback; galerias de rota/ator/categoria; modais; histórico; deep links/voltar. WebKit e Firefox devem ter smoke dos componentes alterados; usar runner temporário/config dedicada sem substituir os projetos existentes, registrar navegador indisponível como lacuna e não alegar compatibilidade verificada.

**Aceites:** (A1) suíte de comandos do protocolo passa sobre SHA final; (A2) todos os aceites das ECO-2701–2706 têm evidência; (A3) orçamento de desempenho comum atendido na máquina/perfil baseline; (A4) sem novas violações axe e sem falhas de teclado/foco/reduce; (A5) rede de domínio não aumenta devido a motion, nenhuma fixture incorporada ao caminho normal; (A6) testes de cleanup 20 ciclos passam; (A7) reviewer sem P0/P1/P2 aberto que afete critérios da iniciativa; (A8) limitações nativas explicitadas, sem alegar homologação por Jest.

**Entregável:** relatório com matriz PASS/FAIL, comparação de desempenho, vídeos antes/depois, traces, exit codes, inventário/aceites atualizados e recomendação GO/NO-GO local. Revisor independente reproduz pelo menos mapa, galeria, modal/reduce e regressão Pedral. Não usar screenshot para provar fps.

**Subagentes:** testador funcional, auditor a11y/performance e revisor; cada um read-only sobre commit final, sequencial quando disputarem browser/servidor. **Parada:** revisão e integração local, sem release ainda.

## ECO-2708 — Reconciliação e preparação de release

**Objetivo:** entregar um candidato publicável, revisado contra staging atual, com PR e rollback concretos.

**Dependência:** ECO-2707. **Branch:** `codex/eco-2708-motion`.

**Execução:** fetch, conferir avanço de staging, incorporar no candidato como protocolo; repetir checks após mudanças. Confirmar diff da iniciativa não inclui backend/migrations/landing/segredos/artefatos fixture. Inspecionar GitHub/Vercel via CLI/MCP read-only: proteções, checks exigidos, integração Git, projeto/equipe/alias, branch de deploy, root/build/output/env público. Não alterar configuração. A configuração local Vercel possui indícios históricos divergentes de root/output; evidência remota atual resolve, não suposição.

Preparar manifesto `evidence/release-candidate.md`: base inicial, staging head atual, HEAD candidato, árvore/conjunto de commits, tasks e evidências, PR, destino/IDs verificados, deployment anterior disponível, efeitos automáticos Render/Supabase, plano de smoke e rollback. Registrar valores descobertos reais, nunca placeholders como se verificados. SHA do próprio commit documental pode ficar no handoff para evitar referência circular.

Depois de revisar e integrar localmente a preparação, cumprir gate de push/PR; publicar somente branch de integração e abrir PR contra staging. PR descreve o produto final e testes, sem histórico de tentativas. Acompanhar checks/preview e revisar candidato final sem bypass. Não executar merge nesta task.

**Aceites:** (A1) staging head/candidato/PR exatos e comparação revisada; (A2) checks remotos obrigatórios aprovados e evidência local correspondente; (A3) identidade remota do staging e build normal sem fixture comprovados; (A4) rollback executável para app e implicações backend documentadas; (A5) merge bloqueia se head avançar ou pipeline exigir migration; (A6) plano de verificação de SHA frontend via metadados de deployment e alias definido, sem confundir header x-vercel-id com SHA; (A7) ação seguinte de merge/publicação apresentada com autorização aplicável.

**Subagentes:** auditor Git/deploy read-only e revisor do candidato; skill deployments-cicd. **Parada:** PR pronta, sem merge; se credencial ausente, BLOCKED com configuração necessária, sem pedir segredo no chat.

## ECO-2709 — Publicação e homologação em staging

**Objetivo:** disponibilizar e comprovar o motion no endereço canônico; não encerrar apenas no merge ou preview.

**Dependência:** ECO-2708, PR aprovada e autorização operacional aplicável ao artefato. Trabalhar no worktree de release/integração sem editar código; correção necessária vira commit revisado no mesmo escopo antes de retomar, nunca edição direta em staging.

**Execução:** reconfirmar HEAD PR, base staging, checks e identidade; cumprir gate de merge/publicação conforme protocolo. Squash merge permitido pela política. Registrar novo SHA de staging. Acompanhar pipeline existente e Vercel Git integration confirmada, sem duplicar deploy. Não aplicar migrations. Se pipeline/alias falhar, classificar e preparar correção/rollback; nunca declarar sucesso parcial como publicação completa.

**Smoke no endereço https://econexao-app-staging.vercel.app/:** iniciar depois de confirmar deployment READY e alias; comparar metadados do frontend ao SHA esperado. Validar carregamento, rotas, mapa, pins/categorias/rota-cidade, quatro origens Pedral, traçado, galeria rota/ator, carrossel, modal e reduce desktop/mobile. Confirmar geometrias e catálogo reais disponíveis sem usar fixture remota. Fazer leituras públicas e interações de UI que não criem mutations de domínio; favoritar, criar viagem, editar conta e sessão sintética exigem autorização de escrita de teste, com escopo e limpeza. Se o app exigir criação de guest para a jornada, identificar esse efeito no preflight e incluí-lo na autorização; não chamar isso read-only. Google Routes/origem dinâmica não deve ser acionada sem autorização específica; essa variante é comprovada localmente com fixtures, respeitando flag em staging.

**Aceites:** (A1) SHA staging esperado serve o alias canônico e deployment READY; (A2) pipeline do mesmo SHA aprovado, backend smoke registra SHA esperado quando redeploy ocorrer; (A3) todas as jornadas públicas acima passam em browser real normal/reduce, sem erro novo de console/rede/CORS; (A4) funcionalidades de domínio com escrita comprovadas localmente e somente remotamente se autorizadas; (A5) nenhuma alteração de produção/schema/dados fora do escopo; (A6) relatório final liga PR, squash SHA, deployments, checks, URLs, evidências e limitações; (A7) estado atualizado no cadastro local, distinção explícita do que foi publicado e do que permanece documental local.

**Entregável:** `evidence/ECO-2709.md` e handoff `PUBLICADO E HOMOLOGADO EM STAGING` somente se A1–A7 atendidos. Em falha: PARTIAL/BLOCKED/NOT_VERIFIABLE, incidente e próxima ação/rollback concreto. Não promover a main ou production.

**Subagentes:** observador CLI/MCP dos deployments/checks e verificador browser read-only após disponibilidade; raiz executa operações autorizadas e revisor independente confirma evidências. Sem duas sessões controlando o mesmo browser. **Parada final:** staging homologado e relatório entregue; nada de publicação adicional por iniciativa própria.

## Fontes técnicas consultadas

- [Expo SDK 54](https://docs.expo.dev/versions/v54.0.0/): manter a combinação compatível existente.
- [Leaflet 1.9.4](https://leafletjs.com/reference.html): posicionamento de markers, polylines e câmera devem continuar sob o adapter.
- [W3C C39](https://www.w3.org/WAI/WCAG22/Techniques/css/C39): preferência do usuário para reduzir animação de interação.
- [Vercel Git deployments](https://vercel.com/docs/git): pushes podem criar deployments; confirmar configuração do projeto antes da execução.

Consultar APIs oficiais da versão instalada ao implementar. As durações, budgets e sequência visual deste documento são decisões propostas para o ECOnexão, não requisitos impostos pelas fontes externas.
