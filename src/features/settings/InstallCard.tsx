import { CircleCheck, Download, Share, SquarePlus } from 'lucide-react';
import { Button } from '@/components/Button';
import { promptInstall, useInstallPrompt } from '@/hooks/useInstallPrompt';
import styles from './SettingsPage.module.css';

/** Explains how to put the planner on the home screen, so it opens like a real app. */
export function InstallCard() {
  const install = useInstallPrompt();

  if (install.kind === 'installed') {
    return (
      <p className={styles.storageLine}>
        <CircleCheck aria-hidden size={18} className={styles.ok} />
        The planner is installed on this device. It opens full-screen and works offline.
      </p>
    );
  }

  if (install.kind === 'available') {
    return (
      <div className={styles.storage}>
        <p className={styles.storageLine}>
          Install the planner to open it from your home screen, full-screen and offline — no app
          store needed.
        </p>
        <div className={styles.buttons}>
          <Button icon={<Download aria-hidden />} onClick={() => void promptInstall()}>
            Install app
          </Button>
        </div>
      </div>
    );
  }

  if (install.kind === 'ios') {
    return (
      <ol className={styles.steps}>
        <li>
          Tap <Share aria-hidden size={16} className={styles.inlineIcon} /> <strong>Share</strong>{' '}
          in Safari's toolbar.
        </li>
        <li>
          Choose <SquarePlus aria-hidden size={16} className={styles.inlineIcon} />{' '}
          <strong>Add to Home Screen</strong>.
        </li>
        <li>
          Tap <strong>Add</strong>. The planner now opens like an app and works offline.
        </li>
      </ol>
    );
  }

  return (
    <p className={styles.storageLine}>
      Open this site in Chrome or Edge on your phone, then use the browser menu →{' '}
      <strong>Install app</strong> or <strong>Add to Home screen</strong>.
    </p>
  );
}
