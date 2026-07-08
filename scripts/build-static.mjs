/**
 * Post-build script for shared hosting (cPanel) deployment.
 *
 * Runs the Vite/Nitro build with the node-server preset, starts the SSR server
 * locally in the background, fetches pre-rendered pages to get the exact HTML
 * and $_TSR hydration data, then stops the server. Finally, copies public assets
 * and pre-rendered pages into the upload-ready folder.
 *
 * Usage: node scripts/build-static.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync, spawn } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUTPUT_PUBLIC = path.join(ROOT, ".output", "public");
const UPLOAD_DIR = path.join(ROOT, "upload-ready");

const ROUTES = [
  { path: "/", file: "index.html" },
  { path: "/about-us", file: "about-us/index.html" },
  { path: "/bdix-cloud-vps", file: "bdix-cloud-vps/index.html" },
  { path: "/hosting", file: "hosting/index.html" },
  { path: "/privacy-policy", file: "privacy-policy/index.html" },
  { path: "/terms-of-service", file: "terms-of-service/index.html" },
  { path: "/whois", file: "whois/index.html" },
  { path: "/xeon-cloud-vps", file: "xeon-cloud-vps/index.html" }
];

console.log("🚀 Starting static site generation...");

// 1. Build client and server with node-server preset
console.log("📦 Building client & server bundles (preset: node-server)...");
try {
  execSync("npx vite build", {
    cwd: ROOT,
    stdio: "inherit",
    env: {
      ...process.env,
      NITRO_PRESET: "node-server"
    }
  });
} catch (err) {
  console.error("❌ Vite build failed.");
  process.exit(1);
}

// 2. Start the built node server
console.log("🔌 Starting background SSR server...");
const serverProcess = spawn("node", [".output/server/index.mjs"], {
  cwd: ROOT,
  stdio: "ignore",
  env: {
    ...process.env,
    PORT: "3000"
  }
});

// Helper to wait
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper to fetch HTML from server
async function fetchPage(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return await res.text();
}

async function main() {
  try {
    // Wait for server to start
    let connected = false;
    for (let i = 0; i < 15; i++) {
      try {
        await fetch("http://localhost:3000/");
        connected = true;
        break;
      } catch {
        await sleep(500);
      }
    }

    if (!connected) {
      throw new Error("Could not connect to the local SSR server after 7.5 seconds.");
    }

    console.log("✨ SSR server running. Scraping pages...");
    const pageContents = {};

    for (const route of ROUTES) {
      console.log(`   📄 Scraping ${route.path}...`);
      pageContents[route.path] = await fetchPage(`http://localhost:3000${route.path}`);
    }

    // Stop the server
    console.log("🛑 Stopping background SSR server...");
    serverProcess.kill("SIGTERM");

    // 3. Create upload-ready directory
    if (fs.existsSync(UPLOAD_DIR)) {
      fs.rmSync(UPLOAD_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });

    // Copy all .output/public contents
    console.log("📂 Copying assets and public files...");
    copyDirSync(OUTPUT_PUBLIC, UPLOAD_DIR);

    // Write pre-rendered HTML files
    console.log("✍️ Writing pre-rendered pages...");
    for (const route of ROUTES) {
      const filePath = path.join(UPLOAD_DIR, route.file);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, pageContents[route.path]);
    }

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
    console.log("✅ Static site successfully generated and optimized:");
    console.log(`   📁 ${UPLOAD_DIR}`);
    console.log("");
    listDir(UPLOAD_DIR, "   ");
    console.log("");
    console.log("🚀 cPanel-এ আপলোড করতে:");
    console.log("   1. upload-ready/ ফোল্ডারের ভেতরের সব কিছু ZIP করো");
    console.log("   2. cPanel File Manager-এ public_html/ ফোল্ডারে আপলোড করো");
    console.log("   3. ZIP extract করো");
    console.log("   4. Done! 🎉");

  } catch (err) {
    console.error("❌ Static generation failed:", err);
    serverProcess.kill("SIGTERM");
    process.exit(1);
  }
}

main();

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
