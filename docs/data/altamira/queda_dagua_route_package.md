# Pacote de Dados e Revisão de Rota — Balneário e Pousada Queda D'água

- **Versão:** 1.0
- **Data:** 19/09/2026
- **Task ECO:** ECO-2628
- **Status Editorial:** `draft` (pronto para carga/publicação após GO de staging)
- **Região:** Região de Altamira / Xingu (`altamira-xingu`)

---

## 1. Identificação e Ficha Geral da Rota

| Campo | Preenchimento |
|---|---|
| `route_id` | `a17a314a-0000-4000-8000-000000000005` |
| `route_slug` | `rota-queda-dagua` |
| `title` | `Balneário e Pousada Queda D'água` |
| `summary` | `Refúgio ecológico e de lazer em Altamira, o Balneário e Pousada Queda D'água oferece banho refrescante em águas naturais, estrutura de pousada, área de descanso e contato com a natureza exuberante da região amazônica.` |
| `region_slug` | `altamira-xingu` |
| `region_name` | `Região de Altamira / Xingu` |
| `city` | `Altamira` |
| `state_code` | `PA` |
| `status` | `active` |
| `is_verified` | `false` |
| `best_season` | `Aberto o ano todo para banho e hospedagem, com destaque para fins de semana e temporada de sol amazônica.` |
| `connectivity` | `Sinal de celular oscilante no trajeto pela Transamazônica; conectividade Wi-Fi disponível na sede da pousada.` |
| `road_access` | `Acesso a partir de Altamira pela Rodovia Transamazônica (BR-230) asfaltada sentido oeste, com trecho final em estrada vicinal de terra/piçarra com boa trafegabilidade.` |
| `payment_info` | `Pix e dinheiro em espécie são amplamente aceitos; cartões de débito e crédito sujeitos à estabilidade do sinal local.` |

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

| Código da Origem | Provedor | Ponto Inicial (Lat, Lng) | Ponto Final Comum (Lat, Lng) | Distância (m) | Duração (s) | Qtd. Pontos | Bounding Box (`[minLon, minLat, maxLon, maxLat]`) |
|---|---|---|---|---:|---:|---:|---|
| `rodoviaria` | `osrm` | `-3.205579, -52.219993` | `-3.280970, -52.385373` | 23.755 m | 1.267 s (~21 min) | 261 | `[-52.385373, -3.28097, -52.219597, -3.205579]` |
| `aeroporto` | `osrm` | `-3.253431, -52.248182` | `-3.280970, -52.385373` | 27.130 m | 1.634 s (~27 min) | 316 | `[-52.385373, -3.28097, -52.248182, -3.232306]` |
| `terminal_fluvial` | `osrm` | `-3.205628, -52.205678` | `-3.280970, -52.385373` | 26.077 m | 1.431 s (~24 min) | 366 | `[-52.385373, -3.28097, -52.205678, -3.204369]` |
| `centro` | `osrm` | `-3.205052, -52.206376` | `-3.280970, -52.385373` | 25.974 m | 1.405 s (~23 min) | 363 | `[-52.385373, -3.28097, -52.206008, -3.204369]` |

Destino solicitado: `[-52.39089850755947, -3.322080679135625]` (Balneário e Pousada Queda D'água). Ponto viário OSRM: `[-52.385373, -3.280970]` (entroncamento viário BR-230 Transamazônica com a vicinal de acesso).

---

## 4. Associação Espacial de Atores no Corredor (1.000 m)

- **Total de atores do catálogo de Altamira com coordenadas:** 571 (de 765 no total)
- **Total de atores únicos dentro do corredor de 1.000 m (todas as 4 origens):** 398
  - Corredor Rodoviária: 250 atores
  - Corredor Aeroporto: 74 atores
  - Corredor Terminal Fluvial: 357 atores
  - Corredor Centro: 356 atores
- **Segregação de camadas (ADR 0011):** Apenas os atores dentro de 1.000 m da geometria selecionada recebem flag ativa por origem (`origin_flags`). Serviços essenciais da cidade fora do corredor permanecem no modo cidade (`citywide_essential`).

---

## 5. Mídia Editorial e Hero da Rota

- **Arquivo no app:** `econexao-app/assets/images/queda_dagua_route_hero.png` (promovido a partir de `balneário-queda-d-agua-01.png`)
- **Alt text:** `Vista do Balneário e Pousada Queda D'água com área de banho natural, piscinas de igarapé e vegetação nativa preservada em Altamira, Pará.`
- **Crédito:** `Acervo Oficial ECOnexão / Altamira–PA`
- **Licença:** `PROPRIETARY` / `SEMTUR_INSTITUTIONAL`
