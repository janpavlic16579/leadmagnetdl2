import { describe, it, expect } from 'vitest';
import { PANTHEON_BRAND, PANTHEON_LOGOS } from './pantheonLogos';
import { PANTHEON_LOGO_SVG, prefixSvgIds } from './pantheonLogoSources';
import { SEGMENT_ORDER } from './segments';

/**
 * Zaslon in poročila morata za isti segment vrniti isti logotip.
 *
 * Doslej je register bral en sam odjemalec (Header.tsx); odkar ga berejo še tri
 * poročila, je razhajanje med naslovom za <img> in vgrajenim izvornim besedilom
 * napaka, ki se pokaže šele stranki — na zaslonu Manufacture, v PDF-ju Enterprise.
 */
describe('PANTHEON_BRAND', () => {
  it('vsak segment ima znamko, naslov in izvorno besedilo', () => {
    for (const segmentId of SEGMENT_ORDER) {
      const brand = PANTHEON_BRAND[segmentId];
      expect(brand, segmentId).toBeTruthy();
      expect(PANTHEON_LOGO_SVG[brand].dark, segmentId).toContain('<svg');
      expect(PANTHEON_LOGO_SVG[brand].light, segmentId).toContain('<svg');
      expect(PANTHEON_LOGOS[segmentId].srcDark, segmentId).toBeTruthy();
    }
  });

  it('temna različica ima svetel napis, svetla temnega', () => {
    // Merilo je barva in ne ime datoteke: preimenovana ali napačno pregenerirana
    // izpeljanka bi se sicer skrila (glej pantheonLogos.ts — #231F20 -> #ECE8E5).
    for (const brand of Object.values(PANTHEON_BRAND)) {
      expect(PANTHEON_LOGO_SVG[brand].dark.toLowerCase(), brand).toContain('#ece8e5');
      expect(PANTHEON_LOGO_SVG[brand].dark.toLowerCase(), brand).not.toContain('#231f20');
      expect(PANTHEON_LOGO_SVG[brand].light.toLowerCase(), brand).toContain('#231f20');
    }
  });
});

describe('prefixSvgIds', () => {
  it('preimenuje definicijo in obe vrsti sklica nanjo', () => {
    const source = '<defs><path id="a"/></defs><mask id="b"><use xlink:href="#a"/></mask><g mask="url(#b)"/>';
    expect(prefixSvgIds(source, 'x')).toBe(
      '<defs><path id="x-a"/></defs><mask id="x-b"><use xlink:href="#x-a"/></mask><g mask="url(#x-b)"/>',
    );
  });
});
