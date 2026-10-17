import { useSyncExternalStore } from 'react';

/** Chrome/Edge/Android fire this when the app can be installed. Not in TypeScript's DOM types. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type InstallState =
  | { kind: 'installed' } // already running as an installed app
  | { kind: 'available' } // browser offers a one-tap install
  | { kind: 'ios' } // iPhone/iPad: only manual "Add to Home Screen"
  | { kind: 'unsupported' };

let deferred: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

/*
 * The event fires once, usually before the Settings page is opened, so we catch it
 * as soon as this module loads and keep it for later.
 */
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault(); // show our own button instead of the browser's mini-bar
    deferred = event as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    installed = true;
    notify();
  });
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari's own flag
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

let cached: InstallState = { kind: 'unsupported' };
function getSnapshot(): InstallState {
  const kind: InstallState['kind'] =
    installed || isStandalone()
      ? 'installed'
      : deferred
        ? 'available'
        : isIos()
          ? 'ios'
          : 'unsupported';
  // useSyncExternalStore needs a stable object while nothing has changed.
  if (cached.kind !== kind) cached = { kind };
  return cached;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Opens the browser's install dialog. Returns true if the user installed the app. */
export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  const event = deferred;
  await event.prompt();
  const { outcome } = await event.userChoice;
  deferred = null;
  notify();
  return outcome === 'accepted';
}

export function useInstallPrompt(): InstallState {
  return useSyncExternalStore(subscribe, getSnapshot);
}
