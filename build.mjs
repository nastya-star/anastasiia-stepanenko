// Generates the static English and German pages from one template:
//   index.html, cv.html          (English, site root)
//   de/index.html, de/cv.html    (German)
// Run after editing: node build.mjs   (no dependencies). Commit the generated files.

import { mkdirSync, writeFileSync } from 'node:fs';

// --- Facts (unchanged across languages) -----------------------------------
const NAME = 'Anastasiia Stepanenko';
const EMAIL = 'anastasiia.stepanenko.work@gmail.com';
const PHONE = '+49 160 2328574';
const PHONE_TEL = '+491602328574';
const SITE = 'https://nastya-star.github.io/anastasiia-stepanenko/';

// --- Availability ----------------------------------------------------------
// CV PDFs per language; null = not provided yet. While no PDF exists the
// homepage CV button stays inactive and is labelled as coming soon.
const CV = { en: 'Anastasiia_Stepanenko_CV.pdf', de: null }; // English Europass CV added 2026-10-31; German version not provided yet
// The fuel project (separate repo) is not published yet (checked 2026-10-31).
const FUEL_URL = 'https://nastya-star.github.io/munich-fuel-min/'; // live since 2026-11-03
// Apps Script /exec URL of apps-script/cv-mailer; null = email delivery not set up yet.
const MAILER_URL = 'https://script.google.com/macros/s/AKfycbw2ujz24SGgibmiJL6kNifrusFNfSHXZ3iXcK7mJpe0aUrVbTIv_5yqcuGA5m0JuDeJ/exec';

// --- Text ------------------------------------------------------------------
const T = {
  en: {
    htmlLang: 'en',
    title: `${NAME} · Optimization & Data Science · Munich`,
    description: `${NAME}, MSc student in Mathematics in Data Science at the Technical University of Munich. Optimization & Data Science, Munich.`,
    focus: 'Optimization & Data Science',
    study: 'MSc student in Mathematics in Data Science · Technical University of Munich',
    place: 'Munich',
    langNav: 'Language',
    linksNav: 'Contact and links',
    phone: 'Phone',
    cv: 'CV',
    cvSub: 'View, download or receive by email',
    fuel: 'Cheapest fuel in town',
    fuelSub: 'Munich',
    soon: 'Soon',
    soonLong: 'Coming soon',
    opensNewTab: 'opens in a new tab',
    footer: `© ${NAME} · Munich`,
    // CV page
    cvTitle: `CV · ${NAME}`,
    cvDescription: `CV of ${NAME}, MSc student in Mathematics in Data Science at the Technical University of Munich.`,
    cvHeading: 'CV',
    cvIntro: `${NAME} · Optimization & Data Science · Munich`,
    pdfLang: { en: 'English', de: 'German' },
    pdfLangNote: (l) => `The CV is currently available in ${l} only.`,
    openPdf: 'Open PDF',
    openPdfSub: 'Opens in a new tab',
    download: 'Download CV',
    sendCv: 'Send CV to my email',
    sendCvSub: `Sent from ${EMAIL}`,
    back: 'Back',
    formLabel: 'Your email address',
    formHint: `My CV will be sent as a PDF from ${EMAIL}. Your address is used only for this one email.`,
    placeholder: 'name@company.com',
    submit: 'Send CV',
    honeypot: 'Company',
    viewerLabel: `CV of ${NAME} (PDF)`,
    fallback: (open, dl) => `This browser can’t display the PDF here. Use ${open} or ${dl}.`,
    fallbackOpen: 'Open PDF',
    fallbackDl: 'Download CV',
    noCv: 'My CV is being finalised and will be available here shortly.',
  },
  de: {
    htmlLang: 'de',
    title: `${NAME} · Optimierung & Data Science · München`,
    description: `${NAME}, Masterstudentin im Studiengang Mathematics in Data Science an der Technischen Universität München. Optimierung & Data Science, München.`,
    focus: 'Optimierung & Data Science',
    study: 'Masterstudentin im Studiengang Mathematics in Data Science · Technische Universität München',
    place: 'München',
    langNav: 'Sprache',
    linksNav: 'Kontakt und Links',
    phone: 'Telefon',
    cv: 'Lebenslauf',
    cvSub: 'Ansehen, herunterladen oder per E-Mail erhalten',
    fuel: 'Günstig tanken in München',
    fuelSub: 'München',
    soon: 'Bald',
    soonLong: 'Demnächst verfügbar',
    opensNewTab: 'öffnet in einem neuen Tab',
    footer: `© ${NAME} · München`,
    cvTitle: `Lebenslauf · ${NAME}`,
    cvDescription: `Lebenslauf von ${NAME}, Masterstudentin im Studiengang Mathematics in Data Science an der Technischen Universität München.`,
    cvHeading: 'Lebenslauf',
    cvIntro: `${NAME} · Optimierung & Data Science · München`,
    pdfLang: { en: 'Englisch', de: 'Deutsch' },
    pdfLangNote: (l) => `Der Lebenslauf liegt derzeit nur auf ${l} vor.`,
    openPdf: 'PDF öffnen',
    openPdfSub: 'Öffnet in einem neuen Tab',
    download: 'Lebenslauf herunterladen',
    sendCv: 'Lebenslauf per E-Mail erhalten',
    sendCvSub: `Versand von ${EMAIL}`,
    back: 'Zurück',
    formLabel: 'Ihre E-Mail-Adresse',
    formHint: `Mein Lebenslauf wird als PDF von ${EMAIL} versendet. Ihre Adresse wird ausschließlich für diese eine E-Mail verwendet.`,
    placeholder: 'name@unternehmen.de',
    submit: 'Lebenslauf senden',
    honeypot: 'Firma',
    viewerLabel: `Lebenslauf von ${NAME} (PDF)`,
    fallback: (open, dl) => `Dieser Browser kann das PDF hier nicht anzeigen. Nutzen Sie ${open} oder ${dl}.`,
    fallbackOpen: 'PDF öffnen',
    fallbackDl: 'Lebenslauf herunterladen',
    noCv: 'Mein Lebenslauf wird gerade fertiggestellt und ist in Kürze hier verfügbar.',
  },
};

