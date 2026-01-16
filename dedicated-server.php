<?php
/**
 * Dedicated Server Page
 * Physical Dedicated Servers
 */

require_once 'config.php';

$pageTitle = 'Dedicated Server Hosting - Fully Managed Dedicated Servers';
$metaDescription = 'Enterprise-grade dedicated servers with Intel Xeon processors, NVMe storage, unmetered bandwidth, and managed support for high-traffic websites and applications.';
$metaKeywords = 'dedicated server bangladesh, managed dedicated server, enterprise server, bare metal server';

include 'includes/header.php';
?>

<link rel="stylesheet" href="<?php echo SITE_URL; ?>/assets/css/components.css">

<section class="section">
    <div class="container">
        <div class="service-hero">
            <div class="section-header service-hero-copy">
                <h2 class="section-title">Enterprise-Grade Dedicated Servers</h2>
                <p class="section-description">
                    Get complete control with fully dedicated physical servers. Perfect for mission-critical 
                    applications, high-traffic websites, and resource-intensive workloads.
                </p>
            </div>
            <div class="service-hero-media">
                <img src="<?php echo SITE_URL; ?>/img/hero-server.jpg" alt="Dedicated server hardware" loading="lazy">
            </div>
        </div>
        
        <div class="features-grid">
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-server"></i>
                </div>
                <h3 class="feature-title">100% Dedicated Resources</h3>
                <p class="feature-description">
                    Entire physical server dedicated to you with no sharing of CPU, RAM, or storage.
                </p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-gear"></i>
                </div>
                <h3 class="feature-title">Fully Managed</h3>
                <p class="feature-description">
                    Complete server management including OS installation, updates, and monitoring.
                </p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-network-wired"></i>
                </div>
                <h3 class="feature-title">Enterprise Network</h3>
                <p class="feature-description">
                    10 Gbps port with premium bandwidth and multiple upstream providers.
                </p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-shield-halved"></i>
                </div>
                <h3 class="feature-title">Hardware RAID</h3>
                <p class="feature-description">
                    Enterprise hardware RAID controllers with battery backup for data protection.
                </p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-chart-line"></i>
                </div>
                <h3 class="feature-title">99.99% Uptime SLA</h3>
                <p class="feature-description">
                    Industry-leading uptime guarantee with redundant power and network.
                </p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-user-tie"></i>
                </div>
                <h3 class="feature-title">Dedicated Support</h3>
                <p class="feature-description">
                    Priority 24/7 support with dedicated account manager for enterprise clients.
                </p>
            </div>
        </div>
    </div>
</section>

<section class="section section-bg">
    <div class="container">
        <div class="section-header">
            <h2 class="section-title">Dedicated Server Plans</h2>
            <p class="section-description">
                Enterprise-grade hardware with transparent monthly pricing
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
            <h2 class="section-title">Why Choose Our Dedicated Servers?</h2>
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

<section class="cta-section">
    <div class="container">
        <h2 class="section-title">Need a Custom Configuration?</h2>
        <p class="section-description">
            Contact us for custom dedicated server configurations tailored to your specific requirements.
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



