import axios from 'axios';
import { load as cheerioLoad } from 'cheerio';
import fs from 'fs';
import path from 'path';
import { Document, Packer, Paragraph } from 'docx';

let _puppeteer = null; // lazy-loaded if CRAWL_USE_PUPPETEER=1

// Crawls the school website, extracts text and writes it to output.docx
// Default start URL can be overridden via the CRAWL_START_URL environment variable
async function crawlWebsite(
    startUrl = process.env.CRAWL_START_URL || 'https://schulwebsites-template.osc-fr1.scalingo.io'
) {
    const START_ORIGIN = new URL(startUrl).origin;

    // Allow crawling across multiple hostnames if configured (comma-separated origins or hostnames)
    const allowedFromEnv = (process.env.CRAWL_ALLOW_ORIGINS || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

    // Build a set of allowed origins; accept either full origins (https://example.com) or bare hostnames (example.com)
    const ALLOWED_ORIGINS = new Set([START_ORIGIN]);
    const ALLOWED_HOSTNAMES = new Set();

    for (const item of allowedFromEnv) {
        try {
            if (item.startsWith('http://') || item.startsWith('https://')) {
                ALLOWED_ORIGINS.add(new URL(item).origin);
                ALLOWED_HOSTNAMES.add(new URL(item).hostname);
            } else {
                ALLOWED_HOSTNAMES.add(item);
            }
        } catch (_) { /* ignore malformed */ }
    }

    // Naive registrable base domain (e.g., sub.domain.tld -> domain.tld). This is a heuristic, not PSL-aware.
    function baseDomain(hostname) {
        const parts = String(hostname || '').split('.');
        return parts.length >= 2 ? parts.slice(-2).join('.') : hostname;
    }
    const START_BASE_DOMAIN = baseDomain(new URL(startUrl).hostname);

    // Default extra paths commonly used on school websites (will be resolved against START_ORIGIN)
    const DEFAULT_EXTRA_PATHS = [
      '/schulleitung', '/schulleitung/', '/leitung',
      '/termine', '/aktuelles', '/news',
      '/impressum', 'menschen','/kontakt'
    ];

    if (process.env.CRAWL_USE_PUPPETEER === '1') {
        console.log('Running in Puppeteer mode (JS-rendered pages supported).');
    }

    const visited = new Set();
    const texts = [];
    const REQUEST_DELAY_MS = 200; // polite delay between requests
    const USER_AGENT = 'SchoolCrawler/1.0'; // identify the crawler
    const MIN_CHARS = parseInt(process.env.CRAWL_MIN_CHARS || '20', 10);
    const MAX_DEPTH = parseInt(process.env.CRAWL_MAX_DEPTH || '2', 10); // limit link-following depth (0 = only seeds)
    const EXTRA_START_URLS = (process.env.CRAWL_START_URLS || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

    const USE_PUPPETEER = process.env.CRAWL_USE_PUPPETEER === '1';
    let browser = null;
    let page = null;
    const NETWORK_URLS = new Set();

    // --- Next.js route discovery (no external deps) ---
    const CODE_SCAN_ENABLED = process.env.CRAWL_SCAN_CODE === '1';

    function isCodeFile(file) {
        return /\.(tsx|ts|jsx|js)$/.test(file);
    }

    function hasDynamicSegment(p) {
        // matches [id], [...slug], [[...slug]]
        return /\[(?:\.\.\.|\[?\.\.\.)?[^\]]+\]/.test(p);
    }

    function walkDirSync(dir) {
        const out = [];
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const e of entries) {
                const full = path.join(dir, e.name);
                if (e.isDirectory()) {
                    out.push(...walkDirSync(full));
                } else {
                    out.push(full);
                }
            }
        } catch (_) {}
        return out;
    }

    function routesFromPages(pagesDir) {
        const routes = [];
        const files = walkDirSync(pagesDir).filter(isCodeFile);
        for (const f of files) {
            const rel = path.relative(pagesDir, f).replace(/\\/g, '/');
            if (!rel) continue;
            if (rel.startsWith('api/')) continue;
            const segs = rel.split('/');
            if (segs.some(s => s.startsWith('_'))) continue; // skip _app, _document, _error, etc.
            if (hasDynamicSegment(rel)) continue; // skip dynamic routes unless you provide params
            let urlPath = '/' + rel.replace(/\.(tsx|ts|jsx|js)$/i, '');
            urlPath = urlPath.replace(/\/index$/i, '/');
            urlPath = urlPath.replace(/\/\/+/, '/');
            routes.push(urlPath);
        }
        return Array.from(new Set(routes));
    }

    function routesFromApp(appDir) {
        const routes = [];
        // In the app router, a route exists where a folder contains page.(ts|tsx|js|jsx)
        const files = walkDirSync(appDir);
        for (const f of files) {
            if (!/\/page\.(tsx|ts|jsx|js)$/i.test(f)) continue;
            const relDir = path.dirname(path.relative(appDir, f)).replace(/\\/g, '/');
            if (hasDynamicSegment(relDir)) continue;
            let urlPath = '/' + relDir;
            if (urlPath === '/.' || urlPath === '/' || urlPath === '/index') urlPath = '/';
            urlPath = urlPath.replace(/\/\/+/, '/');
            routes.push(urlPath);
        }
        return Array.from(new Set(routes));
    }

    function discoverNextRoutes() {
        const projectRoot = process.cwd();
        const srcDir = path.join(projectRoot, 'dietrich-bonhoeffer-realschule-website');
        // If repo root is already that folder, fall back to current
        const baseDir = fs.existsSync(srcDir) ? srcDir : projectRoot;
        const pagesDir = path.join(baseDir, 'src', 'pages');
        const appDir = path.join(baseDir, 'src', 'app');
        let routes = [];
        if (fs.existsSync(pagesDir)) routes = routes.concat(routesFromPages(pagesDir));
        if (fs.existsSync(appDir)) routes = routes.concat(routesFromApp(appDir));
        routes = Array.from(new Set(routes.length ? routes : ['/']));
        return routes;
    }
    // --- end Next.js route discovery ---

    function normalizeUrl(u) {
        // drop fragment (except preserve hash-routes like `/#/` as-is to keep them distinct if present)
        if (!u.includes('/#/')) {
            u = u.split('#')[0];
        }
        if (u.endsWith('/')) u = u.slice(0, -1);
        return u;
    }

    async function ensureBrowser() {
        if (!USE_PUPPETEER) return;
        if (!_puppeteer) {
            try {
                _puppeteer = (await import('puppeteer')).default;
            } catch (e) {
                console.error('Puppeteer not installed. Run: npm i puppeteer');
                throw e;
            }
        }
        if (!browser) {
            if (process.env.PUPPETEER_CACHE_DIR) {
                try { fs.mkdirSync(process.env.PUPPETEER_CACHE_DIR, { recursive: true }); } catch {}
            }
            browser = await _puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--no-zygote',
                    '--disable-features=site-per-process'
                ]
                // executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
            });
            page = await browser.newPage();
            await page.setUserAgent(USER_AGENT);
            page.on('response', async (res) => {
                try {
                    const url = res.url();
                    const ct = String(res.headers()['content-type'] || '');
                    if (!/text\/html/i.test(ct)) return;
                    const u = new URL(url);
                    const candHost = u.hostname;
                    const candOrigin = u.origin;
                    const sameOrigin = candOrigin === START_ORIGIN;
                    const sameBaseDomain = baseDomain(candHost) === START_BASE_DOMAIN;
                    const allowedByOrigin = ALLOWED_ORIGINS.has(candOrigin);
                    const allowedByHostname = ALLOWED_HOSTNAMES.has(candHost) || ALLOWED_HOSTNAMES.has(baseDomain(candHost));
                    if (sameOrigin || sameBaseDomain || allowedByOrigin || allowedByHostname) {
                        NETWORK_URLS.add(normalizeUrl(u.toString()));
                    }
                } catch (_) {}
            });
        }
    }

    async function closeBrowser() {
        if (browser) {
            try { await browser.close(); } catch (_) {}
            browser = null;
            page = null;
        }
    }

    async function seedFromSitemap() {
        const candidates = [
            new URL('/sitemap.xml', startUrl).toString(),
            new URL('/sitemap_index.xml', startUrl).toString()
        ];
        candidates.push(new URL('/sitemap_index.xml.gz', startUrl).toString());
        const seeds = [];
        for (const smUrl of candidates) {
            try {
                const res = await axios.get(smUrl, {
                    headers: { 'User-Agent': USER_AGENT },
                    timeout: 15000,
                    validateStatus: s => s >= 200 && s < 400
                });
                const ct = String(res.headers?.['content-type'] || '');
                if (!/(xml|text)/i.test(ct)) continue;
                const $xml = cheerioLoad(res.data, { xmlMode: true });
                // handle sitemap index and regular sitemap
                $xml('sitemap > loc, url > loc').each((_, el) => {
                    const loc = $xml(el).text().trim();
                    if (!loc) return;
                    try {
                        const u = new URL(loc);
                        if (u.origin !== START_ORIGIN) return;
                        const n = normalizeUrl(u.toString());
                        if (!seeds.includes(n)) seeds.push(n);
                    } catch (_) { /* ignore */ }
                });
            } catch (_) { /* ignore missing sitemap */ }
        }
        return seeds;
    }

    async function fetchHtml(url) {
        if (USE_PUPPETEER) {
            await ensureBrowser();
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
            // try to load lazy content
            await page.evaluate(async () => {
                await new Promise(r => { let y = 0; const i = setInterval(() => { window.scrollTo(0, y += 400); if (y > (document.body.scrollHeight || 2000)) { clearInterval(i); r(); } }, 120); });
            });
            // try to open common menus/toggles to expose links
            const toggleSelectors = [
                'button[aria-label*="men" i]','button[aria-label*="nav" i]','[role="button"][aria-label*="menu" i]','[role="button"][aria-label*="navigation" i]',
                '.menu','.burger','.navbar-burger','.nav-toggle','button.hamburger','button.menu-toggle'
            ];
            for (const sel of toggleSelectors) {
                const els = await page.$$(sel);
                for (const el of els) { try { await el.click({ delay: 20 }); } catch (_) {} }
            }
            await sleep(250);
            // optional small delay for JS-rendered content
            await sleep(150);
            const html = await page.content();
            return { html, contentType: 'text/html' };
        } else {
            const response = await axios.get(url, {
                headers: { 'User-Agent': USER_AGENT },
                timeout: 15000,
                validateStatus: s => s >= 200 && s < 400
            });
            const contentType = response.headers && response.headers['content-type'] ? String(response.headers['content-type']) : '';
            return { html: response.data, contentType };
        }
    }

    // Helper function to extract clean, normalized text from a Cheerio instance
    function extractCleanText($) {
        // Prefer likely content containers; fall back to body
        let $root = $('main').first();
        if (!$root.length) $root = $('[role="main"]').first();
        if (!$root.length) $root = $('article').first();
        if (!$root.length) $root = $('section').first();
        if (!$root.length) $root = $('body');

        // Work on a clone so we don't mutate the original DOM
        const $clone = $root.clone();

        // Remove common noise and non-content elements
        $clone.find('script, style, noscript, template, iframe, svg, canvas, link, meta, header, footer, nav, form, input, select, textarea, button, aside, picture, source').remove();

        // Do NOT remove nodes by text-content (too aggressive) – instead scrub tokens from the final text

        // Extract raw text first
        let text = $clone.text() || '';

        // Scrub typical Next.js streaming/AppShell tokens and asset noise from the raw text
        text = text
            // obvious stream markers / tokens
            .replace(/self\.__next_f/gi, ' ')
            .replace(/#nprogress/gi, ' ')
            // chunk and asset paths
            .replace(/static\/chunks\/[^\s"']+/gi, ' ')
            // long hex-like ids (to cut down on bundle artifact residue)
            .replace(/\b[a-f0-9]{8,}\b/gi, ' ');

        // Normalize whitespace/punctuation a bit
        const cleaned = text
            .replace(/\u00A0/g, ' ') // nbsp -> space
            .replace(/\s+/g, ' ')    // collapse whitespace
            .replace(/\s*([,:;.!?])\s*/g, '$1 ') // tidy punctuation spacing
            .replace(/^[\s·•\-–—]+/g, '')
            .trim();

        return cleaned;
    }

    async function crawl(url, depth = 0) {
        if (visited.has(url)) return;
        visited.add(url);
        console.log(`Crawling: ${url} (${visited.size}) depth=${depth}`);
        if (depth > MAX_DEPTH) {
            return; // reached maximum depth
        }
        await sleep(REQUEST_DELAY_MS);
        try {
            const { html, contentType } = await fetchHtml(url);
            if (!/text\/html/i.test(String(contentType))) {
                return;
            }
            const data = html;
            const $ = cheerioLoad(data);
            const pageText = extractCleanText($);
            if (pageText && pageText.length >= MIN_CHARS) {
                texts.push(pageText);
            } else {
                console.log(`[CRAWL] No meaningful text extracted for: ${url} (len=${pageText ? pageText.length : 0}, min=${MIN_CHARS})`);
            }

            const current = new URL(url);
            const links = [];

            if (USE_PUPPETEER && page) {
                // Get post-rendered anchor hrefs (covers many SPA cases)
                let hrefs = await page.$$eval('a[href]', els => els.map(a => a.getAttribute('href')).filter(Boolean));
                // Include common SPA hash-route anchors explicitly
                const hashHrefs = await page.$$eval('a[href^="#/"]', els => els.map(a => a.getAttribute('href')).filter(Boolean));
                hrefs = hrefs.concat(hashHrefs);
                hrefs = hrefs.concat(Array.from(NETWORK_URLS));

                for (const href of hrefs) {
                    if (/^(mailto:|tel:|javascript:)/i.test(href)) continue;
                    let candidate;
                    try {
                        candidate = new URL(href, current.href);
                    } catch (_) { continue; }

                    const candHost = candidate.hostname;
                    const candOrigin = candidate.origin;
                    const sameOrigin = candOrigin === START_ORIGIN;
                    const sameBaseDomain = baseDomain(candHost) === START_BASE_DOMAIN;
                    const allowedByOrigin = ALLOWED_ORIGINS.has(candOrigin);
                    const allowedByHostname = ALLOWED_HOSTNAMES.has(candHost) || ALLOWED_HOSTNAMES.has(baseDomain(candHost));
                    if (!(sameOrigin || sameBaseDomain || allowedByOrigin || allowedByHostname)) continue;

                    let nextUrl = normalizeUrl(candidate.toString());
                    if (/\.(pdf|jpg|jpeg|png|gif|webp|svg|zip|rar|7z|mp3|mp4|avi|mov|wmv|doc|docx|ppt|pptx|xls|xlsx|ics)$/i.test(nextUrl.split('?')[0])) continue;
                    if (!visited.has(nextUrl) && !links.includes(nextUrl)) links.push(nextUrl);
                }
            } else {
                $('a[href]').each((_, el) => {
                    const href = $(el).attr('href');
                    if (!href) return;
                    if (/^(mailto:|tel:|javascript:)/i.test(href)) return;
                    let candidate;
                    try {
                        candidate = new URL(href, current.href);
                    } catch (_) { return; }

                    const candHost = candidate.hostname;
                    const candOrigin = candidate.origin;
                    const sameOrigin = candOrigin === START_ORIGIN;
                    const sameBaseDomain = baseDomain(candHost) === START_BASE_DOMAIN;
                    const allowedByOrigin = ALLOWED_ORIGINS.has(candOrigin);    
                    const allowedByHostname = ALLOWED_HOSTNAMES.has(candHost) || ALLOWED_HOSTNAMES.has(baseDomain(candHost));
                    if (!(sameOrigin || sameBaseDomain || allowedByOrigin || allowedByHostname)) return;

                    let nextUrl = normalizeUrl(candidate.toString());
                    if (/\.(pdf|jpg|jpeg|png|gif|webp|svg|zip|rar|7z|mp3|mp4|avi|mov|wmv|doc|docx|ppt|pptx|xls|xlsx|ics)$/i.test(nextUrl.split('?')[0])) return;
                    if (!visited.has(nextUrl) && !links.includes(nextUrl)) links.push(nextUrl);
                });
            }

            if (USE_PUPPETEER) {
                NETWORK_URLS.clear();
            }

            for (const link of links) {
                await crawl(link, depth + 1);
            }
        } catch (err) {
            console.error('Error crawling', url, err.message);
        }
    }

    if (CODE_SCAN_ENABLED) {
        const routes = discoverNextRoutes();
        const urls = routes.map(r => new URL(r, START_ORIGIN).toString()).map(normalizeUrl);
        console.log(`Discovered ${urls.length} Next.js route(s) from code.`);
        for (const u of urls) {
            await crawl(u);
        }
    }

    // Try to pre-seed the crawl from sitemap entries (if available)
    try {
        const seeds = await seedFromSitemap();
        for (const u of seeds) {
            await crawl(u, 0);
        }
        console.log(`Seeded ${seeds.length} URLs from sitemap.`);
    } catch (_) { /* non-fatal */ }

    // Also seed from default extra paths and user-provided extra URLs
    try {
        const extraFromDefaults = DEFAULT_EXTRA_PATHS
            .map(p => {
                try { return new URL(p, START_ORIGIN).toString(); } catch (_) { return null; }
            })
            .filter(Boolean)
            .map(normalizeUrl);

        const extraFromEnv = EXTRA_START_URLS
            .map(u => {
                try { return new URL(u, START_ORIGIN).toString(); } catch (_) { return null; }
            })
            .filter(Boolean)
            .map(normalizeUrl);

        const extraSeeds = Array.from(new Set([...extraFromDefaults, ...extraFromEnv]));
        for (const u of extraSeeds) {
            await crawl(u, 0);
        }
        console.log(`Seeded ${extraSeeds.length} extra URL(s).`);
    } catch (_) { /* non-fatal */ }

    await crawl(startUrl, 0);
    console.log(`Total pages crawled: ${visited.size}`);

    // compact texts a bit (remove exact duplicates)
    const uniqueTexts = Array.from(new Set(texts));

    // write result to docx
    const doc = new Document({
        sections: [
            {
                properties: {},
                children: uniqueTexts.map(t => new Paragraph(t)),
            },
        ],
    });
    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync('output.docx', buffer);
    console.log('Website crawl finished. Saved to output.docx');

    await closeBrowser();

    return texts; // optionally return the collected texts (docChunks)
}

export { crawlWebsite };


if (import.meta.url === `file://${process.argv[1]}`) {
    crawlWebsite()
        .then(() => {
            console.log('Crawling completed.');
        })
        .catch(err => {
            console.error('Crawling failed:', err);
            process.exitCode = 1;
        });
}