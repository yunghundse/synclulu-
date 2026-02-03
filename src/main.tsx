import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// Copy Protection & Anti-Scraping (Production only)
// NOTE: Temporarily disabled aggressive protection due to false positives
// Meta tags and headers in index.html + vercel.json still provide protection

// Render app first, then add lightweight protection
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// Initialize lightweight protection AFTER app renders
if (import.meta.env.PROD) {
  import('./lib/copyProtection').then(({ initializeCopyProtection }) => {
    // Delay to ensure React has rendered
    setTimeout(() => {
      try {
        initializeCopyProtection();
      } catch (e) {
        console.warn('Protection init failed:', e);
      }
    }, 1000);
  }).catch(() => {
    // Silently fail - protection is optional
  });
}
