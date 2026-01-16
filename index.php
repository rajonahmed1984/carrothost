<?php
/**
 * CarrotHost - Homepage
 * Professional Web Hosting Business Website
 */

require_once 'config.php';

// SEO Meta Tags
$pageTheme = 'home';
$pageTitle = 'Professional Web Hosting Services in Bangladesh';
$metaDescription = 'Fast, secure web hosting in Bangladesh with SSD storage, 99.9% uptime, cPanel hosting, VPS, dedicated servers, and domain registration backed by 24/7 support.';
$metaKeywords = 'web hosting bangladesh, cpanel hosting, vps hosting, bdix hosting, dedicated server bangladesh, cheap hosting bd, domain registration';

// SEO Schema
$homeBreadcrumb = [
    ['name' => 'Home', 'url' => buildCanonicalUrlFromPath('')]
];
$homeFaq = [
    ['question' => 'Do you offer local support?', 'answer' => 'Yes, our Bangladesh-based team is available 24/7 via WhatsApp, email, and tickets.'],
    ['question' => 'What uptime do you guarantee?', 'answer' => 'CarrotHost offers a 99.9% uptime SLA backed by redundant hardware and network partners.'],
    ['question' => 'Can I start with shared hosting and upgrade later?', 'answer' => 'Absolutely. You can migrate from shared hosting to VPS or dedicated servers as your traffic grows.'],
    ['question' => 'Are backups included?', 'answer' => 'Daily automated backups are included on all plans with easy restore options.' ]
];
$homeServiceOffers = [
    '@type' => 'AggregateOffer',
    'priceCurrency' => 'BDT',
    'lowPrice' => '500',
    'highPrice' => '14400',
    'offerCount' => 5
];
$schemaParts = [
    buildBreadcrumbSchema($homeBreadcrumb),
    buildServiceSchema('Service', 'CarrotHost Web Hosting Services', 'Fast, secure web hosting in Bangladesh with SSD storage, LiteSpeed, and 24/7 support.', SITE_URL, $homeServiceOffers),
    buildFaqSchema($homeFaq)
];
$additionalSchema = implode("\n", array_filter($schemaParts));

include 'includes/header.php';
?>

