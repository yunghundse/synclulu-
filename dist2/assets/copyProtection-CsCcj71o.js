const t={enableRightClickProtection:!1,enableTextSelection:!0,enableDevToolsDetection:!1,enableConsoleWarning:!0,enableScraperDetection:!1,copyrightNotice:"© 2025-2026 Butterbread UG. All rights reserved.",contactEmail:"legal@butterbread.de"},i=[{name:"google",content:"notranslate, nositelinkssearchbox, nopagereadaloud"},{name:"googlebot",content:"noai, noimageai"},{name:"google-site-verification",content:"noai"},{name:"robots",content:"noai, noimageai, noindex, nofollow"},{name:"GPTBot",content:"noindex, nofollow"},{name:"ai-content-declaration",content:"not-ai-generated, do-not-train, no-ml-training"},{name:"author",content:"Butterbread UG"},{name:"copyright",content:"© 2025-2026 Butterbread UG. All rights reserved."}],c=()=>{if(!(typeof window>"u"))try{r(),t.enableRightClickProtection,t.enableTextSelection,t.enableDevToolsDetection,t.enableConsoleWarning&&a(),s(),console.log("%c🛡️ synclulu Copy Protection Active","color: #A78BFA; font-size: 14px; font-weight: bold;")}catch(e){console.warn("Copy protection initialization failed:",e)}},r=()=>{i.forEach(o=>{const n=document.createElement("meta");n.name=o.name,n.content=o.content,document.head.appendChild(n)});const e=document.createElement("script");e.type="application/ld+json",e.textContent=JSON.stringify({"@context":"https://schema.org","@type":"WebApplication",name:"synclulu",author:{"@type":"Organization",name:"Butterbread UG",email:t.contactEmail},copyrightHolder:{"@type":"Organization",name:"Butterbread UG"},copyrightYear:"2025",license:"https://synclulu.app/terms",usageInfo:"All content is protected by copyright. AI training, scraping, and unauthorized reproduction is prohibited."}),document.head.appendChild(e)};const a=()=>{console.clear(),console.log("%c⚠️ WARNUNG! ⚠️","color: red; font-size: 60px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);"),console.log("%cDiese Browser-Funktion ist für Entwickler gedacht.","color: #333; font-size: 18px;"),console.log("%c🛡️ URHEBERRECHTSHINWEIS","color: #A78BFA; font-size: 24px; font-weight: bold;"),console.log(`%cDer Code, das Design und alle Inhalte dieser Anwendung sind urheberrechtlich geschützt.
© 2025-2026 Butterbread UG. Alle Rechte vorbehalten.

❌ VERBOTEN:
• Kopieren des Quellcodes
• Scraping oder automatisiertes Auslesen
• Training von AI/ML Modellen
• Nachahmen oder Klonen der App
• Reverse Engineering

⚖️ Verstöße werden zivilrechtlich und strafrechtlich verfolgt.

📧 Kontakt: legal@butterbread.de`,"color: #666; font-size: 14px; line-height: 1.8;")},s=()=>{const e=document.createElement("div");e.id="synclulu-watermark",e.style.cssText=`
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
  `,e.textContent=`© ${new Date().getFullYear()} Butterbread UG`,document.body.appendChild(e)};export{i as AI_OPTOUT_META_TAGS,t as PROTECTION_CONFIG,c as initializeCopyProtection};
