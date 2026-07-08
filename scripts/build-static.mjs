/**
 * Post-build script for shared hosting (cPanel) deployment.
 *
 * Reads the Vite client-build manifest to discover the hashed entry-point JS
 * and CSS files, then writes a minimal SPA index.html that boots the React app
 * client-side. Copies .htaccess and public assets into a single upload-ready
 * folder.
 *
 * Usage:  node scripts/build-static.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUTPUT_PUBLIC = path.join(ROOT, ".output", "public");
const UPLOAD_DIR = path.join(ROOT, "upload-ready");

// ── 1. Discover entry JS & CSS from the built assets ──────────────────────
const assetsDir = path.join(OUTPUT_PUBLIC, "assets");
if (!fs.existsSync(assetsDir)) {
  console.error("❌ No .output/public/assets found. Run 'npm run build:static' first.");
  process.exit(1);
}

const assetFiles = fs.readdirSync(assetsDir);
const entryJs = assetFiles.find((f) => f.startsWith("index-") && f.endsWith(".js"));
const entryCss = assetFiles.find((f) => f.startsWith("styles-") && f.endsWith(".css"));

if (!entryJs) {
  console.error("❌ Could not find entry JS bundle in .output/public/assets/");
  process.exit(1);
}

console.log(`📦 Entry JS:  assets/${entryJs}`);
console.log(`🎨 Entry CSS: assets/${entryCss || "(none)"}`);

// ── 2. Generate index.html ────────────────────────────────────────────────
const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>CarrotHost — Reliable Domain & Web Hosting in Bangladesh</title>
  <meta name="description" content="CarrotHost offers fast, secure, and affordable domain registration and web hosting in Bangladesh with 99.9% uptime and 24/7 local support." />

  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:title" content="CarrotHost — Reliable Domain & Web Hosting in Bangladesh" />
  <meta property="og:description" content="CarrotHost offers fast, secure, and affordable domain registration and web hosting in Bangladesh with 99.9% uptime and 24/7 local support." />
  <meta property="og:image" content="/og-image.png" />
  <meta property="og:url" content="https://carrothost.com/" />
  <meta property="og:site_name" content="CarrotHost" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="CarrotHost — Reliable Domain & Web Hosting in Bangladesh" />
  <meta name="twitter:description" content="CarrotHost offers fast, secure, and affordable domain registration and web hosting in Bangladesh with 99.9% uptime and 24/7 local support." />
  <meta name="twitter:image" content="/og-image.png" />

  <!-- Favicon -->
  <link rel="icon" href="/favicon.ico" type="image/x-icon" />
  <link rel="icon" type="image/png" href="/favicon.png" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" />

  <!-- Styles -->
  ${entryCss ? `<link rel="stylesheet" href="/assets/${entryCss}" />` : ""}

  <!-- Structured Data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "CarrotHost",
    "url": "https://carrothost.com",
    "logo": "https://carrothost.com/logo.png",
    "description": "Fast, secure, and affordable domain registration and web hosting in Bangladesh."
  }
  </script>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "CarrotHost",
    "url": "https://carrothost.com"
  }
  </script>
</head>
<body>
  <script>
    window.$_TSR = {
      buffer: [],
      router: {
        matches: []
      },
      h() {},
      e() {},
      c() {},
      p(e) { e(); }
    };
  </script>
  <script type="module" src="/assets/${entryJs}"></script>
</body>
</html>
`;


// ── 3. Create upload-ready directory ──────────────────────────────────────
if (fs.existsSync(UPLOAD_DIR)) {
  fs.rmSync(UPLOAD_DIR, { recursive: true, force: true });
}
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Copy all .output/public contents
copyDirSync(OUTPUT_PUBLIC, UPLOAD_DIR);

// Write index.html
fs.writeFileSync(path.join(UPLOAD_DIR, "index.html"), indexHtml);

// Copy .htaccess
const htaccessSrc = path.join(ROOT, ".htaccess");
if (fs.existsSync(htaccessSrc)) {
  fs.copyFileSync(htaccessSrc, path.join(UPLOAD_DIR, ".htaccess"));
}

// Copy robots.txt from root if not already present
const robotsSrc = path.join(ROOT, "robots.txt");
const robotsDst = path.join(UPLOAD_DIR, "robots.txt");
if (fs.existsSync(robotsSrc) && !fs.existsSync(robotsDst)) {
  fs.copyFileSync(robotsSrc, robotsDst);
}

console.log("");
console.log("✅ Upload-ready folder created:");
console.log(`   📁 ${UPLOAD_DIR}`);
console.log("");
listDir(UPLOAD_DIR, "   ");
console.log("");
console.log("🚀 cPanel-এ আপলোড করতে:");
console.log("   1. upload-ready/ ফোল্ডারের ভেতরের সব কিছু ZIP করো");
console.log("   2. cPanel File Manager-এ public_html/ ফোল্ডারে আপলোড করো");
console.log("   3. ZIP extract করো");
console.log("   4. Done! 🎉");

// ── Helpers ───────────────────────────────────────────────────────────────
function copyDirSync(src, dst) {
  if (!fs.existsSync(dst)) fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const dstPath = path.join(dst, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, dstPath);
    } else {
      fs.copyFileSync(srcPath, dstPath);
    }
  }
}

function listDir(dir, indent, depth = 0) {
  if (depth > 2) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name);
  });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      console.log(`${indent}📁 ${entry.name}/`);
      listDir(fullPath, indent + "  ", depth + 1);
    } else {
      const size = fs.statSync(fullPath).size;
      const sizeStr = size > 1024 ? `${(size / 1024).toFixed(1)} KB` : `${size} B`;
      console.log(`${indent}📄 ${entry.name} (${sizeStr})`);
    }
  }
}
