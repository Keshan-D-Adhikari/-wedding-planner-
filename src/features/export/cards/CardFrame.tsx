import type { ReactNode, Ref } from 'react';
import { APP_NAME } from '@/utils/constants';
import { getSiteUrl } from '@/utils/siteUrl';
import styles from './cards.module.css';

interface CardFrameProps {
  eyebrow: string;
  children: ReactNode;
  ref?: Ref<HTMLDivElement>;
}

/**
 * The shared 1000×1500 "invitation" frame for every Pinterest card:
 * soft theme gradient, a fine inset border, decorative rings and a quiet footer.
 */
export function CardFrame({ eyebrow, children, ref }: CardFrameProps) {
  return (
    <div ref={ref} className={styles.card}>
      <span className={styles.ringA} aria-hidden />
      <span className={styles.ringB} aria-hidden />
      <div className={styles.inner}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <div className={styles.content}>{children}</div>
        <footer className={styles.footer}>
          <span className={styles.footerLine} aria-hidden />
          <span>
            Planned with {APP_NAME} · {getSiteUrl()}
          </span>
          <span className={styles.footerLine} aria-hidden />
        </footer>
      </div>
    </div>
  );
}

/** "Amaya & Kavin" with the ampersand in the accent colour; shrinks for long names. */
export function CoupleNames({
  first,
  second,
  size = 96,
}: {
  first: string;
  second: string;
  size?: number;
}) {
  const length = first.length + second.length;
  const fontSize = length > 26 ? size * 0.7 : length > 18 ? size * 0.85 : size;
  return (
    <h2 className={styles.names} style={{ fontSize }}>
      {first} <span className={styles.amp}>&amp;</span> {second}
    </h2>
  );
}

export function Ornament() {
  return (
    <div className={styles.ornament} aria-hidden>
      <span />
      <svg viewBox="0 0 24 24" width="28" height="28">
        <path
          d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 5 6.4 5c2 0 3.6 1.1 4.6 2.6C12 6.1 13.6 5 15.6 5 19 5 21.1 8.4 19.6 11.8 17.5 16.4 12 21 12 21z"
          fill="currentColor"
        />
      </svg>
      <span />
    </div>
  );
}
