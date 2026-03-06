<?php
/**
 * cPanel Hosting Page
 * Professional cPanel Web Hosting Plans
 */

require_once 'config.php';

$pageTheme = 'cpanel';

$pageTitle = 'cPanel Hosting Plans - Fast & Secure Web Hosting';
$metaDescription = 'Professional cPanel hosting in Bangladesh with SSD storage, free SSL, LiteSpeed, daily backups, and 24/7 support. Plans start from just BDT 500/month.';
$metaKeywords = 'cpanel hosting bangladesh, cpanel web hosting, ssd cpanel hosting, cheap cpanel hosting bd, cpanel hosting price';

$cpanelBreadcrumb = [
    ['name' => 'Home', 'url' => buildCanonicalUrlFromPath('')],
    ['name' => 'cPanel Hosting', 'url' => buildCanonicalUrlFromPath('cpanel-hosting')]
];
$cpanelFaq = [
    ['question' => 'Is SSL included on every plan?', 'answer' => 'Yes, we provide free Let\'s Encrypt SSL certificates that renew automatically.'],
    ['question' => 'What kind of backups do you run?', 'answer' => 'Daily automated backups are included with easy restore options for all plans.'],
    ['question' => 'Can I migrate my site?', 'answer' => 'Our team assists with migrating WordPress, ecommerce, or business sites with minimal downtime.'],
    ['question' => 'Is LiteSpeed available?', 'answer' => 'All cPanel plans run on LiteSpeed-powered servers for superior performance.' ]
];
$cpanelOffers = [
    '@type' => 'AggregateOffer',
    'priceCurrency' => 'BDT',
    'lowPrice' => '4800',
    'highPrice' => '14400',
    'offerCount' => 3
];
$schemaParts = [
    buildBreadcrumbSchema($cpanelBreadcrumb),
    buildServiceSchema('Service', 'cPanel Hosting', 'Professional cPanel web hosting with LiteSpeed, free SSL, daily backups, and 24/7 support.', SITE_URL . '/cpanel-hosting', $cpanelOffers),
    buildFaqSchema($cpanelFaq)
];
$additionalSchema = implode("\n", array_filter($schemaParts));

include 'includes/header.php';
?>

