import {
  getPedralCoverImage,
  getPindobalCoverImage,
  getRouteCoverImage,
  getRouteDisplayName,
  getRouteDescription,
  getRouteGalleryImages,
  isPedralRoute,
} from './routeCoverImage';

describe('getRouteDisplayName', () => {
  it('standardizes Rota do Pedral to Balneário Luiz do Pedral', () => {
    expect(getRouteDisplayName({ slug: 'rota-pedral', title: 'Rota do Pedral' })).toBe('Balneário Luiz do Pedral');
    expect(getRouteDisplayName({ id: 'a17a314a-0000-4000-8000-000000000002', title: 'Rota do Pedral (Altamira)' })).toBe('Balneário Luiz do Pedral');
    expect(getRouteDisplayName({ title: 'Rota do Pedral' })).toBe('Balneário Luiz do Pedral');
  });

  it('preserves other route titles as-is', () => {
    expect(getRouteDisplayName({ slug: 'rota-pindobal', title: 'Pindobal' })).toBe('Pindobal');
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
});

describe('getRouteDescription', () => {
  it('returns a brief description under 250 chars for Balneário Luiz do Pedral', () => {
    const desc = getRouteDescription({ slug: 'rota-pedral' });
    expect(desc).toContain('Pedral');
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

