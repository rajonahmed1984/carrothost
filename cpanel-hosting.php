<?php
/**
 * cPanel Hosting Page
 * Professional cPanel Web Hosting Plans
 */

require_once 'config.php';

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

<section class="section hero-section">
    <div class="container">
        <div class="service-hero hero-split">
            <div class="section-header">
                <span class="section-subtitle"><i class="fas fa-cpanel"></i> cPanel Hosting</span>
                <h1 class="section-title">cPanel hosting built for speed in Bangladesh</h1>
                <p class="section-description">
                    Launch on LiteSpeed, SSD storage, and daily backups with the control panel teams already know.
                    Get reliable uptime, free SSL, and local support you can reach any time.
                </p>
                <div class="hero-cta">
                    <a href="#plans" class="btn btn-primary">
                        <i class="fas fa-cart-shopping"></i> View Plans
                    </a>
                    <a href="https://wa.me/<?php echo WHATSAPP_NUMBER; ?>" class="btn btn-outline">
                        <i class="fab fa-whatsapp"></i> Talk to Support
                    </a>
                </div>
                <div class="hero-metrics">
                    <div class="hero-metric">
                        <strong>99.9%</strong>
                        <span>Uptime SLA</span>
                    </div>
                    <div class="hero-metric">
                        <strong>LiteSpeed</strong>
                        <span>Cache ready</span>
                    </div>
                    <div class="hero-metric">
                        <strong>24/7</strong>
                        <span>Local experts</span>
                    </div>
                </div>
            </div>
            <div class="hero-media">
                <!-- Unsplash: https://unsplash.com/photos/98d2b5aba04b -->
                <img src="<?php echo SITE_URL; ?>/img/cpanel-hero.jpg" alt="cPanel hosting dashboard on a laptop" loading="lazy">
                <div class="hero-callout">
                    <span>Performance Stack</span>
                    <strong>SSD + LiteSpeed</strong>
                </div>
                <div class="hero-callout hero-callout-secondary">
                    <span>Security</span>
                    <strong>Free SSL + Malware Scan</strong>
                </div>
            </div>
        </div>

        <div class="trust-strip">
            <div class="trust-item"><i class="fas fa-shield-halved"></i> Imunify AV+ protection</div>
            <div class="trust-item"><i class="fas fa-arrows-rotate"></i> Daily automated backups</div>
            <div class="trust-item"><i class="fas fa-server"></i> Tier III Dhaka DC</div>
            <div class="trust-item"><i class="fas fa-headset"></i> 24/7 support team</div>
        </div>
    </div>
</section>

<section class="section section-bg" id="plans">
    <div class="container">
        <div class="section-header">
            <span class="section-subtitle"><i class="fas fa-tags"></i> Pricing</span>
            <h2 class="section-title">Choose your cPanel plan</h2>
            <p class="section-description">
                All plans include LiteSpeed, free SSL, daily backups, and proactive security.
            </p>
        </div>

        <div class="pricing-grid">
            <div class="pricing-card" data-price-bdt="4800">
                <div class="pricing-icon">
                    <i class="fas fa-carrot"></i>
                </div>
                <h3 class="pricing-name">Orange Carrot</h3>

                <div class="pricing-price">
                    <div class="price-amount">
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
                    <div class="price-amount">
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
                    <div class="price-amount">
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

<section class="section" id="included">
    <div class="container">
        <div class="section-header">
            <span class="section-subtitle"><i class="fas fa-star"></i> Included With Every Plan</span>
            <h2 class="section-title">Everything you need to run a modern website</h2>
            <p class="section-description">
                Launch fast with built-in security, performance, and management tools.
            </p>
        </div>

        <div class="features-grid">
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-cpanel"></i>
                </div>
                <h3 class="feature-title">cPanel control panel</h3>
                <p class="feature-description">
                    Manage files, databases, and email with the industry standard interface.
                </p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-rocket"></i>
                </div>
                <h3 class="feature-title">LiteSpeed acceleration</h3>
                <p class="feature-description">
                    Cache-enabled hosting keeps WordPress, Laravel, and CMS sites fast.
                </p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-lock"></i>
                </div>
                <h3 class="feature-title">Free SSL + WAF</h3>
                <p class="feature-description">
                    Protect traffic with SSL and firewall rules that reduce attack risk.
                </p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-arrows-rotate"></i>
                </div>
                <h3 class="feature-title">Daily backups</h3>
                <p class="feature-description">
                    Restore files quickly with automatic backups retained for up to 30 days.
                </p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-envelope"></i>
                </div>
                <h3 class="feature-title">Professional email</h3>
                <p class="feature-description">
                    Create branded inboxes with webmail, IMAP, and spam protection.
                </p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-headset"></i>
                </div>
                <h3 class="feature-title">Local support team</h3>
                <p class="feature-description">
                    Get help from Bangladesh-based experts via WhatsApp or ticketing.
                </p>
            </div>
        </div>
    </div>
