<?php
/**
 * Xeon VPS Hosting Page
 * Intel Xeon Powered VPS Servers
 */

require_once 'config.php';

$pageTitle = 'Xeon VPS Hosting - Intel Xeon Powered Virtual Servers';
$metaDescription = 'High-performance Xeon VPS hosting with Intel Xeon processors, NVMe SSD storage, and unmetered bandwidth. Perfect for business applications and high-traffic websites.';
$metaKeywords = 'xeon vps, intel xeon vps, xeon vps hosting, enterprise vps, high performance vps';

include 'includes/header.php';
?>

<link rel="stylesheet" href="<?php echo SITE_URL; ?>/assets/css/components.css">

<div class="page-header">
    <div class="container">
        <h1 class="page-header-title">Intel Xeon VPS Hosting</h1>
        <div class="page-header-breadcrumb">
            <a href="<?php echo SITE_URL; ?>"><i class="fas fa-home"></i> Home</a>
            <i class="fas fa-chevron-right"></i>
            <span>Xeon VPS</span>
        </div>
    </div>
</div>

<section class="section">
    <div class="container">
        <div class="section-header">
            <h2 class="section-title">Enterprise-Grade Intel Xeon VPS</h2>
            <p class="section-description">
                Powered by Intel Xeon processors with NVMe SSD storage for maximum performance. 
                Ideal for demanding applications, databases, and high-traffic websites.
            </p>
        </div>
        
        <div class="features-grid">
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-microchip"></i>
                </div>
                <h3 class="feature-title">Intel Xeon Processors</h3>
                <p class="feature-description">
                    Latest generation Intel Xeon CPUs with high clock speeds and multiple cores.
                </p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-bolt"></i>
                </div>
                <h3 class="feature-title">NVMe SSD Storage</h3>
                <p class="feature-description">
                    Ultra-fast NVMe SSDs deliver up to 6x faster performance than regular SSDs.
                </p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-infinity"></i>
                </div>
                <h3 class="feature-title">Unmetered Bandwidth</h3>
                <p class="feature-description">
                    Truly unmetered bandwidth on 1 Gbps network port for unlimited data transfer.
                </p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-memory"></i>
                </div>
                <h3 class="feature-title">DDR4 RAM</h3>
                <p class="feature-description">
                    High-speed DDR4 ECC RAM for reliable performance and data integrity.
                </p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-network-wired"></i>
                </div>
                <h3 class="feature-title">Premium Network</h3>
                <p class="feature-description">
                    Connected to Tier 1 carriers with multiple peering for low latency worldwide.
                </p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-user-shield"></i>
                </div>
                <h3 class="feature-title">Full Root Access</h3>
                <p class="feature-description">
                    Complete control with root SSH access and custom OS installation support.
                </p>
            </div>
        </div>
    </div>
</section>