<section class="hero-section hero-section-home">
    <div class="container">
        <div class="service-hero hero-split">
            <div class="hero-content hero-content-left">
                <span class="section-subtitle"><i class="fas fa-bolt"></i> Bangladesh-First Hosting</span>
                <h1 class="hero-title">
                    Launch fast, stay online, and scale without worry
                </h1>
                <p class="hero-subtitle">
                    Tier III infrastructure in Dhaka, BDIX-optimized routing, and 24/7 local engineers.
                    Everything you need to ship confidently, from domains to dedicated servers.
                </p>
                <div class="hero-cta">
                    <a href="<?php echo WHMCS_CART_URL; ?>" class="btn btn-primary btn-lg">
                        <i class="fas fa-rocket"></i> Get Started
                    </a>
                    <a href="#solutions" class="btn btn-outline btn-lg">
                        <i class="fas fa-layer-group"></i> Compare Solutions
                    </a>
                </div>
                <div class="hero-metrics">
                    <div class="hero-metric">
                        <strong>99.9%</strong>
                        <span>Uptime SLA</span>
                    </div>
                    <div class="hero-metric">
                        <strong>15 min</strong>
                        <span>Average setup</span>
                    </div>
                    <div class="hero-metric">
                        <strong>24/7</strong>
                        <span>Local support</span>
                    </div>
                </div>
            </div>
            <div class="hero-media">
                <!-- Unsplash: https://unsplash.com/photos/009f0129c71c -->
                <img src="<?php echo SITE_URL; ?>/img/home-hero.jpg" alt="Engineers building high-performance hosting infrastructure" loading="lazy">
                <div class="hero-callout">
                    <span>Tier III Data Center</span>
                    <strong>Dhaka, Bangladesh</strong>
                </div>
                <div class="hero-callout hero-callout-secondary">
                    <span>Security Stack</span>
                    <strong>Free SSL + Daily Backups</strong>
                </div>
            </div>
        </div>

        <div class="domain-search-box domain-search-box-hero">
            <h3 class="domain-search-title">Find Your Perfect Domain</h3>
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
                    <i class="fas fa-magnifying-glass"></i> Search
                </button>
            </form>
            <div class="domain-search-result" aria-live="polite"></div>
            <div class="popular-extensions">
                <span class="extension-tag" data-tld=".com" data-price-type="register">
                    .com <span class="extension-price" data-price-bdt="1600">
                        <?php echo formatPrice(1600); ?>
                    </span>
                </span>
                <span class="extension-tag" data-tld=".net" data-price-type="register">
                    .net <span class="extension-price" data-price-bdt="1900">
                        <?php echo formatPrice(1900); ?>
                    </span>
                </span>
                <span class="extension-tag" data-tld=".org" data-price-type="register">
                    .org <span class="extension-price" data-price-bdt="1800">
                        <?php echo formatPrice(1800); ?>
                    </span>
                </span>
                <span class="extension-tag" data-tld=".xyz" data-price-type="register">
                    .xyz <span class="extension-price" data-price-bdt="500">
                        <?php echo formatPrice(500); ?>
                    </span>
                </span>
            </div>
        </div>

        <div class="trust-strip">
            <div class="trust-item"><i class="fas fa-shield-halved"></i> 99.9% uptime guarantee</div>
            <div class="trust-item"><i class="fas fa-location-dot"></i> Tier III DC in Dhaka</div>
            <div class="trust-item"><i class="fas fa-network-wired"></i> BDIX optimized routes</div>
            <div class="trust-item"><i class="fas fa-headset"></i> 24/7 expert support</div>
        </div>
    </div>
</section>

