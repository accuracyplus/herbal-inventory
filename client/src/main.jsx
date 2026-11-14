import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { Boundary } from './ui.jsx';
import { t } from './i18n.js';
import '@hifive/ui/styles.css';
import './styles.css';

// The last net: should the shell itself fail to draw, the page says so and offers a way back
// rather than going blank. Changing the address (#/today) draws the app again from the start.
createRoot(document.getElementById('root')).render(
  <Boundary where="the app" className="hf page" back={{ label: t('Reload'), go: () => location.reload() }}>
    <App />
  </Boundary>,
);

// The service worker keeps the shell and its assets for a weak signal; data is never cached.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
