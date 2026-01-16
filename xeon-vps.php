<?php
/**
 * Xeon VPS Hosting Page
 * Intel Xeon Powered VPS Servers
 */

require_once 'config.php';

$pageTitle = 'Xeon VPS Hosting - Intel Xeon Powered Virtual Servers';
$metaDescription = 'High-performance Xeon VPS hosting with Intel Xeon processors, NVMe SSD storage, and unmetered bandwidth for business applications and high-traffic websites.';
$metaKeywords = 'xeon vps, intel xeon vps, xeon vps hosting, enterprise vps, high performance vps';

$xeonBreadcrumb = [
    ['name' => 'Home', 'url' => buildCanonicalUrlFromPath('')],
    ['name' => 'Xeon VPS', 'url' => buildCanonicalUrlFromPath('xeon-vps')]
];
$xeonFaq = [
    ['question' => 'Are these VPS built for enterprise workloads?', 'answer' => 'Yes, Xeon VPS run on Intel Xeon CPUs with premium networking and monitoring for business applications.'],
    ['question' => 'Do you offer NVMe storage?', 'answer' => 'All Xeon plans include NVMe SSD storage for faster I/O.'],
    ['question' => 'Can I customize my configuration?', 'answer' => 'We offer custom Xeon profiles so you can tailor CPU, RAM, and storage.'],
    ['question' => 'Is support available 24/7?', 'answer' => 'Yes, our experts monitor and support these servers around the clock.' ]
];
$xeonOffers = [
    '@type' => 'AggregateOffer',
    'priceCurrency' => 'BDT',
    'lowPrice' => '607',
    'highPrice' => '12140',
    'offerCount' => 4
];
$schemaParts = [
    buildBreadcrumbSchema($xeonBreadcrumb),
    buildServiceSchema('Service', 'Xeon VPS Hosting', 'Intel Xeon VPS with NVMe storage, unmetered bandwidth, and enterprise uptime.', SITE_URL . '/xeon-vps', $xeonOffers),
    buildFaqSchema($xeonFaq)
];
$additionalSchema = implode("\n", array_filter($schemaParts));

include 'includes/header.php';
?>

<section class="section hero-section">
    <div class="container">
        <div class="service-hero hero-split">
            <div class="section-header">
                <span class="section-subtitle"><i class="fas fa-microchip"></i> Xeon VPS</span>
                <h1 class="section-title">Enterprise-grade Intel Xeon VPS</h1>
                <p class="section-description">
                    Power demanding applications with Xeon processors, NVMe storage, and premium networking.
                    Built for business workloads, databases, and high-traffic platforms.
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
                        <strong>NVMe</strong>
                        <span>SSD storage</span>
                    </div>
                    <div class="hero-metric">
                        <strong>1 Gbps</strong>
                        <span>Premium network</span>
                    </div>
                    <div class="hero-metric">
                        <strong>99.9%</strong>
                        <span>Uptime SLA</span>
                    </div>
                </div>
            </div>
            <div class="hero-media">
                <!-- Unsplash: https://unsplash.com/photos/4636190af475 -->
                <img src="<?php echo SITE_URL; ?>/img/xeon-hero.jpg" alt="Enterprise server infrastructure" loading="lazy">
                <div class="hero-callout">
                    <span>Intel Xeon</span>
                    <strong>Enterprise CPUs</strong>
                </div>
                <div class="hero-callout hero-callout-secondary">
                    <span>Storage</span>
                    <strong>NVMe performance</strong>
                </div>
            </div>
        </div>

        <div class="trust-strip">
            <div class="trust-item"><i class="fas fa-microchip"></i> Xeon processors</div>
            <div class="trust-item"><i class="fas fa-bolt"></i> NVMe SSD storage</div>
            <div class="trust-item"><i class="fas fa-network-wired"></i> Premium networking</div>
            <div class="trust-item"><i class="fas fa-user-shield"></i> Full root access</div>
        </div>
    </div>
</section>

