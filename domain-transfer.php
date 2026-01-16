<?php
/**
 * Domain Transfer Page
 * Transfer Domain Names to CarrotHost
 */

require_once 'config.php';

$pageTheme = 'domain-transfer';

$pageTitle = 'Domain Transfer - Transfer Your Domain to CarrotHost';
$metaDescription = 'Transfer your domain to CarrotHost for better management, free WHOIS privacy, and competitive pricing with a fast, secure transfer process.';
$metaKeywords = 'domain transfer, transfer domain, move domain, domain migration, domain transfer bangladesh';

$transferBreadcrumb = [
    ['name' => 'Home', 'url' => buildCanonicalUrlFromPath('')],
    ['name' => 'Domain Transfer', 'url' => buildCanonicalUrlFromPath('domain-transfer')]
];
$transferFaq = [
    ['question' => 'How long does the transfer take?', 'answer' => 'Most transfers finish within 5-7 days depending on the current registrar.'],
    ['question' => 'Will my site go down?', 'answer' => 'No, your website and email stay online during the transfer process.'],
    ['question' => 'Do you include a free extension?', 'answer' => 'Yes, every domain transfer includes a free 1-year extension.'],
    ['question' => 'What is an authorization code?', 'answer' => 'The authorization code (EPP) proves ownership and is required for transfers.' ]
];
$transferOffers = [
    '@type' => 'AggregateOffer',
    'priceCurrency' => 'BDT',
    'lowPrice' => '500',
    'highPrice' => '1900',
    'offerCount' => 5
];
$schemaParts = [
    buildBreadcrumbSchema($transferBreadcrumb),
    buildServiceSchema('Service', 'Domain Transfer', 'Securely transfer your domain to CarrotHost with one-year extension and WHOIS privacy.', SITE_URL . '/domain-transfer', $transferOffers),
    buildFaqSchema($transferFaq)
];
$additionalSchema = implode("\n", array_filter($schemaParts));

include 'includes/header.php';
?>

<section class="section hero-section">
    <div class="container">
        <div class="service-hero hero-split">
            <div class="hero-content hero-content-left">
                <span class="section-subtitle"><i class="fas fa-right-left"></i> Domain Transfer</span>
                <h1 class="hero-title">Move your domain to CarrotHost</h1>
                <p class="hero-subtitle">
                    Transfer your domain for better pricing, free privacy, and local support.
                    Get a 1-year extension added to your existing expiry date.
                </p>
                <div class="hero-cta">
                    <a class="btn btn-primary" href="#transfer-search">
                        <i class="fas fa-arrow-right-arrow-left"></i> Start Transfer
                    </a>
                    <a class="btn btn-outline" href="<?php echo SITE_URL; ?>/domain-register">
                        <i class="fas fa-globe"></i> Register a Domain
                    </a>
                </div>

                <div class="domain-search-box domain-search-box-hero" id="transfer-search">
                    <h3 class="domain-search-title">Check transfer eligibility</h3>
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
                    <div class="popular-extensions">
                        <span class="extension-tag" data-tld=".com" data-price-type="transfer">
                            .com <span class="extension-price" data-price-bdt="1600"><?php echo formatPrice(1600); ?></span>
                        </span>
                        <span class="extension-tag" data-tld=".net" data-price-type="transfer">
                            .net <span class="extension-price" data-price-bdt="1900"><?php echo formatPrice(1900); ?></span>
                        </span>
                        <span class="extension-tag" data-tld=".org" data-price-type="transfer">
                            .org <span class="extension-price" data-price-bdt="1800"><?php echo formatPrice(1800); ?></span>
                        </span>
                        <span class="extension-tag" data-tld=".xyz" data-price-type="transfer">
                            .xyz <span class="extension-price" data-price-bdt="500"><?php echo formatPrice(500); ?></span>
                        </span>
                    </div>
                </div>
            </div>
            <div class="hero-media">
                <!-- Unsplash: https://unsplash.com/photos/9303baea8ebd -->
                <img src="<?php echo SITE_URL; ?>/img/domain-transfer-hero.jpg" alt="Team reviewing a domain transfer workflow" loading="lazy">
                <div class="hero-callout">
                    <span>Free Extension</span>
                    <strong>+1 Year Added</strong>
                </div>
                <div class="hero-callout hero-callout-secondary">
                    <span>Support</span>
                    <strong>Transfer assistance</strong>
                </div>
            </div>
        </div>

        <div class="trust-strip">
            <div class="trust-item"><i class="fas fa-gift"></i> 1-year extension included</div>
            <div class="trust-item"><i class="fas fa-user-secret"></i> Free WHOIS privacy</div>
            <div class="trust-item"><i class="fas fa-shield-halved"></i> Secure transfer</div>
            <div class="trust-item"><i class="fas fa-headset"></i> 24/7 support</div>
        </div>
    </div>
