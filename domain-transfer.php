<?php
/**
 * Domain Transfer Page
 * Transfer Domain Names to CarrotHost
 */

require_once 'config.php';

$pageTitle = 'Domain Transfer - Transfer Your Domain to CarrotHost';
$metaDescription = 'Transfer your domain to CarrotHost for better management, free WHOIS privacy, and competitive prices. Fast, secure, and hassle-free domain transfer process.';
$metaKeywords = 'domain transfer, transfer domain, move domain, domain migration, domain transfer bangladesh';

include 'includes/header.php';
?>

<link rel="stylesheet" href="<?php echo SITE_URL; ?>/assets/css/components.css">

<div class="page-header">
    <div class="container">
        <h1 class="page-header-title">Transfer Your Domain</h1>
        <div class="page-header-breadcrumb">
            <a href="<?php echo SITE_URL; ?>"><i class="fas fa-home"></i> Home</a>
            <i class="fas fa-chevron-right"></i>
            <span>Domain Transfer</span>
        </div>
    </div>
</div>

<!-- Transfer Intro -->
<section class="section">
    <div class="container">
        <div class="section-header">
            <h2 class="section-title">Transfer Your Domain to CarrotHost</h2>
            <p class="section-description">
                Move your domain to CarrotHost for better service, competitive pricing, and free extras. 
                Our transfer process is fast, secure, and comes with 1 year free extension.
            </p>
        </div>
        
        <!-- Transfer Search Box -->
        <div class="domain-search-box" style="max-width: 900px; margin: 2rem auto;">
            <h3 class="domain-search-title">Start Your Domain Transfer</h3>
            <form class="domain-search-form" action="<?php echo WHMCS_DOMAIN_TRANSFER; ?>" method="get">
                <div class="domain-input-wrapper">
                    <span>www.</span>
                    <input type="text" 
                           class="domain-input" 
                           placeholder="yourdomain.com" 
                           name="domain" 
                           required>
                </div>
                <button type="submit" class="btn btn-primary domain-search-btn">
                    <i class="fas fa-exchange-alt"></i> Start Transfer
                </button>
            </form>
            <p style="text-align: center; margin-top: 1rem; color: #666; font-size: 0.9rem;">
                Enter your domain name to check transfer eligibility and get started
            </p>
        </div>
    </div>
</section>

<!-- Transfer Benefits -->
<section class="section section-bg">
    <div class="container">
        <div class="section-header">
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
                    <i class="fas fa-tachometer-alt"></i>
                </div>
                <h3 class="feature-title">Fast Transfer Process</h3>
                <p class="feature-description">
                    Most domain transfers complete within 5-7 days with our streamlined process.
                </p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-shield-alt"></i>
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
            <h2 class="section-title">How to Transfer Your Domain</h2>
            <p class="section-description">
                Follow these simple steps to transfer your domain to CarrotHost
            </p>
        </div>
        
        <div style="max-width: 900px; margin: 0 auto;">
            <div style="display: grid; gap: 2rem;">
                <!-- Step 1 -->
                <div style="display: flex; gap: 2rem; align-items: start;">
                    <div style="flex-shrink: 0; width: 60px; height: 60px; background: linear-gradient(135deg, #f16922 0%, #d95a1c 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem; font-weight: bold;">1</div>
                    <div>
                        <h3 style="margin-bottom: 0.5rem;">Unlock Your Domain</h3>
                        <p style="color: #666;">Log in to your current registrar and unlock your domain. This usually takes just a few clicks in your domain settings.</p>
                    </div>
                </div>
                
                <!-- Step 2 -->
                <div style="display: flex; gap: 2rem; align-items: start;">
                    <div style="flex-shrink: 0; width: 60px; height: 60px; background: linear-gradient(135deg, #f16922 0%, #d95a1c 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem; font-weight: bold;">2</div>
                    <div>
                        <h3 style="margin-bottom: 0.5rem;">Get Authorization Code (EPP Code)</h3>
                        <p style="color: #666;">Request the authorization code (also called EPP code or transfer key) from your current registrar.</p>
                    </div>
                </div>
                
                <!-- Step 3 -->
                <div style="display: flex; gap: 2rem; align-items: start;">
                    <div style="flex-shrink: 0; width: 60px; height: 60px; background: linear-gradient(135deg, #f16922 0%, #d95a1c 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem; font-weight: bold;">3</div>
                    <div>
                        <h3 style="margin-bottom: 0.5rem;">Initiate Transfer</h3>
                        <p style="color: #666;">Enter your domain and authorization code in our transfer form above, then complete the checkout process.</p>
                    </div>
                </div>
                
                <!-- Step 4 -->
                <div style="display: flex; gap: 2rem; align-items: start;">
                    <div style="flex-shrink: 0; width: 60px; height: 60px; background: linear-gradient(135deg, #f16922 0%, #d95a1c 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem; font-weight: bold;">4</div>
                    <div>
                        <h3 style="margin-bottom: 0.5rem;">Approve Transfer Email</h3>
                        <p style="color: #666;">Check your email for a transfer approval link and click to confirm. This email is sent to the domain's administrative contact.</p>
                    </div>
                </div>
                
                <!-- Step 5 -->
                <div style="display: flex; gap: 2rem; align-items: start;">
                    <div style="flex-shrink: 0; width: 60px; height: 60px; background: linear-gradient(135deg, #009247 0%, #007a3a 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem; font-weight: bold;">✓</div>
                    <div>
                        <h3 style="margin-bottom: 0.5rem;">Transfer Complete!</h3>
                        <p style="color: #666;">Your domain transfer will be completed within 5-7 days. You'll receive confirmation once it's done.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Transfer Pricing -->
