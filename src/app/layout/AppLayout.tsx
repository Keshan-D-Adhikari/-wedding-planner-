import { useEffect, useRef, type MouseEvent } from 'react';
import { Outlet, useLocation } from 'react-router';
import { APP_NAME } from '@/utils/constants';
import { NAV_ITEMS } from '../navigation';
import styles from './AppLayout.module.css';
import { BottomNav } from './BottomNav';
import { MobileHeader } from './MobileHeader';
import { Sidebar } from './Sidebar';

/**
 * Desktop (≥ 900px): fixed sidebar on the left.
 * Mobile: slim top header + bottom tab bar.
 * Which one shows is decided purely in CSS — no JS media queries, no layout flash.
 */
export function AppLayout() {
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const isFirstPage = useRef(true);

  useEffect(() => {
    // A clear tab title per page (also what screen readers announce first).
    const page = NAV_ITEMS.find((item) => item.to === pathname);
    document.title = page ? `${page.label} · ${APP_NAME}` : APP_NAME;

    // Start each page at the top, and move keyboard/screen-reader focus to the new
    // content — otherwise focus stays on the nav link that was just pressed.
    window.scrollTo({ top: 0 });
    if (isFirstPage.current) {
      isFirstPage.current = false;
      return;
    }
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  // HashRouter uses the "#" for routes, so a normal href="#main" would navigate
  // to a "main" page. Move focus with JavaScript instead.
  function skipToContent(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    mainRef.current?.focus();
  }

  return (
    <div className={styles.shell}>
      <a href="#main" className={styles.skipLink} onClick={skipToContent}>
        Skip to content
      </a>

      <Sidebar />
      <MobileHeader />

      <main id="main" ref={mainRef} tabIndex={-1} className={styles.main}>
        <div className={styles.content}>
          <Outlet />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
