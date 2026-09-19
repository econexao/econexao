import {
  getAmbeCoverImage,
  getMassanoriCoverImage,
  getPedralCoverImage,
  getPindobalCoverImage,
  getQuedaDaguaCoverImage,
  getRaizesXinguCoverImage,
  getRouteCoverImage,
  getRouteDisplayName,
  getRouteDescription,
  getRouteGalleryImages,
  isAmbeRoute,
  isPedralRoute,
  isQuedaDaguaRoute,
  isRaizesXinguRoute,
} from './routeCoverImage';

describe('getRouteDisplayName', () => {
  it('standardizes Rota do Pedral to Balneário Luiz do Pedral', () => {
    expect(getRouteDisplayName({ slug: 'rota-pedral', title: 'Rota do Pedral' })).toBe('Balneário Luiz do Pedral');
    expect(getRouteDisplayName({ id: 'a17a314a-0000-4000-8000-000000000002', title: 'Rota do Pedral (Altamira)' })).toBe('Balneário Luiz do Pedral');
    expect(getRouteDisplayName({ title: 'Rota do Pedral' })).toBe('Balneário Luiz do Pedral');
  });

  it('standardizes Ambé routes to Ambé Floresta Park', () => {
    expect(getRouteDisplayName({ slug: 'rota-ambe', title: 'Rota Ambé' })).toBe('Ambé Floresta Park');
    expect(getRouteDisplayName({ id: 'a17a314a-0000-4000-8000-000000000004', title: 'Ambé Floresta Park' })).toBe('Ambé Floresta Park');
  });

  it('standardizes Queda D\'água routes to Balneário e Pousada Queda D\'água', () => {
    expect(getRouteDisplayName({ slug: 'rota-queda-dagua', title: 'Rota Queda D\'água' })).toBe('Balneário e Pousada Queda D\'água');
    expect(getRouteDisplayName({ id: 'a17a314a-0000-4000-8000-000000000005', title: 'Balneário e Pousada Queda D\'água' })).toBe('Balneário e Pousada Queda D\'água');
  });

  it('standardizes Raízes do Xingu routes to Sítio Raízes do Xingu', () => {
    expect(getRouteDisplayName({ slug: 'rota-raizes-do-xingu', title: 'Rota Raízes do Xingu' })).toBe('Sítio Raízes do Xingu');
    expect(getRouteDisplayName({ id: 'a17a314a-0000-4000-8000-000000000006', title: 'Sítio Raízes do Xingu' })).toBe('Sítio Raízes do Xingu');
  });

  it('preserves other route titles as-is', () => {
    expect(getRouteDisplayName({ slug: 'rota-pindobal', title: 'Pindobal' })).toBe('Pindobal');
    expect(getRouteDisplayName({ slug: 'rota-massanori', title: 'Rota Praia do Massanori' })).toBe('Praia do Massanori');
    expect(getRouteDisplayName({ slug: 'rota-alter-do-chao', title: 'Praia do Amor (Alter do Chão)' })).toBe('Praia do Amor (Alter do Chão)');
    expect(getRouteDisplayName(null)).toBe('');
  });
});


