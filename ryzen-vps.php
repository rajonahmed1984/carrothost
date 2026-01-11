<?php
/**
 * Ryzen VPS Hosting Page
 * AMD Ryzen Powered VPS Servers
 */

require_once 'config.php';

$pageTitle = 'Ryzen VPS Hosting - AMD Ryzen Powered Virtual Servers';
$metaDescription = 'High-performance Ryzen VPS hosting with AMD Ryzen processors, NVMe storage, and exceptional single-thread performance. Perfect for gaming and CPU-intensive applications.';
$metaKeywords = 'ryzen vps, amd ryzen vps, ryzen vps hosting, gaming vps, high performance vps';

include 'includes/header.php';
?>

<link rel="stylesheet" href="<?php echo SITE_URL; ?>/assets/css/components.css">

<div class="page-header">
    <div class="container">
        <h1 class="page-header-title">AMD Ryzen VPS Hosting</h1>
        <div class="page-header-breadcrumb">
            <a href="<?php echo SITE_URL; ?>"><i class="fas fa-home"></i> Home</a>
            <i class="fas fa-chevron-right"></i>
            <span>Ryzen VPS</span>
        </div>
    </div>
</div>

<section class="section">
    <div class="container">
        <div class="section-header">
            <h2 class="section-title">AMD Ryzen Powered VPS</h2>
            <p class="section-description">
                Experience exceptional performance with AMD Ryzen processors. Best-in-class single-thread 
                performance perfect for gaming servers, trading platforms, and CPU-intensive workloads.
            </p>
        </div>
        
        <div class="features-grid">
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fab fa-amd"></i>
                </div>
                <h3 class="feature-title">AMD Ryzen Power</h3>
                <p class="feature-description">
                    Latest AMD Ryzen processors with high clock speeds and superior IPC performance.
                </p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-gamepad"></i>
                </div>
                <h3 class="feature-title">Gaming Optimized</h3>
                <p class="feature-description">
                    Perfect for game servers with excellent single-core performance and low latency.
                </p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-tachometer-alt"></i>
                </div>
                <h3 class="feature-title">High Clock Speed</h3>
                <p class="feature-description">
                    Boost up to 4.9 GHz for maximum performance in single-threaded applications.
                </p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-hdd"></i>
                </div>
                <h3 class="feature-title">Gen4 NVMe Storage</h3>
                <p class="feature-description">
                    PCIe Gen4 NVMe SSDs provide ultra-fast read/write speeds up to 7000 MB/s.
                </p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-infinity"></i>
                </div>
                <h3 class="feature-title">Unlimited Bandwidth</h3>
                <p class="feature-description">
                    Truly unlimited bandwidth on high-speed 1-10 Gbps network ports.
                </p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-shield-alt"></i>
                </div>
                <h3 class="feature-title">Advanced Security</h3>
                <p class="feature-description">
                    DDoS protection, firewall, and regular security updates included free.
                </p>
            </div>
        </div>
    </div>
</section>

<section class="section section-bg">
    <div class="container">
        <div class="section-header">
            <h2 class="section-title">Ryzen VPS Plans</h2>
            <p class="section-description">
                All plans include KVM virtualization, unlimited bandwidth, and instant setup
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
                    <li><i class="fas fa-check-circle"></i> 2 Ryzen vCPU Cores</li>
                    <li><i class="fas fa-check-circle"></i> 4 GB DDR4 RAM</li>
                    <li><i class="fas fa-check-circle"></i> 60 GB NVMe SSD</li>
                    <li><i class="fas fa-check-circle"></i> Unlimited Bandwidth</li>
                    <li><i class="fas fa-check-circle"></i> 1 IPv4 + IPv6</li>
                    <li><i class="fas fa-check-circle"></i> KVM Virtualization</li>
                    <li><i class="fas fa-check-circle"></i> Full Root Access</li>
                    <li><i class="fas fa-check-circle"></i> 24/7 Support</li>
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
                    <li><i class="fas fa-check-circle"></i> 4 Ryzen vCPU Cores</li>
                    <li><i class="fas fa-check-circle"></i> 8 GB DDR4 RAM</li>
                    <li><i class="fas fa-check-circle"></i> 120 GB NVMe SSD</li>
                    <li><i class="fas fa-check-circle"></i> Unlimited Bandwidth</li>
                    <li><i class="fas fa-check-circle"></i> 1 IPv4 + IPv6</li>
                    <li><i class="fas fa-check-circle"></i> KVM Virtualization</li>
                    <li><i class="fas fa-check-circle"></i> Full Root Access</li>
                    <li><i class="fas fa-check-circle"></i> Weekly Backups</li>
                    <li><i class="fas fa-check-circle"></i> 24/7 Priority Support</li>
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
                    <li><i class="fas fa-check-circle"></i> 8 Ryzen vCPU Cores</li>
                    <li><i class="fas fa-check-circle"></i> 16 GB DDR4 RAM</li>
                    <li><i class="fas fa-check-circle"></i> 240 GB NVMe SSD</li>
                    <li><i class="fas fa-check-circle"></i> Unlimited Bandwidth</li>
                    <li><i class="fas fa-check-circle"></i> 2 IPv4 + IPv6</li>
                    <li><i class="fas fa-check-circle"></i> KVM Virtualization</li>
                    <li><i class="fas fa-check-circle"></i> Full Root Access</li>
                    <li><i class="fas fa-check-circle"></i> Daily Backups</li>
                    <li><i class="fas fa-check-circle"></i> DDoS Protection</li>
                    <li><i class="fas fa-check-circle"></i> 24/7 Premium Support</li>
                </ul>
                
                <a href="<?php echo getWHMCSProductURL(42); ?>" class="btn btn-primary pricing-cta" data-whmcs-product="42">
                    Order Now
                </a>
            </div>
        </div>
    </div>
</section>

<section class="cta-section">
    <div class="container">
        <h2 class="section-title">Unleash AMD Ryzen Performance!</h2>
        <p class="section-description">
            Experience the power of AMD Ryzen processors. Perfect for gaming and high-performance applications.
        </p>
        <div class="cta-buttons">
            <a href="<?php echo WHMCS_CART_URL; ?>" class="btn btn-lg">
                <i class="fas fa-shopping-cart"></i> Order Ryzen VPS
            </a>
            <a href="https://wa.me/<?php echo WHATSAPP_NUMBER; ?>" class="btn btn-outline btn-lg">
                <i class="fab fa-whatsapp"></i> Get Consultation
            </a>
        </div>
    </div>
</section>

<?php include 'includes/footer.php'; ?>
