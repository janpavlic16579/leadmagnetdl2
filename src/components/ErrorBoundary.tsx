import { Component, type ErrorInfo, type ReactNode } from 'react';
import { SALES_CONTACT } from '../config/salesContact';
import buttonStyles from '../styles/buttons.module.css';
import styles from './ErrorBoundary.module.css';

interface Props {
  children: ReactNode;
}

interface State {
  failed: boolean;
}

/**
 * Meja napak okoli cele aplikacije.
 *
 * Brez nje React ob nezajeti napaki pri izrisu odklopi celotno drevo in
 * obiskovalec vidi prazno stran — brez besedila in brez poti naprej. Najbolj
 * verjetno se to zgodi pozno: kos za graf ali PDF, ki ga po objavi ni več
 * (lib/preloadRecovery.ts to praviloma prestreže z osvežitvijo; ta zaslon je
 * zadnja vrsta), ali obnovljena seja, ki ji nova različica orodja ne ustreza.
 *
 * Osvežitev je pravi napotek: napredek je v sessionStorage
 * (lib/progressStorage.ts) in se vrne, oddaja tudi. Razredna komponenta, ker
 * React mejo napak pozna samo prek getDerivedStateFromError.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Samo v konzolo: zunanjega beleženja aplikacija nima, dogodek lijaka pa bi
    // šel skozi kodo, ki je morda prav tista, ki je padla.
    console.warn('Aplikacija je padla pri izrisu:', error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className={styles.wrap} role="alert">
        <h1 className={styles.title}>Nekaj je šlo narobe.</h1>
        <p className={styles.note}>
          Osvežite stran — vaši dosedanji vnosi so v tem zavihku shranjeni in se vrnejo. Če se ponovi, nas
          pokličite na <a href={SALES_CONTACT.phoneHref}>{SALES_CONTACT.phone}</a>.
        </p>
        <button type="button" className={buttonStyles.primaryButton} onClick={() => window.location.reload()}>
          Osveži stran
        </button>
      </main>
    );
  }
}