<section class="section hero-section hero-dashboard">
    <div class="container">
        <div class="hero-grid">
            <div class="hero-copy">
                <span class="badge"><i class="fas fa-cpanel"></i> cPanel Hosting</span>
                <h1>Control panel hosting made simple</h1>
                <p>Manage sites, email, databases, and backups from the dashboard you already know. Powered by LiteSpeed, SSD, and 24/7 local support.</p>
                <div class="hero-actions">
                    <a href="#plans" class="btn btn-primary"><i class="fas fa-rocket"></i> Buy cPanel Hosting</a>
                    <a href="#compare" class="btn btn-outline"><i class="fas fa-layer-group"></i> Compare Plans</a>
                </div>
                <div class="hero-quick-specs">
                    <div class="chip"><i class="fas fa-lock"></i> Free SSL</div>
                    <div class="chip"><i class="fas fa-database"></i> NVMe Storage</div>
                    <div class="chip"><i class="fas fa-gauge-high"></i> LiteSpeed</div>
                    <div class="chip"><i class="fas fa-headset"></i> 24/7 Support</div>
                </div>
            </div>
            <div class="hero-visual">
                <div class="dashboard-frame">
                    <div class="frame-top">
                        <span class="dot red"></span>
                        <span class="dot yellow"></span>
                        <span class="dot green"></span>
                        <span class="frame-title">cPanel Dashboard</span>
                    </div>
                    <div class="frame-body">
                        <div class="frame-sidebar">
                            <span><i class="fas fa-folder-open"></i> File Manager</span>
                            <span><i class="fas fa-envelope"></i> Email</span>
                            <span><i class="fas fa-database"></i> MySQL</span>
                            <span><i class="fas fa-shield-alt"></i> Security</span>
                        </div>
                        <div class="frame-main">
                            <div class="widget">
                                <p>Resource Usage</p>
                                <div class="widget-bar"><span style="width:68%"></span></div>
                            </div>
                            <div class="widget-grid">
                                <div class="widget-card"><i class="fas fa-cloud-upload-alt"></i> Backups</div>
                                <div class="widget-card"><i class="fas fa-rocket"></i> LiteSpeed</div>
                                <div class="widget-card"><i class="fas fa-shield-halved"></i> SSL</div>
                                <div class="widget-card"><i class="fas fa-copy"></i> One-click Apps</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<section class="section section-bg" id="plans">
    <div class="container">
        <div class="section-header">
            <span class="section-subtitle"><i class="fas fa-tags"></i> Pricing</span>
            <h2 class="section-title">Choose your cPanel plan</h2>
            <p class="section-description">LiteSpeed, free SSL, daily backups, malware scan, and proactive support included on every plan.</p>
        </div>

        <div class="pricing-grid">
            <div class="pricing-card" data-price-bdt="4800">
                <div class="pricing-icon">
                    <i class="fas fa-carrot"></i>
                </div>
                <h3 class="pricing-name">Orange Carrot</h3>

                <div class="pricing-price">
                    <div class="price-amount" data-price-bdt="4800">
                        <span class="price-currency"><?php echo convertPrice(4800)['symbol']; ?></span>
                        <span class="price-number"><?php echo convertPrice(4800)['amount']; ?></span>
                        <span class="price-period">/year</span>
                    </div>
                    <p class="price-note">Best for new sites</p>
                </div>

                <ul class="pricing-features">
                    <li><i class="fas fa-circle-check"></i> 1 Website</li>
                    <li><i class="fas fa-circle-check"></i> 10 Email Accounts</li>
                    <li><i class="fas fa-circle-check"></i> 2 GB Email Storage</li>
                    <li><i class="fas fa-circle-check"></i> 10 GB SSD Storage</li>
                    <li><i class="fas fa-circle-check"></i> LiteSpeed Cache</li>
                    <li><i class="fas fa-circle-check"></i> Free SSL</li>
                    <li><i class="fas fa-circle-check"></i> Daily Backups</li>
                </ul>

                <a href="<?php echo getWHMCSProductURL(1); ?>" class="btn btn-primary pricing-cta" data-whmcs-product="1">
                    Order Now
                </a>
            </div>

            <div class="pricing-card featured" data-price-bdt="9600">
                <span class="pricing-badge">Most Popular</span>
                <div class="pricing-icon">
                    <i class="fas fa-carrot"></i>
                </div>
                <h3 class="pricing-name">Blue Carrot</h3>

                <div class="pricing-price">
                    <div class="price-amount" data-price-bdt="9600">
                        <span class="price-currency"><?php echo convertPrice(9600)['symbol']; ?></span>
                        <span class="price-number"><?php echo convertPrice(9600)['amount']; ?></span>
                        <span class="price-period">/year</span>
                    </div>
                    <p class="price-note">For growing brands</p>
                </div>

                <ul class="pricing-features">
                    <li><i class="fas fa-circle-check"></i> 1 Website</li>
                    <li><i class="fas fa-circle-check"></i> 20 Email Accounts</li>
                    <li><i class="fas fa-circle-check"></i> 4 GB Email Storage</li>
                    <li><i class="fas fa-circle-check"></i> 20 GB SSD Storage</li>
                    <li><i class="fas fa-circle-check"></i> LiteSpeed Cache</li>
                    <li><i class="fas fa-circle-check"></i> Free SSL</li>
                    <li><i class="fas fa-circle-check"></i> Daily Backups</li>
                </ul>

                <a href="<?php echo getWHMCSProductURL(2); ?>" class="btn btn-primary pricing-cta" data-whmcs-product="2">
                    Order Now
                </a>
            </div>

            <div class="pricing-card" data-price-bdt="14400">
                <div class="pricing-icon">
                    <i class="fas fa-carrot"></i>
                </div>
                <h3 class="pricing-name">Red Carrot</h3>

                <div class="pricing-price">
                    <div class="price-amount" data-price-bdt="14400">
                        <span class="price-currency"><?php echo convertPrice(14400)['symbol']; ?></span>
                        <span class="price-number"><?php echo convertPrice(14400)['amount']; ?></span>
                        <span class="price-period">/year</span>
                    </div>
                    <p class="price-note">For busy stores</p>
                </div>

                <ul class="pricing-features">
                    <li><i class="fas fa-circle-check"></i> 1 Website</li>
                    <li><i class="fas fa-circle-check"></i> 30 Email Accounts</li>
                    <li><i class="fas fa-circle-check"></i> 6 GB Email Storage</li>
                    <li><i class="fas fa-circle-check"></i> 30 GB SSD Storage</li>
                    <li><i class="fas fa-circle-check"></i> LiteSpeed Cache</li>
                    <li><i class="fas fa-circle-check"></i> Free SSL</li>
                    <li><i class="fas fa-circle-check"></i> Daily Backups</li>
                </ul>

                <a href="<?php echo getWHMCSProductURL(3); ?>" class="btn btn-primary pricing-cta" data-whmcs-product="3">
                    Order Now
                </a>
            </div>
        </div>
    </div>
</section>

<section class="section tools-strip" id="tools">
    <div class="container">
        <div class="strip-grid">
            <div class="tool-card"><i class="fas fa-folder-open"></i> File Manager</div>
            <div class="tool-card"><i class="fas fa-envelope"></i> Email Accounts</div>
            <div class="tool-card"><i class="fas fa-database"></i> MySQL & phpMyAdmin</div>
            <div class="tool-card"><i class="fas fa-download"></i> One-click Installer</div>
            <div class="tool-card"><i class="fas fa-cloud-upload-alt"></i> Backups & Restore</div>
            <div class="tool-card"><i class="fas fa-shield-halved"></i> SSL & Security</div>
        </div>
    </div>
