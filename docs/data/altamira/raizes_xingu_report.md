# Relatório de Inserção da Rota Sítio Raízes do Xingu

- **Data:** 19/09/2026
- **Branch:** `codex/eco-2629-rota-raizes-do-xingu`, baseada em `origin/staging` (`66b3498`).
- **Task ECO:** ECO-2629
- **Status:** `CONCLUÍDA LOCAL`

Esta entrega formaliza e implementa a rota oficial **Sítio Raízes do Xingu** (com a **Cachoeira Planaltina** como atrativo em destaque) em Altamira/PA no padrão de produto do Pedral:

1. **Destino Único no Catálogo:** `Sítio Raízes do Xingu` (slug `rota-raizes-do-xingu`, id `a17a314a-0000-4000-8000-000000000006`).
2. **Quatro Origens Oficiais:**
   - Terminal Rodoviário: 48,01 km, 2.818 s (~47 min), 599 pontos
   - Aeroporto de Altamira: 51,38 km, 3.185 s (~53 min), 654 pontos
   - Terminal Fluvial (Cais da Orla): 50,33 km, 2.982 s (~50 min), 704 pontos
   - Centro (Praça da Matriz): 50,22 km, 2.956 s (~49 min), 701 pontos
3. **Geometrias OSRM Viárias Salvas:** Sem interpolações em linha reta, com trajeto conectado a partir de Altamira via BR-230 (Transamazônica) sentido oeste/Medicilândia até o entroncamento do ramal da Planaltina (`[-52.561737, -3.353302]`).
4. **Corredor Espacial de 1.000 m (PostGIS):**
   - Rodoviária: 250 atores
   - Aeroporto: 74 atores
   - Terminal Fluvial: 357 atores
   - Centro: 356 atores
   - **Atores únicos no corredor de 1 km de Raízes do Xingu:** 398 atores
5. **Assets e Frontend:**
   - Imagem de capa oficial: `econexao-app/assets/images/raizes_xingu_route_hero.png` (a partir de `raizes-xingu-01.png`).
   - Galeria completa de 4 imagens: `raizes_xingu_route_hero.png`, `raizes_xingu_02.png`, `raizes_xingu_03.png`, `raizes_xingu_04.png`.
   - Suporte a `isRaizesXinguRoute`, capa, galeria com alt texts acessíveis, nome canônico e descrição concisa destacando a Cachoeira Planaltina em `routeCoverImage.ts`.

## Artefatos Entregues

1. `supabase/migrations/20260919120000_raizes_xingu_four_origins_route.sql`: migration idempotente versionada contendo inserção da rota (`a17a314a-0000-4000-8000-000000000006`), 4 origens, 4 geometrias com bounds/hashes e cálculo de corredor PostGIS.
2. `docs/data/altamira/raizes_xingu_geometries.json`: geometrias GeoJSON, polylines codificadas, bounds e hashes SHA-256.
3. `docs/data/altamira/raizes_xingu_route_package.md`: ficha editorial, origens, taxonomia e proveniência.
4. `docs/data/altamira/raizes_xingu_ingestion_summary.json`: relatório do dry-run de ingestão.
5. `backend/scripts/apply_altamira_raizes_xingu.py`: script idempotente com `--dry-run` e suporte transacional.
6. `backend/scripts/build_raizes_xingu_migration.py`: script determinístico de geração da migration SQL.
7. `backend/scripts/generate_raizes_xingu_geometries.py`: script de geração e captura das geometrias OSRM.
8. `econexao-app/assets/images/raizes_xingu_route_hero.png`: imagem oficial de capa/hero empacotada no app.
9. `econexao-app/assets/images/raizes_xingu_02.png`, `03.png`, `04.png`: imagens oficiais da galeria de fotos.
10. `econexao-app/src/components/routes/routeCoverImage.ts`: suporte a `isRaizesXinguRoute`, capa, galeria de 4 fotos, nome e descrição concisa com Cachoeira Planaltina.
11. `econexao-app/src/components/routes/routeCoverImage.test.ts`: suite de testes unitários para a rota Sítio Raízes do Xingu.
12. `backend/tests/test_altamira_ingestion.py`: testes automatizados de integridade de geometrias e contagens de corredor de Raízes do Xingu.