<section class="section section-bg" id="plans">
    <div class="container">
        <div class="section-header">
            <span class="section-subtitle"><i class="fas fa-tags"></i> Pricing</span>
            <h2 class="section-title">Xeon VPS plans</h2>
            <p class="section-description">
                All plans include KVM virtualization, unmetered bandwidth, and managed support.
            </p>
        </div>

        <div class="pricing-grid">
            <div class="pricing-card" data-price-bdt="607">
                <div class="pricing-icon">
                    <i class="fas fa-bolt"></i>
                </div>
                <h3 class="pricing-name">NVMe Nano4</h3>

                <div class="pricing-price">
                    <div class="price-amount">
                        <span class="price-currency"><?php echo convertPrice(607)['symbol']; ?></span>
                        <span class="price-number"><?php echo convertPrice(607)['amount']; ?></span>
                        <span class="price-period">/month</span>
                    </div>
                    <p class="price-note">Starting from</p>
                </div>

                <ul class="pricing-features">
                    <li><i class="fas fa-circle-check"></i> Xeon Platinum CPUs</li>
                    <li><i class="fas fa-circle-check"></i> 15 GB NVMe storage</li>
                    <li><i class="fas fa-circle-check"></i> 1 vCPU thread</li>
                    <li><i class="fas fa-circle-check"></i> 2 GB RAM</li>
                    <li><i class="fas fa-circle-check"></i> 1 Gbps port (1 TB transfer)</li>
                    <li><i class="fas fa-circle-check"></i> Free SSL</li>
                </ul>

                <a href="<?php echo getWHMCSProductURL(30); ?>" class="btn btn-primary pricing-cta" data-whmcs-product="30">
                    Order Now
                </a>
            </div>

            <div class="pricing-card featured" data-price-bdt="3035">
                <span class="pricing-badge">Popular</span>
                <div class="pricing-icon">
                    <i class="fas fa-star"></i>
                </div>
                <h3 class="pricing-name">NVMe Bit</h3>

                <div class="pricing-price">
                    <div class="price-amount">
                        <span class="price-currency"><?php echo convertPrice(3035)['symbol']; ?></span>
                        <span class="price-number"><?php echo convertPrice(3035)['amount']; ?></span>
                        <span class="price-period">/month</span>
                    </div>
                    <p class="price-note">Starting from</p>
                </div>

                <ul class="pricing-features">
                    <li><i class="fas fa-circle-check"></i> Xeon Platinum CPUs</li>
                    <li><i class="fas fa-circle-check"></i> 100 GB NVMe storage</li>
                    <li><i class="fas fa-circle-check"></i> 10 vCPU threads</li>
                    <li><i class="fas fa-circle-check"></i> 10 GB RAM</li>
                    <li><i class="fas fa-circle-check"></i> 1 Gbps port (5 TB transfer)</li>
                    <li><i class="fas fa-circle-check"></i> WP management</li>
                </ul>

                <a href="<?php echo getWHMCSProductURL(31); ?>" class="btn btn-primary pricing-cta" data-whmcs-product="31">
                    Order Now
                </a>
            </div>

            <div class="pricing-card" data-price-bdt="12140">
                <div class="pricing-icon">
                    <i class="fas fa-crown"></i>
                </div>
                <h3 class="pricing-name">NVMe Premium</h3>

                <div class="pricing-price">
                    <div class="price-amount">
                        <span class="price-currency"><?php echo convertPrice(12140)['symbol']; ?></span>
                        <span class="price-number"><?php echo convertPrice(12140)['amount']; ?></span>
                        <span class="price-period">/month</span>
                    </div>
                    <p class="price-note">Starting from</p>
                </div>

                <ul class="pricing-features">
                    <li><i class="fas fa-circle-check"></i> Xeon Platinum CPUs</li>
                    <li><i class="fas fa-circle-check"></i> 500 GB NVMe storage</li>
                    <li><i class="fas fa-circle-check"></i> 30 vCPU threads</li>
                    <li><i class="fas fa-circle-check"></i> 64 GB RAM</li>
                    <li><i class="fas fa-circle-check"></i> 1 Gbps port (23 TB transfer)</li>
                    <li><i class="fas fa-circle-check"></i> Priority support</li>
                </ul>

                <a href="<?php echo getWHMCSProductURL(33); ?>" class="btn btn-primary pricing-cta" data-whmcs-product="33">
                    Order Now
                </a>
            </div>
        </div>
    </div>
</section>

