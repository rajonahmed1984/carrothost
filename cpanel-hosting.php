<?php
/**
 * cPanel Hosting Page
 * Professional cPanel Web Hosting Plans
 */

require_once 'config.php';

$pageTitle = 'cPanel Hosting Plans - Fast & Secure Web Hosting';
$metaDescription = 'Professional cPanel hosting with SSD storage, free SSL, daily backups, and 24/7 support. Choose from Basic, Standard, or Premium hosting plans starting from just ৳500/month.';
$metaKeywords = 'cpanel hosting bangladesh, cpanel web hosting, ssd cpanel hosting, cheap cpanel hosting bd, cpanel hosting price';

include 'includes/header.php';
?>

<link rel="stylesheet" href="<?php echo SITE_URL; ?>/assets/css/components.css">

<!-- Page Header -->
<div class="page-header">
    <div class="container">
        <h1 class="page-header-title">cPanel Hosting</h1>
        <div class="page-header-breadcrumb">
            <a href="<?php echo SITE_URL; ?>"><i class="fas fa-home"></i> Home</a>
            <i class="fas fa-chevron-right"></i>
            <span>cPanel Hosting</span>
        </div>
    </div>
</div>

<!-- Intro Section -->
<section class="section">
    <div class="container">
        <div class="section-header">
            <h2 class="section-title">Professional cPanel Web Hosting</h2>
            <p class="section-description">
                Experience powerful, reliable, and user-friendly cPanel hosting with SSD storage, 
                free SSL certificates, and 24/7 expert support. Perfect for websites of all sizes.
            </p>
        </div>
        
        <!-- Features Grid -->
        <div class="features-grid">
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-cpanel"></i>
                </div>
                <h3 class="feature-title">cPanel Control Panel</h3>
                <p class="feature-description">
                    Industry-leading cPanel with one-click installer, file manager, email management, and more.
                </p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-hdd"></i>
                </div>
                <h3 class="feature-title">Pure SSD Storage</h3>
                <p class="feature-description">
                    Ultra-fast SSD drives provide 20x faster performance compared to traditional hard drives.
                </p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-lock"></i>
                </div>
                <h3 class="feature-title">Free SSL Certificate</h3>
                <p class="feature-description">
                    Free Let's Encrypt SSL certificate with automatic installation and renewal included.
                </p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fab fa-wordpress"></i>
                </div>
                <h3 class="feature-title">WordPress Ready</h3>
                <p class="feature-description">
                    One-click WordPress installation with automatic updates and optimized performance.
                </p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-envelope"></i>
                </div>
                <h3 class="feature-title">Professional Email</h3>
                <p class="feature-description">
                    Create unlimited professional email accounts with webmail, IMAP, POP3, and SMTP support.
                </p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-shield-virus"></i>
                </div>
                <h3 class="feature-title">Advanced Security</h3>
                <p class="feature-description">
                    Imunify AV+ antivirus, firewall protection, and daily malware scanning included free.
                </p>
            </div>
        </div>
    </div>
</section>

