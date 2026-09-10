-- ECO-Expanded Taxonomy: Expand canonical categories and actor types hierarchy
BEGIN;

-- 1. Update check constraint to allow 12 canonical categories
ALTER TABLE app_private.actor_categories
    DROP CONSTRAINT IF EXISTS chk_actor_categories_canonical_metadata,
    ADD CONSTRAINT chk_actor_categories_canonical_metadata CHECK (
        (slug = 'alimentacao' AND label = 'Alimentação' AND color = '#D97706' AND icon = 'utensils' AND sort_order = 1 AND is_public AND spatial_scope = 'route_corridor') OR
        (slug = 'atrativos' AND label = 'Atrativos' AND color = '#059669' AND icon = 'compass' AND sort_order = 2 AND is_public AND spatial_scope = 'route_corridor') OR
        (slug = 'hospedagem' AND label = 'Hospedagem' AND color = '#2563EB' AND icon = 'bed' AND sort_order = 3 AND is_public AND spatial_scope = 'route_corridor') OR
        (slug = 'artesanato' AND label = 'Artesanato' AND color = '#7C3AED' AND icon = 'palette' AND sort_order = 4 AND is_public AND spatial_scope = 'route_corridor') OR
        (slug = 'comercio' AND label = 'Comércio Local & Lojas' AND color = '#EA580C' AND icon = 'store' AND sort_order = 5 AND is_public AND spatial_scope = 'both') OR
        (slug = 'experiencias' AND label = 'Experiências & Passeios' AND color = '#0D9488' AND icon = 'boat' AND sort_order = 6 AND is_public AND spatial_scope = 'route_corridor') OR
        (slug = 'vida_noturna' AND label = 'Vida Noturna & Eventos' AND color = '#9333EA' AND icon = 'beer' AND sort_order = 7 AND is_public AND spatial_scope = 'route_corridor') OR
        (slug = 'servicos_turisticos' AND label = 'Serviços Turísticos & Guias' AND color = '#4F46E5' AND icon = 'briefcase' AND sort_order = 8 AND is_public AND spatial_scope = 'both') OR
        (slug = 'transporte' AND label = 'Transporte' AND color = '#0891B2' AND icon = 'bus' AND sort_order = 9 AND is_public AND spatial_scope = 'both') OR
        (slug = 'saude' AND label = 'Saúde' AND color = '#DC2626' AND icon = 'heart-pulse' AND sort_order = 10 AND is_public AND spatial_scope = 'citywide_essential') OR
        (slug = 'seguranca' AND label = 'Segurança' AND color = '#1E3A8A' AND icon = 'shield' AND sort_order = 11 AND is_public AND spatial_scope = 'citywide_essential') OR
        (slug = 'outros' AND label = 'Outros' AND color = '#6B7280' AND icon = 'help-circle' AND sort_order = 99 AND is_public AND spatial_scope = 'route_corridor')
    );

-- 2. Insert or update all 12 categories
INSERT INTO app_private.actor_categories (
    id, slug, label, color, icon, sort_order, is_public, spatial_scope
)
VALUES
    (gen_random_uuid(), 'alimentacao', 'Alimentação', '#D97706', 'utensils', 1, true, 'route_corridor'),
    (gen_random_uuid(), 'atrativos', 'Atrativos', '#059669', 'compass', 2, true, 'route_corridor'),
    (gen_random_uuid(), 'hospedagem', 'Hospedagem', '#2563EB', 'bed', 3, true, 'route_corridor'),
    (gen_random_uuid(), 'artesanato', 'Artesanato', '#7C3AED', 'palette', 4, true, 'route_corridor'),
    (gen_random_uuid(), 'comercio', 'Comércio Local & Lojas', '#EA580C', 'store', 5, true, 'both'),
    (gen_random_uuid(), 'experiencias', 'Experiências & Passeios', '#0D9488', 'boat', 6, true, 'route_corridor'),
    (gen_random_uuid(), 'vida_noturna', 'Vida Noturna & Eventos', '#9333EA', 'beer', 7, true, 'route_corridor'),
    (gen_random_uuid(), 'servicos_turisticos', 'Serviços Turísticos & Guias', '#4F46E5', 'briefcase', 8, true, 'both'),
    (gen_random_uuid(), 'transporte', 'Transporte', '#0891B2', 'bus', 9, true, 'both'),
    (gen_random_uuid(), 'saude', 'Saúde', '#DC2626', 'heart-pulse', 10, true, 'citywide_essential'),
    (gen_random_uuid(), 'seguranca', 'Segurança', '#1E3A8A', 'shield', 11, true, 'citywide_essential'),
    (gen_random_uuid(), 'outros', 'Outros', '#6B7280', 'help-circle', 99, true, 'route_corridor')
