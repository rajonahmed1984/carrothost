<?php
/**
 * Webuzo Hosting Page
 * VPS Hosting with Webuzo Control Panel
 */

require_once 'config.php';

$pageTitle = 'Webuzo VPS Hosting - Powerful VPS with Webuzo Panel';
$metaDescription = 'Affordable Webuzo VPS hosting with full root access, SSD storage, and one-click app management for developers, agencies, and growing businesses.';
$metaKeywords = 'webuzo hosting, webuzo vps, vps with webuzo, cheap webuzo hosting, webuzo control panel';

$webuzoBreadcrumb = [
    ['name' => 'Home', 'url' => buildCanonicalUrlFromPath('')],
    ['name' => 'Webuzo Hosting', 'url' => buildCanonicalUrlFromPath('webuzo-hosting')]
];
$webuzoFaq = [
    ['question' => 'Is Webuzo included on every VPS plan?', 'answer' => 'Yes, every VPS plan ships with the Webuzo control panel at no extra cost.'],
    ['question' => 'Can I install applications with one click?', 'answer' => 'Webuzo lets you install more than 450 applications including WordPress, Joomla, and Laravel.'],
    ['question' => 'Do I get root access?', 'answer' => 'Full root SSH access is available so you can configure your environment as needed.'],
    ['question' => 'Is there support for databases?', 'answer' => 'Webuzo includes phpMyAdmin and database management tools for MySQL/MariaDB.' ]
];
$webuzoOffers = [
    '@type' => 'AggregateOffer',
    'priceCurrency' => 'BDT',
    'lowPrice' => '4200',
    'highPrice' => '12000',
    'offerCount' => 3
];
$schemaParts = [
    buildBreadcrumbSchema($webuzoBreadcrumb),
    buildServiceSchema('Service', 'Webuzo VPS Hosting', 'VPS hosting bundled with the Webuzo control panel for faster app deployments and root control.', SITE_URL . '/webuzo-hosting', $webuzoOffers),
    buildFaqSchema($webuzoFaq)
];
$additionalSchema = implode("\n", array_filter($schemaParts));

include 'includes/header.php';
?>

<section class="section hero-section">
    <div class="container">
        <div class="service-hero hero-split">
            <div class="section-header">
                <span class="section-subtitle"><i class="fas fa-layer-group"></i> Webuzo VPS</span>
                <h1 class="section-title">VPS hosting with the Webuzo control panel</h1>
                <p class="section-description">
                    Combine VPS performance with a lightweight control panel. Launch apps, manage domains,
                    and scale resources with full root access and 24/7 local support.
                </p>
                <div class="hero-cta">
                    <a href="#plans" class="btn btn-primary">
                        <i class="fas fa-cart-shopping"></i> View Plans
                    </a>
                    <a href="https://wa.me/<?php echo WHATSAPP_NUMBER; ?>" class="btn btn-outline">
                        <i class="fab fa-whatsapp"></i> Talk to an Expert
                    </a>
                </div>
                <div class="hero-metrics">
                    <div class="hero-metric">
                        <strong>Full</strong>
                        <span>Root access</span>
                    </div>
                    <div class="hero-metric">
                        <strong>450+</strong>
                        <span>Apps ready</span>
                    </div>
                    <div class="hero-metric">
                        <strong>24/7</strong>
                        <span>Local support</span>
                    </div>
                </div>
            </div>
            <div class="hero-media">
                <!-- Unsplash: https://unsplash.com/photos/c5249f4df085 -->
                <img src="<?php echo SITE_URL; ?>/img/webuzo-hero.jpg" alt="Webuzo control panel workspace" loading="lazy">
                <div class="hero-callout">
                    <span>Performance</span>
                    <strong>NVMe SSD</strong>
                </div>
                <div class="hero-callout hero-callout-secondary">
                    <span>Security</span>
                    <strong>DDoS + Firewall</strong>
                </div>
            </div>
        </div>

        <div class="trust-strip">
            <div class="trust-item"><i class="fas fa-shield-halved"></i> DDoS protection</div>
            <div class="trust-item"><i class="fas fa-terminal"></i> Root SSH access</div>
            <div class="trust-item"><i class="fas fa-cloud-arrow-down"></i> One-click apps</div>
            <div class="trust-item"><i class="fas fa-headset"></i> 24/7 support</div>
        </div>
    </div>
</section>

