import { useCallback, useEffect, useRef, useState } from 'react';

const TOAST_DURATION_MS = 4000;

export type ToastTone = 'success' | 'error';

export interface ToastMessage {
  text: string;
  tone: ToastTone;
}

/** A short-lived message, e.g. "12 guests added" or "Table 3 is full". Pair with <Toast />. */
export function useToast() {
  const [message, setMessage] = useState<ToastMessage | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const show = useCallback((text: string, tone: ToastTone = 'success') => {
    window.clearTimeout(timer.current);
    setMessage({ text, tone });
    // Errors stay a little longer so there's time to read them.
    const duration = tone === 'error' ? TOAST_DURATION_MS * 1.5 : TOAST_DURATION_MS;
    timer.current = window.setTimeout(() => setMessage(null), duration);
  }, []);

  const dismiss = useCallback(() => {
    window.clearTimeout(timer.current);
    setMessage(null);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return { message, show, dismiss };
}