<section class="section section-bg">
    <div class="container">
        <div class="section-header">
            <h2 class="section-title">Xeon VPS Plans</h2>
            <p class="section-description">
                All plans include KVM virtualization, unmetered bandwidth, and 99.9% uptime SLA
            </p>
        </div>
        
        <div class="pricing-grid">
            <div class="pricing-card" data-price-bdt="2500">
                <div class="pricing-icon">
                    <i class="fas fa-bolt"></i>
                </div>
                <h3 class="pricing-name">Xeon-1</h3>
                <p class="pricing-description">Entry-level Xeon VPS</p>
                
                <div class="pricing-price">
                    <div class="price-amount">
                        <span class="price-currency"><?php echo convertPrice(2500)['symbol']; ?></span>
                        <span class="price-number"><?php echo convertPrice(2500)['amount']; ?></span>
                        <span class="price-period">/month</span>
                    </div>
                </div>
                
                <ul class="pricing-features">
                    <li><i class="fas fa-check-circle"></i> 2 Xeon vCPU Cores</li>
                    <li><i class="fas fa-check-circle"></i> 4 GB DDR4 RAM</li>
                    <li><i class="fas fa-check-circle"></i> 50 GB NVMe SSD</li>
                    <li><i class="fas fa-check-circle"></i> Unmetered Bandwidth</li>
                    <li><i class="fas fa-check-circle"></i> 1 IPv4 + IPv6</li>
                    <li><i class="fas fa-check-circle"></i> KVM Virtualization</li>
                    <li><i class="fas fa-check-circle"></i> Full Root Access</li>
                    <li><i class="fas fa-check-circle"></i> 24/7 Support</li>
                </ul>
                
                <a href="<?php echo getWHMCSProductURL(30); ?>" class="btn btn-primary pricing-cta" data-whmcs-product="30">
                    Order Now
                </a>
            </div>
            
            <div class="pricing-card featured" data-price-bdt="4500">
                <span class="pricing-badge">Best Value</span>
                <div class="pricing-icon">
                    <i class="fas fa-star"></i>
                </div>
                <h3 class="pricing-name">Xeon-2</h3>
                <p class="pricing-description">Most popular plan</p>
                
                <div class="pricing-price">
                    <div class="price-amount">
                        <span class="price-currency"><?php echo convertPrice(4500)['symbol']; ?></span>
                        <span class="price-number"><?php echo convertPrice(4500)['amount']; ?></span>
                        <span class="price-period">/month</span>
                    </div>
                </div>
                
                <ul class="pricing-features">
                    <li><i class="fas fa-check-circle"></i> 4 Xeon vCPU Cores</li>
                    <li><i class="fas fa-check-circle"></i> 8 GB DDR4 RAM</li>
                    <li><i class="fas fa-check-circle"></i> 100 GB NVMe SSD</li>
                    <li><i class="fas fa-check-circle"></i> Unmetered Bandwidth</li>
                    <li><i class="fas fa-check-circle"></i> 1 IPv4 + IPv6</li>
                    <li><i class="fas fa-check-circle"></i> KVM Virtualization</li>
                    <li><i class="fas fa-check-circle"></i> Full Root Access</li>
                    <li><i class="fas fa-check-circle"></i> Weekly Backups</li>
                    <li><i class="fas fa-check-circle"></i> 24/7 Priority Support</li>
                </ul>
                
                <a href="<?php echo getWHMCSProductURL(31); ?>" class="btn btn-primary pricing-cta" data-whmcs-product="31">
                    Order Now
                </a>
            </div>
            
            <div class="pricing-card" data-price-bdt="8500">
                <div class="pricing-icon">
                    <i class="fas fa-crown"></i>
                </div>
                <h3 class="pricing-name">Xeon-3</h3>
                <p class="pricing-description">High-performance VPS</p>
                
                <div class="pricing-price">
                    <div class="price-amount">
                        <span class="price-currency"><?php echo convertPrice(8500)['symbol']; ?></span>
                        <span class="price-number"><?php echo convertPrice(8500)['amount']; ?></span>
                        <span class="price-period">/month</span>
                    </div>
                </div>
                
                <ul class="pricing-features">
                    <li><i class="fas fa-check-circle"></i> 8 Xeon vCPU Cores</li>
                    <li><i class="fas fa-check-circle"></i> 16 GB DDR4 RAM</li>
                    <li><i class="fas fa-check-circle"></i> 200 GB NVMe SSD</li>
                    <li><i class="fas fa-check-circle"></i> Unmetered Bandwidth</li>
                    <li><i class="fas fa-check-circle"></i> 2 IPv4 + IPv6</li>
                    <li><i class="fas fa-check-circle"></i> KVM Virtualization</li>
                    <li><i class="fas fa-check-circle"></i> Full Root Access</li>
                    <li><i class="fas fa-check-circle"></i> Daily Backups</li>
                    <li><i class="fas fa-check-circle"></i> DDoS Protection</li>
                    <li><i class="fas fa-check-circle"></i> 24/7 Premium Support</li>
                </ul>
                
                <a href="<?php echo getWHMCSProductURL(32); ?>" class="btn btn-primary pricing-cta" data-whmcs-product="32">
                    Order Now
                </a>
            </div>
        </div>
    </div>
</section>

<section class="cta-section">
    <div class="container">
        <h2 class="section-title">Power Your Business with Xeon VPS</h2>
        <p class="section-description">
            Get started with enterprise-grade Intel Xeon VPS hosting today.
        </p>
        <div class="cta-buttons">
            <a href="<?php echo WHMCS_CART_URL; ?>" class="btn btn-lg">
                <i class="fas fa-shopping-cart"></i> Order Now
            </a>
            <a href="https://wa.me/<?php echo WHATSAPP_NUMBER; ?>" class="btn btn-outline btn-lg">
                <i class="fab fa-whatsapp"></i> Chat with Us
            </a>
        </div>
    </div>
</section>

<?php include 'includes/footer.php'; ?>
