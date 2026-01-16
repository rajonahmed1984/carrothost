<?php
/**
 * Dedicated Server Page
 * Physical Dedicated Servers
 */

require_once 'config.php';

$pageTitle = 'Dedicated Server Hosting - Fully Managed Dedicated Servers';
$metaDescription = 'Enterprise-grade dedicated servers with Intel Xeon processors, NVMe storage, unmetered bandwidth, and managed support for high-traffic websites and applications.';
$metaKeywords = 'dedicated server bangladesh, managed dedicated server, enterprise server, bare metal server';

$dedicatedBreadcrumb = [
    ['name' => 'Home', 'url' => buildCanonicalUrlFromPath('')],
    ['name' => 'Dedicated Server', 'url' => buildCanonicalUrlFromPath('dedicated-server')]
];
$dedicatedFaq = [
    ['question' => 'Do you offer managed services?', 'answer' => 'Yes, we manage OS updates, security, and monitoring so you can focus on your business.'],
    ['question' => 'Can I customize hardware?', 'answer' => 'We tailor CPU, storage, and RAM to match your workload and compliance needs.'],
    ['question' => 'What kind of network do you provide?', 'answer' => '10 Gbps ports with multiple Tier 1 carriers and redundant uplinks.'],
    ['question' => 'How long does provisioning take?', 'answer' => 'Most dedicated servers are provisioned within 24-48 hours with your OS choice.' ]
];
$dedicatedOffers = [
    '@type' => 'Service',
    'serviceType' => 'Dedicated Server Hosting',
    'provider' => [
        '@type' => 'Organization',
        'name' => SITE_NAME,
        'url' => SITE_URL
    ]
];
$schemaParts = [
    buildBreadcrumbSchema($dedicatedBreadcrumb),
    buildServiceSchema('Service', 'Dedicated Server Hosting', 'Enterprise-grade bare metal servers with managed support and premium networking.', SITE_URL . '/dedicated-server', $dedicatedOffers),
    buildFaqSchema($dedicatedFaq)
];
$additionalSchema = implode("\n", array_filter($schemaParts));

include 'includes/header.php';
?>

<section class="section hero-section">
    <div class="container">
        <div class="service-hero hero-split">
            <div class="section-header">
                <span class="section-subtitle"><i class="fas fa-server"></i> Dedicated Servers</span>
                <h1 class="section-title">Bare metal performance with full control</h1>
                <p class="section-description">
                    Get dedicated hardware, managed support, and enterprise networking for mission-critical
                    workloads. Ideal for high-traffic platforms, databases, and compliance-heavy workloads.
                </p>
                <div class="hero-cta">
                    <a href="#plans" class="btn btn-primary">
                        <i class="fas fa-cart-shopping"></i> View Plans
                    </a>
                    <a href="https://wa.me/<?php echo WHATSAPP_NUMBER; ?>" class="btn btn-outline">
                        <i class="fab fa-whatsapp"></i> Request Consultation
                    </a>
                </div>
                <div class="hero-metrics">
                    <div class="hero-metric">
                        <strong>99.99%</strong>
                        <span>Uptime SLA</span>
                    </div>
                    <div class="hero-metric">
                        <strong>10 Gbps</strong>
                        <span>Network ready</span>
                    </div>
                    <div class="hero-metric">
                        <strong>24/7</strong>
                        <span>Managed support</span>
                    </div>
                </div>
            </div>
            <div class="hero-media">
                <img src="<?php echo SITE_URL; ?>/img/hero-server.jpg" alt="Dedicated server hardware" loading="lazy">
                <div class="hero-callout">
                    <span>Dedicated Hardware</span>
                    <strong>Single-tenant performance</strong>
                </div>
                <div class="hero-callout hero-callout-secondary">
                    <span>Management</span>
                    <strong>Enterprise support</strong>
                </div>
            </div>
        </div>

        <div class="trust-strip">
            <div class="trust-item"><i class="fas fa-server"></i> 100% dedicated resources</div>
            <div class="trust-item"><i class="fas fa-network-wired"></i> Premium network</div>
            <div class="trust-item"><i class="fas fa-shield-halved"></i> Hardware RAID</div>
            <div class="trust-item"><i class="fas fa-user-tie"></i> Priority support</div>
        </div>
    </div>
</section>

