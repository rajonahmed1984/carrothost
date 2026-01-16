<?php
/**
 * Domain Transfer Page
 * Transfer Domain Names to CarrotHost
 */

require_once 'config.php';

$pageTitle = 'Domain Transfer - Transfer Your Domain to CarrotHost';
$metaDescription = 'Transfer your domain to CarrotHost for better management, free WHOIS privacy, and competitive pricing with a fast, secure transfer process.';
$metaKeywords = 'domain transfer, transfer domain, move domain, domain migration, domain transfer bangladesh';

include 'includes/header.php';
?>

<link rel="stylesheet" href="<?php echo SITE_URL; ?>/assets/css/components.css">

<!-- Transfer Intro -->
<section class="section hero-section">
    <div class="container">
        <div class="service-hero">
            <div class="section-header">
                <span class="section-subtitle"><i class="fas fa-right-left"></i> Domain Transfer</span>
                <h1 class="section-title">Transfer Your Domain to CarrotHost</h1>
                <p class="section-description">
                    Move your domain to CarrotHost for better service, competitive pricing, and free extras. 
                    Our transfer process is fast, secure, and comes with 1 year free extension.
                </p>
                <div class="hero-cta">
                    <a class="btn btn-primary" href="#transfer-search">
                        <i class="fas fa-arrow-right-arrow-left"></i> Start Transfer
                    </a>
                    <a class="btn btn-outline" href="<?php echo SITE_URL; ?>/domain-register">
                        <i class="fas fa-globe"></i> Register a Domain
                    </a>
                </div>
            </div>
            <div class="service-hero-media">
                <!-- Unsplash: https://unsplash.com/photos/9303baea8ebd -->
                <img src="<?php echo SITE_URL; ?>/img/domain-transfer-hero.jpg" alt="Team reviewing a domain transfer workflow" loading="lazy">
            </div>
        </div>

        <!-- Transfer Search Box -->
        <div class="domain-search-box" id="transfer-search">
            <h3 class="domain-search-title">Start Your Domain Transfer</h3>
            <form class="domain-search-form" action="<?php echo WHMCS_DOMAIN_TRANSFER; ?>" method="get" data-whmcs-url="<?php echo WHMCS_URL; ?>" data-check-mode="transfer" data-default-tld=".com">
                <div class="domain-input-wrapper">
                    <span>www.</span>
                    <input type="text" 
                           class="domain-input" 
                           placeholder="yourdomain.com" 
                           name="domain" 
                           required>
                </div>
                <button type="submit" class="btn btn-primary domain-search-btn">
                    <i class="fas fa-arrow-right-arrow-left"></i> Start Transfer
                </button>
            </form>
            <div class="domain-search-result" aria-live="polite"></div>
            <p class="domain-search-note">
                Enter your domain name to check transfer eligibility and get started
            </p>
        </div>
    </div>
</section>

<!-- Transfer Benefits -->
<section class="section section-bg">
    <div class="container">
        <div class="section-header">
            <span class="section-subtitle"><i class="fas fa-gift"></i> Transfer Benefits</span>
            <h2 class="section-title">Why Transfer to CarrotHost?</h2>
        </div>
        
        <div class="features-grid">
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-gift"></i>
                </div>
                <h3 class="feature-title">Free 1 Year Extension</h3>
                <p class="feature-description">
                    Get 1 year free domain extension added to your current expiry date when you transfer.
                </p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-user-secret"></i>
                </div>
                <h3 class="feature-title">Free WHOIS Privacy</h3>
                <p class="feature-description">
                    Protect your personal information with free lifetime WHOIS privacy protection.
                </p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-gauge-high"></i>
                </div>
                <h3 class="feature-title">Fast Transfer Process</h3>
                <p class="feature-description">
                    Most domain transfers complete within 5-7 days with our streamlined process.
                </p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-shield-halved"></i>
                </div>
                <h3 class="feature-title">Secure & Safe</h3>
                <p class="feature-description">
                    Your domain stays live during transfer with no downtime or data loss.
                </p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-tags"></i>
                </div>
                <h3 class="feature-title">Competitive Pricing</h3>
                <p class="feature-description">
                    Save money with our competitive renewal rates and no hidden fees.
                </p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-headset"></i>
                </div>
                <h3 class="feature-title">Transfer Assistance</h3>
                <p class="feature-description">
                    Our expert team helps you through every step of the transfer process.
                </p>
            </div>
        </div>
    </div>
</section>

