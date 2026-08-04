import { useState } from 'react';
import { getSegmentFromUrlParam, type SegmentId } from './config/segments';
import { FALLBACK_SEGMENT } from './config/industries';
import { CalculatorFlow } from './components/Calculator/CalculatorFlow';
import { Header } from './components/Layout/Header';
import { applyTheme, readStoredTheme, type Theme } from './lib/theme';

function readInitialParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    segment: getSegmentFromUrlParam(params.get('s')),
    utmSource: params.get('utm_source'),
  };
}

function App() {
  // Parametra se bereta samo ob prvem izrisu — po tem tok krmili stanje, ne URL.
  const [initial] = useState(readInitialParams);
  const [segmentOverride] = useState<SegmentId | null>(initial.segment?.id ?? null);
  // Isti privzeti izračun kot v CalculatorFlow (segmentOverride ?? izpeljava iz dejavnosti),
  // da se ob prvem izrisu prikaže pravi logotip brez bliskanja.
  const [activeSegmentId, setActiveSegmentId] = useState<SegmentId>(segmentOverride ?? FALLBACK_SEGMENT);
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
        initialSegmentOverride={segmentOverride}
        utmSource={initial.utmSource}
        onActiveSegmentChange={setActiveSegmentId}
      />
    </>
  );
}

export default App;