ON CONFLICT (slug) DO UPDATE SET
    label = EXCLUDED.label,
    color = EXCLUDED.color,
    icon = EXCLUDED.icon,
    sort_order = EXCLUDED.sort_order,
    is_public = EXCLUDED.is_public,
    spatial_scope = EXCLUDED.spatial_scope,
    updated_at = clock_timestamp()
WHERE (
    actor_categories.label,
    actor_categories.color,
    actor_categories.icon,
    actor_categories.sort_order,
    actor_categories.is_public,
    actor_categories.spatial_scope
) IS DISTINCT FROM (
    EXCLUDED.label,
    EXCLUDED.color,
    EXCLUDED.icon,
    EXCLUDED.sort_order,
    EXCLUDED.is_public,
    EXCLUDED.spatial_scope
);

-- 3. Remap actor types and actors to the new specialized categories
DO $$
DECLARE
    v_alimentacao_id UUID;
    v_atrativos_id UUID;
    v_hospedagem_id UUID;
    v_artesanato_id UUID;
    v_comercio_id UUID;
    v_experiencias_id UUID;
    v_vida_noturna_id UUID;
    v_servicos_turisticos_id UUID;
    v_transporte_id UUID;
    v_saude_id UUID;
    v_seguranca_id UUID;
    v_outros_id UUID;
