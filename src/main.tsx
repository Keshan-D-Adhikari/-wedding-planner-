import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Self-hosted fonts (bundled with the app — no requests to Google, works offline)
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/cormorant-garamond/500-italic.css';
import '@fontsource-variable/dm-sans';

import './styles/global.css';
import { App } from './app/App';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element #root not found');

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
