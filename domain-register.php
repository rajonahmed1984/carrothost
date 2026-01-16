<?php
/**
 * Domain Registration Page
 * Register New Domain Names
 */

require_once 'config.php';

$pageTitle = 'Domain Registration - Register Your Domain Name';
$metaDescription = 'Register your perfect domain name with CarrotHost. Choose .com, .net, .org, .bd, and 500+ extensions with instant activation, free DNS, and WHOIS privacy.';
$metaKeywords = 'domain registration, register domain, buy domain, domain name, cheap domain bangladesh';

$domainBreadcrumb = [
    ['name' => 'Home', 'url' => buildCanonicalUrlFromPath('')],
    ['name' => 'Domain Registration', 'url' => buildCanonicalUrlFromPath('domain-register')]
];
$domainFaq = [
    ['question' => 'How long does registration take?', 'answer' => 'Most domains are active within minutes after checkout.'],
    ['question' => 'Do you provide WHOIS privacy?', 'answer' => 'Eligible domains include free WHOIS privacy protection at no extra cost.'],
    ['question' => 'Can I manage DNS records?', 'answer' => 'Yes, every domain includes DNS management with unlimited entries.'],
    ['question' => 'What if my domain is taken?', 'answer' => 'We can recommend alternatives or help with backorder requests.' ]
];
$domainOffers = [
    '@type' => 'AggregateOffer',
    'priceCurrency' => 'BDT',
    'lowPrice' => '333',
    'highPrice' => '1900',
    'offerCount' => 4
];
$schemaParts = [
    buildBreadcrumbSchema($domainBreadcrumb),
    buildServiceSchema('Product', 'Domain Registration', 'Register your domain with CarrotHost and get instant activation, DNS, and privacy controls.', SITE_URL . '/domain-register', $domainOffers),
    buildFaqSchema($domainFaq)
];
$additionalSchema = implode("\n", array_filter($schemaParts));

include 'includes/header.php';
?>

<section class="section hero-section">
    <div class="container">
        <div class="service-hero hero-split">
            <div class="hero-content hero-content-left">
                <span class="section-subtitle"><i class="fas fa-globe"></i> Domain Registration</span>
                <h1 class="hero-title">Find a domain that fits your brand</h1>
                <p class="hero-subtitle">
                    Secure your name with instant activation, free DNS management, and competitive pricing
                    across 500+ extensions.
                </p>
                <div class="hero-cta">
                    <a class="btn btn-primary" href="#domain-search">
                        <i class="fas fa-magnifying-glass"></i> Search Domain
                    </a>
                    <a class="btn btn-outline" href="<?php echo SITE_URL; ?>/domain-transfer">
                        <i class="fas fa-right-left"></i> Transfer a Domain
                    </a>
                </div>

                <div class="domain-search-box domain-search-box-hero" id="domain-search">
                    <h3 class="domain-search-title">Search your domain now</h3>
                    <form class="domain-search-form" action="<?php echo WHMCS_DOMAIN_REGISTER; ?>" method="get" data-whmcs-url="<?php echo WHMCS_URL; ?>" data-check-mode="register" data-default-tld=".com">
                        <div class="domain-input-wrapper">
                            <span>www.</span>
                            <input type="text"
                                   class="domain-input"
                                   placeholder="yourdomain"
                                   name="query"
                                   required>
                        </div>
                        <button type="submit" class="btn btn-primary domain-search-btn">
                            <i class="fas fa-magnifying-glass"></i> Search Domain
                        </button>
                    </form>
                    <div class="domain-search-result" aria-live="polite"></div>
                    <div class="popular-extensions">
                        <span class="extension-tag" data-tld=".com" data-price-type="register">
                            .com <span class="extension-price" data-price-bdt="1600"><?php echo formatPrice(1600); ?></span>
                        </span>
                        <span class="extension-tag" data-tld=".net" data-price-type="register">
                            .net <span class="extension-price" data-price-bdt="1900"><?php echo formatPrice(1900); ?></span>
                        </span>
                        <span class="extension-tag" data-tld=".org" data-price-type="register">
                            .org <span class="extension-price" data-price-bdt="1800"><?php echo formatPrice(1800); ?></span>
                        </span>
                        <span class="extension-tag" data-tld=".xyz" data-price-type="register">
                            .xyz <span class="extension-price" data-price-bdt="500"><?php echo formatPrice(500); ?></span>
                        </span>
                    </div>
                </div>
            </div>

            <div class="hero-media">
                <!-- Unsplash: https://unsplash.com/photos/c5249f4df085 -->
                <img src="<?php echo SITE_URL; ?>/img/domain-hero.jpg" alt="Laptop showing a domain search workflow" loading="lazy">
                <div class="hero-callout">
                    <span>Instant Activation</span>
                    <strong>Live in minutes</strong>
                </div>
                <div class="hero-callout hero-callout-secondary">
                    <span>Protection</span>
                    <strong>Free WHOIS privacy</strong>
                </div>
            </div>
        </div>

        <div class="trust-strip">
            <div class="trust-item"><i class="fas fa-lock"></i> Domain lock enabled</div>
            <div class="trust-item"><i class="fas fa-dns"></i> Free DNS management</div>
            <div class="trust-item"><i class="fas fa-arrows-rotate"></i> Auto-renewal options</div>
            <div class="trust-item"><i class="fas fa-headset"></i> 24/7 support team</div>
        </div>
    </div>
