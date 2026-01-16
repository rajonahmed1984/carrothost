<?php
/**
 * BDIX VPS Hosting Page
 * Bangladesh Internet Exchange VPS with Local Connectivity
 */

require_once 'config.php';

$pageTitle = 'BDIX VPS Hosting Bangladesh - Local High-Speed VPS';
$metaDescription = 'BDIX VPS hosting with ultra-fast local Bangladesh connectivity, SSD storage, and high bandwidth for streaming, gaming, file sharing, and content delivery.';
$metaKeywords = 'bdix vps, bangladesh vps, bdix hosting, local vps bangladesh, bdix vps hosting, streaming vps bd';

$bdixBreadcrumb = [
    ['name' => 'Home', 'url' => buildCanonicalUrlFromPath('')],
    ['name' => 'BDIX VPS', 'url' => buildCanonicalUrlFromPath('bdix-vps')]
];
$bdixFaq = [
    ['question' => 'Is BDIX bandwidth unlimited?', 'answer' => 'Yes, BDIX traffic is unlimited under our fair usage terms for local delivery.'],
    ['question' => 'Can I host game servers?', 'answer' => 'Low latency BDIX routing makes these VPS ideal for game and streaming servers in Bangladesh.'],
    ['question' => 'Do you provide DDoS protection?', 'answer' => 'Advanced DDoS mitigation and firewall protection keep your servers secure.'],
    ['question' => 'How quickly can I get set up?', 'answer' => 'Most BDIX VPS plans are provisioned instantly or within two hours depending on configuration.' ]
];
$bdixOffers = [
    '@type' => 'AggregateOffer',
    'priceCurrency' => 'BDT',
    'lowPrice' => '1550',
    'highPrice' => '4900',
    'offerCount' => 3
];
$schemaParts = [
    buildBreadcrumbSchema($bdixBreadcrumb),
    buildServiceSchema('Service', 'BDIX VPS Hosting', 'Bangladesh Internet Exchange VPS for low-latency streaming, gaming, and local delivery.', SITE_URL . '/bdix-vps', $bdixOffers),
    buildFaqSchema($bdixFaq)
];
$additionalSchema = implode("\n", array_filter($schemaParts));

include 'includes/header.php';
?>

<section class="section hero-section">
    <div class="container">
        <div class="service-hero hero-split">
            <div class="section-header">
                <span class="section-subtitle"><i class="fas fa-gauge-high"></i> BDIX VPS</span>
                <h1 class="section-title">Local-speed BDIX VPS for Bangladesh users</h1>
                <p class="section-description">
                    Deliver ultra-low latency inside Bangladesh with BDIX routing. Built for streaming,
                    gaming, file distribution, and community platforms that need fast local delivery.
                </p>
                <div class="hero-cta">
                    <a href="#plans" class="btn btn-primary">
                        <i class="fas fa-cart-shopping"></i> Order BDIX VPS
                    </a>
                    <a href="https://wa.me/<?php echo WHATSAPP_NUMBER; ?>" class="btn btn-outline">
                        <i class="fab fa-whatsapp"></i> Need Guidance?
                    </a>
                </div>
                <div class="hero-metrics">
                    <div class="hero-metric">
                        <strong>1 Gbps</strong>
                        <span>BDIX routing</span>
                    </div>
                    <div class="hero-metric">
                        <strong>Unlimited</strong>
                        <span>BDIX bandwidth</span>
                    </div>
                    <div class="hero-metric">
                        <strong>Tier III</strong>
                        <span>Dhaka DC</span>
                    </div>
                </div>
            </div>
            <div class="hero-media">
                <!-- Unsplash: https://unsplash.com/photos/0ad4aaf24ca7 -->
                <img src="<?php echo SITE_URL; ?>/img/bdix-hero.jpg" alt="Server racks and network cables" loading="lazy">
                <div class="hero-callout">
                    <span>BDIX Optimized</span>
                    <strong>Low latency delivery</strong>
                </div>
                <div class="hero-callout hero-callout-secondary">
                    <span>Security</span>
                    <strong>DDoS protection</strong>
                </div>
            </div>
        </div>

        <div class="trust-strip">
            <div class="trust-item"><i class="fas fa-bolt"></i> Ultra-fast BDIX routes</div>
            <div class="trust-item"><i class="fas fa-infinity"></i> Unlimited BDIX bandwidth</div>
            <div class="trust-item"><i class="fas fa-shield-halved"></i> DDoS protection</div>
            <div class="trust-item"><i class="fas fa-headset"></i> 24/7 support</div>
        </div>
    </div>
