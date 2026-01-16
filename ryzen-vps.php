<?php
/**
 * Ryzen VPS Hosting Page
 * AMD Ryzen Powered VPS Servers
 */

require_once 'config.php';

$pageTheme = 'ryzen';

$pageTitle = 'Ryzen VPS Hosting - AMD Ryzen Powered Virtual Servers';
$metaDescription = 'High-performance Ryzen VPS hosting with AMD Ryzen processors, NVMe storage, and strong single-thread speed for gaming and CPU-intensive applications.';
$metaKeywords = 'ryzen vps, amd ryzen vps, ryzen vps hosting, gaming vps, high performance vps';

$ryzenBreadcrumb = [
    ['name' => 'Home', 'url' => buildCanonicalUrlFromPath('')],
    ['name' => 'Ryzen VPS', 'url' => buildCanonicalUrlFromPath('ryzen-vps')]
];
$ryzenFaq = [
    ['question' => 'Is Ryzen VPS good for gaming servers?', 'answer' => 'Yes, AMD Ryzen processors excel at single-thread speed, which is ideal for game servers.'],
    ['question' => 'Do you offer NVMe Gen4 SSDs?', 'answer' => 'All Ryzen plans include Gen4 NVMe SSD storage for maximum throughput.'],
    ['question' => 'Is DDoS protection included?', 'answer' => 'Yes, DDoS mitigation and firewall protections are included with every plan.'],
    ['question' => 'Can I scale resources later?', 'answer' => 'You can upgrade CPU, RAM, or storage anytime through the client area.' ]
];
$ryzenOffers = [
    '@type' => 'AggregateOffer',
    'priceCurrency' => 'BDT',
    'lowPrice' => '2800',
    'highPrice' => '9500',
    'offerCount' => 3
];
$schemaParts = [
    buildBreadcrumbSchema($ryzenBreadcrumb),
    buildServiceSchema('Service', 'Ryzen VPS Hosting', 'AMD Ryzen-powered VPS with high clock speeds, NVMe storage, and strong single-thread performance.', SITE_URL . '/ryzen-vps', $ryzenOffers),
    buildFaqSchema($ryzenFaq)
];
$additionalSchema = implode("\n", array_filter($schemaParts));

include 'includes/header.php';
?>

<section class="section hero-section">
    <div class="container">
        <div class="service-hero hero-split">
            <div class="section-header">
                <span class="section-subtitle"><i class="fab fa-amd"></i> Ryzen VPS</span>
                <h1 class="section-title">High-frequency Ryzen VPS for demanding workloads</h1>
                <p class="section-description">
                    Ryzen delivers fast single-thread performance for gaming, trading, and CPU-heavy apps.
                    Combine NVMe storage with reliable bandwidth and 24/7 support.
                </p>
                <div class="hero-cta">
                    <a href="#plans" class="btn btn-primary">
                        <i class="fas fa-bolt"></i> View Plans
                    </a>
                    <a href="https://wa.me/<?php echo WHATSAPP_NUMBER; ?>" class="btn btn-outline">
                        <i class="fab fa-whatsapp"></i> Get Consultation
                    </a>
                </div>
                <div class="hero-metrics">
                    <div class="hero-metric">
                        <strong>4.9 GHz</strong>
                        <span>Boost speed</span>
                    </div>
                    <div class="hero-metric">
                        <strong>NVMe</strong>
                        <span>Gen4 SSD</span>
                    </div>
                    <div class="hero-metric">
                        <strong>Unlimited</strong>
                        <span>Bandwidth</span>
                    </div>
                </div>
            </div>
            <div class="hero-media">
                <!-- Unsplash: https://unsplash.com/photos/47ba0277781c -->
                <img src="<?php echo SITE_URL; ?>/img/ryzen-hero.jpg" alt="Ryzen VPS performance workspace" loading="lazy">
                <div class="hero-callout">
                    <span>Ryzen Power</span>
                    <strong>High clock speed</strong>
                </div>
                <div class="hero-callout hero-callout-secondary">
                    <span>Storage</span>
                    <strong>Gen4 NVMe SSD</strong>
                </div>
            </div>
        </div>

        <div class="trust-strip">
            <div class="trust-item"><i class="fab fa-amd"></i> Ryzen processors</div>
            <div class="trust-item"><i class="fas fa-gauge-high"></i> High single-core speed</div>
            <div class="trust-item"><i class="fas fa-hard-drive"></i> NVMe SSD storage</div>
            <div class="trust-item"><i class="fas fa-shield-halved"></i> DDoS protection</div>
        </div>
    </div>
