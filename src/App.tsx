import { useState } from 'react';
import { getSegmentFromUrlParam, type SegmentId } from './config/segments';
import {
  FALLBACK_SEGMENT,
  getIndustryForPath,
  getIndustryForSegment,
  getSegmentForIndustry,
} from './config/industries';
import { CalculatorFlow } from './components/Calculator/CalculatorFlow';
import { Header } from './components/Layout/Header';
import { applyTheme, readStoredTheme, type Theme } from './lib/theme';

/**
 * Povezava dejavnost pove na dva načina. Kampanjski ?s= je ne določa mimo
 * vprašalnika, ampak jo prednastavi na uvodnem zaslonu — segment ima s tem en sam
 * vir, izbrano dejavnost, in se ne more razhajati z njo, kot se je, dokler je
 * obstajal ročni override. Pot `<objava>/proizvodnja/` gre korak dlje: dejavnost
 * izbere in uvodni zaslon preskoči (config/industries.ts, INDUSTRY_PATHS). Ob obeh
 * hkrati velja pot, ker je določnejša.
 */
function readInitialParams() {
  const params = new URLSearchParams(window.location.search);
  const pathIndustry = getIndustryForPath(window.location.pathname, import.meta.env.BASE_URL);
  const segment = getSegmentFromUrlParam(params.get('s'));
  return {
    industry: pathIndustry || (segment ? getIndustryForSegment(segment.id) : ''),
    skipIndustryStep: pathIndustry !== '',
    utmSource: params.get('utm_source'),
    // Interni način: prodajna priprava se prenese na napravo. Namenjen razvoju in
    // preverjanju vsebine; obiskovalec ga po nesreči ne vklopi.
    internalMode: params.get('debug') === '1',
  };
}

function App() {
  // Parametra se bereta samo ob prvem izrisu — po tem tok krmili stanje, ne URL.
  const [initial] = useState(readInitialParams);
  // Isti privzeti izračun kot v CalculatorFlow, da se ob prvem izrisu prikaže pravi
  // logotip brez bliskanja.
  const [activeSegmentId, setActiveSegmentId] = useState<SegmentId>(() =>
    initial.industry ? getSegmentForIndustry(initial.industry) : FALLBACK_SEGMENT,
  );
  const [theme, setTheme] = useState<Theme>(readStoredTheme);

  function handleToggleTheme() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
  }

  return (
    <>
      <Header activeSegmentId={activeSegmentId} theme={theme} onToggleTheme={handleToggleTheme} />
      {/* Orientir "glavna vsebina": bralnik zaslona lahko skoči nanj mimo glave. */}
      <main>
        <CalculatorFlow
          initialIndustry={initial.industry}
          skipIndustryStep={initial.skipIndustryStep}
          utmSource={initial.utmSource}
          internalMode={initial.internalMode}
          onActiveSegmentChange={setActiveSegmentId}
        />
      </main>
    </>
  );
}

export default App;
