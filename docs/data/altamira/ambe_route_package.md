# Pacote de Dados e Revisão de Rota — Ambé Floresta Park

- **Versão:** 1.0
- **Data:** 18/09/2026
- **Task ECO:** ECO-2627
- **Status Editorial:** `draft` (pronto para carga/publicação após GO de staging)
- **Região:** Região de Altamira / Xingu (`altamira-xingu`)

---

## 1. Identificação e Ficha Geral da Rota

| Campo | Preenchimento |
|---|---|
| `route_id` | `a17a314a-0000-4000-8000-000000000004` |
| `route_slug` | `rota-ambe` |
| `title` | `Ambé Floresta Park` |
| `summary` | `Complexo de lazer e ecoturismo em Altamira, o Ambé Floresta Park integra piscinas naturais de igarapé, trilhas na mata nativa, áreas de descanso e gastronomia regional amazônica.` |
| `region_slug` | `altamira-xingu` |
| `region_name` | `Região de Altamira / Xingu` |
| `city` | `Altamira` |
| `state_code` | `PA` |
| `status` | `active` |
| `is_verified` | `false` |
| `best_season` | `Aberto o ano todo, com destaque para os meses ensolarados e finais de semana para banho de igarapé e lazer ecológico.` |
| `connectivity` | `Sinal de telefonia celular e internet móvel (4G/3G) no trajeto urbano e cobertura nas áreas centrais do parque.` |
| `road_access` | `Acesso viário a partir do centro de Altamira com trecho asfaltado e estrada vicinal de piçarra com boa trafegabilidade até a portaria e estacionamento.` |
| `payment_info` | `Pix e dinheiro em espécie são amplamente aceitos; cartões de débito e crédito funcionam nos quiosques e restaurante.` |

---

## 2. Origens Homologadas e Pontos de Saída

| Código (`origin_code`) | Nome da Origem (`origin_name`) | Latitude (WGS84) | Longitude (WGS84) | Ordem (`sort_order`) |
|---|---|:---:|:---:|:---:|
| `rodoviaria` | Terminal Rodoviário de Altamira | -3.2057320 | -52.2198928 | 1 |
| `aeroporto` | Aeroporto de Altamira | -3.2534371 | -52.2480994 | 2 |
| `terminal_fluvial` | Terminal Fluvial (Cais da Orla) | -3.2058603 | -52.2054132 | 3 |
| `centro` | Centro (Praça da Matriz) | -3.2052890 | -52.2060820 | 4 |

---

## 3. Geometrias por Origem, Bounds e Proveniência

| Código da Origem | Provedor | Ponto Inicial (Lat, Lng) | Ponto Final Comum (Lat, Lng) | Distância (m) | Duração (s) | Qtd. Pontos | Bounding Box (`[minLon, minLat, maxLon, maxLat]`) | Hash SHA-256 da Fonte |
|---|---|---|---|---:|---:|---:|---|---|
| `rodoviaria` | `osrm` | `-3.205579, -52.219993` | `-3.125293, -52.220224` | 19.367 m | 1.660 s (~28 min) | 288 | `[-52.223893, -3.205755, -52.175024, -3.116061]` | `4f31fe62b2e09e12...` |
| `aeroporto` | `osrm` | `-3.253431, -52.248182` | `-3.125293, -52.220224` | 27.498 m | 2.258 s (~38 min) | 431 | `[-52.248182, -3.253431, -52.175024, -3.116061]` | `4c43ef66efb3adc0...` |
| `terminal_fluvial` | `osrm` | `-3.205628, -52.205678` | `-3.125293, -52.220224` | 16.734 m | 1.599 s (~27 min) | 222 | `[-52.220238, -3.205628, -52.175024, -3.116061]` | `f9380f2e9b3d5af1...` |
| `centro` | `osrm` | `-3.205052, -52.206376` | `-3.125293, -52.220224` | 16.630 m | 1.573 s (~26 min) | 219 | `[-52.220238, -3.205052, -52.175024, -3.116061]` | `696b191655d1601d...` |

Destino canônico OSRM viário: `[-52.220224, -3.125293]` (acesso viário e estacionamento do parque, ~67,8 m do ponto solicitado `-3.125289, -52.220835`).

---

## 4. Associação Espacial de Atores no Corredor (1.000 m)

- **Total de atores do catálogo de Altamira com coordenadas:** 571 (de 765 no total)
- **Total de atores únicos dentro do corredor de 1.000 m (todas as 4 origens):** 436
  - Corredor Rodoviária: 281 atores
  - Corredor Aeroporto: 146 atores
  - Corredor Terminal Fluvial: 169 atores
  - Corredor Centro: 174 atores
- **Segregação de camadas (ADR 0011):** Apenas os atores dentro de 1.000 m da geometria selecionada recebem flag ativa por origem (`origin_flags`). Serviços essenciais da cidade fora do corredor permanecem no modo cidade (`citywide_essential`).

---

## 5. Mídia Editorial e Hero da Rota

- **Arquivo no app:** `econexao-app/assets/images/ambe_route_hero.png` (promovido a partir de `ambe-01.png`)
- **Alt text:** `Vista do Ambé Floresta Park com piscinas naturais de água corrente de igarapé, pontes rústicas de madeira e vegetação nativa preservada em Altamira, Pará.`
- **Crédito:** `Acervo Oficial ECOnexão / Altamira–PA`
- **Licença:** `PROPRIETARY` / `SEMTUR_INSTITUTIONAL`