</section>

<section class="section section-bg">
    <div class="container">
        <div class="section-header">
            <span class="section-subtitle"><i class="fas fa-list-check"></i> Simple Steps</span>
            <h2 class="section-title">How to transfer your domain</h2>
            <p class="section-description">Follow these steps to move your domain without downtime.</p>
        </div>

        <div class="transfer-steps">
            <div class="transfer-step">
                <div class="transfer-step-badge">1</div>
                <div class="transfer-step-content">
                    <h3>Unlock your domain</h3>
                    <p>Log in to your current registrar and unlock the domain for transfer.</p>
                </div>
            </div>

            <div class="transfer-step">
                <div class="transfer-step-badge">2</div>
                <div class="transfer-step-content">
                    <h3>Get your EPP code</h3>
                    <p>Request the authorization code (EPP code) from your current provider.</p>
                </div>
            </div>

            <div class="transfer-step">
                <div class="transfer-step-badge">3</div>
                <div class="transfer-step-content">
                    <h3>Start transfer</h3>
                    <p>Enter the domain above, complete checkout, and submit the EPP code.</p>
                </div>
            </div>

            <div class="transfer-step">
                <div class="transfer-step-badge">4</div>
                <div class="transfer-step-content">
                    <h3>Approve the transfer</h3>
                    <p>Confirm the transfer email sent to your domain admin contact.</p>
                </div>
            </div>

            <div class="transfer-step transfer-step-success">
                <div class="transfer-step-badge">5</div>
                <div class="transfer-step-content">
                    <h3>Transfer complete</h3>
                    <p>Your transfer finishes in 5-7 days with no downtime.</p>
                </div>
            </div>
        </div>
    </div>
</section>

<section class="section">
    <div class="container">
        <div class="section-header">
            <span class="section-subtitle"><i class="fas fa-gift"></i> Transfer Benefits</span>
            <h2 class="section-title">Why transfer to CarrotHost?</h2>
        </div>

        <div class="features-grid">
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-gift"></i>
                </div>
                <h3 class="feature-title">Free 1 year extension</h3>
                <p class="feature-description">
                    Get 1 year added to your current expiry date when the transfer completes.
                </p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-user-secret"></i>
                </div>
                <h3 class="feature-title">Free WHOIS privacy</h3>
                <p class="feature-description">
                    Keep your personal details hidden with free privacy protection.
                </p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-gauge-high"></i>
                </div>
                <h3 class="feature-title">Fast transfer process</h3>
                <p class="feature-description">
                    Most transfers complete within 5-7 days with a smooth workflow.
                </p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-shield-halved"></i>
                </div>
                <h3 class="feature-title">Secure and stable</h3>
                <p class="feature-description">
                    Your website and email remain live while the transfer completes.
                </p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-tags"></i>
                </div>
                <h3 class="feature-title">Competitive pricing</h3>
                <p class="feature-description">
                    Transparent transfer pricing with no hidden fees.
                </p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">
                    <i class="fas fa-headset"></i>
                </div>
                <h3 class="feature-title">Transfer assistance</h3>
                <p class="feature-description">
                    Our engineers can guide you through every transfer step.
                </p>
            </div>
        </div>
    </div>
</section>

<section class="section section-bg">
    <div class="container">
        <div class="section-header">
            <span class="section-subtitle"><i class="fas fa-tag"></i> Transfer Pricing</span>
            <h2 class="section-title">Domain transfer pricing</h2>
            <p class="section-description">
                Competitive rates with a 1-year extension included.
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

<section class="section">
    <div class="container">
        <div class="section-header">
            <span class="section-subtitle"><i class="fas fa-circle-question"></i> FAQs</span>
            <h2 class="section-title">Transfer FAQs</h2>
        </div>

        <div class="faq-accordion">
            <details class="faq-item">
                <summary>How long does a domain transfer take?</summary>
                <p>Most domain transfers complete within 5-7 days depending on the current registrar.</p>
            </details>
            <details class="faq-item">
                <summary>Will my website go down during transfer?</summary>
                <p>No. Your website and email stay live during the transfer process.</p>
            </details>
            <details class="faq-item">
                <summary>What is an authorization code?</summary>
                <p>The authorization code (EPP) is a transfer key that proves you own the domain.</p>
            </details>
            <details class="faq-item">
                <summary>Can I transfer a new domain?</summary>
                <p>Domains must be at least 60 days old before they can be transferred.</p>
            </details>
        </div>
    </div>
</section>

<section class="cta-section">
    <div class="container">
        <h2 class="section-title">Ready to transfer your domain?</h2>
        <p class="section-description">
            Start your transfer today with guided support and competitive pricing.
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