</section>

<section class="section section-bg" id="plans">
    <div class="container">
        <div class="section-header">
            <span class="section-subtitle"><i class="fas fa-tags"></i> Pricing</span>
            <h2 class="section-title">Ryzen VPS plans</h2>
            <p class="section-description">
                All plans include KVM virtualization, unlimited bandwidth, and instant setup.
            </p>
        </div>

        <div class="pricing-grid">
            <div class="pricing-card" data-price-bdt="2800">
                <div class="pricing-icon">
                    <i class="fas fa-rocket"></i>
                </div>
                <h3 class="pricing-name">Ryzen-1</h3>
                <p class="pricing-description">Perfect starter plan</p>

                <div class="pricing-price">
                    <div class="price-amount">
                        <span class="price-currency"><?php echo convertPrice(2800)['symbol']; ?></span>
                        <span class="price-number"><?php echo convertPrice(2800)['amount']; ?></span>
                        <span class="price-period">/month</span>
                    </div>
                </div>

                <ul class="pricing-features">
                    <li><i class="fas fa-circle-check"></i> 2 Ryzen vCPU Cores</li>
                    <li><i class="fas fa-circle-check"></i> 4 GB DDR4 RAM</li>
                    <li><i class="fas fa-circle-check"></i> 60 GB NVMe SSD</li>
                    <li><i class="fas fa-circle-check"></i> Unlimited Bandwidth</li>
                    <li><i class="fas fa-circle-check"></i> 1 IPv4 + IPv6</li>
                    <li><i class="fas fa-circle-check"></i> KVM Virtualization</li>
                    <li><i class="fas fa-circle-check"></i> Full Root Access</li>
                    <li><i class="fas fa-circle-check"></i> 24/7 Support</li>
                </ul>

                <a href="<?php echo getWHMCSProductURL(40); ?>" class="btn btn-primary pricing-cta" data-whmcs-product="40">
                    Order Now
                </a>
            </div>

            <div class="pricing-card featured" data-price-bdt="5000">
                <span class="pricing-badge">Hot Deal</span>
                <div class="pricing-icon">
                    <i class="fas fa-fire"></i>
                </div>
                <h3 class="pricing-name">Ryzen-2</h3>
                <p class="pricing-description">Most popular choice</p>

                <div class="pricing-price">
                    <div class="price-amount">
                        <span class="price-currency"><?php echo convertPrice(5000)['symbol']; ?></span>
                        <span class="price-number"><?php echo convertPrice(5000)['amount']; ?></span>
                        <span class="price-period">/month</span>
                    </div>
                </div>

                <ul class="pricing-features">
                    <li><i class="fas fa-circle-check"></i> 4 Ryzen vCPU Cores</li>
                    <li><i class="fas fa-circle-check"></i> 8 GB DDR4 RAM</li>
                    <li><i class="fas fa-circle-check"></i> 120 GB NVMe SSD</li>
                    <li><i class="fas fa-circle-check"></i> Unlimited Bandwidth</li>
                    <li><i class="fas fa-circle-check"></i> 1 IPv4 + IPv6</li>
                    <li><i class="fas fa-circle-check"></i> KVM Virtualization</li>
                    <li><i class="fas fa-circle-check"></i> Full Root Access</li>
                    <li><i class="fas fa-circle-check"></i> Weekly Backups</li>
                    <li><i class="fas fa-circle-check"></i> 24/7 Priority Support</li>
                </ul>

                <a href="<?php echo getWHMCSProductURL(41); ?>" class="btn btn-primary pricing-cta" data-whmcs-product="41">
                    Order Now
                </a>
            </div>

            <div class="pricing-card" data-price-bdt="9500">
                <div class="pricing-icon">
                    <i class="fas fa-trophy"></i>
                </div>
                <h3 class="pricing-name">Ryzen-3</h3>
                <p class="pricing-description">Maximum performance</p>

                <div class="pricing-price">
                    <div class="price-amount">
                        <span class="price-currency"><?php echo convertPrice(9500)['symbol']; ?></span>
                        <span class="price-number"><?php echo convertPrice(9500)['amount']; ?></span>
                        <span class="price-period">/month</span>
                    </div>
                </div>

                <ul class="pricing-features">
                    <li><i class="fas fa-circle-check"></i> 8 Ryzen vCPU Cores</li>
                    <li><i class="fas fa-circle-check"></i> 16 GB DDR4 RAM</li>
                    <li><i class="fas fa-circle-check"></i> 240 GB NVMe SSD</li>
                    <li><i class="fas fa-circle-check"></i> Unlimited Bandwidth</li>
                    <li><i class="fas fa-circle-check"></i> 2 IPv4 + IPv6</li>
                    <li><i class="fas fa-circle-check"></i> KVM Virtualization</li>
                    <li><i class="fas fa-circle-check"></i> Full Root Access</li>
                    <li><i class="fas fa-circle-check"></i> Daily Backups</li>
                    <li><i class="fas fa-circle-check"></i> DDoS Protection</li>
                    <li><i class="fas fa-circle-check"></i> 24/7 Premium Support</li>
                </ul>

                <a href="<?php echo getWHMCSProductURL(42); ?>" class="btn btn-primary pricing-cta" data-whmcs-product="42">
                    Order Now
                </a>
            </div>
        </div>
    </div>