<!-- Transfer Steps -->
<section class="section">
    <div class="container">
        <div class="section-header">
            <span class="section-subtitle"><i class="fas fa-list-check"></i> Simple Steps</span>
            <h2 class="section-title">How to Transfer Your Domain</h2>
            <p class="section-description">
                Follow these simple steps to transfer your domain to CarrotHost
            </p>
        </div>
        
        <div class="transfer-steps">
            <div class="transfer-step">
                <div class="transfer-step-badge">1</div>
                <div class="transfer-step-content">
                    <h3>Unlock Your Domain</h3>
                    <p>Log in to your current registrar and unlock your domain. This usually takes just a few clicks in your domain settings.</p>
                </div>
            </div>
            
            <div class="transfer-step">
                <div class="transfer-step-badge">2</div>
                <div class="transfer-step-content">
                    <h3>Get Authorization Code (EPP Code)</h3>
                    <p>Request the authorization code (also called EPP code or transfer key) from your current registrar.</p>
                </div>
            </div>
            
            <div class="transfer-step">
                <div class="transfer-step-badge">3</div>
                <div class="transfer-step-content">
                    <h3>Initiate Transfer</h3>
                    <p>Enter your domain and authorization code in our transfer form above, then complete the checkout process.</p>
                </div>
            </div>
            
            <div class="transfer-step">
                <div class="transfer-step-badge">4</div>
                <div class="transfer-step-content">
                    <h3>Approve Transfer Email</h3>
                    <p>Check your email for a transfer approval link and click to confirm. This email is sent to the domain's administrative contact.</p>
                </div>
            </div>
            
            <div class="transfer-step transfer-step-success">
                <div class="transfer-step-badge">5</div>
                <div class="transfer-step-content">
                    <h3>Transfer Complete!</h3>
                    <p>Your domain transfer will be completed within 5-7 days. You'll receive confirmation once it's done.</p>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Transfer Pricing -->
<section class="section section-bg">
    <div class="container">
        <div class="section-header">
            <span class="section-subtitle"><i class="fas fa-tag"></i> Transfer Pricing</span>
            <h2 class="section-title">Domain Transfer Pricing</h2>
            <p class="section-description">
                Competitive transfer rates with 1 year extension included
            </p>
        </div>
        
        <div class="comparison-table-wrapper narrow">
            <table class="comparison-table">
                <thead>
                    <tr>
                        <th>Extension</th>
                        <th>Transfer Price</th>
                        <th>Includes</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>.com</strong></td>
                        <td><span class="extension-price" data-tld=".com" data-price-type="transfer" data-price-bdt="1600"><?php echo formatPrice(1600); ?></span>/year</td>
                        <td>+1 Year Extension</td>
                    </tr>
                    <tr>
                        <td><strong>.net</strong></td>
                        <td><span class="extension-price" data-tld=".net" data-price-type="transfer" data-price-bdt="1900"><?php echo formatPrice(1900); ?></span>/year</td>
                        <td>+1 Year Extension</td>
                    </tr>
                    <tr>
                        <td><strong>.org</strong></td>
                        <td><span class="extension-price" data-tld=".org" data-price-type="transfer" data-price-bdt="1800"><?php echo formatPrice(1800); ?></span>/year</td>
                        <td>+1 Year Extension</td>
                    </tr>
                    <tr>
                        <td><strong>.info</strong></td>
                        <td><span class="extension-price" data-tld=".info" data-price-type="transfer" data-price-bdt="2500"><?php echo formatPrice(2500); ?></span>/year</td>
                        <td>+1 Year Extension</td>
                    </tr>
                    <tr>
                        <td><strong>.xyz</strong></td>
                        <td><span class="extension-price" data-tld=".xyz" data-price-type="transfer" data-price-bdt="500"><?php echo formatPrice(500); ?></span>/year</td>
                        <td>+1 Year Extension</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</section>

<!-- FAQ Section -->
<section class="section">
    <div class="container">
        <div class="section-header">
            <span class="section-subtitle"><i class="fas fa-circle-question"></i> FAQs</span>
            <h2 class="section-title">Transfer FAQs</h2>
        </div>
        
        <div class="faq-grid">
            <div class="faq-card">
                <h4 class="faq-question">How long does a domain transfer take?</h4>
                <p>Most domain transfers complete within 5-7 days. The exact time depends on your current registrar's processing time.</p>
            </div>
            
            <div class="faq-card">
                <h4 class="faq-question">Will my website go down during transfer?</h4>
                <p>No! Your website, email, and all services will continue to work normally during the transfer process.</p>
            </div>
            
            <div class="faq-card">
                <h4 class="faq-question">What is an authorization code?</h4>
                <p>An authorization code (EPP code) is a unique password for your domain that proves you own it. You can get it from your current registrar.</p>
            </div>
            
            <div class="faq-card">
                <h4 class="faq-question">Can I transfer a recently registered domain?</h4>
                <p>Domains must be at least 60 days old before they can be transferred according to ICANN rules.</p>
            </div>
        </div>
    </div>
</section>

<!-- CTA Section -->
<section class="cta-section">
    <div class="container">
        <h2 class="section-title">Ready to Transfer Your Domain?</h2>
        <p class="section-description">
            Start your hassle-free domain transfer today. Our team is here to help every step of the way!
        </p>
        <div class="cta-buttons">
            <a href="<?php echo WHMCS_DOMAIN_TRANSFER; ?>" class="btn btn-lg">
                <i class="fas fa-arrow-right-arrow-left"></i> Start Transfer
            </a>
            <a href="https://wa.me/<?php echo WHATSAPP_NUMBER; ?>" class="btn btn-outline btn-lg">
                <i class="fab fa-whatsapp"></i> Need Transfer Help?
            </a>
        </div>
    </div>
</section>

<?php include 'includes/footer.php'; ?>


