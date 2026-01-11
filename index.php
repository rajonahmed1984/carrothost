<?php
/**
 * CarrotHost - Homepage
 * Professional Web Hosting Business Website
 */

require_once 'config.php';

// SEO Meta Tags
$pageTitle = 'Professional Web Hosting Services in Bangladesh';
$metaDescription = 'Fast, secure & optimized web hosting with 99.9% uptime guarantee. Get cPanel hosting, VPS, dedicated servers, and domain registration with 24/7 support.';
$metaKeywords = 'web hosting bangladesh, cpanel hosting, vps hosting, bdix hosting, dedicated server bangladesh, cheap hosting bd, domain registration';

// JSON-LD Schema for Products
$additionalSchema = <<<SCHEMA
<script type="application/ld+json">
{
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Web Hosting Services",
    "description": "Professional web hosting with cPanel, SSD storage, and 24/7 support",
    "brand": {
        "@type": "Brand",
        "name": "CarrotHost"
    },
    "offers": {
        "@type": "AggregateOffer",
        "priceCurrency": "BDT",
        "lowPrice": "500",
        "highPrice": "50000"
    }
}
</script>
SCHEMA;

include 'includes/header.php';
?>

<!-- Include components CSS -->
<link rel="stylesheet" href="<?php echo SITE_URL; ?>/assets/css/components.css">

<!-- Hero Section -->
<section class="hero-section">
    <div class="container">
        <div class="hero-content">
            <h1 class="hero-title">
                Fast, Secure & Optimized<br>
                <span class="text-highlight">Web Hosting</span> for Your Business
            </h1>
            <p class="hero-subtitle">
                Lightning-fast SSD hosting with Imunify AV+ security, 99.9% uptime guarantee, 
                and 24/7 dedicated support. Start your online journey today!
            </p>
            <div class="hero-cta">
                <a href="<?php echo WHMCS_DOMAIN_REGISTER; ?>" class="btn btn-primary btn-lg">
                    <i class="fas fa-rocket"></i> Get Started Now
                </a>
                <a href="#pricing" class="btn btn-outline btn-lg">
                    <i class="fas fa-tags"></i> View Pricing
                </a>
            </div>
            
            <!-- Domain Search Box -->
            <div class="domain-search-box">
                <h3 class="domain-search-title">Find Your Perfect Domain</h3>
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
                        <i class="fas fa-search"></i> Search
                    </button>
                </form>
                <div class="popular-extensions">
                    <span class="extension-tag">
                        .com <span class="extension-price" data-price-bdt="1600">
                            <?php echo formatPrice(1600); ?>
                        </span>
                    </span>
                    <span class="extension-tag">
                        .net <span class="extension-price" data-price-bdt="1900">
                            <?php echo formatPrice(1900); ?>
                        </span>
                    </span>
                    <span class="extension-tag">
                        .org <span class="extension-price" data-price-bdt="1800">
                            <?php echo formatPrice(1800); ?>
                        </span>
                    </span>
                    <span class="extension-tag">
                        .xyz <span class="extension-price" data-price-bdt="500">
                            <?php echo formatPrice(500); ?>
                        </span>
                    </span>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Features Section -->
<section class="section">
    <div class="container">
        <div class="section-header">
            <span class="section-subtitle">Why Choose CarrotHost</span>
            <h2 class="section-title">Powerful Features for Your Success</h2>
            <p class="section-description">
                Experience enterprise-grade hosting features designed to help your business grow online.
            </p>
        </div>
        
        <div class="features-grid">
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-tachometer-alt"></i>
                </div>
                <h3 class="feature-title">Lightning Fast Speed</h3>
                <p class="feature-description">
                    Pure SSD storage with LiteSpeed web server and advanced caching for maximum performance.
                </p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-shield-alt"></i>
                </div>
                <h3 class="feature-title">Advanced Security</h3>
                <p class="feature-description">
                    Imunify AV+ protection, free SSL certificates, and daily malware scanning keep your site secure.
                </p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-headset"></i>
                </div>
                <h3 class="feature-title">24/7 Expert Support</h3>
                <p class="feature-description">
                    Round-the-clock technical support via WhatsApp, email, and ticketing system by experienced professionals.
                </p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-clock"></i>
                </div>
                <h3 class="feature-title">99.9% Uptime Guarantee</h3>
                <p class="feature-description">
                    Enterprise-grade infrastructure with redundant systems ensures your website is always online.
                </p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-sync-alt"></i>
                </div>
                <h3 class="feature-title">Automatic Backups</h3>
                <p class="feature-description">
                    Daily automated backups with easy restore options to keep your data safe and secure.
                </p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-code"></i>
                </div>
                <h3 class="feature-title">Developer Friendly</h3>
                <p class="feature-description">
                    Support for PHP, MySQL, Node.js, Python, Git, SSH access, and WP-CLI for developers.
                </p>
            </div>
        </div>
    </div>