</section>

<section class="section" id="inside-cpanel">
    <div class="container">
        <div class="section-header">
            <span class="section-subtitle"><i class="fas fa-window-restore"></i> Inside cPanel</span>
            <h2 class="section-title">Manage everything from one dashboard</h2>
            <p class="section-description">Control domains, email, backups, and apps without touching the command line.</p>
        </div>

        <div class="panel-showcase">
            <div class="panel-frame">
                <div class="frame-top">
                    <span class="dot red"></span>
                    <span class="dot yellow"></span>
                    <span class="dot green"></span>
                    <span class="frame-title">cPanel Preview</span>
                </div>
                <div class="frame-body">
                    <img src="<?php echo SITE_URL; ?>/img/cpanel-screenshot-placeholder.png" alt="cPanel interface preview" loading="lazy">
                </div>
            </div>
            <div class="panel-list">
                <h3>Manage faster with built-in tools</h3>
                <ul>
                    <li><i class="fas fa-link"></i> Domains, subdomains, redirects, DNS</li>
                    <li><i class="fas fa-envelope-open-text"></i> Email inboxes with spam filtering</li>
                    <li><i class="fas fa-database"></i> Databases with phpMyAdmin</li>
                    <li><i class="fas fa-sync"></i> Cron jobs and scheduling</li>
                    <li><i class="fas fa-shield-alt"></i> SSL, WAF, malware scanning</li>
                    <li><i class="fas fa-cloud-upload-alt"></i> Backup and restore in a click</li>
                </ul>
            </div>
        </div>
    </div>
</section>

<section class="section section-split" id="performance-security">
    <div class="container">
        <div class="split-grid">
            <div class="split-card">
                <h3><i class="fas fa-gauge-high"></i> Performance</h3>
                <ul>
                    <li><i class="fas fa-bolt"></i> LiteSpeed + HTTP/2/3</li>
                    <li><i class="fas fa-database"></i> NVMe storage for fast I/O</li>
                    <li><i class="fas fa-layer-group"></i> Server-level caching</li>
                    <li><i class="fas fa-sitemap"></i> Anycast DNS for faster resolution</li>
                </ul>
            </div>
            <div class="split-card">
                <h3><i class="fas fa-shield-alt"></i> Security</h3>
                <ul>
                    <li><i class="fas fa-lock"></i> Free SSL on every site</li>
                    <li><i class="fas fa-shield-halved"></i> WAF + malware scanning</li>
                    <li><i class="fas fa-cloud-upload-alt"></i> Daily backups with restore</li>
                    <li><i class="fas fa-user-shield"></i> Two-factor auth for client area</li>
                </ul>
            </div>
        </div>
    </div>
</section>

<section class="section section-accent" id="migration">
    <div class="container cta-band">
        <div>
            <h3>Free migration + real humans</h3>
            <p>Send us your cPanel login and we’ll migrate your sites, email, and SSL with zero downtime.</p>
            <div class="cta-buttons">
                <a href="<?php echo SUPPORT_TICKET_URL; ?>" class="btn btn-primary btn-sm"><i class="fas fa-paper-plane"></i> Request migration</a>
                <a href="https://wa.me/<?php echo WHATSAPP_NUMBER; ?>" class="btn btn-outline btn-sm"><i class="fab fa-whatsapp"></i> Chat now</a>
            </div>
        </div>
        <div class="cta-badges">
            <span><i class="fas fa-headset"></i> 24/7 support</span>
            <span><i class="fas fa-shield-halved"></i> Zero-downtime transfers</span>
        </div>
    </div>
</section>

<section class="section" id="faq">
    <div class="container">
        <div class="section-header">
            <span class="section-subtitle"><i class="fas fa-circle-question"></i> FAQs</span>
            <h2 class="section-title">Common questions about cPanel hosting</h2>
        </div>

        <div class="faq-accordion">
            <details class="faq-item">
                <summary>What is cPanel?</summary>
                <p>cPanel is a user-friendly control panel to manage websites, email, databases, DNS, and backups without using the command line.</p>
            </details>
            <details class="faq-item">
                <summary>Can I migrate my site?</summary>
                <p>Yes. We migrate cPanel accounts, websites, and email free of charge when you move to CarrotHost.</p>
            </details>
            <details class="faq-item">
                <summary>Do you provide SSL?</summary>
                <p>All plans include free SSL certificates with automatic renewals.</p>
            </details>
            <details class="faq-item">
                <summary>How many websites per plan?</summary>
                <p>Each plan supports 1 website to keep resources dedicated; upgrade or move to VPS for more sites.</p>
            </details>
        </div>
    </div>
</section>

<?php include 'includes/footer.php'; ?>
