/**
 * synclulu COPY PROTECTION SYSTEM
 * Schutzmechanismen gegen Scraping, Kopieren & AI-Training
 *
 * Copyright © 2025-2026 Butterbread UG. Alle Rechte vorbehalten.
 */

// ═══════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════

export const PROTECTION_CONFIG = {
  enableRightClickProtection: false, // Disabled - interferes with mobile UX
  enableTextSelection: true, // Allow text selection
  enableDevToolsDetection: false, // Disabled - can cause issues
  enableConsoleWarning: true,
  enableScraperDetection: false, // DISABLED - was causing false positives
  copyrightNotice: '© 2025-2026 Butterbread UG. All rights reserved.',
  contactEmail: 'legal@butterbread.de',
};

// ═══════════════════════════════════════
// ANTI-SCRAPING HEADERS
// ═══════════════════════════════════════

export const SECURITY_HEADERS = {
  'X-Robots-Tag': 'noai, noimageai, noindex, nofollow, noarchive, nosnippet, notranslate, noimageindex',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https://*.firebase.io https://*.firebaseio.com https://*.googleapis.com wss://*.firebaseio.com",
};

// ═══════════════════════════════════════
// META TAGS FOR AI OPT-OUT
// ═══════════════════════════════════════

export const AI_OPTOUT_META_TAGS = [
  // Google AI
  { name: 'google', content: 'notranslate, nositelinkssearchbox, nopagereadaloud' },
  { name: 'googlebot', content: 'noai, noimageai' },
  { name: 'google-site-verification', content: 'noai' },

  // OpenAI
  { name: 'robots', content: 'noai, noimageai, noindex, nofollow' },
  { name: 'GPTBot', content: 'noindex, nofollow' },

  // General AI opt-out
  { name: 'ai-content-declaration', content: 'not-ai-generated, do-not-train, no-ml-training' },

  // Copyright
  { name: 'author', content: 'Butterbread UG' },
  { name: 'copyright', content: '© 2025-2026 Butterbread UG. All rights reserved.' },
];

// ═══════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════

/**
 * Initialize all copy protection measures
 */
export const initializeCopyProtection = () => {
  if (typeof window === 'undefined') return;

  try {
    // Add meta tags (safe - doesn't affect rendering)
    injectAIOptOutMetaTags();

    // Only enable these if explicitly configured
    if (PROTECTION_CONFIG.enableRightClickProtection) {
      disableRightClick();
    }

    if (!PROTECTION_CONFIG.enableTextSelection) {
      disableTextSelection();
    }

    if (PROTECTION_CONFIG.enableDevToolsDetection) {
      detectDevTools();
    }

    if (PROTECTION_CONFIG.enableConsoleWarning) {
      showConsoleWarning();
    }

    // DISABLED: Scraper detection can cause false positives
    // if (PROTECTION_CONFIG.enableScraperDetection) {
    //   detectScrapers();
    // }

    // Add watermark (safe)
    addWatermark();

    console.log('%c🛡️ synclulu Copy Protection Active', 'color: #A78BFA; font-size: 14px; font-weight: bold;');
  } catch (error) {
    console.warn('Copy protection initialization failed:', error);
    // Don't block app loading if protection fails
  }
};

// ═══════════════════════════════════════
// PROTECTION FUNCTIONS
// ═══════════════════════════════════════

/**
 * Inject AI opt-out meta tags
 */
const injectAIOptOutMetaTags = () => {
  AI_OPTOUT_META_TAGS.forEach(tag => {
    const meta = document.createElement('meta');
    meta.name = tag.name;
    meta.content = tag.content;
    document.head.appendChild(meta);
  });

  // Add structured data for copyright
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    'name': 'synclulu',
    'author': {
      '@type': 'Organization',
      'name': 'Butterbread UG',
      'email': PROTECTION_CONFIG.contactEmail,
    },
    'copyrightHolder': {
      '@type': 'Organization',
      'name': 'Butterbread UG',
    },
    'copyrightYear': '2025',
    'license': 'https://synclulu.app/terms',
    'usageInfo': 'All content is protected by copyright. AI training, scraping, and unauthorized reproduction is prohibited.',
  });
  document.head.appendChild(script);
};

/**
 * Disable right-click context menu
 */
const disableRightClick = () => {
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    showProtectionToast('Rechtsklick ist deaktiviert');
    return false;
  });
};

/**
 * Disable text selection
 */
const disableTextSelection = () => {
  document.addEventListener('selectstart', (e) => {
    // Allow selection in input fields
    if ((e.target as HTMLElement).tagName === 'INPUT' ||
        (e.target as HTMLElement).tagName === 'TEXTAREA') {
      return true;
    }
    e.preventDefault();
    return false;
  });

  // CSS-based protection
  const style = document.createElement('style');
  style.textContent = `
    body {
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
    }
    input, textarea, [contenteditable="true"] {
      -webkit-user-select: text;
      -moz-user-select: text;
      -ms-user-select: text;
      user-select: text;
    }
  `;
  document.head.appendChild(style);
};

/**
 * Detect DevTools opening
 */
const detectDevTools = () => {
  const threshold = 160;

  const check = () => {
    const widthThreshold = window.outerWidth - window.innerWidth > threshold;
    const heightThreshold = window.outerHeight - window.innerHeight > threshold;

    if (widthThreshold || heightThreshold) {
      console.clear();
      showConsoleWarning();
    }
  };

  window.addEventListener('resize', check);
  setInterval(check, 1000);

  // Detect via debugger
  const element = new Image();
  Object.defineProperty(element, 'id', {
    get: function() {
      console.clear();
      showConsoleWarning();
      return 'detected';
    }
  });
};

