<?php
/**
 * BDIX VPS Hosting Page
 * Bangladesh Internet Exchange VPS with Local Connectivity
 */

require_once 'config.php';

$pageTitle = 'BDIX VPS Hosting Bangladesh - Local High-Speed VPS';
$metaDescription = 'BDIX VPS hosting with ultra-fast local Bangladesh connectivity, SSD storage, and high bandwidth for streaming, gaming, file sharing, and content delivery.';
$metaKeywords = 'bdix vps, bangladesh vps, bdix hosting, local vps bangladesh, bdix vps hosting, streaming vps bd';

include 'includes/header.php';
?>

<link rel="stylesheet" href="<?php echo SITE_URL; ?>/assets/css/components.css">

<!-- Intro Section -->
<section class="section hero-section">
    <div class="container">
        <div class="service-hero">
            <div class="section-header">
                <span class="section-subtitle"><i class="fas fa-gauge-high"></i> BDIX VPS</span>
                <h1 class="section-title">Bangladesh Internet Exchange (BDIX) VPS</h1>
                <p class="section-description">
                    Experience lightning-fast local connectivity with BDIX VPS hosting. Perfect for streaming 
                    servers, game servers, file sharing, and content delivery within Bangladesh.
                </p>
                <div class="hero-cta">
                    <a href="#plans" class="btn btn-primary">
                        <i class="fas fa-cart-shopping"></i> Order BDIX VPS
                    </a>
                    <a href="https://wa.me/<?php echo WHATSAPP_NUMBER; ?>" class="btn btn-outline">
                        <i class="fab fa-whatsapp"></i> Need Guidance?
                    </a>
                </div>
            </div>
            <div class="service-hero-media">
                <!-- Unsplash: https://unsplash.com/photos/0ad4aaf24ca7 -->
                <img src="<?php echo SITE_URL; ?>/img/bdix-hero.jpg" alt="Server racks and network cables" loading="lazy">
            </div>
        </div>
        
        <!-- BDIX Benefits -->
        <div class="features-grid">
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-bolt"></i>
                </div>
                <h3 class="feature-title">Ultra-Fast BDIX</h3>
                <p class="feature-description">
                    Direct Bangladesh Internet Exchange connectivity with speeds up to 1 Gbps for local traffic.
                </p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-infinity"></i>
                </div>
                <h3 class="feature-title">Unlimited BDIX Bandwidth</h3>
                <p class="feature-description">
                    Truly unlimited bandwidth for BDIX connected ISPs within Bangladesh network.
                </p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-video"></i>
                </div>
                <h3 class="feature-title">Perfect for Streaming</h3>
                <p class="feature-description">
                    Ideal for IPTV, video streaming, OTT platforms, and media servers with buffer-free playback.
                </p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-gamepad"></i>
                </div>
                <h3 class="feature-title">Game Server Ready</h3>
                <p class="feature-description">
                    Low latency BDIX connection perfect for hosting game servers with minimal ping.
                </p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-location-dot"></i>
                </div>
                <h3 class="feature-title">Bangladesh Data Center</h3>
                <p class="feature-description">
                    Hosted in Tier III data center in Dhaka with redundant power and network infrastructure.
                </p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-shield-halved"></i>
                </div>
                <h3 class="feature-title">DDoS Protection</h3>
                <p class="feature-description">
                    Advanced DDoS protection and firewall to keep your server secure from attacks.
                </p>
            </div>
        </div>
    </div>
</section>