<!-- Pricing Section -->
<section class="section section-bg">
    <div class="container">
        <div class="section-header">
            <h2 class="section-title">Choose Your Perfect Plan</h2>
            <p class="section-description">
                All plans include 24/7 support, free SSL, daily backups, and 99.9% uptime guarantee
            </p>
        </div>
        
        <div class="pricing-grid">
            <!-- Basic Plan -->
            <div class="pricing-card" data-price-bdt="500">
                <div class="pricing-icon">
                    <i class="fas fa-rocket"></i>
                </div>
                <h3 class="pricing-name">Basic</h3>
                <p class="pricing-description">Perfect for personal websites and blogs</p>
                
                <div class="pricing-price">
                    <div class="price-amount">
                        <span class="price-currency"><?php echo convertPrice(500)['symbol']; ?></span>
                        <span class="price-number"><?php echo convertPrice(500)['amount']; ?></span>
                        <span class="price-period">/month</span>
                    </div>
                    <p class="price-note">Billed annually - Save 20%</p>
                </div>
                
                <ul class="pricing-features">
                    <li><i class="fas fa-check-circle"></i> 2 GB SSD Storage</li>
                    <li><i class="fas fa-check-circle"></i> 20 GB Monthly Bandwidth</li>
                    <li><i class="fas fa-check-circle"></i> 1 Website/Domain</li>
                    <li><i class="fas fa-check-circle"></i> 5 Email Accounts</li>
                    <li><i class="fas fa-check-circle"></i> 5 FTP Accounts</li>
                    <li><i class="fas fa-check-circle"></i> Free SSL Certificate</li>
                    <li><i class="fas fa-check-circle"></i> cPanel Control Panel</li>
                    <li><i class="fas fa-check-circle"></i> Softaculous Auto Installer</li>
                    <li><i class="fas fa-check-circle"></i> 24/7 Support</li>
                    <li><i class="fas fa-check-circle"></i> 99.9% Uptime Guarantee</li>
                </ul>
                
                <a href="<?php echo getWHMCSProductURL(1); ?>" class="btn btn-primary pricing-cta" data-whmcs-product="1">
                    Order Now
                </a>
            </div>
            
            <!-- Standard Plan -->
            <div class="pricing-card featured" data-price-bdt="800">
                <span class="pricing-badge">Most Popular</span>
                <div class="pricing-icon">
                    <i class="fas fa-star"></i>
                </div>
                <h3 class="pricing-name">Standard</h3>
                <p class="pricing-description">Great for small business websites</p>
                
                <div class="pricing-price">
                    <div class="price-amount">
                        <span class="price-currency"><?php echo convertPrice(800)['symbol']; ?></span>
                        <span class="price-number"><?php echo convertPrice(800)['amount']; ?></span>
                        <span class="price-period">/month</span>
                    </div>
                    <p class="price-note">Billed annually - Save 20%</p>
                </div>
                
                <ul class="pricing-features">
                    <li><i class="fas fa-check-circle"></i> 5 GB SSD Storage</li>
                    <li><i class="fas fa-check-circle"></i> 50 GB Monthly Bandwidth</li>
                    <li><i class="fas fa-check-circle"></i> 3 Websites/Domains</li>
                    <li><i class="fas fa-check-circle"></i> 10 Email Accounts</li>
                    <li><i class="fas fa-check-circle"></i> 10 FTP Accounts</li>
                    <li><i class="fas fa-check-circle"></i> Free SSL Certificate</li>
                    <li><i class="fas fa-check-circle"></i> cPanel Control Panel</li>
                    <li><i class="fas fa-check-circle"></i> Softaculous Auto Installer</li>
                    <li><i class="fas fa-check-circle"></i> Daily Backups</li>
                    <li><i class="fas fa-check-circle"></i> Imunify AV+ Security</li>
                    <li><i class="fas fa-check-circle"></i> 24/7 Priority Support</li>
                    <li><i class="fas fa-check-circle"></i> 99.9% Uptime Guarantee</li>
                </ul>
                
                <a href="<?php echo getWHMCSProductURL(2); ?>" class="btn btn-primary pricing-cta" data-whmcs-product="2">
                    Order Now
                </a>
            </div>
            
            <!-- Premium Plan -->
            <div class="pricing-card" data-price-bdt="1500">
                <div class="pricing-icon">
                    <i class="fas fa-crown"></i>
                </div>
                <h3 class="pricing-name">Premium</h3>
                <p class="pricing-description">Ideal for growing businesses</p>
                
                <div class="pricing-price">
                    <div class="price-amount">
                        <span class="price-currency"><?php echo convertPrice(1500)['symbol']; ?></span>
                        <span class="price-number"><?php echo convertPrice(1500)['amount']; ?></span>
                        <span class="price-period">/month</span>
                    </div>
                    <p class="price-note">Billed annually - Save 20%</p>
                </div>
                
                <ul class="pricing-features">
                    <li><i class="fas fa-check-circle"></i> 10 GB SSD Storage</li>
                    <li><i class="fas fa-check-circle"></i> 100 GB Monthly Bandwidth</li>
                    <li><i class="fas fa-check-circle"></i> 10 Websites/Domains</li>
                    <li><i class="fas fa-check-circle"></i> Unlimited Email Accounts</li>
                    <li><i class="fas fa-check-circle"></i> Unlimited FTP Accounts</li>
                    <li><i class="fas fa-check-circle"></i> Free SSL Certificate</li>
                    <li><i class="fas fa-check-circle"></i> cPanel Control Panel</li>
                    <li><i class="fas fa-check-circle"></i> Softaculous Auto Installer</li>
                    <li><i class="fas fa-check-circle"></i> Daily Backups</li>
                    <li><i class="fas fa-check-circle"></i> Imunify AV+ Security</li>
                    <li><i class="fas fa-check-circle"></i> CloudLinux OS</li>
                    <li><i class="fas fa-check-circle"></i> LiteSpeed Web Server</li>
                    <li><i class="fas fa-check-circle"></i> 24/7 Premium Support</li>
                    <li><i class="fas fa-check-circle"></i> 99.9% Uptime Guarantee</li>
                </ul>
                
                <a href="<?php echo getWHMCSProductURL(3); ?>" class="btn btn-primary pricing-cta" data-whmcs-product="3">
                    Order Now
                </a>
            </div>
            
            <!-- Business Plan -->
            <div class="pricing-card" data-price-bdt="2500">
                <div class="pricing-icon">
                    <i class="fas fa-building"></i>
                </div>
                <h3 class="pricing-name">Business</h3>
                <p class="pricing-description">For high-traffic business websites</p>
                
                <div class="pricing-price">
                    <div class="price-amount">
                        <span class="price-currency"><?php echo convertPrice(2500)['symbol']; ?></span>
                        <span class="price-number"><?php echo convertPrice(2500)['amount']; ?></span>
                        <span class="price-period">/month</span>
                    </div>
                    <p class="price-note">Billed annually - Save 20%</p>
                </div>
                
                <ul class="pricing-features">
                    <li><i class="fas fa-check-circle"></i> 25 GB SSD Storage</li>
                    <li><i class="fas fa-check-circle"></i> 250 GB Monthly Bandwidth</li>
                    <li><i class="fas fa-check-circle"></i> Unlimited Websites</li>
                    <li><i class="fas fa-check-circle"></i> Unlimited Email Accounts</li>
                    <li><i class="fas fa-check-circle"></i> Unlimited FTP Accounts</li>
                    <li><i class="fas fa-check-circle"></i> Free SSL Certificate</li>
                    <li><i class="fas fa-check-circle"></i> cPanel Control Panel</li>
                    <li><i class="fas fa-check-circle"></i> Softaculous Auto Installer</li>
                    <li><i class="fas fa-check-circle"></i> Hourly Backups</li>
                    <li><i class="fas fa-check-circle"></i> Imunify360 Security</li>
                    <li><i class="fas fa-check-circle"></i> CloudLinux OS</li>
                    <li><i class="fas fa-check-circle"></i> LiteSpeed Web Server</li>
                    <li><i class="fas fa-check-circle"></i> Free CDN</li>
                    <li><i class="fas fa-check-circle"></i> Dedicated IP Address</li>
                    <li><i class="fas fa-check-circle"></i> 24/7 VIP Support</li>
                    <li><i class="fas fa-check-circle"></i> 99.9% Uptime Guarantee</li>
                </ul>
                
                <a href="<?php echo getWHMCSProductURL(4); ?>" class="btn btn-primary pricing-cta" data-whmcs-product="4">
                    Order Now
                </a>
            </div>
        </div>
    </div>
