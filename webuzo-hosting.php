<?php
/**
 * Webuzo Hosting Page
 * VPS Hosting with Webuzo Control Panel
 */

require_once 'config.php';

$pageTitle = 'Webuzo VPS Hosting - Powerful VPS with Webuzo Panel';
$metaDescription = 'Affordable Webuzo VPS hosting with full root access, SSD storage, and easy application management. Perfect for developers and agencies.';
$metaKeywords = 'webuzo hosting, webuzo vps, vps with webuzo, cheap webuzo hosting, webuzo control panel';

include 'includes/header.php';
?>

<link rel="stylesheet" href="<?php echo SITE_URL; ?>/assets/css/components.css">

<!-- Page Header -->
<div class="page-header">
    <div class="container">
        <h1 class="page-header-title">Webuzo VPS Hosting</h1>
        <div class="page-header-breadcrumb">
            <a href="<?php echo SITE_URL; ?>"><i class="fas fa-home"></i> Home</a>
            <i class="fas fa-chevron-right"></i>
            <span>Webuzo Hosting</span>
        </div>
    </div>
</div>

<!-- Intro Section -->
<section class="section">
    <div class="container">
        <div class="section-header">
            <h2 class="section-title">VPS Hosting with Webuzo Control Panel</h2>
            <p class="section-description">
                Get the power of VPS with the ease of Webuzo control panel. Install 450+ applications 
                with one click, manage domains, email, databases, and more.
            </p>
        </div>
        
        <!-- Features Grid -->
        <div class="features-grid">
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-server"></i>
                </div>
                <h3 class="feature-title">Full Root Access</h3>
                <p class="feature-description">
                    Complete server control with root SSH access for advanced configuration and management.
                </p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-layer-group"></i>
                </div>
                <h3 class="feature-title">Webuzo Control Panel</h3>
                <p class="feature-description">
                    Easy-to-use control panel with 450+ application installer for WordPress, Joomla, and more.
                </p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-network-wired"></i>
                </div>
                <h3 class="feature-title">KVM Virtualization</h3>
                <p class="feature-description">
                    Fully isolated VPS environment with guaranteed resources using KVM technology.
                </p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-bolt"></i>
                </div>
                <h3 class="feature-title">NVMe SSD Storage</h3>
                <p class="feature-description">
                    Ultra-fast NVMe SSD drives deliver exceptional I/O performance for your applications.
                </p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-shield-alt"></i>
                </div>
                <h3 class="feature-title">DDoS Protection</h3>
                <p class="feature-description">
                    Built-in DDoS protection and firewall to keep your VPS secure from attacks.
                </p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-terminal"></i>
                </div>
                <h3 class="feature-title">Multiple OS Options</h3>
                <p class="feature-description">
                    Choose from CentOS, Ubuntu, Debian, AlmaLinux, and other popular Linux distributions.
                </p>
            </div>
        </div>
    </div>
</section>

