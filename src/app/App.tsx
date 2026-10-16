import { HashRouter } from 'react-router';
import { DatabaseGate } from './DatabaseGate';
import { ErrorBoundary } from './ErrorBoundary';
import { AppRoutes } from './routes';
import { ThemeProvider } from './ThemeProvider';
import { UpdatePrompt } from './UpdatePrompt';

/**
 * HashRouter keeps routes after the "#" (e.g. /#/budget), so refreshing any
 * page on GitHub Pages works without server-side rewrites.
 * UpdatePrompt sits outside the database gate so offline support still installs
 * even when storage is blocked.
 */
export function App() {
  return (
    <ErrorBoundary>
      <DatabaseGate>
        <ThemeProvider>
          <HashRouter>
            <AppRoutes />
          </HashRouter>
        </ThemeProvider>
      </DatabaseGate>
      <UpdatePrompt />
    </ErrorBoundary>
  );
}