</section>

<section class="section">
    <div class="container">
        <div class="section-header">
            <span class="section-subtitle"><i class="fas fa-gauge-high"></i> Performance Highlights</span>
            <h2 class="section-title">Why teams choose Ryzen VPS</h2>
        </div>

        <div class="features-grid">
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-gamepad"></i>
                </div>
                <h3 class="feature-title">Gaming optimized</h3>
                <p class="feature-description">
                    High clock speeds deliver smooth performance for multiplayer servers.
                </p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-gauge-high"></i>
                </div>
                <h3 class="feature-title">Single-thread speed</h3>
                <p class="feature-description">
                    Ideal for trading platforms, SaaS apps, and CPU-heavy workloads.
                </p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-hard-drive"></i>
                </div>
                <h3 class="feature-title">Gen4 NVMe SSD</h3>
                <p class="feature-description">
                    Faster storage for databases, analytics, and large files.
                </p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-shield-halved"></i>
                </div>
                <h3 class="feature-title">Security included</h3>
                <p class="feature-description">
                    DDoS mitigation and firewall protection keep workloads safe.
                </p>
            </div>
        </div>
    </div>
</section>

<section class="section section-bg">
    <div class="container">
        <div class="section-header">
            <span class="section-subtitle"><i class="fas fa-list-check"></i> Specs</span>
            <h2 class="section-title">Ryzen VPS specifications</h2>
        </div>

        <div class="comparison-table-wrapper narrow">
            <table class="comparison-table">
                <thead>
                    <tr>
                        <th>Feature</th>
                        <th>Specification</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>CPU</strong></td>
                        <td>AMD Ryzen high-frequency processors</td>
                    </tr>
                    <tr>
                        <td><strong>Storage</strong></td>
                        <td>Gen4 NVMe SSD</td>
                    </tr>
                    <tr>
                        <td><strong>Network</strong></td>
                        <td>1-10 Gbps ports with unlimited bandwidth</td>
                    </tr>
                    <tr>
                        <td><strong>Virtualization</strong></td>
                        <td>KVM virtualization</td>
                    </tr>
                    <tr>
                        <td><strong>Support</strong></td>
                        <td>24/7 monitoring and assistance</td>
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
            <h2 class="section-title">Ryzen VPS questions</h2>
        </div>

        <div class="faq-accordion">
            <details class="faq-item">
                <summary>Is Ryzen VPS good for gaming servers?</summary>
                <p>Yes. Ryzen excels at high-frequency workloads like game servers.</p>
            </details>
            <details class="faq-item">
                <summary>Do you provide root access?</summary>
                <p>Yes. All Ryzen VPS plans include full root access.</p>
            </details>
            <details class="faq-item">
                <summary>Can I upgrade to more resources?</summary>
                <p>Yes. You can scale CPU, RAM, and storage anytime.</p>
            </details>
            <details class="faq-item">
                <summary>Is DDoS protection included?</summary>
                <p>Yes. DDoS protection and firewall rules are included.</p>
            </details>
        </div>
    </div>
</section>

<section class="cta-section">
    <div class="container">
        <h2 class="section-title">Unleash Ryzen performance</h2>
        <p class="section-description">
            Launch with high-frequency Ryzen VPS plans built for speed and stability.
        </p>
        <div class="cta-buttons">
            <a href="<?php echo WHMCS_CART_URL; ?>" class="btn btn-lg">
                <i class="fas fa-cart-shopping"></i> Order Ryzen VPS
            </a>
            <a href="https://wa.me/<?php echo WHATSAPP_NUMBER; ?>" class="btn btn-outline btn-lg">
                <i class="fab fa-whatsapp"></i> Get Consultation
            </a>
        </div>
    </div>
</section>

<?php include 'includes/footer.php'; ?>
