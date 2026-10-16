import { useEffect, useState } from 'react';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import { Button, LinkButton } from '@/components/Button';
import { requestPersistentStorage } from '@/db/storage';
import styles from './SettingsPage.module.css';

interface StorageInfo {
  persisted: boolean | null;
  usedKb: number | null;
}

async function readStorageInfo(): Promise<StorageInfo> {
  try {
    const persisted = navigator.storage?.persisted ? await navigator.storage.persisted() : null;
    const estimate = navigator.storage?.estimate ? await navigator.storage.estimate() : null;
    return {
      persisted,
      usedKb: estimate?.usage !== undefined ? Math.round(estimate.usage / 1024) : null,
    };
  } catch {
    return { persisted: null, usedKb: null };
  }
}

/** Explains where data lives and whether the browser has promised to keep it. */
export function StorageStatus() {
  const [info, setInfo] = useState<StorageInfo>({ persisted: null, usedKb: null });
  const [asked, setAsked] = useState(false);

  useEffect(() => {
    let active = true;
    void readStorageInfo().then((result) => {
      if (active) setInfo(result);
    });
    return () => {
      active = false;
    };
  }, []);

  async function handleProtect() {
    await requestPersistentStorage();
    setAsked(true);
    setInfo(await readStorageInfo());
  }

  return (
    <div className={styles.storage}>
      <p className={styles.storageLine}>
        {info.persisted ? (
          <ShieldCheck aria-hidden size={18} className={styles.ok} />
        ) : (
          <ShieldAlert aria-hidden size={18} className={styles.warn} />
        )}
        <span>
          {info.persisted
            ? 'Your browser has agreed to keep your plans safe from automatic clean-up.'
            : 'Your browser may clear site data if your device runs low on space.'}
          {info.usedKb !== null && ` Using about ${Math.max(1, info.usedKb).toLocaleString()} KB.`}
        </span>
      </p>
      <div className={styles.buttons}>
        {!info.persisted && info.persisted !== null && (
          <Button variant="secondary" size="sm" onClick={() => void handleProtect()}>
            {asked ? 'Ask again' : 'Ask browser to keep my data'}
          </Button>
        )}
        <LinkButton to="/export" variant="secondary" size="sm">
          Back up or restore
        </LinkButton>
      </div>
      {asked && !info.persisted && (
        <p className={styles.small}>
          Your browser decided not to — that's common for sites you haven't used much yet. Regular
          backups keep you safe either way.
        </p>
      )}
    </div>
  );
}
