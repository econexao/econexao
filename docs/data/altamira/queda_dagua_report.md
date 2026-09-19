# Relatório de Inserção da Rota Balneário e Pousada Queda D'água

- **Data:** 19/09/2026
- **Branch:** `codex/eco-2628-rota-queda-dagua`, baseada em `origin/staging` (`b34c6ac`).
- **Task ECO:** ECO-2628
- **Status:** `CONCLUÍDA LOCAL`

Esta entrega formaliza e implementa a rota oficial **Balneário e Pousada Queda D'água** em Altamira/PA no padrão de produto do Pedral:

1. **Destino Único no Catálogo:** `Balneário e Pousada Queda D'água` (slug `rota-queda-dagua`, id `a17a314a-0000-4000-8000-000000000005`).
2. **Quatro Origens Oficiais:**
   - Terminal Rodoviário: 23,75 km, 1.267 s (~21 min), 261 pontos
   - Aeroporto de Altamira: 27,13 km, 1.634 s (~27 min), 316 pontos
   - Terminal Fluvial (Cais da Orla): 26,08 km, 1.431 s (~24 min), 366 pontos
   - Centro (Praça da Matriz): 25,97 km, 1.405 s (~23 min), 363 pontos
3. **Geometrias OSRM Viárias Salvas:** Sem interpolações em linha reta, com trajeto conectado a partir de Altamira via BR-230 (Transamazônica) sentido oeste.
4. **Corredor Espacial de 1.000 m (PostGIS):**
   - Rodoviária: 250 atores
   - Aeroporto: 74 atores
   - Terminal Fluvial: 357 atores
   - Centro: 356 atores
   - **Atores únicos no corredor de 1 km de Queda D'água:** 398 atores
5. **Assets e Frontend:**
   - Imagem de capa oficial: `econexao-app/assets/images/queda_dagua_route_hero.png` (promovida a partir de `balneário-queda-d-agua-01.png`).
   - Suporte a `isQuedaDaguaRoute`, capa, galeria, nome canônico e descrição concisa em `routeCoverImage.ts`.

## Artefatos Entregues

1. `supabase/migrations/20260919110000_queda_dagua_four_origins_route.sql`: migration idempotente versionada contendo inserção da rota (`a17a314a-0000-4000-8000-000000000005`), 4 origens, 4 geometrias com bounds/hashes e cálculo de corredor PostGIS.
2. `docs/data/altamira/queda_dagua_geometries.json`: geometrias GeoJSON, polylines codificadas, bounds e hashes SHA-256.
3. `docs/data/altamira/queda_dagua_route_package.md`: ficha editorial, origens, taxonomia e proveniência.
4. `docs/data/altamira/queda_dagua_ingestion_summary.json`: relatório do dry-run de ingestão.
5. `backend/scripts/apply_altamira_queda_dagua.py`: script idempotente com `--dry-run` e suporte transacional.
6. `backend/scripts/build_queda_dagua_migration.py`: script determinístico de geração da migration SQL.
7. `backend/scripts/generate_queda_dagua_geometries.py`: script de geração e captura das geometrias OSRM.
8. `econexao-app/assets/images/queda_dagua_route_hero.png`: imagem oficial de capa/hero empacotada no app.
9. `econexao-app/src/components/routes/routeCoverImage.ts`: suporte a `isQuedaDaguaRoute`, capa, galeria, nome e descrição concisa.
10. `econexao-app/src/components/routes/routeCoverImage.test.ts`: suite de testes unitários para a rota Queda D'água.
11. `backend/tests/test_altamira_ingestion.py`: teste automatizado de integridade de geometrias e bounds de Queda D'água.
