<?php
/**
 * Domain Registration Page
 * Register New Domain Names
 */

require_once 'config.php';

$pageTitle = 'Domain Registration - Register Your Domain Name';
$metaDescription = 'Register your perfect domain name with CarrotHost. Choose .com, .net, .org, .bd, and 500+ extensions with instant activation, free DNS, and WHOIS privacy.';
$metaKeywords = 'domain registration, register domain, buy domain, domain name, cheap domain bangladesh';

include 'includes/header.php';
?>

<link rel="stylesheet" href="<?php echo SITE_URL; ?>/assets/css/components.css">

<section class="section hero-section">
    <div class="container">
        <div class="service-hero">
            <div class="section-header">
                <span class="section-subtitle"><i class="fas fa-globe"></i> Domain Registration</span>
                <h1 class="section-title">Find Your Perfect Domain Name</h1>
                <p class="section-description">
                    Search and register your ideal domain name from 500+ extensions. Start building your online presence today!
                </p>
                <div class="hero-cta">
                    <a class="btn btn-primary" href="#domain-search">
                        <i class="fas fa-magnifying-glass"></i> Search Domain
                    </a>
                    <a class="btn btn-outline" href="<?php echo SITE_URL; ?>/domain-transfer">
                        <i class="fas fa-right-left"></i> Transfer a Domain
                    </a>
                </div>
            </div>
            <div class="service-hero-media">
                <!-- Unsplash: https://unsplash.com/photos/c5249f4df085 -->
                <img src="<?php echo SITE_URL; ?>/img/domain-hero.jpg" alt="Laptop showing a domain search workflow" loading="lazy">
            </div>
        </div>

        <div class="domain-search-box" id="domain-search">
            <form class="domain-search-form" data-whmcs-url="<?php echo WHMCS_URL; ?>" data-check-mode="register" data-default-tld=".com">
                <div class="domain-input-wrapper">
                    <span>www.</span>
                    <input type="text" 
                           class="domain-input" 
                           placeholder="yourdomain" 
                           name="domain" 
                           required>
                </div>
                <button type="submit" class="btn btn-primary domain-search-btn">
                    <i class="fas fa-magnifying-glass"></i> Search Domain
                </button>
            </form>
            <div class="domain-search-result" aria-live="polite"></div>
        </div>
    </div>
</section>

<!-- Featured TLDs -->
<section class="section">
    <div class="container">
        <div class="section-header">
            <span class="section-subtitle"><i class="fas fa-tags"></i> Popular Picks</span>
            <h2 class="section-title">Featured Extensions</h2>
            <p class="section-description">Top picks with live pricing</p>
        </div>
        <div class="featured-tlds">
            <ul>
                <li data-tld=".com" data-price-type="register">
                    <div class="tld-badge">.com</div>
                    <p><span class="extension-price" data-price-bdt="1600"><?php echo formatPrice(1600); ?></span> /year</p>
                </li>
                <li data-tld=".xyz" data-price-type="register">
                    <span class="sale-icon">Hot</span>
                    <div class="tld-badge">.xyz</div>
                    <p>Only <span class="extension-price" data-price-bdt="333"><?php echo formatPrice(333); ?></span> /year</p>
                    <p class="tld-note">Promo End Date: 31-12-2025</p>
                </li>
                <li data-tld=".net" data-price-type="register">
                    <div class="tld-badge">.net</div>
                    <p><span class="extension-price" data-price-bdt="1900"><?php echo formatPrice(1900); ?></span> /year</p>
                </li>
                <li data-tld=".org" data-price-type="register">
                    <div class="tld-badge">.org</div>
                    <p><span class="extension-price" data-price-bdt="1900"><?php echo formatPrice(1900); ?></span> /year</p>
                </li>
            </ul>
        </div>
    </div>
</section>

<!-- Domain Pricing Table -->
<section class="section section-bg">
    <div class="container">
        <div class="section-header">
            <span class="section-subtitle"><i class="fas fa-chart-line"></i> Live Pricing</span>
            <h2 class="section-title">Domain Pricing</h2>
            <p class="section-description">
                Browse extensions by category with live WHMCS pricing
            </p>
        </div>
        <div class="domain-pricing-browser" data-whmcs-url="<?php echo WHMCS_URL; ?>">
            <div class="domain-category-filters" role="tablist" aria-label="Domain categories">
                <button class="category-btn active" type="button" data-category="Popular">Popular</button>
                <button class="category-btn" type="button" data-category="Arts and Entertainment">Arts and Entertainment</button>
                <button class="category-btn" type="button" data-category="Business">Business</button>
                <button class="category-btn" type="button" data-category="Geographic">Geographic</button>
                <button class="category-btn" type="button" data-category="Sports">Sports</button>
                <button class="category-btn" type="button" data-category="Technology">Technology</button>
                <button class="category-btn" type="button" data-category="Services">Services</button>
                <button class="category-btn" type="button" data-category="Money and Finance">Money and Finance</button>
                <button class="category-btn" type="button" data-category="Education">Education</button>
                <button class="category-btn" type="button" data-category="Food and Drink">Food and Drink</button>
                <button class="category-btn" type="button" data-category="Leisure and Recreation">Leisure and Recreation</button>
                <button class="category-btn" type="button" data-category="Shopping">Shopping</button>
                <button class="category-btn" type="button" data-category="Real Estate">Real Estate</button>
                <button class="category-btn" type="button" data-category="Novelty">Novelty</button>
                <button class="category-btn" type="button" data-category="Other">Other</button>
            </div>

            <div class="comparison-table-wrapper domain-pricing-table" style="max-width: 900px; margin: 0 auto;">
                <table class="comparison-table">
                    <thead>
                        <tr>
                            <th>Domain</th>
                            <th>New Price</th>
                            <th>Transfer</th>
                            <th>Renewal</th>
                        </tr>
                    </thead>
                    <tbody data-domain-pricing-body>
                        <tr>
                            <td colspan="4">Loading pricing...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</section>

<!-- Domain Features -->
<section class="section">
    <div class="container">
        <div class="section-header">
            <span class="section-subtitle"><i class="fas fa-shield-halved"></i> Why CarrotHost</span>
            <h2 class="section-title">Why Register Your Domain with CarrotHost?</h2>
            <p class="section-description">
                Everything you need to secure, manage, and grow your domain in one place.
            </p>
        </div>
        
        <div class="features-grid">
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-shield-halved"></i>
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
                    <i class="fas fa-arrows-rotate"></i>
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
                <i class="fas fa-magnifying-glass"></i> Search Domain
            </a>
            <a href="https://wa.me/<?php echo WHATSAPP_NUMBER; ?>" class="btn btn-outline btn-lg">
                <i class="fab fa-whatsapp"></i> Need Help?
            </a>
        </div>
    </div>
</section>

<?php include 'includes/footer.php'; ?>

