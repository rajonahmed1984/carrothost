<?php
/**
 * Domain Registration Page
 * Register New Domain Names
 */

require_once 'config.php';

$pageTitle = 'Domain Registration - Register Your Domain Name';
$metaDescription = 'Register your perfect domain name with CarrotHost. Choose from .com, .net, .org, .bd, and 500+ domain extensions. Affordable prices and free WHOIS privacy.';
$metaKeywords = 'domain registration, register domain, buy domain, domain name, cheap domain bangladesh';

include 'includes/header.php';
?>

<link rel="stylesheet" href="<?php echo SITE_URL; ?>/assets/css/components.css">

<div class="page-header">
    <div class="container">
        <h1 class="page-header-title">Register a New Domain</h1>
        <div class="page-header-breadcrumb">
            <a href="<?php echo SITE_URL; ?>"><i class="fas fa-home"></i> Home</a>
            <i class="fas fa-chevron-right"></i>
            <span>Domain Registration</span>
        </div>
    </div>
</div>

<!-- Domain Search Section -->
<section class="section">
    <div class="container">
        <div class="section-header">
            <h2 class="section-title">Find Your Perfect Domain Name</h2>
            <p class="section-description">
                Search and register your ideal domain name from 500+ extensions. Start building your online presence today!
            </p>
        </div>
        
        <div class="domain-search-box" style="max-width: 900px; margin: 2rem auto;">
            <form class="domain-search-form" data-whmcs-url="<?php echo WHMCS_URL; ?>">
                <div class="domain-input-wrapper">
                    <span>www.</span>
                    <input type="text" 
                           class="domain-input" 
                           placeholder="yourdomain" 
                           name="domain" 
                           required>
                </div>
                <button type="submit" class="btn btn-primary domain-search-btn">
                    <i class="fas fa-search"></i> Search Domain
                </button>
            </form>
        </div>
    </div>
</section>

<!-- Popular Domain Pricing -->
<section class="section section-bg">
    <div class="container">
        <div class="section-header">
            <h2 class="section-title">Popular Domain Extensions</h2>
            <p class="section-description">
                Choose from the most popular domain extensions at competitive prices
            </p>
        </div>
        
        <div class="pricing-grid">
            <!-- .com Domain -->
            <div class="pricing-card" data-price-bdt="1600">
                <div class="pricing-icon">
                    <i class="fas fa-globe"></i>
                </div>
                <h3 class="pricing-name">.COM</h3>
                <p class="pricing-description">Most popular domain extension</p>
                
                <div class="pricing-price">
                    <div class="price-amount">
                        <span class="price-currency"><?php echo convertPrice(1600)['symbol']; ?></span>
                        <span class="price-number"><?php echo convertPrice(1600)['amount']; ?></span>
                        <span class="price-period">/year</span>
                    </div>
                </div>
                
                <ul class="pricing-features">
                    <li><i class="fas fa-check-circle"></i> Worldwide Recognition</li>
                    <li><i class="fas fa-check-circle"></i> Best for Business</li>
                    <li><i class="fas fa-check-circle"></i> High Trust Factor</li>
                    <li><i class="fas fa-check-circle"></i> Free WHOIS Privacy</li>
                    <li><i class="fas fa-check-circle"></i> Free DNS Management</li>
                </ul>
                
                <a href="<?php echo WHMCS_DOMAIN_REGISTER; ?>" class="btn btn-primary pricing-cta">
                    Register Now
                </a>
            </div>
            
            <!-- .net Domain -->
            <div class="pricing-card" data-price-bdt="1900">
                <div class="pricing-icon">
                    <i class="fas fa-network-wired"></i>
                </div>
                <h3 class="pricing-name">.NET</h3>
                <p class="pricing-description">Network & technology sites</p>
                
                <div class="pricing-price">
                    <div class="price-amount">
                        <span class="price-currency"><?php echo convertPrice(1900)['symbol']; ?></span>
                        <span class="price-number"><?php echo convertPrice(1900)['amount']; ?></span>
                        <span class="price-period">/year</span>
                    </div>
                </div>
                
                <ul class="pricing-features">
                    <li><i class="fas fa-check-circle"></i> Tech Industry Standard</li>
                    <li><i class="fas fa-check-circle"></i> Great Alternative to .com</li>
                    <li><i class="fas fa-check-circle"></i> Professional Image</li>
                    <li><i class="fas fa-check-circle"></i> Free WHOIS Privacy</li>
                    <li><i class="fas fa-check-circle"></i> Free DNS Management</li>
                </ul>
                
                <a href="<?php echo WHMCS_DOMAIN_REGISTER; ?>" class="btn btn-primary pricing-cta">
                    Register Now
                </a>
            </div>
            
            <!-- .org Domain -->
            <div class="pricing-card" data-price-bdt="1800">
                <div class="pricing-icon">
                    <i class="fas fa-users"></i>
                </div>
                <h3 class="pricing-name">.ORG</h3>
                <p class="pricing-description">Organizations & nonprofits</p>
                
                <div class="pricing-price">
                    <div class="price-amount">
                        <span class="price-currency"><?php echo convertPrice(1800)['symbol']; ?></span>
                        <span class="price-number"><?php echo convertPrice(1800)['amount']; ?></span>
                        <span class="price-period">/year</span>
                    </div>
                </div>
                
                <ul class="pricing-features">
                    <li><i class="fas fa-check-circle"></i> Perfect for NGOs</li>
                    <li><i class="fas fa-check-circle"></i> Community Projects</li>
                    <li><i class="fas fa-check-circle"></i> High Credibility</li>
                    <li><i class="fas fa-check-circle"></i> Free WHOIS Privacy</li>
                    <li><i class="fas fa-check-circle"></i> Free DNS Management</li>
                </ul>
                
                <a href="<?php echo WHMCS_DOMAIN_REGISTER; ?>" class="btn btn-primary pricing-cta">
                    Register Now
                </a>
            </div>
            
            <!-- .xyz Domain -->
            <div class="pricing-card featured" data-price-bdt="500">
                <span class="pricing-badge">Hot Deal</span>
                <div class="pricing-icon">
                    <i class="fas fa-star"></i>
                </div>
                <h3 class="pricing-name">.XYZ</h3>
                <p class="pricing-description">Modern & affordable</p>
                
                <div class="pricing-price">
                    <div class="price-amount">
                        <span class="price-currency"><?php echo convertPrice(500)['symbol']; ?></span>
                        <span class="price-number"><?php echo convertPrice(500)['amount']; ?></span>
                        <span class="price-period">/year</span>
                    </div>
                </div>
                
                <ul class="pricing-features">
                    <li><i class="fas fa-check-circle"></i> Budget-Friendly</li>
                    <li><i class="fas fa-check-circle"></i> Modern Extension</li>
                    <li><i class="fas fa-check-circle"></i> Great Availability</li>
                    <li><i class="fas fa-check-circle"></i> Free WHOIS Privacy</li>
                    <li><i class="fas fa-check-circle"></i> Free DNS Management</li>
                </ul>
                
                <a href="<?php echo WHMCS_DOMAIN_REGISTER; ?>" class="btn btn-primary pricing-cta">
                    Register Now
                </a>
            </div>
        </div>
        
        <!-- More Extensions -->
        <div style="margin-top: 3rem; text-align: center;">
            <h3 style="margin-bottom: 1.5rem;">More Domain Extensions</h3>
            <div style="display: flex; flex-wrap: wrap; gap: 1rem; justify-content: center; max-width: 900px; margin: 0 auto;">
                <div class="extension-tag" data-price-bdt="2500">.info - <?php echo formatPrice(2500); ?></div>
                <div class="extension-tag" data-price-bdt="1200">.online - <?php echo formatPrice(1200); ?></div>
                <div class="extension-tag" data-price-bdt="1500">.store - <?php echo formatPrice(1500); ?></div>
                <div class="extension-tag" data-price-bdt="1800">.tech - <?php echo formatPrice(1800); ?></div>
                <div class="extension-tag" data-price-bdt="3500">.bd - <?php echo formatPrice(3500); ?></div>
                <div class="extension-tag" data-price-bdt="4500">.com.bd - <?php echo formatPrice(4500); ?></div>
                <div class="extension-tag" data-price-bdt="2200">.site - <?php echo formatPrice(2200); ?></div>
                <div class="extension-tag" data-price-bdt="2500">.shop - <?php echo formatPrice(2500); ?></div>
                <div class="extension-tag" data-price-bdt="1800">.app - <?php echo formatPrice(1800); ?></div>
                <div class="extension-tag" data-price-bdt="2800">.dev - <?php echo formatPrice(2800); ?></div>
            </div>
        </div>
    </div>
