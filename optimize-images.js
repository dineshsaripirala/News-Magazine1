/**
 * Image Optimization Script for NewsHub
 * Downloads all site images from picsum.photos and converts to WebP (<100 KB each).
 * Run once: node optimize-images.js
 *
 * Requires: node optimize-images.js  (sharp is auto-installed if missing)
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ── Auto-install sharp if needed ──────────────────────────────────────────────
let sharp;
try {
    sharp = require('sharp');
} catch {
    console.log('Installing sharp (one-time)...');
    execSync('npm install sharp', { stdio: 'inherit', cwd: __dirname });
    sharp = require('sharp');
}

// ── Image manifest ─────────────────────────────────────────────────────────────
// Each entry: { src (picsum URL), name (output filename), w, h (resize target), quality }
const IMAGES = [
    // Article hero images — 600×400, shown full-width in cards & article pages
    { src: 'https://picsum.photos/600/400?random=1',   name: 'article-1.webp',            w: 600, h: 400 },
    { src: 'https://picsum.photos/600/400?random=2',   name: 'article-2.webp',            w: 600, h: 400 },
    { src: 'https://picsum.photos/600/400?random=3',   name: 'article-3.webp',            w: 600, h: 400 },
    { src: 'https://picsum.photos/600/400?random=4',   name: 'article-4.webp',            w: 600, h: 400 },
    { src: 'https://picsum.photos/600/400?random=5',   name: 'article-5.webp',            w: 600, h: 400 },
    { src: 'https://picsum.photos/600/400?random=6',   name: 'article-6.webp',            w: 600, h: 400 },
    { src: 'https://picsum.photos/600/400?random=7',   name: 'article-7.webp',            w: 600, h: 400 },
    { src: 'https://picsum.photos/600/400?random=8',   name: 'article-8.webp',            w: 600, h: 400 },

    // Small article thumbnails — 160×120 (2× of 80×60 display size)
    { src: 'https://picsum.photos/160/120?random=1',   name: 'article-1-thumb.webp',      w: 160, h: 120 },
    { src: 'https://picsum.photos/160/120?random=2',   name: 'article-2-thumb.webp',      w: 160, h: 120 },
    { src: 'https://picsum.photos/160/120?random=3',   name: 'article-3-thumb.webp',      w: 160, h: 120 },
    { src: 'https://picsum.photos/160/120?random=4',   name: 'article-4-thumb.webp',      w: 160, h: 120 },
    { src: 'https://picsum.photos/160/120?random=5',   name: 'article-5-thumb.webp',      w: 160, h: 120 },
    { src: 'https://picsum.photos/160/120?random=6',   name: 'article-6-thumb.webp',      w: 160, h: 120 },
    { src: 'https://picsum.photos/160/120?random=7',   name: 'article-7-thumb.webp',      w: 160, h: 120 },
    { src: 'https://picsum.photos/160/120?random=8',   name: 'article-8-thumb.webp',      w: 160, h: 120 },

    // Stat-card avatar icons — 120×120 (2× of 60×60 display)
    { src: 'https://picsum.photos/120/120?random=101', name: 'avatar-1.webp',             w: 120, h: 120 },
    { src: 'https://picsum.photos/120/120?random=102', name: 'avatar-2.webp',             w: 120, h: 120 },
    { src: 'https://picsum.photos/120/120?random=103', name: 'avatar-3.webp',             w: 120, h: 120 },
    { src: 'https://picsum.photos/120/120?random=104', name: 'avatar-4.webp',             w: 120, h: 120 },

    // Team member photos — 160×160 (2× of 80×80 display)
    { src: 'https://picsum.photos/160/160?random=301', name: 'team-1.webp',               w: 160, h: 160 },
    { src: 'https://picsum.photos/160/160?random=302', name: 'team-2.webp',               w: 160, h: 160 },
    { src: 'https://picsum.photos/160/160?random=303', name: 'team-3.webp',               w: 160, h: 160 },
    { src: 'https://picsum.photos/160/160?random=304', name: 'team-4.webp',               w: 160, h: 160 },

    // Magazine covers — 400×280 (shown 100% width, 280 px tall in cards)
    { src: 'https://picsum.photos/400/400?random=401', name: 'magazine-1.webp',           w: 400, h: 280 },
    { src: 'https://picsum.photos/400/400?random=402', name: 'magazine-2.webp',           w: 400, h: 280 },
    { src: 'https://picsum.photos/400/400?random=403', name: 'magazine-3.webp',           w: 400, h: 280 },

    // Magazine featured story thumbnails — 240×200 (2× of 120×100 display)
    { src: 'https://picsum.photos/240/200?random=1',   name: 'magazine-thumb-1.webp',     w: 240, h: 200 },
    { src: 'https://picsum.photos/240/200?random=2',   name: 'magazine-thumb-2.webp',     w: 240, h: 200 },
    { src: 'https://picsum.photos/240/200?random=3',   name: 'magazine-thumb-3.webp',     w: 240, h: 200 },
    { src: 'https://picsum.photos/240/200?random=4',   name: 'magazine-thumb-4.webp',     w: 240, h: 200 },
    { src: 'https://picsum.photos/240/200?random=5',   name: 'magazine-thumb-5.webp',     w: 240, h: 200 },
    { src: 'https://picsum.photos/240/200?random=6',   name: 'magazine-thumb-6.webp',     w: 240, h: 200 },
    { src: 'https://picsum.photos/240/200?random=7',   name: 'magazine-thumb-7.webp',     w: 240, h: 200 },
    { src: 'https://picsum.photos/240/200?random=8',   name: 'magazine-thumb-8.webp',     w: 240, h: 200 },

    // About page hero — 400×400
    { src: 'https://picsum.photos/400/400?random=501', name: 'about-hero.webp',           w: 400, h: 400 },

    // Category card images — 400×150
    { src: 'https://picsum.photos/400/300?random=201', name: 'category-politics.webp',    w: 400, h: 150 },
    { src: 'https://picsum.photos/400/300?random=202', name: 'category-business.webp',    w: 400, h: 150 },
    { src: 'https://picsum.photos/400/300?random=203', name: 'category-technology.webp',  w: 400, h: 150 },
    { src: 'https://picsum.photos/400/300?random=204', name: 'category-sports.webp',      w: 400, h: 150 },
    { src: 'https://picsum.photos/400/300?random=205', name: 'category-entertainment.webp',w: 400, h: 150 },
    { src: 'https://picsum.photos/400/300?random=206', name: 'category-education.webp',   w: 400, h: 150 },
    { src: 'https://picsum.photos/400/300?random=207', name: 'category-lifestyle.webp',   w: 400, h: 150 },
    { src: 'https://picsum.photos/400/300?random=208', name: 'category-world-news.webp',  w: 400, h: 150 },
];

const OUTPUT_DIR = path.join(__dirname, 'images');
const QUALITY = 80;

// ── Helpers ────────────────────────────────────────────────────────────────────

function fetchBuffer(url, redirects = 5) {
    return new Promise((resolve, reject) => {
        const mod = url.startsWith('https') ? https : http;
        mod.get(url, { headers: { 'User-Agent': 'NewsHub-Optimizer/1.0' } }, res => {
            if ((res.statusCode === 301 || res.statusCode === 302) && redirects > 0) {
                return fetchBuffer(res.headers.location, redirects - 1).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) {
                return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
            }
            const chunks = [];
            res.on('data', c => chunks.push(c));
            res.on('end', () => resolve(Buffer.concat(chunks)));
            res.on('error', reject);
        }).on('error', reject);
    });
}

async function processImage({ src, name, w, h }) {
    const dest = path.join(OUTPUT_DIR, name);
    if (fs.existsSync(dest)) {
        const kb = (fs.statSync(dest).size / 1024).toFixed(1);
        console.log(`  skip  ${name} (${kb} KB already exists)`);
        return;
    }

    const buf = await fetchBuffer(src);
    await sharp(buf)
        .resize(w, h, { fit: 'cover', position: 'centre' })
        .webp({ quality: QUALITY, effort: 6, smartSubsample: true })
        .toFile(dest);

    const kb = (fs.statSync(dest).size / 1024).toFixed(1);
    const flag = parseFloat(kb) > 100 ? ' ⚠️  OVER 100 KB' : '';
    console.log(`  ✓  ${name.padEnd(30)} ${kb.padStart(6)} KB${flag}`);
}

// ── Main ───────────────────────────────────────────────────────────────────────

(async () => {
    console.log(`\nNewsHub Image Optimizer\n${'─'.repeat(50)}`);
    console.log(`Output → ${OUTPUT_DIR}\n`);

    let ok = 0, fail = 0;
    for (const img of IMAGES) {
        try {
            await processImage(img);
            ok++;
        } catch (err) {
            console.error(`  ✗  ${img.name}: ${err.message}`);
            fail++;
        }
    }

    console.log(`\n${'─'.repeat(50)}`);
    console.log(`Done — ${ok} succeeded, ${fail} failed.\n`);
    if (fail > 0) console.log('Re-run the script to retry failed images.\n');
})();
