import accountingDark from '../assets/pantheon-logos/accounting-dark.svg?raw';
import accountingLight from '../assets/pantheon-logos/accounting.svg?raw';
import enterpriseDark from '../assets/pantheon-logos/enterprise-dark.svg?raw';
import enterpriseLight from '../assets/pantheon-logos/enterprise.svg?raw';
import manufactureDark from '../assets/pantheon-logos/manufacture-dark.svg?raw';
import manufactureLight from '../assets/pantheon-logos/manufacture.svg?raw';
import retailDark from '../assets/pantheon-logos/retail-dark.svg?raw';
import retailLight from '../assets/pantheon-logos/retail.svg?raw';
import type { PantheonBrand } from './pantheonLogos';

/**
 * Izvorna besedila logotipov PANTHEON.
 *
 * Zaslon logotip vključi kot <img src>, poročila pa ga ne morejo: strankin in
 * prodajni PDF ga morata rasterizirati (jsPDF SVG ne sprejme, glej lib/svgRaster.ts),
 * prodajna priprava v HTML pa ga vgradi v datoteko, ker se ta odpira prek file://
 * in potuje po e-pošti — zunanja slika bi bila tam tiho blokirana.
 *
 * Ločen modul in ne polje v PANTHEON_LOGOS: izvorna besedila so skupaj ~35 KB in
 * v glavnem svežnju, ki jih ne potrebuje, nimajo kaj iskati. Preslikava segment ->
 * znamka ostane ena sama (PANTHEON_BRAND), zato se zaslon in poročila ne moreta
 * razhajati.
 *
 * TEMNA različica je za poročila pravilo in ne izjema: glave vseh treh dokumentov
 * so v znamčni temni #231f20, kjer bi napis svetle različice izginil. Svetla gre
 * v uporabo samo pri tisku HTML priprave, kjer glava postane bela.
 */
export const PANTHEON_LOGO_SVG: Record<PantheonBrand, { light: string; dark: string }> = {
  enterprise: { light: enterpriseLight, dark: enterpriseDark },
  retail: { light: retailLight, dark: retailDark },
  manufacture: { light: manufactureLight, dark: manufactureDark },
  accounting: { light: accountingLight, dark: accountingDark },
};

/**
 * Prefiksira notranje id-je SVG-ja.
 *
 * Vsi logotipi uporabljajo iste kratke id-je (`a`–`d`) za `<defs>` in maske. Ko
 * sta v ISTEM dokumentu dva — v HTML pripravi sta, ker se svetla in temna
 * različica preklapljata s CSS — se referenci `url(#b)` in `xlink:href="#a"`
 * razrešita na prvi zadetek in drugi logotip se izriše z masko prvega. Napaka je
 * tiha: barvni krog ostane, znak v njem izgine.
 */
export function prefixSvgIds(source: string, prefix: string): string {
  return source
    .replace(/id="([^"]+)"/g, `id="${prefix}-$1"`)
    .replace(/url\(#([^)]+)\)/g, `url(#${prefix}-$1)`)
    .replace(/href="#([^"]+)"/g, `href="#${prefix}-$1"`);
}