describe('getRouteCoverImage', () => {
  it('uses the bundled pindobal1 image for the Pindobal route', () => {
    expect(getRouteCoverImage({ slug: 'rota-pindobal', cover_image_url: 'https://example.test/old.jpg' })).toBeDefined();
    expect(getRouteCoverImage({ id: 'route-pindobal' })).toBeDefined();
  });

  it('uses the bundled pedral hero image for Rota do Pedral', () => {
    expect(isPedralRoute({ slug: 'rota-pedral' })).toBe(true);
    expect(isPedralRoute({ id: 'a17a314a-0000-4000-8000-000000000002' })).toBe(true);
    expect(getRouteCoverImage({ slug: 'rota-pedral' })).toBeDefined();
    expect(getPedralCoverImage({ slug: 'rota-pedral' })).toBeDefined();
    expect(getPedralCoverImage({ slug: 'outra-rota' })).toBeUndefined();
  });

  it('uses the bundled massanori hero image for Praia do Massanori', () => {
    expect(getRouteCoverImage({ slug: 'rota-massanori' })).toBeDefined();
    expect(getRouteCoverImage({ id: 'a17a314a-0000-4000-8000-000000000003' })).toBeDefined();
    expect(getMassanoriCoverImage({ slug: 'rota-massanori' })).toBeDefined();
  });

  it('uses the bundled ambe hero image for Ambé Floresta Park', () => {
    expect(isAmbeRoute({ slug: 'rota-ambe' })).toBe(true);
    expect(isAmbeRoute({ id: 'a17a314a-0000-4000-8000-000000000004' })).toBe(true);
    expect(getRouteCoverImage({ slug: 'rota-ambe' })).toBeDefined();
    expect(getRouteCoverImage({ id: 'a17a314a-0000-4000-8000-000000000004' })).toBeDefined();
    expect(getAmbeCoverImage({ slug: 'rota-ambe' })).toBeDefined();
    expect(getAmbeCoverImage({ slug: 'outra-rota' })).toBeUndefined();
  });

  it('uses the bundled queda dagua hero image for Balneário e Pousada Queda D\'água', () => {
    expect(isQuedaDaguaRoute({ slug: 'rota-queda-dagua' })).toBe(true);
    expect(isQuedaDaguaRoute({ id: 'a17a314a-0000-4000-8000-000000000005' })).toBe(true);
    expect(getRouteCoverImage({ slug: 'rota-queda-dagua' })).toBeDefined();
    expect(getRouteCoverImage({ id: 'a17a314a-0000-4000-8000-000000000005' })).toBeDefined();
    expect(getQuedaDaguaCoverImage({ slug: 'rota-queda-dagua' })).toBeDefined();
    expect(getQuedaDaguaCoverImage({ slug: 'outra-rota' })).toBeUndefined();
  });

  it('uses the bundled raizes xingu hero image for Sítio Raízes do Xingu', () => {
    expect(isRaizesXinguRoute({ slug: 'rota-raizes-do-xingu' })).toBe(true);
    expect(isRaizesXinguRoute({ id: 'a17a314a-0000-4000-8000-000000000006' })).toBe(true);
    expect(getRouteCoverImage({ slug: 'rota-raizes-do-xingu' })).toBeDefined();
    expect(getRouteCoverImage({ id: 'a17a314a-0000-4000-8000-000000000006' })).toBeDefined();
    expect(getRaizesXinguCoverImage({ slug: 'rota-raizes-do-xingu' })).toBeDefined();
    expect(getRaizesXinguCoverImage({ slug: 'outra-rota' })).toBeUndefined();
  });

  it('provides the bundled image only for Pindobal detail heroes', () => {
    expect(getPindobalCoverImage({ slug: 'rota-pindobal' })).toBeDefined();
    expect(getPindobalCoverImage({ slug: 'outra-rota', cover_image_url: 'https://example.test/route.jpg' })).toBeUndefined();
  });

  it('preserves the API image source for every other route', () => {
    expect(getRouteCoverImage({ slug: 'outra-rota', cover_image_url: 'https://example.test/route.jpg' }))
      .toEqual({ uri: 'https://example.test/route.jpg' });
  });

  it('uses bundled images for Alter do Chao, Ponta de Pedras, Vila Socorro, and Aramanai', () => {
    expect(getRouteCoverImage({ slug: 'rota-alter-do-chao' })).toBeDefined();
    expect(getRouteCoverImage({ slug: 'rota-ponta-de-pedras' })).toBeDefined();
    expect(getRouteCoverImage({ slug: 'rota-vila-socorro' })).toBeDefined();
    expect(getRouteCoverImage({ slug: 'rota-aramanai' })).toBeDefined();
  });

  it('keeps the unavailable-image state for other routes without a cover', () => {
    expect(getRouteCoverImage({ slug: 'outra-rota' })).toBeUndefined();
  });
});