// --- Shared bits -------------------------------------------------------------
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const ICON = {
  linkedin: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 10.5V17M8 7.25v.01M12 17v-6.5M12 13.5a2.75 2.75 0 0 1 5.5 0V17"/>',
  whatsapp: '<path d="M3.5 20.5l1.3-4A8.5 8.5 0 1 1 8 19.4z"/><path d="M9.2 8.6c.3-.6.9-.6 1.2 0l.6 1.3c.1.3 0 .6-.2.8l-.5.5a5.6 5.6 0 0 0 2.6 2.6l.5-.5c.2-.2.5-.3.8-.2l1.3.6c.6.3.6.9 0 1.2-.7.5-1.6.7-2.4.4a8 8 0 0 1-4.6-4.6c-.3-.8-.1-1.7.4-2.4z"/>',
  mail: '<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="m3 6.5 9 6.5 9-6.5"/>',
  phone: '<path d="M20.3 15.6v2.8a1.9 1.9 0 0 1-2 1.9 18.3 18.3 0 0 1-8-2.8 18 18 0 0 1-5.5-5.5 18.3 18.3 0 0 1-2.9-8 1.9 1.9 0 0 1 1.9-2h2.8a1.9 1.9 0 0 1 1.8 1.6c.12.9.34 1.75.65 2.6a1.9 1.9 0 0 1-.43 2L7.4 9.4a15 15 0 0 0 5.6 5.6l1.2-1.2a1.9 1.9 0 0 1 2-.43c.85.31 1.7.53 2.6.65a1.9 1.9 0 0 1 1.6 1.9z"/>',
  github: '<path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/>',
  cv: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
  fuel: '<path d="M4 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16M3 21h13M7 7.5h5v3.5H7zM15 11h1.5a1.5 1.5 0 0 1 1.5 1.5v4a1.5 1.5 0 0 0 3 0V8.2a1 1 0 0 0-.3-.7L17.5 5"/>',
  open: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
  download: '<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 20h14"/>',
  send: '<path d="M21 4 3 11l7 2.5L12.5 20z"/><path d="m10 13.5 4-4"/>',
  back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
};
const ARROW = { out: '<path d="M7 17 17 7M9 7h8v8"/>', down: '<path d="M12 5v14M6 13l6 6 6-6"/>', chevron: '<path d="m6 9 6 6 6-6"/>', left: '<path d="M15 6l-6 6 6 6"/>' };
const svg = (paths, cls = '') => `<svg${cls ? ` class="${cls}"` : ''} viewBox="0 0 24 24" aria-hidden="true">${paths}</svg>`;