<!-- Pricing Section -->
<section class="section section-bg">
    <div class="container">
        <div class="section-header">
            <h2 class="section-title">Webuzo VPS Plans</h2>
            <p class="section-description">
                All plans include Webuzo control panel, full root access, and 24/7 support
            </p>
        </div>
        
        <div class="pricing-grid">
            <!-- Starter -->
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
                    <p class="price-note">Annually</p>
                </div>
                
                <ul class="pricing-features">
                    <li><i class="fas fa-check-circle"></i> 5 GB SSD Storage</li>
                    <li><i class="fas fa-check-circle"></i> 250 GB Bandwidth</li>
                    <li><i class="fas fa-check-circle"></i> 1 Website</li>
                    <li><i class="fas fa-check-circle"></i> Standard Performance</li>
                    <li><i class="fas fa-check-circle"></i> Vulnerability Protection</li>
                    <li><i class="fas fa-check-circle"></i> SSL Certificates</li>
                </ul>
                
                <a href="<?php echo getWHMCSProductURL(10); ?>" class="btn btn-primary pricing-cta" data-whmcs-product="10">
                    Order Now
                </a>
            </div>
            
            <!-- Standard -->
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
                    <p class="price-note">Annually</p>
                </div>
                
                <ul class="pricing-features">
                    <li><i class="fas fa-check-circle"></i> 10 GB SSD Storage</li>
                    <li><i class="fas fa-check-circle"></i> 500 GB Bandwidth</li>
                    <li><i class="fas fa-check-circle"></i> 1 Website</li>
                    <li><i class="fas fa-check-circle"></i> Standard Performance</li>
                    <li><i class="fas fa-check-circle"></i> Vulnerability Protection</li>
                    <li><i class="fas fa-check-circle"></i> SSL Certificates</li>
                </ul>
                
                <a href="<?php echo getWHMCSProductURL(11); ?>" class="btn btn-primary pricing-cta" data-whmcs-product="11">
                    Order Now
                </a>
            </div>
            
            <!-- Advanced -->
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
                    <p class="price-note">Annually</p>
                </div>
                
                <ul class="pricing-features">
                    <li><i class="fas fa-check-circle"></i> 20 GB SSD Storage</li>
                    <li><i class="fas fa-check-circle"></i> 1000 GB Bandwidth</li>
                    <li><i class="fas fa-check-circle"></i> 1 Website</li>
                    <li><i class="fas fa-check-circle"></i> Standard Performance</li>
                    <li><i class="fas fa-check-circle"></i> Vulnerability Protection</li>
                    <li><i class="fas fa-check-circle"></i> SSL Certificates</li>
                </ul>
                
                <a href="<?php echo getWHMCSProductURL(12); ?>" class="btn btn-primary pricing-cta" data-whmcs-product="12">
                    Order Now
                </a>
            </div>
        </div>
    </div>
</section>

<!-- Webuzo Features -->
<section class="section">
    <div class="container">
        <div class="section-header">
            <h2 class="section-title">What's Included with Webuzo?</h2>
        </div>
        
        <div class="features-grid">
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-cloud-download-alt"></i>
                </div>
                <h3 class="feature-title">450+ Applications</h3>
                <p class="feature-description">
                    One-click installer for WordPress, Joomla, Drupal, Magento, and 450+ more applications.
                </p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-envelope-open-text"></i>
                </div>
                <h3 class="feature-title">Email Management</h3>
                <p class="feature-description">
                    Create unlimited email accounts with spam protection and webmail access.
                </p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-database"></i>
                </div>
                <h3 class="feature-title">Database Manager</h3>
                <p class="feature-description">
                    Easy MySQL/MariaDB database management with phpMyAdmin integration.
                </p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-folder-open"></i>
                </div>
                <h3 class="feature-title">File Manager</h3>
                <p class="feature-description">
                    Web-based file manager with upload, download, edit, and FTP functionality.
                </p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-code-branch"></i>
                </div>
                <h3 class="feature-title">Version Control</h3>
                <p class="feature-description">
                    Git integration for version control and easy deployment from repositories.
                </p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-chart-line"></i>
                </div>
                <h3 class="feature-title">Resource Monitor</h3>
                <p class="feature-description">
                    Real-time resource usage monitoring for CPU, RAM, disk, and bandwidth.
                </p>
            </div>
        </div>
    </div>
</section>

<!-- CTA Section -->
<section class="cta-section">
    <div class="container">
        <h2 class="section-title">Ready for VPS Hosting with Webuzo?</h2>
        <p class="section-description">
            Get started with powerful VPS hosting today. Instant setup and full control.
        </p>
        <div class="cta-buttons">
            <a href="<?php echo WHMCS_CART_URL; ?>" class="btn btn-lg">
                <i class="fas fa-shopping-cart"></i> Order Now
            </a>
            <a href="https://wa.me/<?php echo WHATSAPP_NUMBER; ?>" class="btn btn-outline btn-lg">
                <i class="fab fa-whatsapp"></i> Chat with Expert
            </a>
        </div>
    </div>
</section>

<?php include 'includes/footer.php'; ?>