<section class="section panel-showcase">
    <div class="container">
        <div class="panel-grid">
            <div class="panel-content">
                <span class="section-subtitle"><i class="fas fa-boxes-stacked"></i> Webuzo Control Panel facility</span>
                <h2 class="section-title">Manage your VPS with a clean, powerful dashboard</h2>
                <p class="section-description">
                    Webuzo keeps VPS management simple for developers, agencies, and SaaS teams.
                    Install apps in minutes, monitor resources, and manage domains without extra tooling.
                </p>
                <ul class="panel-list">
                    <li><i class="fas fa-check"></i> One-click installer for 450+ applications</li>
                    <li><i class="fas fa-check"></i> Built-in file manager and database tools</li>
                    <li><i class="fas fa-check"></i> Email, DNS, and SSL management in one place</li>
                    <li><i class="fas fa-check"></i> Resource monitoring for CPU, RAM, and bandwidth</li>
                    <li><i class="fas fa-check"></i> Git integration for faster deployments</li>
                </ul>
            </div>
            <div class="panel-illustration">
                <img src="<?php echo SITE_URL; ?>/img/page-header-tech.jpg" alt="Webuzo control panel interface illustration" loading="lazy">
            </div>
        </div>
    </div>
</section>

<section class="section section-bg" id="plans">
    <div class="container">
        <div class="section-header">
            <span class="section-subtitle"><i class="fas fa-tags"></i> Pricing</span>
            <h2 class="section-title">Webuzo VPS plans</h2>
            <p class="section-description">
                All plans include Webuzo control panel, root access, and managed support.
            </p>
        </div>

        <div class="pricing-grid">
            <div class="pricing-card" data-price-bdt="4200">
                <div class="pricing-icon">
                    <i class="fas fa-seedling"></i>
                </div>
                <h3 class="pricing-name">Starter</h3>

                <div class="pricing-price">
                    <div class="price-amount">
                        <span class="price-currency"><?php echo convertPrice(4200)['symbol']; ?></span>
                        <span class="price-number"><?php echo convertPrice(4200)['amount']; ?></span>
                        <span class="price-period">/year</span>
                    </div>
                    <p class="price-note">Entry-level VPS</p>
                </div>

                <ul class="pricing-features">
                    <li><i class="fas fa-circle-check"></i> 5 GB SSD Storage</li>
                    <li><i class="fas fa-circle-check"></i> 250 GB Bandwidth</li>
                    <li><i class="fas fa-circle-check"></i> 1 Website</li>
                    <li><i class="fas fa-circle-check"></i> KVM Virtualization</li>
                    <li><i class="fas fa-circle-check"></i> Webuzo Panel</li>
                    <li><i class="fas fa-circle-check"></i> Free SSL</li>
                </ul>

                <a href="<?php echo getWHMCSProductURL(10); ?>" class="btn btn-primary pricing-cta" data-whmcs-product="10">
                    Order Now
                </a>
            </div>

            <div class="pricing-card featured" data-price-bdt="8400">
                <span class="pricing-badge">Most Popular</span>
                <div class="pricing-icon">
                    <i class="fas fa-rocket"></i>
                </div>
                <h3 class="pricing-name">Standard</h3>

                <div class="pricing-price">
                    <div class="price-amount">
                        <span class="price-currency"><?php echo convertPrice(8400)['symbol']; ?></span>
                        <span class="price-number"><?php echo convertPrice(8400)['amount']; ?></span>
                        <span class="price-period">/year</span>
                    </div>
                    <p class="price-note">Balanced performance</p>
                </div>

                <ul class="pricing-features">
                    <li><i class="fas fa-circle-check"></i> 10 GB SSD Storage</li>
                    <li><i class="fas fa-circle-check"></i> 500 GB Bandwidth</li>
                    <li><i class="fas fa-circle-check"></i> 1 Website</li>
                    <li><i class="fas fa-circle-check"></i> KVM Virtualization</li>
                    <li><i class="fas fa-circle-check"></i> Webuzo Panel</li>
                    <li><i class="fas fa-circle-check"></i> Free SSL</li>
                </ul>

                <a href="<?php echo getWHMCSProductURL(11); ?>" class="btn btn-primary pricing-cta" data-whmcs-product="11">
                    Order Now
                </a>
            </div>

            <div class="pricing-card" data-price-bdt="12000">
                <div class="pricing-icon">
                    <i class="fas fa-server"></i>
                </div>
                <h3 class="pricing-name">Advanced</h3>

                <div class="pricing-price">
                    <div class="price-amount">
                        <span class="price-currency"><?php echo convertPrice(12000)['symbol']; ?></span>
                        <span class="price-number"><?php echo convertPrice(12000)['amount']; ?></span>
                        <span class="price-period">/year</span>
                    </div>
                    <p class="price-note">For demanding apps</p>
                </div>

                <ul class="pricing-features">
                    <li><i class="fas fa-circle-check"></i> 20 GB SSD Storage</li>
                    <li><i class="fas fa-circle-check"></i> 1000 GB Bandwidth</li>
                    <li><i class="fas fa-circle-check"></i> 1 Website</li>
                    <li><i class="fas fa-circle-check"></i> KVM Virtualization</li>
                    <li><i class="fas fa-circle-check"></i> Webuzo Panel</li>
                    <li><i class="fas fa-circle-check"></i> Free SSL</li>
                </ul>

                <a href="<?php echo getWHMCSProductURL(12); ?>" class="btn btn-primary pricing-cta" data-whmcs-product="12">
                    Order Now
                </a>
            </div>
        </div>
    </div>