<section class="section" id="solutions">
    <div class="container">
        <div class="section-header">
            <span class="section-subtitle"><i class="fas fa-layer-group"></i> Hosting Solutions</span>
            <h2 class="section-title">Pick the stack that fits your workload</h2>
            <p class="section-description">
                From lightweight websites to enterprise-grade infrastructure, choose the platform that matches your growth plan.
            </p>
        </div>

        <div class="product-grid">
            <article class="product-card">
                <div class="product-icon"><i class="fas fa-cpanel"></i></div>
                <h3>cPanel Hosting</h3>
                <p>Optimized shared hosting with LiteSpeed, free SSL, and daily backups.</p>
                <div class="product-price">
                    <div class="price-amount" data-price-bdt="4800">
                        <span class="price-currency"><?php echo convertPrice(4800)['symbol']; ?></span>
                        <span class="price-number"><?php echo convertPrice(4800)['amount']; ?></span>
                    </div>
                    <span class="price-period">/year</span>
                </div>
                <a href="<?php echo SITE_URL; ?>/cpanel-hosting" class="btn btn-outline btn-sm">Explore Plans</a>
            </article>

            <article class="product-card">
                <div class="product-icon"><i class="fas fa-server"></i></div>
                <h3>Webuzo Hosting</h3>
                <p>Lightweight control panel with full root access and fast app deployment.</p>
                <div class="product-price">
                    <div class="price-amount" data-price-bdt="4200">
                        <span class="price-currency"><?php echo convertPrice(4200)['symbol']; ?></span>
                        <span class="price-number"><?php echo convertPrice(4200)['amount']; ?></span>
                    </div>
                    <span class="price-period">/year</span>
                </div>
                <a href="<?php echo SITE_URL; ?>/webuzo-hosting" class="btn btn-outline btn-sm">Launch Now</a>
            </article>

            <article class="product-card">
                <div class="product-icon"><i class="fas fa-rocket"></i></div>
                <h3>BDIX VPS</h3>
                <p>Ultra-low latency VPS with BDIX routing and local bandwidth.</p>
                <div class="product-price">
                    <div class="price-amount" data-price-bdt="1550">
                        <span class="price-currency"><?php echo convertPrice(1550)['symbol']; ?></span>
                        <span class="price-number"><?php echo convertPrice(1550)['amount']; ?></span>
                    </div>
                    <span class="price-period">/month</span>
                </div>
                <a href="<?php echo SITE_URL; ?>/bdix-vps" class="btn btn-outline btn-sm">View BDIX VPS</a>
            </article>

            <article class="product-card">
                <div class="product-icon"><i class="fas fa-microchip"></i></div>
                <h3>Ryzen VPS</h3>
                <p>High-frequency compute built for modern SaaS and demanding workloads.</p>
                <div class="product-price">
                    <div class="price-amount" data-price-bdt="2800">
                        <span class="price-currency"><?php echo convertPrice(2800)['symbol']; ?></span>
                        <span class="price-number"><?php echo convertPrice(2800)['amount']; ?></span>
                    </div>
                    <span class="price-period">/month</span>
                </div>
                <a href="<?php echo SITE_URL; ?>/ryzen-vps" class="btn btn-outline btn-sm">View Ryzen VPS</a>
            </article>

            <article class="product-card">
                <div class="product-icon"><i class="fas fa-database"></i></div>
                <h3>Dedicated Servers</h3>
                <p>Isolated performance, full control, and custom configurations on demand.</p>
                <div class="product-price">
                    <span class="price-note">Custom pricing</span>
                </div>
                <a href="<?php echo SITE_URL; ?>/dedicated-server" class="btn btn-outline btn-sm">Configure</a>
            </article>

            <article class="product-card">
                <div class="product-icon"><i class="fas fa-globe"></i></div>
                <h3>Domains</h3>
                <p>Register and protect your brand with instant activation and DNS management.</p>
                <div class="product-price">
                    <span class="price-note">500+ extensions</span>
                </div>
                <a href="<?php echo SITE_URL; ?>/domain-register" class="btn btn-outline btn-sm">Search Domains</a>
            </article>
        </div>
    </div>
</section>

<section class="section section-bg" id="why">
    <div class="container">
        <div class="section-header">
            <span class="section-subtitle"><i class="fas fa-star"></i> Why Choose CarrotHost</span>
            <h2 class="section-title">Performance, protection, and people you can reach</h2>
            <p class="section-description">
                Build on modern infrastructure with proactive security, fast support, and transparent pricing.
            </p>
        </div>

        <div class="features-grid">
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-gauge-high"></i>
                </div>
                <h3 class="feature-title">LiteSpeed + SSD stack</h3>
                <p class="feature-description">
                    Page loads stay under control with SSD storage, LiteSpeed cache, and optimized PHP.
                </p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-shield-halved"></i>
                </div>
                <h3 class="feature-title">Security by default</h3>
                <p class="feature-description">
                    Imunify AV+, WAF rules, DDoS mitigation, and free SSL across all plans.
                </p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-headset"></i>
                </div>
                <h3 class="feature-title">Local support engineers</h3>
                <p class="feature-description">
                    Get help from Bangladesh-based engineers via WhatsApp, tickets, or email 24/7.
                </p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-arrows-rotate"></i>
                </div>
                <h3 class="feature-title">Daily backups</h3>
                <p class="feature-description">
                    Automated backups with fast restores keep your data safe and recoverable.
                </p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-code"></i>
                </div>
                <h3 class="feature-title">Developer ready</h3>
                <p class="feature-description">
                    SSH access, Git, multiple PHP versions, and staging-friendly tooling built in.
                </p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-plug"></i>
                </div>
                <h3 class="feature-title">One-click apps</h3>
                <p class="feature-description">
                    Install WordPress, Laravel, or other apps in minutes with guided automation.
                </p>
            </div>
        </div>
    </div>