const CSS = `:root{--bg:#111111;--fg:#F5F3EE;--mute:#B9B5AC;--line:rgba(245,243,238,.75);--soft:rgba(245,243,238,.35);--hover:rgba(245,243,238,.08);--press:rgba(245,243,238,.16);--ok:#9fd8a8;--err:#ffb4a8;--serif:Georgia,"Times New Roman",Times,serif;--sans:system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif}
*{box-sizing:border-box}
html{background:var(--bg)}
body{margin:0;background:var(--bg);color:var(--fg);font:400 1rem/1.5 var(--sans);-webkit-font-smoothing:antialiased}
main{max-width:30rem;margin:0 auto;padding:1.25rem 1.25rem 4rem}
.top{display:flex;justify-content:flex-end;margin-bottom:2.25rem}
.lang{display:flex;align-items:center;border:1px solid var(--soft);border-radius:6px;font-size:.85rem;font-weight:600;letter-spacing:.06em}
.lang a,.lang span{display:flex;align-items:center;justify-content:center;min-width:2.75rem;min-height:2.75rem;padding:0 .7rem;color:var(--mute);text-decoration:none}
.lang a:hover{color:var(--fg);background:var(--hover)}
.lang a:focus-visible{outline:2px solid var(--fg);outline-offset:2px;border-radius:6px}
.lang [aria-current]{color:var(--bg);background:var(--fg)}
.lang .sep{min-width:0;padding:0;width:1px;align-self:stretch;background:var(--soft)}
header{margin-bottom:2.5rem}
h1{margin:0;font:400 clamp(2.1rem,8vw,2.75rem)/1.1 var(--serif);letter-spacing:.01em}
.focus{margin:.9rem 0 0;font-size:.82rem;font-weight:500;letter-spacing:.18em;text-transform:uppercase}
.place{margin:1rem 0 0;color:var(--mute)}
.place svg{width:15px;height:15px;vertical-align:-2px;margin-right:.35rem;fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
.study{margin:.3rem 0 0;color:var(--mute)}
ul{list-style:none;margin:0;padding:0}
.stack{display:grid;gap:.75rem}
.btn{display:flex;align-items:center;gap:.9rem;width:100%;min-height:4rem;padding:.7rem 1rem;border:1px solid var(--line);border-radius:6px;background:var(--bg);color:var(--fg);font:inherit;text-align:left;text-decoration:none;cursor:pointer;transition:background-color .15s,border-color .15s}
.btn:hover{background:var(--hover);border-color:var(--fg)}
.btn:active{background:var(--press)}
.btn:focus-visible{outline:2px solid var(--fg);outline-offset:3px}
.btn svg{flex:none;width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
.btn .end{width:15px;height:15px;opacity:.75;transition:transform .15s}
.txt{flex:1;min-width:0}
.txt b{display:block;font-weight:600;font-size:1rem;line-height:1.3}
.txt small{display:block;margin-top:.1rem;color:var(--mute);font-size:.875rem;line-height:1.35;overflow-wrap:break-word}
.btn.solid{background:#fff;color:#000;border-color:#fff}
.btn.solid .txt small{color:#3d3a35}
.btn.solid:hover{background:#e9e7e2;border-color:#e9e7e2}
.btn.solid:active{background:#d6d3cc;border-color:#d6d3cc}
.btn.off{border-style:dashed;border-color:var(--soft);cursor:default}
.btn.off:hover,.btn.off:active{background:var(--bg)}
.btn.off svg{opacity:.7}
.tag{flex:none;font-size:.72rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--mute);border:1px solid var(--soft);border-radius:999px;padding:.1rem .5rem}
.note{margin:0 0 1.25rem;color:var(--mute);font-size:.92rem}
footer{margin-top:3.5rem;color:var(--mute);font-size:.8rem}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}`;

