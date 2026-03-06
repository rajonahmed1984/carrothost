# Audit Report - CarrotHost

## Stack Summary
- Backend: PHP 7.4+ with a single `config.php` and procedural templates.
- Frontend: HTML5, CSS3, vanilla JavaScript; Font Awesome CDN; Google Fonts (Sora).
- Templates: Custom PHP includes (`includes/header.php`, `includes/footer.php`); per-page PHP files set `$pageTitle`, `$metaDescription`, `$metaKeywords`.
- Assets: Static CSS/JS (`assets/css/style.css`, `assets/css/components.css`, `assets/js/main.js`); no build pipeline or bundler.
- Hosting assumptions: Apache with `mod_rewrite`; `.htaccess` handles SEO URLs, gzip, cache headers, and security headers.

## Current Structure
- Header: `includes/header.php`
- Footer: `includes/footer.php`
- Config/constants: `config.php` (+ optional `config.local.php` for secrets)
- Core pages:
  - `index.php`
  - `cpanel-hosting.php`
  - `webuzo-hosting.php`
  - `domain-register.php`
  - `domain-transfer.php`
  - `bdix-vps.php`
  - `xeon-vps.php`
  - `ryzen-vps.php`
  - `dedicated-server.php`
- APIs:
  - `api/currency-switcher.php`
  - `api/whmcs-domain-check.php`
  - `api/whmcs-domain-pricing.php`
- SEO files:
  - `robots.txt`
  - `sitemap.php` (rewritten to `/sitemap.xml` via `.htaccess`)

## Routing
`.htaccess` removes `.php` extensions and rewrites `/sitemap.xml` to `sitemap.php`.
- `/` -> `index.php`
- `/cpanel-hosting` -> `cpanel-hosting.php`
- `/webuzo-hosting` -> `webuzo-hosting.php`
- `/domain-register` -> `domain-register.php`
- `/domain-transfer` -> `domain-transfer.php`
- `/bdix-vps` -> `bdix-vps.php`
- `/xeon-vps` -> `xeon-vps.php`
- `/ryzen-vps` -> `ryzen-vps.php`
- `/dedicated-server` -> `dedicated-server.php`

## Existing SEO Inventory
- Meta tags (title/description/keywords/author) set in `includes/header.php`.
- Canonical in `includes/header.php` based on `basename($_SERVER['PHP_SELF'])`.
- OpenGraph + Twitter Card tags in `includes/header.php`.
- JSON-LD `HostingBusiness` in `includes/header.php`; optional `$additionalSchema` per page (home uses Product schema).
- `robots.txt` references `/sitemap.xml`; `sitemap.php` emits a dynamic sitemap.
- Site verification files exist: `googleff102cbf176e0195.html`, `BingSiteAuth.xml`.

## Analytics Inventory
- No Google Tag Manager / GA4 / Yandex Metrica scripts found in templates or assets.
- References appear only in docs (`README.md`, `QUICK-START.md`) and not implemented.

## Risks and Gaps
- Canonical uses `basename($_SERVER['PHP_SELF'])`, so `/` becomes `/index`; this can cause duplicate canonical URLs.
- `.htaccess` points to `404.php` and `500.php` but those files do not exist.
- `assets/css/components.css` is linked inside page bodies (after `includes/header.php`), not in `<head>`.
- Currency conversion rate is hard-coded in `assets/js/main.js` (120) and not sourced from `config.php`.
- Domain availability and pricing rely on WHMCS API credentials; missing values return 500 in API endpoints.
- `meta name="google-site-verification"` uses a filename, not a token value, which may be invalid.

## Quick Wins
- Move the `components.css` link into the `<head>` via the header include for proper CSS loading.
- Fix canonical URL logic to use the clean route path (`/` vs `/index`).
- Add `404.php`/`500.php` or update `.htaccess` to valid error handlers.
- Expose `USD_TO_BDT_RATE` via `data-*` or inline script so JS uses the configured rate.
- Add missing analytics snippets once IDs are verified from `https://carrothost.com/wp/` or other site pages.

## Implementation Plan (Step-by-Step)
1. Confirm global templates and routing; update canonical strategy and error handling.
2. Locate existing Google/Yandex analytics IDs from `https://carrothost.com/wp/` or other public pages and plan global insertion points.
3. Establish design tokens and global header/footer upgrades with a consistent layout and CTAs.
4. Rebuild the home page structure (hero, trust, product tiles, feature grid, datacenter, testimonials, CTA).
5. Update shared hosting pages (cPanel + Webuzo) including pricing/feature sections and FAQs.
6. Update domain pages (register/transfer) with WHMCS search/transfer UX and error handling states.
7. Update VPS pages and dedicated server page with refreshed layouts, comparisons, and FAQs.
8. Implement SEO pack: unique titles/descriptions, schema (Organization, WebSite, BreadcrumbList, Product/Service, FAQPage), internal links, sitemap/robots validation.
9. Performance pass: image optimization, lazy loading, responsive images, and cache alignment.
10. QA: test WHMCS flows, forms, navigation, responsive behavior, and basic Lighthouse checks.
