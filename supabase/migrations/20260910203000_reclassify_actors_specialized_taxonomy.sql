-- ECO-Expanded Taxonomy: Backfill actor type_id and reclassify actors to the 12 canonical categories
BEGIN;

-- 1. Backfill type_id and update category_id for actors using sub_category mapping and actor_types aliases
UPDATE app_private.actors a
SET type_id = at.id,
    category_id = at.category_id,
    updated_at = clock_timestamp()
FROM app_private.actor_types at
WHERE a.sub_category IS NOT NULL
  AND (
      lower(trim(a.sub_category)) = lower(at.slug)
      OR lower(trim(a.sub_category)) = lower(at.label)
      OR EXISTS (
          SELECT 1
          FROM unnest(at.aliases) alias
          WHERE lower(trim(a.sub_category)) = lower(trim(alias))
             OR lower(trim(a.sub_category)) ILIKE '%' || lower(trim(alias)) || '%'
      )
  )
  AND at.slug != 'nao_classificado'
  AND (a.type_id IS NULL OR a.type_id != at.id OR a.category_id != at.category_id);

-- 2. Backfill type_id and update category_id for actors without sub_category matching actor name against aliases
UPDATE app_private.actors a
SET type_id = at.id,
    category_id = at.category_id,
    updated_at = clock_timestamp()
FROM app_private.actor_types at
WHERE a.type_id IS NULL
  AND at.slug != 'nao_classificado'
  AND EXISTS (
      SELECT 1
      FROM unnest(at.aliases) alias
      WHERE length(trim(alias)) >= 4
        AND lower(a.name) ILIKE '%' || lower(trim(alias)) || '%'
  )
  AND (a.type_id IS NULL OR a.type_id != at.id OR a.category_id != at.category_id);

-- 3. Ensure any actors with type_id assigned are aligned with their type's category_id
UPDATE app_private.actors
SET category_id = app_private.actor_types.category_id,
    updated_at = clock_timestamp()
FROM app_private.actor_types
WHERE actors.type_id = actor_types.id
  AND actors.category_id != actor_types.category_id;

COMMIT;
