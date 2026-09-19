# Pacote de Dados e Revisão de Rota — Sítio Raízes do Xingu

- **Versão:** 1.0
- **Data:** 19/09/2026
- **Task ECO:** ECO-2629
- **Status Editorial:** `draft` (pronto para carga/publicação após GO de staging)
- **Região:** Região de Altamira / Xingu (`altamira-xingu`)

---

## 1. Identificação e Ficha Geral da Rota

| Campo | Preenchimento |
|---|---|
| `route_id` | `a17a314a-0000-4000-8000-000000000006` |
| `route_slug` | `rota-raizes-do-xingu` |
| `title` | `Sítio Raízes do Xingu` |
| `summary` | `Localizado em meio à natureza exuberante de Altamira, o Sítio Raízes do Xingu proporciona uma experiência autêntica de ecoturismo e lazer amazônico. Com destaque para a deslumbrante Cachoeira Planaltina, o local oferece banho de águas cristalinas, trilhas ecológicas e tranquilidade às margens da região do Xingu.` |
| `region_slug` | `altamira-xingu` |
| `region_name` | `Região de Altamira / Xingu` |
| `city` | `Altamira` |
| `state_code` | `PA` |
| `status` | `active` |
| `is_verified` | `false` |
| `best_season` | `Aberto o ano todo para visitação e banho de cachoeira, com volume d'água ideal e trilhas bem delineadas, destacando-se na temporada de estiagem amazônica.` |
| `connectivity` | `Sinal de celular instável/ausente no trecho final da estrada vicinal; recomenda-se planejar trajetos e contatos com antecedência.` |
| `road_access` | `Acesso a partir de Altamira pela Rodovia Transamazônica (BR-230) asfaltada sentido oeste/Medicilândia, seguindo por ramal vicinal de terra/piçarra até a entrada do sítio e da Cachoeira Planaltina.` |
| `payment_info` | `Dinheiro em espécie e Pix são as formas mais recomendadas; transações eletrônicas sujeitas à disponibilidade do sinal no local.` |

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
| `rodoviaria` | `osrm` | `-3.205579, -52.219993` | `-3.353302, -52.561737` | 48.006 m | 2.818 s (~47 min) | 599 | `[-52.561737, -3.353302, -52.219597, -3.205579]` |
| `aeroporto` | `osrm` | `-3.253431, -52.248182` | `-3.353302, -52.561737` | 51.381 m | 3.185 s (~53 min) | 654 | `[-52.561737, -3.353302, -52.248182, -3.232306]` |
| `terminal_fluvial` | `osrm` | `-3.205628, -52.205678` | `-3.353302, -52.561737` | 50.328 m | 2.982 s (~50 min) | 704 | `[-52.561737, -3.353302, -52.205678, -3.204369]` |
| `centro` | `osrm` | `-3.205052, -52.206376` | `-3.353302, -52.561737` | 50.224 m | 2.956 s (~49 min) | 701 | `[-52.561737, -3.353302, -52.206008, -3.204369]` |

Destino solicitado: `[-52.578634, -3.377206]` (Sítio Raízes do Xingu / Cachoeira Planaltina). Ponto viário OSRM: `[-52.561737, -3.353302]` (entroncamento viário BR-230 Transamazônica com ramal de acesso à Planaltina).

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

## 5. Mídia Editorial e Galeria da Rota

- **Capa no app:** `econexao-app/assets/images/raizes_xingu_route_hero.png` (a partir de `raizes-xingu-01.png`)
- **Galeria (4 imagens):**
  1. `raizes_xingu_route_hero.png` — `Foto 1 do Sítio Raízes do Xingu e Cachoeira Planaltina`
  2. `raizes_xingu_02.png` — `Foto 2 do Sítio Raízes do Xingu e Cachoeira Planaltina`
  3. `raizes_xingu_03.png` — `Foto 3 do Sítio Raízes do Xingu e Cachoeira Planaltina`
  4. `raizes_xingu_04.png` — `Foto 4 do Sítio Raízes do Xingu e Cachoeira Planaltina`
- **Crédito:** `Acervo Oficial ECOnexão / Altamira–PA`
- **Licença:** `PROPRIETARY` / `SEMTUR_INSTITUTIONAL`
