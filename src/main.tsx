import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import { installPreloadRecovery } from './lib/preloadRecovery.ts'

// Pred prvim izrisom: kos, ki pade med nalaganjem, mora osvežitev ujeti, še
// preden React sploh dobi napako.
installPreloadRecovery()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
