import { getPindobalCoverImage, getRouteCoverImage, getRouteGalleryImages } from './routeCoverImage';

describe('getRouteCoverImage', () => {
  it('uses the bundled pindobal1 image for the Pindobal route', () => {
    expect(getRouteCoverImage({ slug: 'rota-pindobal', cover_image_url: 'https://example.test/old.jpg' })).toBeDefined();
    expect(getRouteCoverImage({ id: 'route-pindobal' })).toBeDefined();
  });

  it('provides the bundled image only for Pindobal detail heroes', () => {
    expect(getPindobalCoverImage({ slug: 'rota-pindobal' })).toBeDefined();
    expect(getPindobalCoverImage({ slug: 'outra-rota', cover_image_url: 'https://example.test/route.jpg' })).toBeUndefined();
  });

  it('preserves the API image source for every other route', () => {
    expect(getRouteCoverImage({ slug: 'outra-rota', cover_image_url: 'https://example.test/route.jpg' }))
      .toEqual({ uri: 'https://example.test/route.jpg' });
  });

  it('uses bundled images for Alter do Chao, Ponta de Pedras, and Aramanai', () => {
    expect(getRouteCoverImage({ slug: 'rota-alter-do-chao' })).toBeDefined();
    expect(getRouteCoverImage({ slug: 'rota-ponta-de-pedras' })).toBeDefined();
    expect(getRouteCoverImage({ slug: 'rota-aramanai' })).toBeDefined();
  });

  it('returns undefined (placeholder) for Vila Socorro without cover_image_url', () => {
    expect(getRouteCoverImage({ slug: 'rota-vila-socorro' })).toBeUndefined();
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
});
