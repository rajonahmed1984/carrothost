<?php
/**
 * Dedicated Server Page
 * Physical Dedicated Servers
 */

require_once 'config.php';

$pageTitle = 'Dedicated Server Hosting - Fully Managed Dedicated Servers';
$metaDescription = 'Enterprise-grade dedicated servers with Intel Xeon processors, high-speed SSD/NVMe storage, unmetered bandwidth, and full management. Perfect for high-traffic websites and applications.';
$metaKeywords = 'dedicated server bangladesh, managed dedicated server, enterprise server, bare metal server';

include 'includes/header.php';
?>

<link rel="stylesheet" href="<?php echo SITE_URL; ?>/assets/css/components.css">

<div class="page-header">
    <div class="container">
        <h1 class="page-header-title">Dedicated Server Hosting</h1>
        <div class="page-header-breadcrumb">
            <a href="<?php echo SITE_URL; ?>"><i class="fas fa-home"></i> Home</a>
            <i class="fas fa-chevron-right"></i>
            <span>Dedicated Server</span>
        </div>
    </div>
</div>

<section class="section">
    <div class="container">
        <div class="section-header">
            <h2 class="section-title">Enterprise-Grade Dedicated Servers</h2>
            <p class="section-description">
                Get complete control with fully dedicated physical servers. Perfect for mission-critical 
                applications, high-traffic websites, and resource-intensive workloads.
            </p>
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
                    <i class="fas fa-cogs"></i>
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
                    <i class="fas fa-shield-alt"></i>
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
                All plans include full management, DDoS protection, and hardware replacement
            </p>
        </div>
        
        <div class="pricing-grid">
            <div class="pricing-card" data-price-bdt="15000">
                <div class="pricing-icon">
                    <i class="fas fa-server"></i>
                </div>
                <h3 class="pricing-name">DS-1 Standard</h3>
                <p class="pricing-description">Entry-level dedicated server</p>
                
                <div class="pricing-price">
                    <div class="price-amount">
                        <span class="price-currency"><?php echo convertPrice(15000)['symbol']; ?></span>
                        <span class="price-number"><?php echo convertPrice(15000)['amount']; ?></span>
                        <span class="price-period">/month</span>
                    </div>
                </div>
                
                <ul class="pricing-features">
                    <li><i class="fas fa-check-circle"></i> Intel Xeon E5-2650 (8C/16T)</li>
                    <li><i class="fas fa-check-circle"></i> 32 GB DDR4 ECC RAM</li>
                    <li><i class="fas fa-check-circle"></i> 2x 1 TB SATA SSD (RAID 1)</li>
                    <li><i class="fas fa-check-circle"></i> 10 Gbps Port</li>
                    <li><i class="fas fa-check-circle"></i> 30 TB Bandwidth</li>
                    <li><i class="fas fa-check-circle"></i> 5 IPv4 Addresses</li>
                    <li><i class="fas fa-check-circle"></i> Full Server Management</li>
                    <li><i class="fas fa-check-circle"></i> Hardware RAID Controller</li>
                    <li><i class="fas fa-check-circle"></i> 24/7 Priority Support</li>
                </ul>
                
                <a href="<?php echo getWHMCSProductURL(50); ?>" class="btn btn-primary pricing-cta" data-whmcs-product="50">
                    Order Now
                </a>
            </div>
            
            <div class="pricing-card featured" data-price-bdt="25000">
                <span class="pricing-badge">Enterprise</span>
                <div class="pricing-icon">
                    <i class="fas fa-building"></i>
                </div>
                <h3 class="pricing-name">DS-2 Performance</h3>
                <p class="pricing-description">High-performance server</p>
                
                <div class="pricing-price">
                    <div class="price-amount">
                        <span class="price-currency"><?php echo convertPrice(25000)['symbol']; ?></span>
                        <span class="price-number"><?php echo convertPrice(25000)['amount']; ?></span>
                        <span class="price-period">/month</span>
                    </div>
                </div>
                
                <ul class="pricing-features">
                    <li><i class="fas fa-check-circle"></i> Dual Intel Xeon E5-2680 (24C/48T)</li>
                    <li><i class="fas fa-check-circle"></i> 64 GB DDR4 ECC RAM</li>
                    <li><i class="fas fa-check-circle"></i> 2x 2 TB NVMe SSD (RAID 1)</li>
                    <li><i class="fas fa-check-circle"></i> 10 Gbps Port</li>
                    <li><i class="fas fa-check-circle"></i> 50 TB Bandwidth</li>
                    <li><i class="fas fa-check-circle"></i> 10 IPv4 Addresses</li>
                    <li><i class="fas fa-check-circle"></i> Full Server Management</li>
                    <li><i class="fas fa-check-circle"></i> Hardware RAID Controller</li>
                    <li><i class="fas fa-check-circle"></i> DDoS Protection</li>
                    <li><i class="fas fa-check-circle"></i> Daily Backups</li>
                    <li><i class="fas fa-check-circle"></i> Dedicated Account Manager</li>
                    <li><i class="fas fa-check-circle"></i> 24/7 VIP Support</li>
                </ul>
                
                <a href="<?php echo getWHMCSProductURL(51); ?>" class="btn btn-primary pricing-cta" data-whmcs-product="51">
                    Order Now
                </a>
            </div>
            
            <div class="pricing-card" data-price-bdt="40000">
                <div class="pricing-icon">
                    <i class="fas fa-crown"></i>
                </div>
                <h3 class="pricing-name">DS-3 Enterprise</h3>
                <p class="pricing-description">Maximum performance</p>
                
                <div class="pricing-price">
                    <div class="price-amount">
                        <span class="price-currency"><?php echo convertPrice(40000)['symbol']; ?></span>
                        <span class="price-number"><?php echo convertPrice(40000)['amount']; ?></span>
                        <span class="price-period">/month</span>
                    </div>
                </div>
                
                <ul class="pricing-features">
                    <li><i class="fas fa-check-circle"></i> Dual AMD EPYC 7543 (64C/128T)</li>
                    <li><i class="fas fa-check-circle"></i> 128 GB DDR4 ECC RAM</li>
                    <li><i class="fas fa-check-circle"></i> 4x 4 TB NVMe SSD (RAID 10)</li>
                    <li><i class="fas fa-check-circle"></i> 10 Gbps Port</li>
                    <li><i class="fas fa-check-circle"></i> 100 TB Bandwidth</li>
                    <li><i class="fas fa-check-circle"></i> /28 IPv4 Subnet (16 IPs)</li>
                    <li><i class="fas fa-check-circle"></i> Full Server Management</li>
                    <li><i class="fas fa-check-circle"></i> Enterprise RAID Controller</li>
                    <li><i class="fas fa-check-circle"></i> Advanced DDoS Protection</li>
                    <li><i class="fas fa-check-circle"></i> Hourly Backups</li>
                    <li><i class="fas fa-check-circle"></i> Dedicated Account Manager</li>
                    <li><i class="fas fa-check-circle"></i> 24/7 VIP Support with SLA</li>
                </ul>
                
                <a href="<?php echo getWHMCSProductURL(52); ?>" class="btn btn-primary pricing-cta" data-whmcs-product="52">
                    Order Now
                </a>
            </div>
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
                <i class="fas fa-shopping-cart"></i> Order Server
            </a>
            <a href="https://wa.me/<?php echo WHATSAPP_NUMBER; ?>" class="btn btn-outline btn-lg">
                <i class="fab fa-whatsapp"></i> Request Custom Quote
            </a>
        </div>
    </div>
</section>

<?php include 'includes/footer.php'; ?>