const CV_CSS = `h1.cvh{margin:0 0 .4rem;font:400 clamp(2rem,7vw,2.5rem)/1.1 var(--serif)}
.sub{margin:0 0 1.5rem;color:var(--mute)}
details>summary{list-style:none}
details>summary::-webkit-details-marker{display:none}
details[open]>summary .end{transform:rotate(180deg)}
.panel{margin-top:.75rem;padding:1rem;border:1px solid rgba(245,243,238,.3);border-radius:6px}
.panel label{display:block;font-weight:600;margin-bottom:.4rem}
.panel .hint{margin:0 0 .75rem;color:var(--mute);font-size:.88rem}
input[type=email]{width:100%;min-height:3rem;padding:.6rem .8rem;border:1px solid var(--line);border-radius:6px;background:#0b0b0b;color:var(--fg);font:inherit}
input[type=email]:focus{outline:2px solid var(--fg);outline-offset:2px}
input[aria-invalid=true]{border-color:var(--err)}
.panel .btn{margin-top:.75rem;min-height:3.25rem;justify-content:center;font-weight:600}
.btn:disabled{opacity:.6;cursor:not-allowed}
.hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}
.form-status{margin:.75rem 0 0;font-size:.92rem}
.form-status.ok{color:var(--ok)}
.form-status.err{color:var(--err)}
.viewer{display:block;width:100%;height:85vh;min-height:32rem;margin-top:2.5rem;border:1px solid rgba(245,243,238,.25);border-radius:6px;background:#1b1b1b}
.fallback{padding:2rem 1.25rem;color:var(--mute)}
.fallback a{color:var(--fg)}
@media(min-width:64rem){main.wide{max-width:56rem}main.wide .stack,main.wide .top{max-width:none}}`;

const FAVICON = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='4' fill='%23111'/%3E%3Ctext x='16' y='21.5' text-anchor='middle' font-family='Georgia,serif' font-size='15' fill='%23F5F3EE'%3EAS%3C/text%3E%3C/svg%3E`;

// Pages: path relative to site root, and its counterpart in the other language.
const PAGES = {
  home: { en: '', de: 'de/' },
  cv: { en: 'cv.html', de: 'de/cv.html' },
};
const depth = (lang) => (lang === 'de' ? '../' : '');
const rel = (lang, target) => (lang === 'de' && target.startsWith('de/') ? target.slice(3) : depth(lang) + target) || './';

// Runs in <head> before anything renders, so there is no flash of the wrong language.
// A stored choice always wins; on first visit only the English pages switch German-language browsers to German.
function prefScript(lang, other) {
  return `<script>(function(){var p;try{p=localStorage.getItem("lang")}catch(e){}if(!p&&"${lang}"==="en"&&/^de\\b/i.test(navigator.language||""))p="de";if(p&&p!=="${lang}")location.replace("${other}"+location.hash)})()</script>`;
}

const SWITCH_SCRIPT = `<script>document.querySelectorAll("[data-lang]").forEach(function(a){a.addEventListener("click",function(){try{localStorage.setItem("lang",a.getAttribute("data-lang"))}catch(e){}})})</script>`;

function head(lang, page, title, description, extraCss = '') {
  const other = lang === 'en' ? 'de' : 'en';
  const self = PAGES[page][lang];
  const otherRel = rel(lang, PAGES[page][other]);
  return `<!doctype html>