</section>

<section class="section section-bg" id="plans">
    <div class="container">
        <div class="section-header">
            <span class="section-subtitle"><i class="fas fa-tags"></i> Pricing</span>
            <h2 class="section-title">BDIX VPS plans</h2>
            <p class="section-description">
                All plans include KVM virtualization, root access, and BDIX-optimized connectivity.
            </p>
        </div>

        <div class="pricing-grid">
            <div class="pricing-card" data-price-bdt="1550">
                <div class="pricing-icon">
                    <i class="fas fa-bolt"></i>
                </div>
                <h3 class="pricing-name">BDIX Standard</h3>

                <div class="pricing-price">
                    <div class="price-amount">
                        <span class="price-currency"><?php echo convertPrice(1550)['symbol']; ?></span>
                        <span class="price-number"><?php echo convertPrice(1550)['amount']; ?></span>
                        <span class="price-period">/month</span>
                    </div>
                    <p class="price-note">Best for starter workloads</p>
                </div>

                <ul class="pricing-features">
                    <li><i class="fas fa-circle-check"></i> 2 vCPU Cores</li>
                    <li><i class="fas fa-circle-check"></i> 2 GB RAM</li>
                    <li><i class="fas fa-circle-check"></i> 25 GB SSD Storage</li>
                    <li><i class="fas fa-circle-check"></i> 1000 GB/mo Bandwidth</li>
                    <li><i class="fas fa-circle-check"></i> 1 Gbps BDIX</li>
                    <li><i class="fas fa-circle-check"></i> 100 Mbps International</li>
                </ul>

                <a href="<?php echo getWHMCSProductURL(20); ?>" class="btn btn-primary pricing-cta" data-whmcs-product="20">
                    Order Now
                </a>
            </div>

            <div class="pricing-card featured" data-price-bdt="2700">
                <span class="pricing-badge">Popular</span>
                <div class="pricing-icon">
                    <i class="fas fa-star"></i>
                </div>
                <h3 class="pricing-name">BDIX Enhanced</h3>

                <div class="pricing-price">
                    <div class="price-amount">
                        <span class="price-currency"><?php echo convertPrice(2700)['symbol']; ?></span>
                        <span class="price-number"><?php echo convertPrice(2700)['amount']; ?></span>
                        <span class="price-period">/month</span>
                    </div>
                    <p class="price-note">For growing platforms</p>
                </div>

                <ul class="pricing-features">
                    <li><i class="fas fa-circle-check"></i> 4 vCPU Cores</li>
                    <li><i class="fas fa-circle-check"></i> 4 GB RAM</li>
                    <li><i class="fas fa-circle-check"></i> 50 GB SSD Storage</li>
                    <li><i class="fas fa-circle-check"></i> 1500 GB/mo Bandwidth</li>
                    <li><i class="fas fa-circle-check"></i> 1 Gbps BDIX</li>
                    <li><i class="fas fa-circle-check"></i> 100 Mbps International</li>
                </ul>

                <a href="<?php echo getWHMCSProductURL(21); ?>" class="btn btn-primary pricing-cta" data-whmcs-product="21">
                    Order Now
                </a>
            </div>

            <div class="pricing-card" data-price-bdt="4900">
                <div class="pricing-icon">
                    <i class="fas fa-crown"></i>
                </div>
                <h3 class="pricing-name">BDIX Premium</h3>

                <div class="pricing-price">
                    <div class="price-amount">
                        <span class="price-currency"><?php echo convertPrice(4900)['symbol']; ?></span>
                        <span class="price-number"><?php echo convertPrice(4900)['amount']; ?></span>
                        <span class="price-period">/month</span>
                    </div>
                    <p class="price-note">High traffic delivery</p>
                </div>

                <ul class="pricing-features">
                    <li><i class="fas fa-circle-check"></i> 6 vCPU Cores</li>
                    <li><i class="fas fa-circle-check"></i> 8 GB RAM</li>
                    <li><i class="fas fa-circle-check"></i> 100 GB SSD Storage</li>
                    <li><i class="fas fa-circle-check"></i> 2000 GB/mo Bandwidth</li>
                    <li><i class="fas fa-circle-check"></i> 1 Gbps BDIX</li>
                    <li><i class="fas fa-circle-check"></i> 100 Mbps International</li>
                </ul>

                <a href="<?php echo getWHMCSProductURL(22); ?>" class="btn btn-primary pricing-cta" data-whmcs-product="22">
                    Order Now
                </a>
            </div>
        </div>
    </div>
