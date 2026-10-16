import { useEffect, useState } from 'react';
import { RefreshCw, WifiOff, X } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from '@/components/Button';
import styles from './UpdatePrompt.module.css';

/** Hide the "ready offline" note after a few seconds — it's good news, not an action. */
const OFFLINE_NOTE_MS = 6000;

/**
 * Registers the service worker (which makes the app work offline) and tells the
 * user when a new version has been deployed, so they can update when it suits them.
 */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(error: unknown) {
      console.warn('Offline support could not be enabled:', error);
    },
  });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!offlineReady) return;
    const timer = window.setTimeout(() => setOfflineReady(false), OFFLINE_NOTE_MS);
    return () => window.clearTimeout(timer);
  }, [offlineReady, setOfflineReady]);

  if (!needRefresh && !offlineReady) return null;

  return (
    <div className={styles.prompt} role="status">
      {needRefresh ? (
        <>
          <RefreshCw aria-hidden size={18} className={styles.icon} />
          <span className={styles.text}>A new version of the planner is ready.</span>
          <Button
            size="sm"
            disabled={updating}
            onClick={() => {
              setUpdating(true);
              void updateServiceWorker(true);
            }}
          >
            Update
          </Button>
          <button
            type="button"
            className={styles.close}
            onClick={() => setNeedRefresh(false)}
            aria-label="Update later"
          >
            <X aria-hidden size={16} />
          </button>
        </>
      ) : (
        <>
          <WifiOff aria-hidden size={18} className={styles.icon} />
          <span className={styles.text}>Ready to work offline — even without internet.</span>
          <button
            type="button"
            className={styles.close}
            onClick={() => setOfflineReady(false)}
            aria-label="Dismiss"
          >
            <X aria-hidden size={16} />
          </button>
        </>
      )}
    </div>
  );
}