<html lang="${T[lang].htmlLang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
${prefScript(lang, otherRel)}
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="theme-color" content="#111111">
<meta name="color-scheme" content="dark">
<link rel="canonical" href="${SITE}${self}">
<link rel="alternate" hreflang="en" href="${SITE}${PAGES[page].en}">
<link rel="alternate" hreflang="de" href="${SITE}${PAGES[page].de}">
<link rel="alternate" hreflang="x-default" href="${SITE}${PAGES[page].en}">
<link rel="icon" href="${FAVICON}">
<style>
${CSS}
${extraCss}
</style>
</head>`;
}

function langSwitch(lang, page) {
  const t = T[lang];
  const item = (l) =>
    l === lang
      ? `<span aria-current="page" lang="${l}"><span class="sr">${l === 'en' ? 'English' : 'Deutsch'}, </span>${l.toUpperCase()}</span>`
      : `<a href="${rel(lang, PAGES[page][l])}" hreflang="${l}" lang="${l}" data-lang="${l}"><span class="sr">${l === 'en' ? 'English' : 'Deutsch'}, </span>${l.toUpperCase()}</a>`;
  return `<div class="top"><nav class="lang" aria-label="${t.langNav}">${item('en')}<span class="sep" aria-hidden="true"></span>${item('de')}</nav></div>`;
}

function button({ href, icon, title, sub, solid = false, external = false, end = 'out', off = false, offLabel = '', t, attrs = '' }) {
  const inner = `${svg(ICON[icon])}<span class="txt"><b>${esc(title)}</b><small>${esc(sub)}</small></span>`;
  if (off) return `<span class="btn off" aria-disabled="true">${inner}<span class="tag"><span aria-hidden="true">${esc(t.soon)}</span><span class="sr">${esc(offLabel)}</span></span></span>`;
  const ext = external ? ` target="_blank" rel="noopener"` : '';
  const sr = external ? `<span class="sr"> (${t.opensNewTab})</span>` : '';
  return `<a class="btn${solid ? ' solid' : ''}" href="${esc(href)}"${ext}${attrs}>${inner}${sr}${svg(ARROW[end], 'end')}</a>`;
}

// --- Homepage ------------------------------------------------------------------
function home(lang) {
  const t = T[lang];
  const anyCv = CV[lang] || CV.en || CV.de;
  const items = [
    button({ t, href: 'https://linkedin.com/in/anastasiia-stepanenko-1a0871327', icon: 'linkedin', title: 'LinkedIn', sub: NAME, solid: true, external: true }),
    button({ t, href: 'https://wa.me/491602328574', icon: 'whatsapp', title: 'WhatsApp', sub: PHONE, solid: true, external: true }),
    button({ t, href: `mailto:${EMAIL}`, icon: 'mail', title: 'Gmail', sub: EMAIL }),
    button({ t, href: `tel:${PHONE_TEL}`, icon: 'phone', title: t.phone, sub: PHONE }),
    button({ t, href: 'https://github.com/nastya-star', icon: 'github', title: 'GitHub', sub: 'nastya-star', external: true }),
    button({ t, href: rel(lang, PAGES.cv[lang]), icon: 'cv', title: t.cv, sub: t.cvSub, off: !anyCv, offLabel: t.soonLong }),
    button({ t, href: FUEL_URL, icon: 'fuel', title: t.fuel, sub: t.fuelSub, external: true, off: !FUEL_URL, offLabel: t.soonLong }),
  ];
  return `${head(lang, 'home', t.title, t.description)}