<section class="section">
    <div class="container">
        <div class="section-header">
            <span class="section-subtitle"><i class="fas fa-star"></i> Enterprise Features</span>
            <h2 class="section-title">Built for critical workloads</h2>
        </div>

        <div class="features-grid">
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-server"></i>
                </div>
                <h3 class="feature-title">Dedicated resources</h3>
                <p class="feature-description">
                    Full CPU, RAM, and storage resources reserved for your workloads.
                </p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-gear"></i>
                </div>
                <h3 class="feature-title">Fully managed</h3>
                <p class="feature-description">
                    OS installs, updates, monitoring, and security handled by our team.
                </p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-network-wired"></i>
                </div>
                <h3 class="feature-title">Enterprise network</h3>
                <p class="feature-description">
                    Multi-carrier connectivity with redundant uplinks for reliability.
                </p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-shield-halved"></i>
                </div>
                <h3 class="feature-title">Hardware RAID</h3>
                <p class="feature-description">
                    RAID arrays protect data and improve storage performance.
                </p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-chart-line"></i>
                </div>
                <h3 class="feature-title">99.99% uptime SLA</h3>
                <p class="feature-description">
                    Redundant power, cooling, and networking for reliable uptime.
                </p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-user-tie"></i>
                </div>
                <h3 class="feature-title">Dedicated support</h3>
                <p class="feature-description">
                    Priority assistance with a dedicated account manager available.
                </p>
            </div>
        </div>
    </div>
</section>

