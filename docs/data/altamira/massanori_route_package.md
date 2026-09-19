# Pacote de Dados e Revisão de Rota — Praia do Massanori

- **Versão:** 1.0
- **Data:** 18/09/2026
- **Task ECO:** ECO-2626
- **Status Editorial:** `draft` (pronto para carga/publicação após GO de staging)
- **Região:** Região de Altamira / Xingu (`altamira-xingu`)

---

## 1. Identificação e Ficha Geral da Rota

| Campo | Preenchimento |
|---|---|
| `route_id` | `a17a314a-0000-4000-8000-000000000003` |
| `route_slug` | `rota-massanori` |
| `title` | `Praia do Massanori` |
| `summary` | `Famosa praia de água doce às margens do Rio Xingu em Altamira, a Praia do Massanori se destaca pela extensa faixa de areia dourada durante o período de vazante, quiosques com gastronomia regional e infraestrutura de lazer.` |
| `region_slug` | `altamira-xingu` |
| `region_name` | `Região de Altamira / Xingu` |
| `city` | `Altamira` |
| `state_code` | `PA` |
| `status` | `active` |
| `is_verified` | `false` |
| `best_season` | `Período de seca e estiagem do Rio Xingu (julho a janeiro), quando surgem as praias fluviais de areia clara e águas calmas.` |
| `connectivity` | `Cobertura 4G/3G no trajeto urbano e oscilação no trecho final de acesso à praia.` |
| `road_access` | `Acesso viário pavimentado no perímetro urbano de Altamira e estrada vicinal/piçarra até o bolsão de estacionamento e orla da praia.` |
| `payment_info` | `Pix e dinheiro em espécie são amplamente aceitos; cartões de débito/crédito funcionam na maioria dos quiosques conforme sinal.` |

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
| `rodoviaria` | `osrm` | `-3.205579, -52.219993` | `-3.209977, -52.140359` | 13.150 m | 1.299 s (~21 min) | 246 | `[-52.219993, -3.238695, -52.140359, -3.205203]` | `3e36dedffdaff05b...` |
| `aeroporto` | `osrm` | `-3.253431, -52.248182` | `-3.209977, -52.140359` | 21.280 m | 1.897 s (~31 min) | 389 | `[-52.248182, -3.258951, -52.140359, -3.205203]` | `b33be24e80943da5...` |
| `terminal_fluvial` | `osrm` | `-3.205628, -52.205678` | `-3.209977, -52.140359` | 10.517 m | 1.238 s (~20 min) | 180 | `[-52.209293, -3.238695, -52.140359, -3.205052]` | `039cf318abd194a3...` |
| `centro` | `osrm` | `-3.205052, -52.206376` | `-3.209977, -52.140359` | 10.414 m | 1.212 s (~20 min) | 177 | `[-52.209293, -3.238695, -52.140359, -3.205052]` | `3d4c1208ff70d959...` |

Destino canônico OSRM viário: `[-52.140359, -3.209977]` (estacionamento e acesso da praia, ~130m do ponto de areia `-3.208801, -52.140232`).

---

## 4. Associação Espacial de Atores no Corredor (1.000 m)

- **Total de atores do catálogo de Altamira com coordenadas:** 571 (de 765 no total)
- **Total de atores únicos dentro do corredor de 1.000 m (todas as 4 origens):** 435
  - Corredor Rodoviária: 280 atores
  - Corredor Aeroporto: 145 atores
  - Corredor Terminal Fluvial: 168 atores
  - Corredor Centro: 173 atores
- **Segregação de camadas (ADR 0011):** Apenas os atores dentro de 1.000 m da geometria selecionada recebem flag ativa por origem (`origin_flags`). Serviços essenciais da cidade fora do corredor permanecem no modo cidade (`citywide_essential`).

---

## 5. Mídia Editorial e Hero da Rota

- **Arquivo no app:** `econexao-app/assets/images/massanori_route_hero.png` (promovido a partir de `massanori_01.png`)
- **Alt text:** `Vista aérea da Praia do Massanori com ampla faixa de areia dourada às margens do Rio Xingu, quiosques, área de banho e vegetação nativa amazônica ao fundo em Altamira, Pará.`
- **Crédito:** `Acervo Oficial ECOnexão / Altamira–PA`
- **Licença:** `PROPRIETARY` / `SEMTUR_INSTITUTIONAL`
