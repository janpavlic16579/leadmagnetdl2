/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'


/**
 * Kanonični naslov in og:url vstavi šele, ko je naslov ZNAN — iz VITE_PUBLIC_URL.
 *
 * Trdo kodiran naslov bi bil ugibanje (objava teče prek GitHub Pages, pot v `base`
 * pa se ne ujema z imenom repozitorija, kar kaže na vmesni strežnik ali lastno
 * domeno). Napačen `canonical` je slabši od nobenega: iskalniku pove, naj indeksira
 * naslov, ki ne obstaja. Zato brez spremenljivke oznak preprosto ni.
 */
function canonicalUrl(): Plugin {
  return {
    name: 'lm10-canonical-url',
    transformIndexHtml(html, context) {
      const base = context.server?.config.env.VITE_PUBLIC_URL ?? process.env.VITE_PUBLIC_URL
      if (!base) {
        // Samo pri gradnji (v dev strežniku je odsotnost normalna): brez naslova
        // objava nima canonical, og:url in og:image — povezava se na LinkedInu
        // in v e-pošti deli kot golo besedilo brez predogledne kartice.
        if (!context.server) {
          console.warn(
            '\n[lm10] VITE_PUBLIC_URL ni nastavljen — zgrajena stran bo BREZ canonical, og:url in og:image.\n' +
              '[lm10] Deljenje povezave bo brez predogledne slike. Nastavite repozitorijsko spremenljivko VITE_PUBLIC_URL.\n',
          )
        }
        return html
      }
      const url = base.replace(/\/+$/, '') + '/'
      const tags = [
        `<link rel="canonical" href="${url}" />`,
        `<meta property="og:url" content="${url}" />`,
        // Namenska 1200×630 kartica (public/og-image.png), ne 512-px favicon:
        // LinkedIn in e-poštni odjemalci kvadratni logotip obrežejo ali spustijo.
        `<meta property="og:image" content="${url}og-image.png" />`,
        `<meta property="og:image:width" content="1200" />`,
        `<meta property="og:image:height" content="630" />`,
      ].join('\n    ')
      // Velika kartica ima smisel šele, ko og:image res obstaja — zato se
      // twitter:card nadgradi tu in ne statično v index.html.
      return html
        .replace('<meta name="twitter:card" content="summary" />', '<meta name="twitter:card" content="summary_large_image" />')
        .replace('</head>', `  ${tags}\n  </head>`)
    },
  }
}


/**
 * Prednalaganje pisav, ki jih potrebuje PRVI izris.
 *
 * Brez tega jih brskalnik odkrije šele, ko razčleni CSS — torej po verigi
 * HTML → CSS → woff2. Zaradi `font-display: swap` besedilo medtem ni nevidno,
 * je pa izrisano v nadomestni pisavi in ob prihodu prave poskoči.
 *
 * Prednaložita se samo debelini 400 (latin in latin-ext); 600 in 700 nosita
 * naslove, ki so kratki in jih poskok manj prizadene. Prednaložiti vseh šest bi
 * pomenilo 56 kB v kritični poti — za pridobljeno tekmuje z ostalim prenosom.
 * Imena datotek so zgoščena, zato se poberejo iz svežnja in ne prepišejo na roko.
 */
function preloadFonts(): Plugin {
  let base = '/'
  return {
    name: 'lm10-preload-fonts',
    configResolved(config) {
      base = config.base
    },
    transformIndexHtml(html, context) {
      if (!context.bundle) return html
      const fonts = Object.keys(context.bundle).filter((file) =>
        /titillium-web-400-latin(-ext)?-[^/]*\.woff2$/.test(file),
      )
      if (!fonts.length) return html
      const tags = fonts
        .map(
          (file) =>
            `<link rel="preload" href="${base}${file}" as="font" type="font/woff2" crossorigin />`,
        )
        .join('\n    ')
      return html.replace('</head>', `  ${tags}\n  </head>`)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: '/leadmagnetdl/',
  plugins: [react(), canonicalUrl(), preloadFonts()],
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
    // Brez tega Node ime "localhost" razreši samo v IPv6 (::1) in strežnik na
    // 127.0.0.1 sploh ne posluša. Brskalnik, ki poskusi IPv4, dobi zavrnjeno
    // povezavo in izpiše "This site can't be reached" — čeprav strežnik teče.
    // `true` veže vse vmesnike, torej oba loopbacka (in naslov v lokalnem omrežju,
    // ki ga Vite izpiše ob zagonu).
    host: true,
  },
  test: {
    environment: 'node',
    globals: true,
  },
})