<section class="section section-bg" id="plans">
    <div class="container">
        <div class="section-header">
            <span class="section-subtitle"><i class="fas fa-tags"></i> Pricing</span>
            <h2 class="section-title">Dedicated server plans</h2>
            <p class="section-description">
                Enterprise-grade hardware with transparent monthly pricing.
            </p>
        </div>

        <div class="comparison-table-wrapper dedicated-table">
            <table class="comparison-table">
                <thead>
                    <tr>
                        <th>Plan Name</th>
                        <th>CPU Power</th>
                        <th>Memory</th>
                        <th>Storage</th>
                        <th>Bandwidth</th>
                        <th>IP</th>
                        <th>Price</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><span class="name">SSL5-045</span></td>
                        <td>
                            <img class="intel-logo" src="<?php echo SITE_URL; ?>/img/intel-logo.png" alt="Intel">
                            <span class="name">XeonL5420</span>
                            <span class="subtext">Dual Processor 2.5 GHz (8 Core)</span>
                        </td>
                        <td><span class="name">16 GB</span><span class="subtext">DDR2</span></td>
                        <td><span class="name">500 GB</span><span class="subtext">SATA (7200RPM)</span></td>
                        <td><span class="name">10 TB</span><span class="subtext">1 Gbps port</span></td>
                        <td><span class="name">5</span><span class="subtext">Usable</span></td>
                        <td class="price">
                            <span class="old"><span class="price-value" data-price-bdt="10800"></span>/m</span>
                            <span class="new"><span class="price-value" data-price-bdt="5400"></span>/m</span>
                        </td>
                        <td class="price">
                            <a class="cart-btn" href="<?php echo getWHMCSProductURL(98); ?>">Order Now</a>
                        </td>
                    </tr>
                    <tr>
                        <td><span class="name">SSL5-060</span></td>
                        <td>
                            <img class="intel-logo" src="<?php echo SITE_URL; ?>/img/intel-logo.png" alt="Intel">
                            <span class="name">XeonL5520</span>
                            <span class="subtext">Dual Processor 2.26 GHz (8 Core, 16 Threads)</span>
                        </td>
                        <td><span class="name">24 GB</span><span class="subtext">DDR3</span></td>
                        <td><span class="name">500 GB</span><span class="subtext">SATA (7200RPM)</span></td>
                        <td><span class="name">10 TB</span><span class="subtext">1 Gbps port</span></td>
                        <td><span class="name">5</span><span class="subtext">Usable</span></td>
                        <td class="price">
                            <span class="old"><span class="price-value" data-price-bdt="14400"></span>/m</span>
                            <span class="new"><span class="price-value" data-price-bdt="7200"></span>/m</span>
                        </td>
                        <td class="price">
                            <a class="cart-btn" href="<?php echo getWHMCSProductURL(99); ?>">Order Now</a>
                        </td>
                    </tr>
                    <tr>
                        <td><span class="name">SSL5-073</span></td>
                        <td>
                            <img class="intel-logo" src="<?php echo SITE_URL; ?>/img/intel-logo.png" alt="Intel">
                            <span class="name">XeonL5520</span>
                            <span class="subtext">Dual Processor 2.26 GHz (8 Core, 16 Threads)</span>
                        </td>
                        <td><span class="name">48 GB</span><span class="subtext">DDR3</span></td>
                        <td><span class="name">1 TB</span><span class="subtext">SATA</span></td>
                        <td><span class="name">10 TB</span><span class="subtext">1 Gbps port</span></td>
                        <td><span class="name">5</span><span class="subtext">Usable</span></td>
                        <td class="price">
                            <span class="old"><span class="price-value" data-price-bdt="17520"></span>/m</span>
                            <span class="new"><span class="price-value" data-price-bdt="9000"></span>/m</span>
                        </td>
                        <td class="price">
                            <a class="cart-btn" href="<?php echo getWHMCSProductURL(143); ?>">Order Now</a>
                        </td>
                    </tr>
                    <tr>
                        <td><span class="name">SSE3-090</span></td>
                        <td>
                            <img class="intel-logo" src="<?php echo SITE_URL; ?>/img/intel-xeon.png" alt="Intel Xeon">
                            <span class="name">E3-1230v1</span>
                            <span class="subtext">3.20 GHz (4 Core, 8 Threads)</span>
                        </td>
                        <td><span class="name">16 GB</span><span class="subtext">DDR3</span></td>
                        <td><span class="name">2 TB</span><span class="subtext">SATA</span></td>
                        <td><span class="name">10 TB</span><span class="subtext">1 Gbps port</span></td>
                        <td><span class="name">4</span><span class="subtext">Usable</span></td>
                        <td class="price">
                            <span class="old"><span class="price-value" data-price-bdt="19440"></span>/m</span>
                            <span class="new"><span class="price-value" data-price-bdt="10800"></span>/m</span>
                        </td>
                        <td class="price">
                            <a class="cart-btn" href="<?php echo getWHMCSProductURL(87); ?>">Order Now</a>
                        </td>
                    </tr>
                    <tr>
                        <td><span class="name">SSE3-112</span></td>
                        <td>
                            <img class="intel-logo" src="<?php echo SITE_URL; ?>/img/intel-xeon.png" alt="Intel Xeon">
                            <span class="name">E3-1230v2</span>
                            <span class="subtext">3.30 GHz (4 Core, 8 Threads)</span>
                        </td>
                        <td><span class="name">16 GB</span><span class="subtext">DDR3</span></td>
                        <td><span class="name">256 GB</span><span class="subtext">SSD</span></td>
                        <td><span class="name">10 TB</span><span class="subtext">1 Gbps port</span></td>
                        <td><span class="name">4</span><span class="subtext">Usable</span></td>
                        <td class="price">
                            <span class="old"><span class="price-value" data-price-bdt="22800"></span>/m</span>
                            <span class="new"><span class="price-value" data-price-bdt="13800"></span>/m</span>
                        </td>
                        <td class="price">
                            <a class="cart-btn" href="<?php echo getWHMCSProductURL(88); ?>">Order Now</a>
                        </td>
                    </tr>
                    <tr>
                        <td><span class="name">SSE3-120</span></td>
                        <td>
                            <img class="intel-logo" src="<?php echo SITE_URL; ?>/img/intel-xeon.png" alt="Intel Xeon">
                            <span class="name">E3-1230v2</span>
                            <span class="subtext">3.30 GHz (4 Core, 8 Threads)</span>
                        </td>
                        <td><span class="name">16 GB</span><span class="subtext">DDR3</span></td>
                        <td><span class="name">2x 1TB</span><span class="subtext">SATA</span></td>
                        <td><span class="name">10 TB</span><span class="subtext">1 Gbps port</span></td>
                        <td><span class="name">4</span><span class="subtext">Usable</span></td>
                        <td class="price">
                            <span class="old"><span class="price-value" data-price-bdt="23040"></span>/m</span>
                            <span class="new"><span class="price-value" data-price-bdt="14400"></span>/m</span>
                        </td>
                        <td class="price">
                            <a class="cart-btn" href="<?php echo getWHMCSProductURL(84); ?>">Order Now</a>
                        </td>
                    </tr>
                    <tr>
                        <td><span class="name">SSE3-135</span></td>
                        <td>
                            <img class="intel-logo" src="<?php echo SITE_URL; ?>/img/intel-xeon.png" alt="Intel Xeon">
                            <span class="name">E3-1270v2</span>
                            <span class="subtext">3.50 GHz (4 Core, 8 Threads)</span>
                        </td>
                        <td><span class="name">32 GB</span><span class="subtext">DDR3</span></td>
                        <td><span class="name">2 TB</span><span class="subtext">SATA</span></td>
                        <td><span class="name">10 TB</span><span class="subtext">1 Gbps port</span></td>
                        <td><span class="name">4</span><span class="subtext">Usable</span></td>
                        <td class="price">
                            <span class="old"><span class="price-value" data-price-bdt="24240"></span>/m</span>
                            <span class="new"><span class="price-value" data-price-bdt="16200"></span>/m</span>
                        </td>
                        <td class="price">
                            <a class="cart-btn" href="<?php echo getWHMCSProductURL(89); ?>">Order Now</a>
                        </td>
                    </tr>
                    <tr>
                        <td><span class="name">SSE3-172</span></td>
                        <td>
                            <img class="intel-logo" src="<?php echo SITE_URL; ?>/img/intel-xeon.png" alt="Intel Xeon">
                            <span class="name">E3-1270v2</span>
                            <span class="subtext">3.50 GHz (4 Core, 8 Threads)</span>
                        </td>
                        <td><span class="name">32 GB</span><span class="subtext">DDR3</span></td>
                        <td><span class="name">500 GB</span><span class="subtext">SSD</span></td>
                        <td><span class="name">10 TB</span><span class="subtext">1 Gbps port</span></td>
                        <td><span class="name">4</span><span class="subtext">Usable</span></td>
                        <td class="price">
                            <span class="old"><span class="price-value" data-price-bdt="28800"></span>/m</span>
                            <span class="new"><span class="price-value" data-price-bdt="21000"></span>/m</span>
                        </td>
                        <td class="price">
                            <a class="cart-btn" href="<?php echo getWHMCSProductURL(137); ?>">Order Now</a>
                        </td>
                    </tr>
                    <tr>
                        <td><span class="name">SSE3-217</span></td>
                        <td>
                            <img class="intel-logo" src="<?php echo SITE_URL; ?>/img/intel-xeon.png" alt="Intel Xeon">
                            <span class="name">E3-1270v2</span>
                            <span class="subtext">3.50 GHz (4 Core, 8 Threads)</span>
                        </td>
                        <td><span class="name">32 GB</span><span class="subtext">DDR3</span></td>
                        <td><span class="name">1 TB</span><span class="subtext">SSD</span></td>
                        <td><span class="name">10 TB</span><span class="subtext">1 Gbps port</span></td>
                        <td><span class="name">4</span><span class="subtext">Usable</span></td>
                        <td class="price">
                            <span class="old"><span class="price-value" data-price-bdt="33840"></span>/m</span>
                            <span class="new"><span class="price-value" data-price-bdt="26400"></span>/m</span>
                        </td>
                        <td class="price">
                            <a class="cart-btn" href="<?php echo getWHMCSProductURL(93); ?>">Order Now</a>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</section>

