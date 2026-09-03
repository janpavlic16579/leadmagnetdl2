import { describe, it, expect } from 'vitest';
import { HEADER_LOGO_RASTER_WIDTH_PX, rasterizeSvg } from './svgRaster';

/**
 * Logotip je okras in ne sme podreti generacije dokumenta.
 *
 * Testi tečejo v `environment: 'node'` (vite.config.ts), kjer ni ne `Image` ne
 * canvasa — natanko tako kot v vsakem okolju brez brskalnika. Rasterizator mora
 * tam vrniti `null` in ne vreči: oba izrisovalca imata vejo "brez logotipa"
 * (naslov se premakne z y=24 na y=16) in prav ta veja se v testih vedno izvede.
 */
describe('rasterizeSvg', () => {
  it('brez brskalnika vrne null in ne vrže', async () => {
    await expect(
      rasterizeSvg('<svg xmlns="http://www.w3.org/2000/svg" width="230" height="63"></svg>', 124),
    ).resolves.toBeNull();
  });

  it('tudi ob praznem vhodu vrne null', async () => {
    await expect(rasterizeSvg('', HEADER_LOGO_RASTER_WIDTH_PX)).resolves.toBeNull();
  });
});