</section>

<section class="section">
    <div class="container">
        <div class="section-header">
            <span class="section-subtitle"><i class="fas fa-list-check"></i> Hosting Comparison</span>
            <h2 class="section-title">CarrotHost vs. standard hosting</h2>
            <p class="section-description">
                See how our platform compares against typical shared hosting offerings.
            </p>
        </div>

        <div class="comparison-table-wrapper">
            <table class="comparison-table">
                <thead>
                    <tr>
                        <th>Capability</th>
                        <th>CarrotHost</th>
                        <th>Standard Hosting</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>Tier III BD data center</strong></td>
                        <td><i class="fas fa-circle-check check-icon"></i></td>
                        <td><i class="fas fa-circle-xmark cross-icon"></i></td>
                    </tr>
                    <tr>
                        <td><strong>LiteSpeed + SSD</strong></td>
                        <td><i class="fas fa-circle-check check-icon"></i></td>
                        <td><i class="fas fa-circle-xmark cross-icon"></i></td>
                    </tr>
                    <tr>
                        <td><strong>BDIX optimized routing</strong></td>
                        <td><i class="fas fa-circle-check check-icon"></i></td>
                        <td><i class="fas fa-circle-xmark cross-icon"></i></td>
                    </tr>
                    <tr>
                        <td><strong>24/7 local engineers</strong></td>
                        <td><i class="fas fa-circle-check check-icon"></i></td>
                        <td><i class="fas fa-circle-xmark cross-icon"></i></td>
                    </tr>
                    <tr>
                        <td><strong>Daily automated backups</strong></td>
                        <td><i class="fas fa-circle-check check-icon"></i></td>
                        <td><i class="fas fa-circle-xmark cross-icon"></i></td>
                    </tr>
                    <tr>
                        <td><strong>Free SSL + DNS management</strong></td>
                        <td><i class="fas fa-circle-check check-icon"></i></td>
                        <td><i class="fas fa-circle-xmark cross-icon"></i></td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</section>

<section class="section section-bg" id="coverage">
    <div class="container">
        <div class="section-header">
            <span class="section-subtitle"><i class="fas fa-map-location-dot"></i> Data Center & Coverage</span>
            <h2 class="section-title">Built for Bangladesh. Connected to the world.</h2>
            <p class="section-description">
                Local BDIX speed paired with global transit keeps your users fast anywhere they connect.
            </p>
        </div>

        <div class="coverage-grid">
            <div class="coverage-card">
                <h3>Dhaka Tier III Facility</h3>
                <p>Redundant power, multi-carrier connectivity, and 24/7 on-site security.</p>
                <ul>
                    <li><i class="fas fa-check"></i> 1 Gbps premium uplink</li>
                    <li><i class="fas fa-check"></i> NVMe-ready storage stack</li>
                    <li><i class="fas fa-check"></i> Real-time monitoring</li>
                </ul>
            </div>
            <div class="coverage-card">
                <h3>Bangladesh-Optimized Network</h3>
                <p>Direct BDIX routes keep local traffic fast for streaming, gaming, and commerce.</p>
                <ul>
                    <li><i class="fas fa-check"></i> Low-latency domestic routing</li>
                    <li><i class="fas fa-check"></i> Unlimited BDIX bandwidth</li>
                    <li><i class="fas fa-check"></i> DDoS protection included</li>
                </ul>
            </div>
            <div class="coverage-card">
                <h3>Global Reach</h3>
                <p>International transit partners ensure fast access for global visitors and remote teams.</p>
                <ul>
                    <li><i class="fas fa-check"></i> Multi-region upstream providers</li>
                    <li><i class="fas fa-check"></i> CDN-ready architecture</li>
                    <li><i class="fas fa-check"></i> 99.9% network uptime SLA</li>
                </ul>
            </div>
        </div>
    </div>