<section class="section">
    <div class="container">
        <div class="section-header">
            <span class="section-subtitle"><i class="fas fa-list-check"></i> Specifications</span>
            <h2 class="section-title">What you can expect</h2>
        </div>

        <div class="comparison-table-wrapper">
            <table class="comparison-table">
                <thead>
                    <tr>
                        <th>Feature</th>
                        <th>Description</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>Data Center</strong></td>
                        <td>Tier III+ facility with redundant power and cooling</td>
                    </tr>
                    <tr>
                        <td><strong>Network</strong></td>
                        <td>Multiple Tier 1 carriers with BGP routing</td>
                    </tr>
                    <tr>
                        <td><strong>Hardware</strong></td>
                        <td>Enterprise-grade Intel/AMD processors and ECC RAM</td>
                    </tr>
                    <tr>
                        <td><strong>Storage</strong></td>
                        <td>Hardware RAID with SSD/NVMe drives</td>
                    </tr>
                    <tr>
                        <td><strong>Control Panel</strong></td>
                        <td>Optional: cPanel/WHM, Plesk, DirectAdmin</td>
                    </tr>
                    <tr>
                        <td><strong>Operating Systems</strong></td>
                        <td>CentOS, Ubuntu, Debian, Windows Server</td>
                    </tr>
                    <tr>
                        <td><strong>Setup Time</strong></td>
                        <td>24-48 hours with OS and control panel</td>
                    </tr>
                    <tr>
                        <td><strong>Uptime SLA</strong></td>
                        <td>99.99% with service level agreement</td>
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
            <h2 class="section-title">Dedicated server FAQs</h2>
        </div>

        <div class="faq-accordion">
            <details class="faq-item">
                <summary>Is dedicated hosting fully managed?</summary>
                <p>Yes. We provide OS setup, monitoring, and support.</p>
            </details>
            <details class="faq-item">
                <summary>Can I customize the hardware?</summary>
                <p>Yes. We can tailor CPU, RAM, storage, and RAID to your needs.</p>
            </details>
            <details class="faq-item">
                <summary>Do you provide migration help?</summary>
                <p>Our team can assist with data and workload migration.</p>
            </details>
            <details class="faq-item">
                <summary>How long does provisioning take?</summary>
                <p>Most servers are provisioned within 24-48 hours.</p>
            </details>
        </div>
    </div>
</section>

<section class="cta-section">
    <div class="container">
        <h2 class="section-title">Need a custom configuration?</h2>
        <p class="section-description">
            Contact us for a dedicated server tailored to your exact requirements.
        </p>
        <div class="cta-buttons">
            <a href="<?php echo WHMCS_CART_URL; ?>" class="btn btn-lg">
                <i class="fas fa-cart-shopping"></i> Order Server
            </a>
            <a href="https://wa.me/<?php echo WHATSAPP_NUMBER; ?>" class="btn btn-outline btn-lg">
                <i class="fab fa-whatsapp"></i> Request Custom Quote
            </a>
        </div>
    </div>
</section>

<?php include 'includes/footer.php'; ?>