BEGIN
    SELECT id INTO v_alimentacao_id FROM app_private.actor_categories WHERE slug = 'alimentacao';
    SELECT id INTO v_atrativos_id FROM app_private.actor_categories WHERE slug = 'atrativos';
    SELECT id INTO v_hospedagem_id FROM app_private.actor_categories WHERE slug = 'hospedagem';
    SELECT id INTO v_artesanato_id FROM app_private.actor_categories WHERE slug = 'artesanato';
    SELECT id INTO v_comercio_id FROM app_private.actor_categories WHERE slug = 'comercio';
    SELECT id INTO v_experiencias_id FROM app_private.actor_categories WHERE slug = 'experiencias';
    SELECT id INTO v_vida_noturna_id FROM app_private.actor_categories WHERE slug = 'vida_noturna';
    SELECT id INTO v_servicos_turisticos_id FROM app_private.actor_categories WHERE slug = 'servicos_turisticos';
    SELECT id INTO v_transporte_id FROM app_private.actor_categories WHERE slug = 'transporte';
    SELECT id INTO v_saude_id FROM app_private.actor_categories WHERE slug = 'saude';
    SELECT id INTO v_seguranca_id FROM app_private.actor_categories WHERE slug = 'seguranca';
    SELECT id INTO v_outros_id FROM app_private.actor_categories WHERE slug = 'outros';

    -- Insert or update all specialized actor types
    INSERT INTO app_private.actor_types (category_id, slug, label, icon, sort_order, aliases, spatial_scope, publication_rule)
    VALUES
        (v_alimentacao_id, 'restaurante', 'Restaurante & Gastronomia', 'utensils', 10, ARRAY['restaurante', 'restaurantes e bares', 'alimentacao', 'culinaria', 'gastronomia', 'comida regional', 'peixaria', 'self-service', 'churrascaria', 'pizzaria', 'bistrô', 'buffet'], 'route_corridor', 'Público se published. Selo SEMTUR se originário do inventário oficial.'),
        (v_alimentacao_id, 'barraca_praia', 'Barraca de Praia & Quiosque', 'umbrella', 12, ARRAY['barraca de praia', 'quiosque', 'cabana de praia', 'restaurante de praia', 'apoio de praia', 'barraca'], 'route_corridor', 'Público se published. Relevância máxima no corredor de praias (Pindobal / Alter).'),
        (v_alimentacao_id, 'cafe_lanchonete', 'Café & Lanchonete', 'coffee', 13, ARRAY['lanchonete', 'café', 'cafeteria', 'padaria', 'lanches', 'salgaderia', 'doceria', 'sorveteria', 'sucos'], 'route_corridor', 'Público se published.'),
        (v_atrativos_id, 'atrativo_natural', 'Atrativo Natural & Trilha', 'trees', 20, ARRAY['atrativos naturais', 'atrativo natural', 'natureza', 'ponto turistico', 'trilha', 'floresta', 'igarapé', 'lago', 'encontro das águas'], 'route_corridor', 'Público institucional (published). Soberania SEMTUR para patrimônio natural.'),
        (v_atrativos_id, 'praia_fluvial', 'Praia Fluvial', 'sun', 21, ARRAY['praias fluviais', 'praia fluvial', 'praia', 'ponta de pedras', 'pindobal', 'maracanã', 'carapanari', 'ilha do amor', 'cururu'], 'route_corridor', 'Público institucional (published). Soberania SEMTUR. Selo SEMTUR.'),
        (v_atrativos_id, 'ilha', 'Ilha & Bancada de Areia', 'waves', 22, ARRAY['ilhas', 'ilha', 'arquipélago', 'bancada de areia', 'banco de areia'], 'route_corridor', 'Público institucional (published).'),
        (v_atrativos_id, 'serra_mirante', 'Serra & Mirante Panorâmico', 'mountain', 23, ARRAY['serras', 'serra', 'mirante', 'morro', 'vista panoramica', 'serra da piroca', 'serra do saubal'], 'route_corridor', 'Público institucional (published).'),
        (v_atrativos_id, 'unidade_conservacao', 'Unidade de Conservação & APA', 'shield-check', 24, ARRAY['unidade de conservação', 'área de proteção ambiental', 'apa', 'flona tapajós', 'parna', 'resex tapajós-arapiuns', 'parque ambiental', 'uc'], 'both', 'Público institucional (published). Máxima relevância socioambiental.'),
        (v_atrativos_id, 'patrimonio_cultural', 'Patrimônio Cultural & Histórico', 'landmark', 25, ARRAY['edificações e arquiteturas', 'obras de arte', 'instituições culturais', 'bibliotecas', 'patrimonio', 'centro cultural', 'museu', 'monumento', 'teatro'], 'both', 'Público institucional (published). Selo SEMTUR.'),
        (v_atrativos_id, 'templo_religioso', 'Igreja & Templo Histórico', 'church', 26, ARRAY['igrejas e templos', 'igreja', 'templo', 'religioso', 'catedral', 'capela', 'santuário', 'paróquia', 'matriz'], 'both', 'Público se published. Atração histórico-cultural e referência de comunidade.'),
        (v_atrativos_id, 'lazer_balneario', 'Balneário & Clube de Lazer', 'umbrella', 27, ARRAY['balneários/chácaras', 'balneário', 'chácara', 'clubes sociais, desportivos e de lazer', 'serviços/equipamentos de lazer', 'parque aquático', 'clube'], 'route_corridor', 'Público se published.'),
        (v_hospedagem_id, 'pousada_hotel', 'Hotel & Pousada', 'bed', 30, ARRAY['hospedagem', 'hotel', 'pousada', 'hostel', 'albergue', 'resort', 'dormitório', 'suítes', 'ecopousada'], 'route_corridor', 'Público se published. Selo SEMTUR se cadastrado na prefeitura.'),
        (v_hospedagem_id, 'casa_temporada', 'Casa de Temporada & Camping', 'home', 31, ARRAY['casas de temporada', 'casa de temporada', 'aluguel temporada', 'chalé', 'bangalô', 'flat', 'camping', 'area de camping', 'casa de praia'], 'route_corridor', 'Público se published. Modalidade essencial em Alter do Chão e Pindobal.'),
        (v_artesanato_id, 'artesanato_local', 'Artesanato & Produção Comunitária', 'palette', 40, ARRAY['artesanato', 'artesao', 'trançado', 'cerâmica tapajônica', 'cuia', 'souvenir', 'lembranças', 'associação de artesãos', 'arte indígena', 'biojoias'], 'route_corridor', 'Público se published. Foco em economia solidária e fomento comunitário; selo SEMTUR.'),
        (v_comercio_id, 'mercado_conveniencia', 'Mercado & Conveniência', 'shopping-cart', 50, ARRAY['mercado', 'mercadinho', 'conveniencia', 'mercearia', 'supermercado', 'empório', 'armazém', 'quitanda', 'minimercado'], 'both', 'Público se published. Apoio essencial ao turista no corredor e na cidade.'),
        (v_comercio_id, 'feira_livre', 'Feira & Mercado Produtor', 'store', 51, ARRAY['feira', 'feiras', 'feira livre', 'mercado municipal', 'feira do produtor', 'mercado de peixe', 'feira agroecológica'], 'both', 'Público se published. Patrimônio gastronômico e abastecimento.'),
        (v_comercio_id, 'comercio_local', 'Lojas & Comércio Local', 'store', 52, ARRAY['loja', 'lojas', 'shopping', 'comercio', 'vestuário', 'calçados', 'produtos regionais', 'decoração'], 'both', 'Público se published.'),
        (v_experiencias_id, 'passeio_experiencia', 'Passeio Náutico & Vivência', 'ship', 60, ARRAY['passeios de barco', 'passeio de barco', 'passeio nautico', 'passeios náuticos', 'vivência', 'vivencia comunitaria', 'turismo de base comunitaria', 'turismo comunitário', 'observação de botos', 'expedição', 'roteiro guiado', 'passeio', 'passeios'], 'route_corridor', 'Público se published. Vivências e passeios turísticos guiados no Tapajós e Arapiuns.'),
        (v_experiencias_id, 'trilha_ecoturismo', 'Trilhas & Ecoturismo', 'mountain', 61, ARRAY['trilha guiada', 'trilhas ecológicas', 'caminhada guiada', 'arvorismo', 'observação de aves', 'ecoturismo'], 'route_corridor', 'Público se published.'),
        (v_vida_noturna_id, 'bar_vida_noturna', 'Bar & Vida Noturna', 'beer', 70, ARRAY['bar', 'bares', 'botequim', 'pub', 'vida noturna', 'casa de shows', 'musica ao vivo', 'boate', 'cervejaria', 'lounge', 'carimbó', 'roda de carimbó'], 'route_corridor', 'Público se published. Selo SEMTUR se originário do inventário.'),
        (v_vida_noturna_id, 'evento_cultural', 'Espaço Cultural & Shows', 'music', 71, ARRAY['espaço cultural', 'shows', 'eventos culturais', 'arena cultural'], 'route_corridor', 'Público se published.'),
        (v_servicos_turisticos_id, 'agencia_turismo', 'Agência de Turismo & Receptivo', 'briefcase', 80, ARRAY['agências', 'agência turismo', 'agências de passagens aéreas', 'receptivo', 'operadora de turismo'], 'both', 'Público se published.'),
        (v_servicos_turisticos_id, 'guia_turismo', 'Guia de Turismo & Condutor', 'compass', 81, ARRAY['guia', 'guias', 'guia credenciado', 'condutor ambiental', 'condutor local', 'cadastur', 'guia de turismo'], 'both', 'Público se published. Guias credenciados e condutores locais.'),
        (v_servicos_turisticos_id, 'locacao_equipamentos', 'Locação de Caiaque & Lazer', 'umbrella', 82, ARRAY['locacao caiaque', 'aluguel de caiaque', 'aluguel bike', 'locacao de bicicletas', 'stand up paddle', 'sup', 'aluguel de prancha'], 'route_corridor', 'Público se published.'),
        (v_transporte_id, 'terminal_aeroporto', 'Aeroporto & Pistas de Pouso', 'plane', 90, ARRAY['aeroporto', 'aeroporto de santarem', 'maestro wilson fonseca', 'pista de pouso', 'taxi aereo', 'táxi aéreo em santarem e regioes', 'aerodromo'], 'both', 'Público institucional (published). Origem canônica do contrato de rota.'),
        (v_transporte_id, 'terminal_porto', 'Porto & Terminal Hidroviário', 'anchor', 91, ARRAY['porto', 'terminal hidroviario', 'hidroviaria', 'balsa', 'transporte fluvial em Santarém', 'transporte fluvial', 'cais', 'embarcadouro', 'porto de santarém'], 'both', 'Público institucional (published). Origem canônica do contrato de rota.'),
        (v_transporte_id, 'terminal_rodoviario', 'Rodoviária & Transporte Coletivo', 'bus', 92, ARRAY['rodoviaria', 'terminal rodoviario', 'ponto de onibus', 'vans', 'vans e micro-ônibus', 'transporte intermunicipal', 'transfer', 'coletivo'], 'both', 'Público institucional (published). Origem canônica do contrato de rota.'),
        (v_transporte_id, 'catraia_travessia', 'Catraia & Travessia Fluvial', 'ship', 93, ARRAY['catraias em alter do chão', 'catraias', 'catraia', 'catraieiro', 'travessia ilha do amor', 'canoa', 'voadeira', 'barqueiro'], 'route_corridor', 'Público se published. Patrimônio cultural imaterial e transporte local.'),
        (v_transporte_id, 'posto_combustivel', 'Posto de Combustível', 'fuel', 94, ARRAY['posto de gasolina', 'combustível', 'gasolina', 'etanol', 'diesel', 'posto', 'abastecimento', 'posto 24h'], 'both', 'Público se published. Infraestrutura viária vital no corredor da rodovia e na cidade.'),
        (v_transporte_id, 'locadora_mobilidade', 'Locadora de Veículos & Táxi', 'car', 95, ARRAY['locadoras de veículos', 'locadora veículos', 'aluguel de carro', 'rent a car', 'taxi', 'mototaxi', 'ponto de taxi'], 'both', 'Público se published.'),
        (v_saude_id, 'hospital_upa', 'Hospital & Pronto Socorro', 'heart-pulse', 100, ARRAY['hospital/UPA', 'hospital', 'upa', 'pronto socorro', 'unidade de pronto atendimento', 'emergencia medica', 'samu', 'hospital municipal', 'hospital regional'], 'citywide_essential', 'Serviço Essencial Vital: Visível na cidade e sob demanda na rota.'),
        (v_saude_id, 'posto_saude_ubs', 'UBS & Posto de Saúde', 'cross', 101, ARRAY['posto de saúde', 'posto de saude', 'ubs', 'unidade basica de saude', 'centro de saude', 'posto medico', 'saude da familia', 'ambulatorio'], 'citywide_essential', 'Serviço Essencial: Atenção primária municipal.'),
        (v_saude_id, 'farmacia', 'Farmácia & Drogaria', 'pill', 102, ARRAY['farmácia', 'farmacia', 'drogaria', 'medicamentos', 'remédios', 'plantão farmácia', 'drogaria 24h'], 'both', 'Serviço de Saúde & Apoio: Visível na cidade e no corredor em deslocamentos.'),
        (v_seguranca_id, 'seguranca_publica', 'Polícia, Delegacia & Bombeiros', 'shield', 110, ARRAY['delegacia', 'bombeiros', 'seguranca', 'segurança', 'polícia militar', 'polícia civil', 'corpo de bombeiros', 'guarda municipal', 'defesa civil', 'resgate', '4 gbm'], 'citywide_essential', 'Serviço Essencial de Proteção: Visível na cidade e sob demanda na rota. Selo SEMTUR se oficial.'),
        (v_seguranca_id, 'conselho_tutelar_protecao', 'Conselho Tutelar & Proteção Social', 'scale', 111, ARRAY['conselho tutelar', 'proteção social', 'cidadania', 'direitos humanos', 'vara da infância', 'assistência social', 'cras', 'creas'], 'citywide_essential', 'Proteção Social & Cidadania: Serviço público essencial.'),
        (v_outros_id, 'servicos_publicos_cartorios', 'Serviços Públicos & Cartórios', 'landmark', 120, ARRAY['cartórios', 'cartório', 'cartorios', 'serviço público', 'repartição pública', 'prefeitura', 'fórum', 'tabelionato', 'registro civil'], 'citywide_essential', 'Público institucional (published).'),
        (v_outros_id, 'comercio_eventos', 'Comércio & Serviços para Eventos', 'store', 121, ARRAY['para eventos', 'serviços para eventos', 'serviços/equipamentos para eventos', 'shopping/lojas de departamento', 'shopping/lojas', 'loja', 'decoração', 'som e iluminação'], 'both', 'Curadoria Editorial (review / published se auditado).'),
        (v_outros_id, 'nao_classificado', 'Não Classificado / Triagem', 'help-circle', 999, ARRAY['indefinido', 'desconhecido', 'outros', 'nao classificado', 'a classificar', 'sem categoria'], 'route_corridor', 'Retenção na Fila de Triagem Editorial (draft / review).')
    ON CONFLICT (slug) DO UPDATE SET
        category_id = EXCLUDED.category_id,
        label = EXCLUDED.label,
        icon = EXCLUDED.icon,
        sort_order = EXCLUDED.sort_order,
        aliases = EXCLUDED.aliases,
        spatial_scope = EXCLUDED.spatial_scope,
        publication_rule = EXCLUDED.publication_rule,
        updated_at = clock_timestamp();

    -- Reclassify existing actors based on their updated actor type's category_id
    UPDATE app_private.actors
    SET category_id = app_private.actor_types.category_id,
        updated_at = clock_timestamp()
    FROM app_private.actor_types
    WHERE actors.type_id = actor_types.id
      AND actors.category_id != actor_types.category_id;
END $$;

COMMIT;
