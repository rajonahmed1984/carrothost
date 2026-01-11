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
            <!-- Orange Carrot -->
            <div class="pricing-card" data-price-bdt="4800">
                <div class="pricing-icon">
                    <i class="fas fa-carrot"></i>
                </div>
                <h3 class="pricing-name">Orange Carrot</h3>
                
                <div class="pricing-price">
                    <div class="price-amount">
                        <span class="price-currency"><?php echo convertPrice(4800)['symbol']; ?></span>
                        <span class="price-number"><?php echo convertPrice(4800)['amount']; ?></span>
                        <span class="price-period">/year</span>
                    </div>
                    <p class="price-note">Annually</p>
                </div>
                
                <ul class="pricing-features">
                    <li><i class="fas fa-check-circle"></i> 1 Website</li>
                    <li><i class="fas fa-check-circle"></i> 10 Email Accounts</li>
                    <li><i class="fas fa-check-circle"></i> 2 GB Email Storage</li>
                    <li><i class="fas fa-check-circle"></i> 10 GB Hosting Storage</li>
                    <li><i class="fas fa-check-circle"></i> Proactive Malware Scanning</li>
                    <li><i class="fas fa-check-circle"></i> UNLIMITED Bandwidth</li>
                    <li><i class="fas fa-check-circle"></i> LiteSpeed Web Server</li>
                    <li><i class="fas fa-check-circle"></i> SSL Certificates</li>
                </ul>
                
                <a href="<?php echo getWHMCSProductURL(1); ?>" class="btn btn-primary pricing-cta" data-whmcs-product="1">
                    Order Now
                </a>
            </div>
            
            <!-- Blue Carrot -->
            <div class="pricing-card featured" data-price-bdt="9600">
                <span class="pricing-badge">Most Popular</span>
                <div class="pricing-icon">
                    <i class="fas fa-carrot"></i>
                </div>
                <h3 class="pricing-name">Blue Carrot</h3>
                
                <div class="pricing-price">
                    <div class="price-amount">
                        <span class="price-currency"><?php echo convertPrice(9600)['symbol']; ?></span>
                        <span class="price-number"><?php echo convertPrice(9600)['amount']; ?></span>
                        <span class="price-period">/year</span>
                    </div>
                    <p class="price-note">Annually</p>
                </div>
                
                <ul class="pricing-features">
                    <li><i class="fas fa-check-circle"></i> 1 Website</li>
                    <li><i class="fas fa-check-circle"></i> 20 Email Accounts</li>
                    <li><i class="fas fa-check-circle"></i> 4 GB Email Storage</li>
                    <li><i class="fas fa-check-circle"></i> 20 GB Hosting Storage</li>
                    <li><i class="fas fa-check-circle"></i> Proactive Malware Scanning</li>
                    <li><i class="fas fa-check-circle"></i> UNLIMITED Bandwidth</li>
                    <li><i class="fas fa-check-circle"></i> LiteSpeed Web Server</li>
                    <li><i class="fas fa-check-circle"></i> SSL Certificates</li>
                </ul>
                
                <a href="<?php echo getWHMCSProductURL(2); ?>" class="btn btn-primary pricing-cta" data-whmcs-product="2">
                    Order Now
                </a>
            </div>
            
            <!-- Red Carrot -->
            <div class="pricing-card" data-price-bdt="14400">
                <div class="pricing-icon">
                    <i class="fas fa-carrot"></i>
                </div>
                <h3 class="pricing-name">Red Carrot</h3>
                
                <div class="pricing-price">
                    <div class="price-amount">
                        <span class="price-currency"><?php echo convertPrice(14400)['symbol']; ?></span>
                        <span class="price-number"><?php echo convertPrice(14400)['amount']; ?></span>
                        <span class="price-period">/year</span>
                    </div>
                    <p class="price-note">Annually</p>
                </div>
                
                <ul class="pricing-features">
                    <li><i class="fas fa-check-circle"></i> 1 Website</li>
                    <li><i class="fas fa-check-circle"></i> 30 Email Accounts</li>
                    <li><i class="fas fa-check-circle"></i> 6 GB Email Storage</li>
                    <li><i class="fas fa-check-circle"></i> 30 GB Hosting Storage</li>
                    <li><i class="fas fa-check-circle"></i> Proactive Malware Scanning</li>
                    <li><i class="fas fa-check-circle"></i> UNLIMITED Bandwidth</li>
                    <li><i class="fas fa-check-circle"></i> LiteSpeed Web Server</li>
                    <li><i class="fas fa-check-circle"></i> SSL Certificates</li>
                </ul>
                
                <a href="<?php echo getWHMCSProductURL(3); ?>" class="btn btn-primary pricing-cta" data-whmcs-product="3">
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