</section>

<section class="section section-bg">
    <div class="container">
        <div class="section-header">
            <span class="section-subtitle"><i class="fas fa-list-check"></i> Plan Comparison</span>
            <h2 class="section-title">Compare features at a glance</h2>
            <p class="section-description">
                All plans include SSL, LiteSpeed, daily backups, and 24/7 support.
            </p>
        </div>

        <div class="comparison-table-wrapper">
            <table class="comparison-table">
                <thead>
                    <tr>
                        <th>Feature</th>
                        <th>Orange</th>
                        <th>Blue</th>
                        <th>Red</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>Websites</strong></td>
                        <td>1</td>
                        <td>1</td>
                        <td>1</td>
                    </tr>
                    <tr>
                        <td><strong>SSD Storage</strong></td>
                        <td>10 GB</td>
                        <td>20 GB</td>
                        <td>30 GB</td>
                    </tr>
                    <tr>
                        <td><strong>Email Accounts</strong></td>
                        <td>10</td>
                        <td>20</td>
                        <td>30</td>
                    </tr>
                    <tr>
                        <td><strong>LiteSpeed Cache</strong></td>
                        <td><i class="fas fa-circle-check check-icon"></i></td>
                        <td><i class="fas fa-circle-check check-icon"></i></td>
                        <td><i class="fas fa-circle-check check-icon"></i></td>
                    </tr>
                    <tr>
                        <td><strong>Daily Backups</strong></td>
                        <td><i class="fas fa-circle-check check-icon"></i></td>
                        <td><i class="fas fa-circle-check check-icon"></i></td>
                        <td><i class="fas fa-circle-check check-icon"></i></td>
                    </tr>
                    <tr>
                        <td><strong>Free SSL</strong></td>
                        <td><i class="fas fa-circle-check check-icon"></i></td>
                        <td><i class="fas fa-circle-check check-icon"></i></td>
                        <td><i class="fas fa-circle-check check-icon"></i></td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</section>

<section class="section">
    <div class="container">
        <div class="section-header">
            <span class="section-subtitle"><i class="fas fa-circle-question"></i> FAQs</span>
            <h2 class="section-title">Common questions about cPanel hosting</h2>
        </div>

        <div class="faq-accordion">
            <details class="faq-item">
                <summary>Can you migrate my existing site?</summary>
                <p>Yes. Our team can help move your site and email with minimal downtime.</p>
            </details>
            <details class="faq-item">
                <summary>Is SSL included on all plans?</summary>
                <p>Every plan includes free SSL with auto-renewal at no extra charge.</p>
            </details>
            <details class="faq-item">
                <summary>Do you offer daily backups?</summary>
                <p>Yes. Automated backups run daily with easy restore options.</p>
            </details>
            <details class="faq-item">
                <summary>Can I upgrade later?</summary>
                <p>You can move to a higher plan or VPS as your traffic grows.</p>
            </details>
        </div>
    </div>
</section>

<section class="cta-section">
    <div class="container">
        <h2 class="section-title">Ready to launch on cPanel?</h2>
        <p class="section-description">
            Get fast setup, secure hosting, and a support team that knows Bangladesh businesses.
        </p>
        <div class="cta-buttons">
            <a href="<?php echo WHMCS_CART_URL; ?>" class="btn btn-lg">
                <i class="fas fa-cart-shopping"></i> Order Now
            </a>
            <a href="https://wa.me/<?php echo WHATSAPP_NUMBER; ?>" class="btn btn-outline btn-lg">
                <i class="fab fa-whatsapp"></i> Chat with Us
            </a>
        </div>
    </div>
</section>

<?php include 'includes/footer.php'; ?>