</section>

<!-- Pricing Section - cPanel Hosting -->
<section id="pricing" class="section section-bg">
    <div class="container">
        <div class="section-header">
            <span class="section-subtitle">Hosting Plans</span>
            <h2 class="section-title">Choose Your Perfect cPanel Hosting Plan</h2>
            <p class="section-description">
                Powerful, reliable, and affordable web hosting plans tailored for your needs.
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
                    <p class="price-note">Billed annually</p>
                </div>
                
                <ul class="pricing-features">
                    <li><i class="fas fa-check-circle"></i> 2 GB SSD Storage</li>
                    <li><i class="fas fa-check-circle"></i> 20 GB Bandwidth</li>
                    <li><i class="fas fa-check-circle"></i> 1 Website</li>
                    <li><i class="fas fa-check-circle"></i> 5 Email Accounts</li>
                    <li><i class="fas fa-check-circle"></i> Free SSL Certificate</li>
                    <li><i class="fas fa-check-circle"></i> cPanel Control Panel</li>
                    <li><i class="fas fa-check-circle"></i> 24/7 Support</li>
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
                    <p class="price-note">Billed annually</p>
                </div>
                
                <ul class="pricing-features">
                    <li><i class="fas fa-check-circle"></i> 5 GB SSD Storage</li>
                    <li><i class="fas fa-check-circle"></i> 50 GB Bandwidth</li>
                    <li><i class="fas fa-check-circle"></i> 3 Websites</li>
                    <li><i class="fas fa-check-circle"></i> 10 Email Accounts</li>
                    <li><i class="fas fa-check-circle"></i> Free SSL Certificate</li>
                    <li><i class="fas fa-check-circle"></i> cPanel Control Panel</li>
                    <li><i class="fas fa-check-circle"></i> Daily Backups</li>
                    <li><i class="fas fa-check-circle"></i> 24/7 Priority Support</li>
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
                    <p class="price-note">Billed annually</p>
                </div>
                
                <ul class="pricing-features">
                    <li><i class="fas fa-check-circle"></i> 10 GB SSD Storage</li>
                    <li><i class="fas fa-check-circle"></i> 100 GB Bandwidth</li>
                    <li><i class="fas fa-check-circle"></i> 10 Websites</li>
                    <li><i class="fas fa-check-circle"></i> Unlimited Email Accounts</li>
                    <li><i class="fas fa-check-circle"></i> Free SSL Certificate</li>
                    <li><i class="fas fa-check-circle"></i> cPanel Control Panel</li>
                    <li><i class="fas fa-check-circle"></i> Daily Backups</li>
                    <li><i class="fas fa-check-circle"></i> Advanced Security</li>
                    <li><i class="fas fa-check-circle"></i> 24/7 Premium Support</li>
                </ul>
                
                <a href="<?php echo getWHMCSProductURL(3); ?>" class="btn btn-primary pricing-cta" data-whmcs-product="3">
                    Order Now
                </a>
            </div>
        </div>
    </div>
</section>