</section>

<section class="section">
    <div class="container">
        <div class="section-header">
            <span class="section-subtitle"><i class="fas fa-quote-left"></i> Customer Love</span>
            <h2 class="section-title">Teams trust CarrotHost for mission-critical uptime</h2>
            <p class="section-description">
                Real feedback from businesses building on our Bangladesh-first infrastructure.
            </p>
        </div>

        <div class="testimonials-grid">
            <div class="testimonial-card">
                <div class="testimonial-quote">&ldquo;</div>
                <p class="testimonial-content">
                    Our ecommerce site loads noticeably faster after moving to CarrotHost, and their team helped us
                    migrate without downtime.
                </p>
                <div class="testimonial-author">
                    <div class="testimonial-avatar"><i class="fas fa-bag-shopping"></i></div>
                    <div class="testimonial-info">
                        <h5>Rifat H.</h5>
                        <span>Retail Brand, Dhaka</span>
                    </div>
                </div>
            </div>

            <div class="testimonial-card">
                <div class="testimonial-quote">&ldquo;</div>
                <p class="testimonial-content">
                    The BDIX VPS gives our streaming users stable, low-latency performance. Support is fast and proactive.
                </p>
                <div class="testimonial-author">
                    <div class="testimonial-avatar"><i class="fas fa-podcast"></i></div>
                    <div class="testimonial-info">
                        <h5>Nusrat A.</h5>
                        <span>Media Platform</span>
                    </div>
                </div>
            </div>

            <div class="testimonial-card">
                <div class="testimonial-quote">&ldquo;</div>
                <p class="testimonial-content">
                    We host client sites on cPanel plans and love the consistent uptime and easy backup restores.
                </p>
                <div class="testimonial-author">
                    <div class="testimonial-avatar"><i class="fas fa-laptop-code"></i></div>
                    <div class="testimonial-info">
                        <h5>Tamim K.</h5>
                        <span>Agency Partner</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<section class="section section-bg">
    <div class="container">
        <div class="section-header">
            <span class="section-subtitle"><i class="fas fa-circle-question"></i> FAQs</span>
            <h2 class="section-title">Questions teams ask before switching</h2>
        </div>

        <div class="faq-accordion">
            <details class="faq-item">
                <summary>Do you provide migration support?</summary>
                <p>Yes. Our team can help move your website, email, and databases with minimal downtime.</p>
            </details>
            <details class="faq-item">
                <summary>Is BDIX routing included on all plans?</summary>
                <p>BDIX optimization is included for BDIX VPS plans and available on eligible hosting packages.</p>
            </details>
            <details class="faq-item">
                <summary>Can I start with shared hosting and upgrade later?</summary>
                <p>Absolutely. You can scale to VPS or dedicated servers as your traffic grows.</p>
            </details>
            <details class="faq-item">
                <summary>Do you offer monthly billing?</summary>
                <p>Yes. VPS plans are billed monthly, and shared hosting offers annual plans for best value.</p>
            </details>
        </div>
    </div>
</section>

<section class="cta-section">
    <div class="container">
        <span class="section-subtitle"><i class="fas fa-arrow-right"></i> Get Started</span>
        <h2 class="section-title">Ready to launch on CarrotHost?</h2>
        <p class="section-description">
            Choose your stack, secure your domain, and go live with 24/7 support from our local engineers.
        </p>
        <div class="cta-buttons">
            <a href="<?php echo WHMCS_CART_URL; ?>" class="btn btn-lg">
                <i class="fas fa-rocket"></i> Start Your Website
            </a>
            <a href="https://wa.me/<?php echo WHATSAPP_NUMBER; ?>" class="btn btn-outline btn-lg">
                <i class="fab fa-whatsapp"></i> Talk to an Expert
            </a>
        </div>
    </div>
</section>

<?php include 'includes/footer.php'; ?>