<!-- BDIX VPS Pricing -->
<section class="section section-bg" id="plans">
    <div class="container">
        <div class="section-header">
            <span class="section-subtitle"><i class="fas fa-tags"></i> Pricing</span>
            <h2 class="section-title">BDIX VPS Plans</h2>
            <p class="section-description">
                All plans include unlimited BDIX bandwidth, KVM virtualization, and full root access
            </p>
        </div>
        
        <div class="pricing-grid">
            <!-- BDIX Standard -->
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
                </div>
                
                <ul class="pricing-features">
                    <li><i class="fas fa-circle-check"></i> 2 Cores Core</li>
                    <li><i class="fas fa-circle-check"></i> 2 GB RAM</li>
                    <li><i class="fas fa-circle-check"></i> 25 GB Storage</li>
                    <li><i class="fas fa-circle-check"></i> 1000 GB/m Bandwidth</li>
                    <li><i class="fas fa-circle-check"></i> 1 Gbps BDIX</li>
                    <li><i class="fas fa-circle-check"></i> 100Mbps Internet</li>
                </ul>
                
                <a href="<?php echo getWHMCSProductURL(20); ?>" class="btn btn-primary pricing-cta" data-whmcs-product="20">
                    Order Now
                </a>
            </div>
            
            <!-- BDIX Enhanced -->
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
                </div>
                
                <ul class="pricing-features">
                    <li><i class="fas fa-circle-check"></i> 4 Cores Core</li>
                    <li><i class="fas fa-circle-check"></i> 4 GB RAM</li>
                    <li><i class="fas fa-circle-check"></i> 50 GB Storage</li>
                    <li><i class="fas fa-circle-check"></i> 1500 GB/m Bandwidth</li>
                    <li><i class="fas fa-circle-check"></i> 1 Gbps BDIX</li>
                    <li><i class="fas fa-circle-check"></i> 100Mbps Internet</li>
                </ul>
                
                <a href="<?php echo getWHMCSProductURL(21); ?>" class="btn btn-primary pricing-cta" data-whmcs-product="21">
                    Order Now
                </a>
            </div>
            
            <!-- BDIX Premium -->
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
                </div>
                
                <ul class="pricing-features">
                    <li><i class="fas fa-circle-check"></i> 6 Cores Core</li>
                    <li><i class="fas fa-circle-check"></i> 8 GB RAM</li>
                    <li><i class="fas fa-circle-check"></i> 100 GB Storage</li>
                    <li><i class="fas fa-circle-check"></i> 2000 GB/m Bandwidth</li>
                    <li><i class="fas fa-circle-check"></i> 1 Gbps BDIX</li>
                    <li><i class="fas fa-circle-check"></i> 100Mbps Internet</li>
                </ul>
                
                <a href="<?php echo getWHMCSProductURL(22); ?>" class="btn btn-primary pricing-cta" data-whmcs-product="22">
                    Order Now
                </a>
            </div>
        </div>
    </div>
</section>

<!-- Use Cases -->
<section class="section">
    <div class="container">
        <div class="section-header">
            <span class="section-subtitle"><i class="fas fa-layer-group"></i> Use Cases</span>
            <h2 class="section-title">Perfect For</h2>
        </div>
        
        <div class="features-grid">
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-tv"></i>
                </div>
                <h3 class="feature-title">IPTV & Streaming</h3>
                <p class="feature-description">
                    Host IPTV servers, video streaming platforms, and OTT services with buffer-free playback.
                </p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-gamepad"></i>
                </div>
                <h3 class="feature-title">Game Servers</h3>
                <p class="feature-description">
                    Ultra-low latency for Minecraft, CS:GO, PUBG, and other multiplayer game servers.
                </p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-file-arrow-down"></i>
                </div>
                <h3 class="feature-title">File Sharing</h3>
                <p class="feature-description">
                    High-speed file sharing and download servers for local Bangladesh users.
                </p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-cloud"></i>
                </div>
                <h3 class="feature-title">CDN & Caching</h3>
                <p class="feature-description">
                    Content delivery network and caching servers for faster content delivery.
                </p>
            </div>
        </div>
    </div>
</section>

<!-- Technical Specs -->
<section class="section section-bg">
    <div class="container">
        <div class="section-header">
            <span class="section-subtitle"><i class="fas fa-server"></i> Specs</span>
            <h2 class="section-title">Technical Specifications</h2>
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
                        <td>BDIX Connected with 1 Gbps Port</td>
                    </tr>
                    <tr>
                        <td><strong>BDIX Bandwidth</strong></td>
                        <td>Truly Unlimited (Fair Usage Policy)</td>
                    </tr>
                    <tr>
                        <td><strong>Virtualization</strong></td>
                        <td>KVM (Kernel-based Virtual Machine)</td>
                    </tr>
                    <tr>
                        <td><strong>Storage Type</strong></td>
                        <td>SSD / NVMe SSD (Raid 10)</td>
                    </tr>
                    <tr>
                        <td><strong>Operating Systems</strong></td>
                        <td>CentOS, Ubuntu, Debian, AlmaLinux, Rocky Linux</td>
                    </tr>
                    <tr>
                        <td><strong>Control Panel</strong></td>
                        <td>Optional: cPanel, Plesk, Webuzo (Additional cost)</td>
                    </tr>
                    <tr>
                        <td><strong>Setup Time</strong></td>
                        <td>Instant to 2 Hours</td>
                    </tr>
                    <tr>
                        <td><strong>Uptime SLA</strong></td>
                        <td>99.9% Network Uptime Guarantee</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</section>

<!-- CTA Section -->
<section class="cta-section">
    <div class="container">
        <h2 class="section-title">Get BDIX VPS Hosting Today!</h2>
        <p class="section-description">
            Experience ultra-fast local connectivity with unlimited BDIX bandwidth. Perfect for Bangladesh users.
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