</section>

<section class="section">
    <div class="container">
        <div class="section-header">
            <span class="section-subtitle"><i class="fas fa-tags"></i> Featured Extensions</span>
            <h2 class="section-title">Popular picks with live pricing</h2>
            <p class="section-description">Choose the extension that matches your market and audience.</p>
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

<section class="section section-bg">
    <div class="container">
        <div class="section-header">
            <span class="section-subtitle"><i class="fas fa-list-check"></i> Simple Steps</span>
            <h2 class="section-title">Register your domain in minutes</h2>
            <p class="section-description">Quick search, secure checkout, and instant activation.</p>
        </div>
        <div class="steps-grid">
            <div class="step-card">
                <div class="step-badge">1</div>
                <h3>Search your name</h3>
                <p>Find the right extension and check real-time availability.</p>
            </div>
            <div class="step-card">
                <div class="step-badge">2</div>
                <h3>Choose your plan</h3>
                <p>Add DNS, email, or hosting bundles if you need them.</p>
            </div>
            <div class="step-card">
                <div class="step-badge">3</div>
                <h3>Checkout and go live</h3>
                <p>Complete payment and your domain is active within minutes.</p>
            </div>
        </div>
    </div>
</section>

<section class="section section-bg">
    <div class="container">
        <div class="section-header">
            <span class="section-subtitle"><i class="fas fa-chart-line"></i> Live Pricing</span>
            <h2 class="section-title">Browse domain pricing</h2>
            <p class="section-description">
                Browse extensions by category with live WHMCS pricing.
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

<section class="section">
    <div class="container">
        <div class="section-header">
            <span class="section-subtitle"><i class="fas fa-shield-halved"></i> Why CarrotHost</span>
            <h2 class="section-title">Why register your domain with us?</h2>
            <p class="section-description">
                Everything you need to secure, manage, and protect your brand online.
            </p>
        </div>

        <div class="features-grid">
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-shield-halved"></i>
                </div>
                <h3 class="feature-title">Free WHOIS privacy</h3>
                <p class="feature-description">
                    Protect your personal data with privacy protection on eligible domains.
                </p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-lock"></i>
                </div>
                <h3 class="feature-title">Domain lock</h3>
                <p class="feature-description">
                    Prevent unauthorized transfers with built-in security locks.
                </p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-arrows-rotate"></i>
                </div>
                <h3 class="feature-title">Auto-renewal</h3>
                <p class="feature-description">
                    Avoid losing your domain with reminders and renewal protection.
                </p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-dns"></i>
                </div>
                <h3 class="feature-title">Free DNS management</h3>
                <p class="feature-description">
                    Manage records from a clean dashboard with unlimited entries.
                </p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-envelope"></i>
                </div>
                <h3 class="feature-title">Email forwarding</h3>
                <p class="feature-description">
                    Route branded emails to your existing inbox in minutes.
                </p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-headset"></i>
                </div>
                <h3 class="feature-title">Expert support</h3>
                <p class="feature-description">
                    Get domain help any time by WhatsApp, email, or ticket.
                </p>
            </div>
        </div>
    </div>
</section>

<section class="section section-bg">
    <div class="container">
        <div class="section-header">
            <span class="section-subtitle"><i class="fas fa-circle-question"></i> FAQs</span>
            <h2 class="section-title">Domain registration FAQs</h2>
        </div>
        <div class="faq-accordion">
            <details class="faq-item">
                <summary>How long does registration take?</summary>
                <p>Most domains activate within minutes after successful payment.</p>
            </details>
            <details class="faq-item">
                <summary>Can I register a .bd domain?</summary>
                <p>Yes. We offer Bangladesh domain extensions with local support.</p>
            </details>
            <details class="faq-item">
                <summary>Do you offer WHOIS privacy?</summary>
                <p>WHOIS privacy is included on eligible domains at no extra charge.</p>
            </details>
            <details class="faq-item">
                <summary>Can I add hosting later?</summary>
                <p>Absolutely. You can add hosting or VPS plans at any time.</p>
            </details>
        </div>
    </div>
</section>

<section class="cta-section">
    <div class="container">
        <h2 class="section-title">Ready to register your domain?</h2>
        <p class="section-description">
            Search, register, and go live with a domain that matches your brand.
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
