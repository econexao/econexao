# Relatório de Inserção da Rota Praia do Massanori

Branch `codex/eco-2626-rota-massanori`, baseada em `origin/staging` (`fcbd1c5`).
Task: `ECO-2626`.

Esta entrega formaliza e implementa a rota oficial **Praia do Massanori** em Altamira/PA no padrão de produto do Pedral:
1. Terminal Rodoviário de Altamira (`rodoviaria`)
2. Aeroporto de Altamira (`aeroporto`)
3. Terminal Fluvial / Cais da Orla (`terminal_fluvial`)
4. Centro / Praça da Matriz (`centro`)

## Geometrias e Métricas OSRM

Todas as quatro geometrias são `LineString` viárias contínuas baseadas no grafo OpenStreetMap (perfil OSRM driving) e chegam ao acesso viário da praia no bolsão de estacionamento (`[-52.140359, -3.209977]`), a ~130m do ponto de areia central (`[-52.140232, -3.208801]`):

- **Rodoviária (`rodoviaria`):** 13.150 m / 1.299 s (~21 min), 246 pontos
- **Aeroporto (`aeroporto`):** 21.280 m / 1.897 s (~31 min), 389 pontos
- **Terminal Fluvial (`terminal_fluvial`):** 10.517 m / 1.238 s (~20 min), 180 pontos
- **Centro (`centro`):** 10.414 m / 1.212 s (~20 min), 177 pontos

## Associação Espacial no Corredor (1.000 m)

- **Total de atores com coordenadas em Altamira:** 571 (de 765 registros)
- **Atores únicos no corredor de 1 km de Massanori:** 435 atores
  - Corredor Rodoviária: 280 atores
  - Corredor Aeroporto: 145 atores
  - Corredor Terminal Fluvial: 168 atores
  - Corredor Centro: 173 atores

## Artefatos Entregues

1. `supabase/migrations/20260918193000_massanori_four_origins_route.sql`: migration idempotente versionada contendo inserção da rota (`a17a314a-0000-4000-8000-000000000003`), 4 origens, 4 geometrias com bounds/hashes e cálculo de corredor PostGIS.
2. `docs/data/altamira/massanori_geometries.json`: geometrias GeoJSON, polylines codificadas, bounds e hashes SHA-256.
3. `docs/data/altamira/massanori_route_package.md`: ficha editorial, origens, taxonomia e proveniência.
4. `docs/data/altamira/massanori_ingestion_summary.json`: relatório do dry-run de ingestão.
5. `backend/scripts/apply_altamira_massanori.py`: script idempotente com `--dry-run` e suporte transacional.
6. `econexao-app/assets/images/massanori_route_hero.png`: imagem oficial de capa/hero empacotada no app.
7. `econexao-app/src/components/routes/routeCoverImage.ts`: suporte a `isMassanoriRoute`, capa, galeria, nome e descrição concisa.