</section>

<section class="section">
    <div class="container">
        <div class="section-header">
            <span class="section-subtitle"><i class="fas fa-layer-group"></i> Use Cases</span>
            <h2 class="section-title">Built for local-heavy workloads</h2>
        </div>

        <div class="features-grid">
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-tv"></i>
                </div>
                <h3 class="feature-title">IPTV and streaming</h3>
                <p class="feature-description">
                    Buffer-free delivery for local audiences with BDIX-optimized routing.
                </p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-gamepad"></i>
                </div>
                <h3 class="feature-title">Game servers</h3>
                <p class="feature-description">
                    Low latency for multiplayer games and community platforms.
                </p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-file-arrow-down"></i>
                </div>
                <h3 class="feature-title">File distribution</h3>
                <p class="feature-description">
                    Fast local downloads for education content, ISPs, and media libraries.
                </p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-cloud"></i>
                </div>
                <h3 class="feature-title">Caching and CDN</h3>
                <p class="feature-description">
                    Serve cached content locally while offloading international traffic.
                </p>
            </div>
        </div>
    </div>
</section>

<section class="section section-bg">
    <div class="container">
        <div class="section-header">
            <span class="section-subtitle"><i class="fas fa-server"></i> Specs</span>
            <h2 class="section-title">Technical specifications</h2>
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
                        <td><strong>Location</strong></td>
                        <td>Dhaka, Bangladesh (Tier III Data Center)</td>
                    </tr>
                    <tr>
                        <td><strong>Network</strong></td>
                        <td>BDIX connected with 1 Gbps port</td>
                    </tr>
                    <tr>
                        <td><strong>BDIX Bandwidth</strong></td>
                        <td>Unlimited with fair usage policy</td>
                    </tr>
                    <tr>
                        <td><strong>Virtualization</strong></td>
                        <td>KVM (Kernel-based Virtual Machine)</td>
                    </tr>
                    <tr>
                        <td><strong>Storage Type</strong></td>
                        <td>SSD / NVMe SSD (RAID 10)</td>
                    </tr>
                    <tr>
                        <td><strong>Operating Systems</strong></td>
                        <td>CentOS, Ubuntu, Debian, AlmaLinux, Rocky Linux</td>
                    </tr>
                    <tr>
                        <td><strong>Control Panel</strong></td>
                        <td>Optional: cPanel, Plesk, Webuzo (additional cost)</td>
                    </tr>
                    <tr>
                        <td><strong>Setup Time</strong></td>
                        <td>Instant to 2 hours</td>
                    </tr>
                    <tr>
                        <td><strong>Uptime SLA</strong></td>
                        <td>99.9% network uptime guarantee</td>
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
            <h2 class="section-title">BDIX VPS questions</h2>
        </div>

        <div class="faq-accordion">
            <details class="faq-item">
                <summary>Is BDIX bandwidth unlimited?</summary>
                <p>Yes. BDIX traffic is unlimited under fair usage terms.</p>
            </details>
            <details class="faq-item">
                <summary>Can I upgrade my BDIX VPS later?</summary>
                <p>Yes. You can scale resources or move to higher plans anytime.</p>
            </details>
            <details class="faq-item">
                <summary>Do you offer managed support?</summary>
                <p>Our team can assist with setup, security, and performance tuning.</p>
            </details>
            <details class="faq-item">
                <summary>Is BDIX suitable for streaming?</summary>
                <p>Yes. BDIX routing is ideal for local streaming and low-latency delivery.</p>
            </details>
        </div>
    </div>
</section>

<section class="cta-section">
    <div class="container">
        <h2 class="section-title">Launch your BDIX VPS today</h2>
        <p class="section-description">
            Experience ultra-fast local connectivity with dedicated BDIX routing.
        </p>
        <div class="cta-buttons">
            <a href="<?php echo WHMCS_CART_URL; ?>" class="btn btn-lg">
                <i class="fas fa-cart-shopping"></i> Order BDIX VPS
            </a>
            <a href="https://wa.me/<?php echo WHATSAPP_NUMBER; ?>" class="btn btn-outline btn-lg">
                <i class="fab fa-whatsapp"></i> Need Guidance?
            </a>
        </div>
    </div>
</section>

<?php include 'includes/footer.php'; ?>