</section>

<section class="section">
    <div class="container">
        <div class="section-header">
            <span class="section-subtitle"><i class="fas fa-bolt"></i> VPS Essentials</span>
            <h2 class="section-title">Modern VPS performance with simple management</h2>
            <p class="section-description">
                Webuzo keeps your VPS fast, secure, and ready for production workloads.
            </p>
        </div>

        <div class="features-grid">
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-server"></i>
                </div>
                <h3 class="feature-title">Full root control</h3>
                <p class="feature-description">
                    Configure services, install packages, and customize your stack with SSH access.
                </p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-network-wired"></i>
                </div>
                <h3 class="feature-title">KVM virtualization</h3>
                <p class="feature-description">
                    Guaranteed resources and isolated environments for predictable performance.
                </p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-bolt"></i>
                </div>
                <h3 class="feature-title">NVMe SSD storage</h3>
                <p class="feature-description">
                    Faster I/O for databases, ecommerce, and high-traffic applications.
                </p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-shield-halved"></i>
                </div>
                <h3 class="feature-title">DDoS protection</h3>
                <p class="feature-description">
                    Built-in mitigation and firewall rules protect your services.
                </p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-terminal"></i>
                </div>
                <h3 class="feature-title">Multiple OS options</h3>
                <p class="feature-description">
                    Choose Ubuntu, Debian, AlmaLinux, or CentOS based on your stack.
                </p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-headset"></i>
                </div>
                <h3 class="feature-title">24/7 expert support</h3>
                <p class="feature-description">
                    Bangladesh-based engineers are available whenever you need help.
                </p>
            </div>
        </div>
    </div>
</section>

<section class="section section-bg">
    <div class="container">
        <div class="section-header">
            <span class="section-subtitle"><i class="fas fa-circle-question"></i> FAQs</span>
            <h2 class="section-title">Questions about Webuzo VPS hosting</h2>
        </div>

        <div class="faq-accordion">
            <details class="faq-item">
                <summary>Is Webuzo included with every plan?</summary>
                <p>Yes. Every plan ships with the Webuzo control panel at no extra cost.</p>
            </details>
            <details class="faq-item">
                <summary>Can I install my own stack?</summary>
                <p>Yes. Root access allows you to install custom packages and frameworks.</p>
            </details>
            <details class="faq-item">
                <summary>Do you help with migrations?</summary>
                <p>Our team can assist with moving sites, databases, and email.</p>
            </details>
            <details class="faq-item">
                <summary>Is monthly billing available?</summary>
                <p>Monthly billing is available on VPS plans through the client area.</p>
            </details>
        </div>
    </div>
</section>

<section class="cta-section">
    <div class="container">
        <h2 class="section-title">Ready for VPS hosting with Webuzo?</h2>
        <p class="section-description">
            Get instant setup, full control, and a support team that understands your workloads.
        </p>
        <div class="cta-buttons">
            <a href="<?php echo WHMCS_CART_URL; ?>" class="btn btn-lg">
                <i class="fas fa-cart-shopping"></i> Order Now
            </a>
            <a href="https://wa.me/<?php echo WHATSAPP_NUMBER; ?>" class="btn btn-outline btn-lg">
                <i class="fab fa-whatsapp"></i> Talk to an Expert
            </a>
        </div>
    </div>
</section>

<?php include 'includes/footer.php'; ?>
