# Guia de Operação Assistida, SLOs e Handoff Operacional (ECO-2205)

Este documento é o modelo de operação assistida da primeira versão Web. Revisado em
06/09/2026; não atesta homologação nem operação já executada. Estado e aceites das
tasks pertencem a [project_status.md](../project_status.md). ECO-2201 deve preencher
e aprovar os parâmetros abaixo antes do lançamento; ECO-2205 registra o observado.

---

## 1. Janela de operação assistida a aprovar

24h a 72h é uma proposta histórica, não duração confirmada. Registrar início/fim
absolutos e fuso, versão servida, ambiente, operador, revisor, contato de suporte,
canais de alerta e gatilhos de contenção/rollback. Campo não preenchido permanece
pendente; preparação documental não inicia a janela. Ação remota exige GO específico.

Durante a primeira janela de operação pública:
- **Monitoramento Contínuo:** Observabilidade ativa dos logs estruturados do Render e métricas de conexão do Supabase.
- **Canal de Comunicação Direta:** Plantão técnico para triagem imediata de qualquer anomalia reportada por usuários piloto ou de campo.
- **Reunião de Alinhamento Diária:** Revisão de métricas de tráfego, cadastros e acessibilidade.

---

## 2. Indicadores e Objetivos de Nível de Serviço (SLIs / SLOs)

| Métrica / Serviço | SLI (Indicador) | SLO (Objetivo Mínimo) | Ação em caso de violação |
|---|---|---|---|
| **Disponibilidade Web/API** | Probes/jornadas válidas bem-sucedidas sobre total; registrar timeout e indisponibilidade | Limiar e frequência a aprovar na janela observada | Triagem e contenção/rollback conforme gate aprovado |
| **Latência** | P95 e amostra por jornada, aparelho/rede; separar API fria e cache | Valores a aprovar em ECO-2615 e congelar em ECO-2201 | Diagnóstico do gargalo e correção verificada |
| **Falhas** | 5xx, timeout e falhas de jornada com denominadores separados | Limiares a aprovar; nenhum P0/P1 aberto | Triagem/incident runbook e decisão do operador |
| **Mídia/integrações** | Sucessos, falhas, latência e fallback por operação | Limiares a aprovar; ficha principal continua utilizável | Contenção de integração e investigação |

Registrar amostra e fonte dos indicadores. Sem tráfego/amostra suficiente, resultado
é não verificável, não 100% de sucesso. 4xx esperados em testes negativos não são
falha da API, mas um 4xx inesperado que impede a jornada não conta como sucesso.
Uma janela de 24–72h não comprova SLO de 30 dias. Objetivos mensais, se aprovados,
são acompanhados depois, com sua janela própria. Apps nativos não são gate da Web.

---

## 3. Monitoramento e Guarda de Custos (Cost Guards)

Usar [cost_guards.md](cost_guards.md) como referência e conferir a configuração real
autorizada. Inventariar custos fixos, consumo por serviço/SKU, câmbio/impostos e
reserva dentro do teto total de R$ 500/mês; registrar amostra e projeção separadas.
Alertas não substituem limites de consumo. Verificar o guard mensal persistente de
Google Routes e a contenção dos demais serviços. Não presumir plano contratado,
franquia disponível ou cache permitido a partir deste documento. Fotos em cards
dependem de ECO-2616; fallback deve preservar ficha e mapa quando mídia falha.

---

## 4. Matriz de Escalonamento e Handoff

| Papel | Responsabilidade | Contato / Canal |
|---|---|---|
| **Owner** | Decisões de negócio, aceite e autorização de produção | Nome/canal a confirmar em ECO-1306 |
| **Operador técnico** | Infraestrutura, triagem e execução autorizada | Nome, canal e cobertura a confirmar |
| **Responsável por privacidade** | Receber e encaminhar solicitações de dados | Responsável/canal válido a confirmar |
| **Suporte** | Receber feedback e comunicar incidentes | Responsável/canal testado a confirmar |

---

## 5. Registro de aceite final a preencher em ECO-2205

- Revisão/artefato servido, configuração pública e manifesto de migrations/dados.
- Início/fim e fuso da janela efetivamente observada; executor e revisor.
- Indicadores, denominadores, amostras, limites aprovados e resultados medidos.
- Incidentes, integridade das dez rotas, favoritos/viagens e custos observados.
- Evidências de smoke/recuperação, suporte disponível e pendências residuais com dono.
- Decisão do owner: aceite, correções ou NO-GO, com data e justificativa.

Encerrar somente com evidência observada e sem P0/P1 aberto. Documento pronto,
deploy solicitado ou testes locais não equivalem a aceite operacional. A versão
Web termina em ECO-2205; o backlog posterior permanece separado de seu encerramento.