</section>

<!-- Technical Specifications -->
<section class="section">
    <div class="container">
        <div class="section-header">
            <h2 class="section-title">Technical Specifications</h2>
            <p class="section-description">
                Powered by enterprise-grade hardware and software
            </p>
        </div>
        
        <div class="comparison-table-wrapper">
            <table class="comparison-table">
                <thead>
                    <tr>
                        <th>Feature</th>
                        <th>Specification</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>Web Server</strong></td>
                        <td>LiteSpeed / Apache</td>
                    </tr>
                    <tr>
                        <td><strong>PHP Versions</strong></td>
                        <td>PHP 5.6, 7.0, 7.1, 7.2, 7.3, 7.4, 8.0, 8.1, 8.2</td>
                    </tr>
                    <tr>
                        <td><strong>Database</strong></td>
                        <td>MySQL 5.7 / MariaDB 10.5+</td>
                    </tr>
                    <tr>
                        <td><strong>Operating System</strong></td>
                        <td>CloudLinux OS with CageFS</td>
                    </tr>
                    <tr>
                        <td><strong>Control Panel</strong></td>
                        <td>cPanel/WHM Latest Version</td>
                    </tr>
                    <tr>
                        <td><strong>Security</strong></td>
                        <td>Imunify AV+ / Imunify360, ModSecurity</td>
                    </tr>
                    <tr>
                        <td><strong>Backup</strong></td>
                        <td>Daily Automated Backups (7-30 days retention)</td>
                    </tr>
                    <tr>
                        <td><strong>Network</strong></td>
                        <td>1 Gbps Port with Premium Bandwidth</td>
                    </tr>
                    <tr>
                        <td><strong>Data Center</strong></td>
                        <td>Tier III Data Center in Bangladesh</td>
                    </tr>
                    <tr>
                        <td><strong>Uptime</strong></td>
                        <td>99.9% Guaranteed SLA</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</section>

<!-- CTA Section -->
<section class="cta-section">
    <div class="container">
        <h2 class="section-title">Get Started with cPanel Hosting Today!</h2>
        <p class="section-description">
            30-day money-back guarantee. No questions asked. Start your website risk-free.
        </p>
        <div class="cta-buttons">
            <a href="<?php echo WHMCS_CART_URL; ?>" class="btn btn-lg">
                <i class="fas fa-shopping-cart"></i> Order Now
            </a>
            <a href="https://wa.me/<?php echo WHATSAPP_NUMBER; ?>" class="btn btn-outline btn-lg">
                <i class="fab fa-whatsapp"></i> Need Help? Chat with Us
            </a>
        </div>
    </div>
</section>

<?php include 'includes/footer.php'; ?>
