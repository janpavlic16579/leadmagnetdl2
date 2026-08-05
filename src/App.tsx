import { useState } from 'react';
import { getSegmentFromUrlParam, type SegmentId } from './config/segments';
import { FALLBACK_SEGMENT, getIndustryForSegment, getSegmentForIndustry } from './config/industries';
import { CalculatorFlow } from './components/Calculator/CalculatorFlow';
import { Header } from './components/Layout/Header';
import { applyTheme, readStoredTheme, type Theme } from './lib/theme';

/**
 * Kampanjski ?s= ne določa segmenta mimo vprašalnika, ampak prednastavi dejavnost
 * v Koraku 1. Segment ima s tem en sam vir — izbrano dejavnost — in se ne more
 * razhajati z njo, kot se je, dokler je obstajal ročni override.
 */
function readInitialParams() {
  const params = new URLSearchParams(window.location.search);
  const segment = getSegmentFromUrlParam(params.get('s'));
  return {
    industry: segment ? getIndustryForSegment(segment.id) : '',
    utmSource: params.get('utm_source'),
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
      <CalculatorFlow
        initialIndustry={initial.industry}
        utmSource={initial.utmSource}
        onActiveSegmentChange={setActiveSegmentId}
      />
    </>
  );
}

export default App;
