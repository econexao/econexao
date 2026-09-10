import { getPindobalCoverImage, getRouteCoverImage } from './routeCoverImage';

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