/**
 * Show console warning
 */
const showConsoleWarning = () => {
  console.clear();

  console.log(
    '%c⚠️ WARNUNG! ⚠️',
    'color: red; font-size: 60px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);'
  );

  console.log(
    '%cDiese Browser-Funktion ist für Entwickler gedacht.',
    'color: #333; font-size: 18px;'
  );

  console.log(
    '%c🛡️ URHEBERRECHTSHINWEIS',
    'color: #A78BFA; font-size: 24px; font-weight: bold;'
  );

  console.log(
    '%cDer Code, das Design und alle Inhalte dieser Anwendung sind urheberrechtlich geschützt.\n' +
    '© 2025-2026 Butterbread UG. Alle Rechte vorbehalten.\n\n' +
    '❌ VERBOTEN:\n' +
    '• Kopieren des Quellcodes\n' +
    '• Scraping oder automatisiertes Auslesen\n' +
    '• Training von AI/ML Modellen\n' +
    '• Nachahmen oder Klonen der App\n' +
    '• Reverse Engineering\n\n' +
    '⚖️ Verstöße werden zivilrechtlich und strafrechtlich verfolgt.\n\n' +
    '📧 Kontakt: legal@butterbread.de',
    'color: #666; font-size: 14px; line-height: 1.8;'
  );
};

/**
 * Detect common scraper signatures
 */
const detectScrapers = () => {
  const scraperSignatures = [
    /HeadlessChrome/i,
    /PhantomJS/i,
    /Selenium/i,
    /WebDriver/i,
    /Puppeteer/i,
    /Python-urllib/i,
    /python-requests/i,
    /scrapy/i,
    /wget/i,
    /curl/i,
    /HTTrack/i,
  ];

  const userAgent = navigator.userAgent;

  for (const signature of scraperSignatures) {
    if (signature.test(userAgent)) {
      logScraperAttempt(userAgent);
      document.body.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;text-align:center;padding:20px;">
          <h1 style="color:#EF4444;font-size:48px;">🚫 Zugriff verweigert</h1>
          <p style="color:#666;font-size:18px;max-width:500px;">
            Automatisierte Zugriffe und Scraping sind nicht erlaubt.<br><br>
            © 2025-2026 Butterbread UG
          </p>
        </div>
      `;
      break;
    }
  }

  // Check for headless browser
  if (!navigator.languages || navigator.languages.length === 0) {
    logScraperAttempt('Headless browser detected');
  }

  // Check WebGL
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl');
  if (!gl) {
    logScraperAttempt('No WebGL support - possible headless browser');
  }
};

/**
 * Log scraper attempt (would send to analytics in production)
 */
const logScraperAttempt = (details: string) => {
  console.warn('🚨 Potential scraper detected:', details);
  // In production: Send to analytics/logging service
  // fetch('/api/security/log', { method: 'POST', body: JSON.stringify({ type: 'scraper', details }) });
};

/**
 * Add invisible watermark to content
 */
const addWatermark = () => {
  const watermark = document.createElement('div');
  watermark.id = 'synclulu-watermark';
  watermark.style.cssText = `
    position: fixed;
    pointer-events: none;
    z-index: 9999;
    opacity: 0.03;
    font-size: 12px;
    color: #A78BFA;
    white-space: nowrap;
    user-select: none;
    bottom: 10px;
    right: 10px;
  `;
  watermark.textContent = `© ${new Date().getFullYear()} Butterbread UG`;
  document.body.appendChild(watermark);
};

/**
 * Show protection toast message
 */
const showProtectionToast = (message: string) => {
  const existing = document.getElementById('protection-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'protection-toast';
  toast.style.cssText = `
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%);
    background: #1F2937;
    color: white;
    padding: 12px 24px;
    border-radius: 12px;
    font-size: 14px;
    z-index: 10000;
    animation: fadeInUp 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
  `;
  toast.innerHTML = `<span>🛡️</span><span>${message}</span>`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
};

/**
 * Add keyboard shortcut protection
 */
export const initializeKeyboardProtection = () => {
  document.addEventListener('keydown', (e) => {
    // Block Ctrl+S (Save)
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      showProtectionToast('Speichern nicht erlaubt');
    }

    // Block Ctrl+U (View Source)
    if (e.ctrlKey && e.key === 'u') {
      e.preventDefault();
      showProtectionToast('Quellcode-Ansicht nicht erlaubt');
    }

    // Block Ctrl+Shift+I (DevTools)
    if (e.ctrlKey && e.shiftKey && e.key === 'I') {
      e.preventDefault();
    }

    // Block F12 (DevTools)
    if (e.key === 'F12') {
      e.preventDefault();
    }

    // Block Ctrl+C on non-input elements
    if (e.ctrlKey && e.key === 'c') {
      const target = e.target as HTMLElement;
      if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        showProtectionToast('Kopieren nicht erlaubt');
      }
    }
  });
};

// ═══════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════

export default {
  PROTECTION_CONFIG,
  SECURITY_HEADERS,
  AI_OPTOUT_META_TAGS,
  initializeCopyProtection,
  initializeKeyboardProtection,
};
