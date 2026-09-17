-- Rota do Pedral: canonical destination and exactly three official origins.
-- This migration is corrective; it does not rewrite the historical base migration.

UPDATE app_private.route_origins
SET location = extensions.ST_SetSRID(
        extensions.ST_MakePoint(
            CASE code
                WHEN 'rodoviaria' THEN -52.219892819930664
                WHEN 'aeroporto' THEN -52.2480993506169
                WHEN 'terminal_fluvial' THEN -52.21341376454149
            END,
            CASE code
                WHEN 'rodoviaria' THEN -3.2057320040227766
                WHEN 'aeroporto' THEN -3.2534370581962415
                WHEN 'terminal_fluvial' THEN -3.2167521750482746
            END
        ),
        4326
    )::extensions.geography,
    updated_at = clock_timestamp()
WHERE route_id = 'a17a314a-0000-4000-8000-000000000002'
  AND code IN ('rodoviaria', 'aeroporto', 'terminal_fluvial');

DELETE FROM app_private.route_origins
WHERE route_id = 'a17a314a-0000-4000-8000-000000000002'
  AND code = 'centro';

UPDATE app_private.route_actors
SET origin_flags = origin_flags - 'centro',
    updated_at = clock_timestamp()
WHERE route_id = 'a17a314a-0000-4000-8000-000000000002';