<body>
<main>
${langSwitch(lang, 'home')}
<header>
<h1>${NAME}</h1>
<p class="focus">${esc(t.focus)}</p>
<p class="place">${svg(ICON.pin)}${esc(t.place)}</p>
<p class="study">${esc(t.study)}</p>
</header>
<nav aria-label="${esc(t.linksNav)}">
<ul class="stack">
${items.map((b) => `<li>${b}</li>`).join('\n')}
</ul>
</nav>
<footer>${esc(t.footer)}</footer>
</main>
${SWITCH_SCRIPT}
</body>
</html>
`;
}

// --- CV page -----------------------------------------------------------------
function cvPage(lang) {
  const t = T[lang];
  const pdfLang = CV[lang] ? lang : CV.en ? 'en' : CV.de ? 'de' : null;
  const pdf = pdfLang ? rel(lang, CV[pdfLang]) : null;
  const fileName = pdfLang ? CV[pdfLang] : '';
  const note = !pdf ? t.noCv : pdfLang !== lang ? t.pdfLangNote(t.pdfLang[pdfLang]) : '';
  const fallbackOpen = pdf ? `<a href="${pdf}" target="_blank" rel="noopener">${t.fallbackOpen}</a>` : t.fallbackOpen;
  const fallbackDl = pdf ? `<a href="${pdf}" download="${fileName}">${t.fallbackDl}</a>` : t.fallbackDl;
  const sendSub = t.sendCvSub;
  const action = MAILER_URL || 'REPLACE_WITH_APPS_SCRIPT_EXEC_URL';
  return `${head(lang, 'cv', t.cvTitle, t.cvDescription, CV_CSS)}
<body>
<main class="wide">
${langSwitch(lang, 'cv')}
<h1 class="cvh">${esc(t.cvHeading)}</h1>
<p class="sub">${esc(t.cvIntro)}</p>
${note ? `<p class="note">${esc(note)}</p>` : ''}
<div class="stack">
${pdf ? button({ t, href: pdf, icon: 'open', title: t.openPdf, sub: t.openPdfSub, external: true }) : button({ t, icon: 'open', title: t.openPdf, sub: t.openPdfSub, off: true, offLabel: t.soonLong })}
${pdf ? button({ t, href: pdf, icon: 'download', title: t.download, sub: fileName, end: 'down', attrs: ` download="${fileName}"` }) : button({ t, icon: 'download', title: t.download, sub: 'PDF', off: true, offLabel: t.soonLong })}
<details>
<summary class="btn">${svg(ICON.send)}<span class="txt"><b>${esc(t.sendCv)}</b><small>${esc(sendSub)}</small></span>${svg(ARROW.chevron, 'end')}</summary>
<!-- action = the CV mailer's Apps Script /exec URL (apps-script/cv-mailer/SETUP.md) -->
<form id="cv-request" class="panel" method="post" action="${action}" novalidate>
<input type="hidden" name="lang" value="${lang}">
<label for="cv-email">${esc(t.formLabel)}</label>
<p class="hint" id="cv-hint">${esc(t.formHint)}</p>
<input id="cv-email" name="email" type="email" inputmode="email" autocomplete="email" required maxlength="254" placeholder="${esc(t.placeholder)}" aria-describedby="cv-hint cv-status">
<div class="hp" aria-hidden="true"><label for="cv-company">${esc(t.honeypot)}</label><input id="cv-company" name="company" type="text" tabindex="-1" autocomplete="off"></div>
<button class="btn" type="submit">${esc(t.submit)}</button>
<p id="cv-status" class="form-status" role="status" aria-live="polite"></p>
</form>
</details>
${button({ t, href: rel(lang, PAGES.home[lang]), icon: 'back', title: t.back, sub: NAME, end: 'left' })}
</div>
${pdf ? `<object class="viewer" data="${pdf}#view=FitH" type="application/pdf" aria-label="${esc(t.viewerLabel)}">
<p class="fallback">${t.fallback(fallbackOpen, fallbackDl)}</p>
</object>` : ''}
</main>
${SWITCH_SCRIPT}
<script src="${depth(lang)}cv-request.js" defer></script>
</body>
</html>
`;
}

mkdirSync('de', { recursive: true });
writeFileSync('index.html', home('en'));
writeFileSync('de/index.html', home('de'));
writeFileSync('cv.html', cvPage('en'));
writeFileSync('de/cv.html', cvPage('de'));
console.log('Built index.html, cv.html, de/index.html, de/cv.html');
