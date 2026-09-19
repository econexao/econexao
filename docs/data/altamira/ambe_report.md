# Relatório de Inserção da Rota Ambé Floresta Park

- **Data:** 18/09/2026
- **Branch:** `codex/eco-2627-rota-ambe`, baseada em `origin/staging` (`439e9af`).
- **Task ECO:** ECO-2627
- **Status:** `CONCLUÍDA LOCAL`

Esta entrega formaliza e implementa a rota oficial **Ambé Floresta Park** em Altamira/PA no padrão de produto do Pedral:

1. **Destino Único no Catálogo:** `Ambé Floresta Park` (slug `rota-ambe`, id `a17a314a-0000-4000-8000-000000000004`).
2. **Quatro Origens Oficiais:**
   - Terminal Rodoviário: 19,37 km, 1.660 s (~28 min), 288 pontos
   - Aeroporto de Altamira: 27,50 km, 2.258 s (~38 min), 431 pontos
   - Terminal Fluvial (Cais da Orla): 16,73 km, 1.599 s (~27 min), 222 pontos
   - Centro (Praça da Matriz): 16,63 km, 1.573 s (~26 min), 219 pontos
3. **Geometrias OSRM Viárias Salvas:** Sem interpolações em linha reta, com snapping no leito viário oficial em `[-52.220224, -3.125293]` (~67,8 m da entrada do parque).
4. **Corredor Espacial de 1.000 m (PostGIS):**
   - Rodoviária: 281 atores
   - Aeroporto: 146 atores
   - Terminal Fluvial: 169 atores
   - Centro: 174 atores
   - **Atores únicos no corredor de 1 km de Ambé:** 436 atores
5. **Assets e Frontend:**
   - Imagem de capa oficial: `econexao-app/assets/images/ambe_route_hero.png`
   - Suporte a `isAmbeRoute`, capa, galeria, nome canônico e descrição concisa em `routeCoverImage.ts`.

## Artefatos Entregues

1. `supabase/migrations/20260918203000_ambe_four_origins_route.sql`: migration idempotente versionada contendo inserção da rota (`a17a314a-0000-4000-8000-000000000004`), 4 origens, 4 geometrias com bounds/hashes e cálculo de corredor PostGIS.
2. `docs/data/altamira/ambe_geometries.json`: geometrias GeoJSON, polylines codificadas, bounds e hashes SHA-256.
3. `docs/data/altamira/ambe_route_package.md`: ficha editorial, origens, taxonomia e proveniência.
4. `docs/data/altamira/ambe_ingestion_summary.json`: relatório do dry-run de ingestão.
5. `backend/scripts/apply_altamira_ambe.py`: script idempotente com `--dry-run` e suporte transacional.
6. `econexao-app/assets/images/ambe_route_hero.png`: imagem oficial de capa/hero empacotada no app.
7. `econexao-app/src/components/routes/routeCoverImage.ts`: suporte a `isAmbeRoute`, capa, galeria, nome e descrição concisa.
8. `econexao-app/src/components/routes/routeCoverImage.test.ts`: suite de testes unitários para a rota do Ambé.
9. `backend/tests/test_altamira_ingestion.py`: teste automatizado de integridade de geometrias e bounds do Ambé.
