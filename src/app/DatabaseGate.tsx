import { useEffect, useState, type ReactNode } from 'react';
import { DatabaseZap } from 'lucide-react';
import { checkDatabaseAvailable } from '@/db/storage';
import { ErrorScreen } from '@/components/ErrorScreen';
import { PageLoader } from '@/components/PageLoader';

type Status = 'checking' | 'ready' | 'unavailable';

/** Blocks the app until we know IndexedDB works, and explains clearly if it doesn't. */
export function DatabaseGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('checking');

  useEffect(() => {
    let cancelled = false;
    void checkDatabaseAvailable().then((ok) => {
      if (!cancelled) setStatus(ok ? 'ready' : 'unavailable');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === 'checking') return <PageLoader fullScreen />;

  if (status === 'unavailable') {
    return (
      <ErrorScreen
        icon={<DatabaseZap aria-hidden size={40} />}
        title="We can't save your plans in this browser"
        message="Your wedding data is stored privately on your device, but this browser is blocking storage. This usually happens in private / incognito mode or when site data is disabled. Please open the site in a normal browser window to continue."
      />
    );
  }

  return children;
}