describe('getRouteGalleryImages', () => {
  it('uses every gallery item supplied by the API', () => {
    const gallery = getRouteGalleryImages({
      slug: 'outra-rota',
      gallery: [
        { url: 'https://example.test/original.jpg', derivatives: { card: 'https://example.test/card.jpg' }, alt_text: 'Praia' },
        { url: 'https://example.test/second.jpg', alt_text: null },
      ],
    });

    expect(gallery).toHaveLength(2);
    expect(gallery[0]).toEqual(expect.objectContaining({ source: { uri: 'https://example.test/card.jpg' }, alt: 'Praia' }));
  });

  it('provides the four bundled editorial photos only as Pindobal fallback', () => {
    expect(getRouteGalleryImages({ slug: 'rota-pindobal' })).toHaveLength(4);
    expect(getRouteGalleryImages({ slug: 'outra-rota' })).toHaveLength(0);
  });

  it('provides the bundled hero image for Rota do Pedral gallery', () => {
    expect(getRouteGalleryImages({ slug: 'rota-pedral' })).toHaveLength(1);
  });

  it('provides the bundled hero image for Praia do Massanori gallery', () => {
    expect(getRouteGalleryImages({ slug: 'rota-massanori' })).toHaveLength(1);
  });

  it('provides the bundled hero image for Ambé Floresta Park gallery', () => {
    expect(getRouteGalleryImages({ slug: 'rota-ambe' })).toHaveLength(1);
  });

  it('provides the bundled hero image for Balneário e Pousada Queda D\'água gallery', () => {
    expect(getRouteGalleryImages({ slug: 'rota-queda-dagua' })).toHaveLength(1);
  });

  it('provides the four bundled editorial photos for Sítio Raízes do Xingu gallery', () => {
    const gallery = getRouteGalleryImages({ slug: 'rota-raizes-do-xingu' });
    expect(gallery).toHaveLength(4);
    expect(gallery[0].alt).toContain('Cachoeira Planaltina');
  });
});

describe('getRouteDescription', () => {
  it('returns a brief description under 250 chars for Balneário Luiz do Pedral', () => {
    const desc = getRouteDescription({ slug: 'rota-pedral' });
    expect(desc).toContain('Pedral');
    expect(desc.length).toBeLessThanOrEqual(250);
    expect(desc.length).toBeGreaterThan(20);
  });

  it('returns a brief description under 250 chars for Praia do Massanori', () => {
    const desc = getRouteDescription({ slug: 'rota-massanori' });
    expect(desc).toContain('Massanori');
    expect(desc.length).toBeLessThanOrEqual(250);
    expect(desc.length).toBeGreaterThan(20);
  });

  it('returns a brief description under 250 chars for Ambé Floresta Park', () => {
    const desc = getRouteDescription({ slug: 'rota-ambe' });
    expect(desc).toContain('Ambé');
    expect(desc.length).toBeLessThanOrEqual(250);
    expect(desc.length).toBeGreaterThan(20);
  });

  it('returns a brief description under 250 chars for Balneário e Pousada Queda D\'água', () => {
    expect(isQuedaDaguaRoute({ slug: 'rota-queda-dagua' })).toBe(true);
    expect(isQuedaDaguaRoute({ id: 'a17a314a-0000-4000-8000-000000000005' })).toBe(true);
    const desc = getRouteDescription({ slug: 'rota-queda-dagua' });
    expect(desc).toContain('Queda D\'água');
    expect(desc.length).toBeLessThanOrEqual(250);
    expect(desc.length).toBeGreaterThan(20);
  });

  it('returns a brief description under 250 chars for Sítio Raízes do Xingu with Cachoeira Planaltina', () => {
    expect(isRaizesXinguRoute({ slug: 'rota-raizes-do-xingu' })).toBe(true);
    expect(isRaizesXinguRoute({ id: 'a17a314a-0000-4000-8000-000000000006' })).toBe(true);
    const desc = getRouteDescription({ slug: 'rota-raizes-do-xingu' });
    expect(desc).toContain('Raízes do Xingu');
    expect(desc).toContain('Cachoeira Planaltina');
    expect(desc.length).toBeLessThanOrEqual(250);
    expect(desc.length).toBeGreaterThan(20);
  });

  it('returns a brief description under 250 chars for Praia de Pindobal', () => {
    const desc = getRouteDescription({ slug: 'rota-pindobal' });
    expect(desc).toContain('Pindobal');
    expect(desc.length).toBeLessThanOrEqual(250);
    expect(desc.length).toBeGreaterThan(20);
  });

  it('returns custom description for preview routes', () => {
    const alterDesc = getRouteDescription({ slug: 'rota-alter-do-chao' });
    expect(alterDesc.length).toBeLessThanOrEqual(250);
    expect(alterDesc).toContain('Alter do Chão');
  });

  it('returns API description/summary if provided and not matched to known slugs', () => {
    expect(getRouteDescription({ slug: 'outra-rota', description: 'Descrição da API' })).toBe('Descrição da API');
    expect(getRouteDescription({ slug: 'outra-rota', summary: 'Resumo da API' })).toBe('Resumo da API');
    expect(getRouteDescription(null)).toBe('');
  });
});
