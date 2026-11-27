const fs = require('fs');
const path = require('path');

const srcDist = path.join(__dirname, '..', 'mobile', 'dist');
const outDist = path.join(__dirname, '..', 'dist');

// 1. Copy mobile/dist -> root dist/
fs.rmSync(outDist, { recursive: true, force: true });
fs.cpSync(srcDist, outDist, { recursive: true });

// 2. Cloudflare Pages skips directories named "node_modules" during upload!
//    Rename dist/assets/node_modules -> dist/assets/vendor_modules and rewrite references.
const nmDir = path.join(outDist, 'assets', 'node_modules');
const vendorDir = path.join(outDist, 'assets', 'vendor_modules');
if (fs.existsSync(nmDir)) {
  fs.renameSync(nmDir, vendorDir);
  console.log('Renamed dist/assets/node_modules -> dist/assets/vendor_modules');
}

function rewriteDir(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      rewriteDir(full);
    } else if (/\.(js|css|html|json)$/.test(entry.name)) {
      const content = fs.readFileSync(full, 'utf8');
      if (content.includes('/assets/node_modules/')) {
        fs.writeFileSync(full, content.replaceAll('/assets/node_modules/', '/assets/vendor_modules/'), 'utf8');
      }
    }
  }
}

rewriteDir(outDist);
console.log('Rewrote /assets/node_modules/ references to /assets/vendor_modules/');

// 3. Inject PWA manifest, Apple Touch Icon, and OpenGraph logo tags into dist/index.html
const indexHtmlPath = path.join(outDist, 'index.html');
if (fs.existsSync(indexHtmlPath)) {
  let html = fs.readFileSync(indexHtmlPath, 'utf8');
  const metaTags = `
    <link rel="manifest" href="/manifest.json" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
    <link rel="icon" type="image/png" href="/apple-touch-icon.png" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="Man Ak Bae" />
    <meta name="theme-color" content="#17151C" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="Man Ak Bae ❤️" />
    <meta property="og:description" content="Votre sanctuaire d'amour privé et sécurisé" />
    <meta property="og:image" content="https://secret-9n0.pages.dev/icon-512.png" />
  `;
  if (!html.includes('apple-touch-icon')) {
    html = html.replace('</head>', `${metaTags}\n  </head>`);
    fs.writeFileSync(indexHtmlPath, html, 'utf8');
    console.log('Injected PWA + Apple Touch Icon + OpenGraph logo tags into dist/index.html');
  }
}
