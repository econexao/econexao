-- Migration: 20260919143000_update_region_names_and_brasil_novo.sql
-- Description: Update region names to "Região do Xingu (Altamira)" and "Região do Tapajós (Santarém)", and set municipality of Sítio Raízes do Xingu to "Brasil Novo".

BEGIN;

-- 1. Update Region names
UPDATE app_private.regions
SET name = 'Região do Xingu (Altamira)',
    updated_at = clock_timestamp()
WHERE slug = 'altamira-xingu';

UPDATE app_private.regions
SET name = 'Região do Tapajós (Santarém)',
    updated_at = clock_timestamp()
WHERE slug = 'santarem-belterra';

-- 2. Update municipality and summary for Sítio Raízes do Xingu
UPDATE app_private.routes
SET city = 'Brasil Novo',
    summary = 'Refúgio ecológico e de ecoturismo no município de Brasil Novo, na Região do Xingu. Com destaque para a deslumbrante Cachoeira Planaltina, o local oferece banho de águas cristalinas, trilhas ecológicas e tranquilidade.',
    updated_at = clock_timestamp()
WHERE slug = 'rota-raizes-do-xingu';

COMMIT;