<section class="section">
    <div class="container">
        <div class="section-header">
            <span class="section-subtitle"><i class="fas fa-sliders"></i> Custom</span>
            <h2 class="section-title">Need a custom Xeon profile?</h2>
            <p class="section-description">
                Build a tailored configuration for your exact workload and budget.
            </p>
        </div>

        <div class="pricing-grid">
            <div class="pricing-card" data-price-bdt="5800">
                <div class="pricing-icon">
                    <i class="fas fa-server"></i>
                </div>
                <h3 class="pricing-name">Intel Xeon Custom Profile</h3>

                <div class="pricing-price">
                    <div class="price-amount">
                        <span class="price-currency"><?php echo convertPrice(5800)['symbol']; ?></span>
                        <span class="price-number"><?php echo convertPrice(5800)['amount']; ?></span>
                        <span class="price-period">/month</span>
                    </div>
                    <p class="price-note">Starting from</p>
                </div>

                <ul class="pricing-features">
                    <li><i class="fas fa-circle-check"></i> Storage 50 GB</li>
                    <li><i class="fas fa-circle-check"></i> CPU power 5 threads</li>
                    <li><i class="fas fa-circle-check"></i> Memory 5 GB</li>
                    <li><i class="fas fa-circle-check"></i> 1 Gbps port</li>
                </ul>

                <a href="<?php echo getWHMCSProductURL(32); ?>" class="btn btn-primary pricing-cta" data-whmcs-product="32">
                    Order Now
                </a>
            </div>
        </div>
    </div>
</section>

<section class="section section-bg">
    <div class="container">
        <div class="section-header">
            <span class="section-subtitle"><i class="fas fa-shield-halved"></i> Enterprise Features</span>
            <h2 class="section-title">Built for business-critical workloads</h2>
        </div>

        <div class="features-grid">
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-memory"></i>
                </div>
                <h3 class="feature-title">DDR4 ECC memory</h3>
                <p class="feature-description">
                    Reliable memory performance for production databases and applications.
                </p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-network-wired"></i>
                </div>
                <h3 class="feature-title">Tier 1 network</h3>
                <p class="feature-description">
                    Premium upstream providers keep latency low worldwide.
                </p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-user-shield"></i>
                </div>
                <h3 class="feature-title">Root access and control</h3>
                <p class="feature-description">
                    Full SSH access with custom OS installation support.
                </p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-shield-halved"></i>
                </div>
                <h3 class="feature-title">Security hardening</h3>
                <p class="feature-description">
                    Firewall rules, updates, and monitoring included.
                </p>
            </div>
        </div>
    </div>
</section>

<section class="section">
    <div class="container">
        <div class="section-header">
            <span class="section-subtitle"><i class="fas fa-list-check"></i> Specs</span>
            <h2 class="section-title">Xeon VPS specifications</h2>
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
                        <td><strong>Virtualization</strong></td>
                        <td>KVM virtualization</td>
                    </tr>
                    <tr>
                        <td><strong>Storage</strong></td>
                        <td>NVMe SSD RAID</td>
                    </tr>
                    <tr>
                        <td><strong>Network</strong></td>
                        <td>1 Gbps with unmetered bandwidth</td>
                    </tr>
                    <tr>
                        <td><strong>Operating Systems</strong></td>
                        <td>Ubuntu, Debian, AlmaLinux, Rocky Linux</td>
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
            <h2 class="section-title">Xeon VPS questions</h2>
        </div>

        <div class="faq-accordion">
            <details class="faq-item">
                <summary>Is Xeon VPS suitable for databases?</summary>
                <p>Yes. Xeon CPUs and NVMe storage are ideal for database workloads.</p>
            </details>
            <details class="faq-item">
                <summary>Can I upgrade resources later?</summary>
                <p>Yes. You can scale storage, RAM, and CPU as needed.</p>
            </details>
            <details class="faq-item">
                <summary>Do you offer managed support?</summary>
                <p>We provide monitoring, updates, and guidance on request.</p>
            </details>
            <details class="faq-item">
                <summary>Is monthly billing available?</summary>
                <p>Yes. All Xeon VPS plans are billed monthly.</p>
            </details>
        </div>
    </div>
</section>

<section class="cta-section">
    <div class="container">
        <h2 class="section-title">Power your business with Xeon VPS</h2>
        <p class="section-description">
            Choose a plan or request a custom Xeon configuration today.
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