</section>

<!-- Domain Features -->
<section class="section">
    <div class="container">
        <div class="section-header">
            <h2 class="section-title">Why Register Your Domain with CarrotHost?</h2>
        </div>
        
        <div class="features-grid">
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-shield-alt"></i>
                </div>
                <h3 class="feature-title">Free WHOIS Privacy</h3>
                <p class="feature-description">
                    Protect your personal information with free WHOIS privacy protection on eligible domains.
                </p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-lock"></i>
                </div>
                <h3 class="feature-title">Domain Lock</h3>
                <p class="feature-description">
                    Prevent unauthorized domain transfers with free domain lock protection.
                </p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-sync-alt"></i>
                </div>
                <h3 class="feature-title">Auto-Renewal</h3>
                <p class="feature-description">
                    Never lose your domain with automatic renewal option and expiration reminders.
                </p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-dns"></i>
                </div>
                <h3 class="feature-title">Free DNS Management</h3>
                <p class="feature-description">
                    Full DNS management with easy-to-use control panel and unlimited records.
                </p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-envelope"></i>
                </div>
                <h3 class="feature-title">Email Forwarding</h3>
                <p class="feature-description">
                    Free email forwarding to any email address you choose.
                </p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-headset"></i>
                </div>
                <h3 class="feature-title">24/7 Support</h3>
                <p class="feature-description">
                    Expert domain support available anytime via WhatsApp, email, or ticket.
                </p>
            </div>
        </div>
    </div>
</section>

<!-- CTA Section -->
<section class="cta-section">
    <div class="container">
        <h2 class="section-title">Ready to Register Your Domain?</h2>
        <p class="section-description">
            Search and register your perfect domain name today. Get started in minutes!
        </p>
        <div class="cta-buttons">
            <a href="<?php echo WHMCS_DOMAIN_REGISTER; ?>" class="btn btn-lg">
                <i class="fas fa-search"></i> Search Domain
            </a>
            <a href="https://wa.me/<?php echo WHATSAPP_NUMBER; ?>" class="btn btn-outline btn-lg">
                <i class="fab fa-whatsapp"></i> Need Help?
            </a>
        </div>
    </div>
</section>

<?php include 'includes/footer.php'; ?>