<!-- VPS Hosting Preview -->
<section class="section">
    <div class="container">
        <div class="section-header">
            <span class="section-subtitle">VPS & Dedicated Servers</span>
            <h2 class="section-title">Powerful Server Solutions</h2>
            <p class="section-description">
                Enterprise-grade VPS and dedicated servers for demanding applications and high-traffic websites.
            </p>
        </div>
        
        <div class="pricing-grid">
            <!-- BDIX VPS -->
            <div class="pricing-card">
                <div class="pricing-icon">
                    <i class="fas fa-server"></i>
                </div>
                <h3 class="pricing-name">BDIX VPS</h3>
                <p class="pricing-description">Bangladesh local VPS with BDIX connectivity</p>
                
                <div class="pricing-price">
                    <div class="price-amount">
                        <span class="price-currency"><?php echo convertPrice(1500)['symbol']; ?></span>
                        <span class="price-number"><?php echo convertPrice(1500)['amount']; ?></span>
                        <span class="price-period">/month</span>
                    </div>
                </div>
                
                <ul class="pricing-features">
                    <li><i class="fas fa-check-circle"></i> 2 vCPU Cores</li>
                    <li><i class="fas fa-check-circle"></i> 4 GB RAM</li>
                    <li><i class="fas fa-check-circle"></i> 40 GB SSD Storage</li>
                    <li><i class="fas fa-check-circle"></i> 1 TB BDIX Bandwidth</li>
                    <li><i class="fas fa-check-circle"></i> Root Access</li>
                </ul>
                
                <a href="<?php echo SITE_URL; ?>/bdix-vps" class="btn btn-outline pricing-cta">
                    View Details
                </a>
            </div>
            
            <!-- Xeon VPS -->
            <div class="pricing-card">
                <div class="pricing-icon">
                    <i class="fas fa-microchip"></i>
                </div>
                <h3 class="pricing-name">Xeon VPS</h3>
                <p class="pricing-description">Intel Xeon powered VPS servers</p>
                
                <div class="pricing-price">
                    <div class="price-amount">
                        <span class="price-currency"><?php echo convertPrice(2500)['symbol']; ?></span>
                        <span class="price-number"><?php echo convertPrice(2500)['amount']; ?></span>
                        <span class="price-period">/month</span>
                    </div>
                </div>
                
                <ul class="pricing-features">
                    <li><i class="fas fa-check-circle"></i> 4 Xeon vCPU Cores</li>
                    <li><i class="fas fa-check-circle"></i> 8 GB RAM</li>
                    <li><i class="fas fa-check-circle"></i> 80 GB NVMe SSD</li>
                    <li><i class="fas fa-check-circle"></i> Unlimited Bandwidth</li>
                    <li><i class="fas fa-check-circle"></i> Full Root Access</li>
                </ul>
                
                <a href="<?php echo SITE_URL; ?>/xeon-vps" class="btn btn-outline pricing-cta">
                    View Details
                </a>
            </div>
            
            <!-- Dedicated Server -->
            <div class="pricing-card">
                <div class="pricing-icon">
                    <i class="fas fa-database"></i>
                </div>
                <h3 class="pricing-name">Dedicated Server</h3>
                <p class="pricing-description">Fully dedicated physical servers</p>
                
                <div class="pricing-price">
                    <div class="price-amount">
                        <span class="price-currency"><?php echo convertPrice(15000)['symbol']; ?></span>
                        <span class="price-number"><?php echo convertPrice(15000)['amount']; ?></span>
                        <span class="price-period">/month</span>
                    </div>
                </div>
                
                <ul class="pricing-features">
                    <li><i class="fas fa-check-circle"></i> Intel Xeon E5 Processor</li>
                    <li><i class="fas fa-check-circle"></i> 32 GB DDR4 RAM</li>
                    <li><i class="fas fa-check-circle"></i> 1 TB NVMe SSD</li>
                    <li><i class="fas fa-check-circle"></i> 10 Gbps Port</li>
                    <li><i class="fas fa-check-circle"></i> Full Management</li>
                </ul>
                
                <a href="<?php echo SITE_URL; ?>/dedicated-server" class="btn btn-outline pricing-cta">
                    View Details
                </a>
            </div>
        </div>
    </div>
</section>

<!-- Stats Section -->
<section class="section section-bg">
    <div class="container">
        <div class="stats-grid">
            <div class="stat-item">
                <div class="stat-number" data-count="5000">0</div>
                <div class="stat-label">Happy Customers</div>
            </div>
            <div class="stat-item">
                <div class="stat-number" data-count="99.9">0</div>
                <div class="stat-label">% Uptime Guarantee</div>
            </div>
            <div class="stat-item">
                <div class="stat-number" data-count="24">0</div>
                <div class="stat-label">/ 7 Support</div>
            </div>
            <div class="stat-item">
                <div class="stat-number" data-count="10">0</div>
                <div class="stat-label">+ Years Experience</div>
            </div>
        </div>
    </div>
</section>

<!-- CTA Section -->
<section class="cta-section">
    <div class="container">
        <h2 class="section-title">Ready to Get Started?</h2>
        <p class="section-description">
            Join thousands of satisfied customers who trust CarrotHost for their web hosting needs. 
            Get started today with our risk-free 30-day money-back guarantee.
        </p>
        <div class="cta-buttons">
            <a href="<?php echo WHMCS_DOMAIN_REGISTER; ?>" class="btn btn-lg">
                <i class="fas fa-rocket"></i> Start Your Website
            </a>
            <a href="https://wa.me/<?php echo WHATSAPP_NUMBER; ?>" class="btn btn-outline btn-lg">
                <i class="fab fa-whatsapp"></i> Chat with Us
            </a>
        </div>
    </div>
</section>

<?php include 'includes/footer.php'; ?>
