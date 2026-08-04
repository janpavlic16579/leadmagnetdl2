import { PANTHEON_LOGOS } from '../../config/pantheonLogos';
import type { SegmentId } from '../../config/segmentTypes';
import type { Theme } from '../../lib/theme';
import { ThemeToggle } from './ThemeToggle';
import styles from './Header.module.css';

interface HeaderProps {
  activeSegmentId: SegmentId;
  theme: Theme;
  onToggleTheme: () => void;
}

export function Header({ activeSegmentId, theme, onToggleTheme }: HeaderProps) {
  const logo = PANTHEON_LOGOS[activeSegmentId];

  return (
    <header className={styles.bar}>
      {/* Temna tema uporabi različico s svetlim napisom; ikona je v obeh enaka. */}
      <img src={theme === 'dark' ? logo.srcDark : logo.src} alt={logo.alt} className={styles.logo} />
      <ThemeToggle theme={theme} onToggle={onToggleTheme} />
    </header>
  );
}