<section class="section section-bg">
    <div class="container">
        <div class="section-header">
            <h2 class="section-title">Domain Transfer Pricing</h2>
            <p class="section-description">
                Competitive transfer rates with 1 year extension included
            </p>
        </div>
        
        <div class="comparison-table-wrapper" style="max-width: 800px; margin: 0 auto;">
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
                        <td data-price-bdt="1600"><?php echo formatPrice(1600); ?>/year</td>
                        <td>+1 Year Extension</td>
                    </tr>
                    <tr>
                        <td><strong>.net</strong></td>
                        <td data-price-bdt="1900"><?php echo formatPrice(1900); ?>/year</td>
                        <td>+1 Year Extension</td>
                    </tr>
                    <tr>
                        <td><strong>.org</strong></td>
                        <td data-price-bdt="1800"><?php echo formatPrice(1800); ?>/year</td>
                        <td>+1 Year Extension</td>
                    </tr>
                    <tr>
                        <td><strong>.info</strong></td>
                        <td data-price-bdt="2500"><?php echo formatPrice(2500); ?>/year</td>
                        <td>+1 Year Extension</td>
                    </tr>
                    <tr>
                        <td><strong>.xyz</strong></td>
                        <td data-price-bdt="500"><?php echo formatPrice(500); ?>/year</td>
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
            <h2 class="section-title">Transfer FAQs</h2>
        </div>
        
        <div style="max-width: 900px; margin: 0 auto;">
            <div style="display: grid; gap: 1.5rem;">
                <div style="background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                    <h4 style="color: #f16922; margin-bottom: 0.5rem;">How long does a domain transfer take?</h4>
                    <p style="color: #666;">Most domain transfers complete within 5-7 days. The exact time depends on your current registrar's processing time.</p>
                </div>
                
                <div style="background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                    <h4 style="color: #f16922; margin-bottom: 0.5rem;">Will my website go down during transfer?</h4>
                    <p style="color: #666;">No! Your website, email, and all services will continue to work normally during the transfer process.</p>
                </div>
                
                <div style="background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                    <h4 style="color: #f16922; margin-bottom: 0.5rem;">What is an authorization code?</h4>
                    <p style="color: #666;">An authorization code (EPP code) is a unique password for your domain that proves you own it. You can get it from your current registrar.</p>
                </div>
                
                <div style="background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                    <h4 style="color: #f16922; margin-bottom: 0.5rem;">Can I transfer a recently registered domain?</h4>
                    <p style="color: #666;">Domains must be at least 60 days old before they can be transferred according to ICANN rules.</p>
                </div>
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
                <i class="fas fa-exchange-alt"></i> Start Transfer
            </a>
            <a href="https://wa.me/<?php echo WHATSAPP_NUMBER; ?>" class="btn btn-outline btn-lg">
                <i class="fab fa-whatsapp"></i> Need Transfer Help?
            </a>
        </div>
    </div>
</section>

<?php include 'includes/footer.php'; ?>
