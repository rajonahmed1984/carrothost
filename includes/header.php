<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    
    <!-- SEO Meta Tags -->
    <title><?php echo isset($pageTitle) ? $pageTitle . ' - ' . SITE_NAME : SITE_NAME . ' - ' . SITE_TAGLINE; ?></title>
    <meta name="description" content="<?php echo $metaDescription ?? 'Professional web hosting services in Bangladesh with 24/7 support. cPanel hosting, VPS, dedicated servers, and domain registration at affordable prices.'; ?>">
    <meta name="keywords" content="<?php echo $metaKeywords ?? META_KEYWORDS; ?>">
    <meta name="author" content="<?php echo META_AUTHOR; ?>">
    <link rel="canonical" href="<?php echo SITE_URL . '/' . basename($_SERVER['PHP_SELF'], '.php'); ?>">
    <meta name="google-site-verification" content="googleff102cbf176e0195.html">
    <meta name="msvalidate.01" content="FE3E4A2C892331030670F3F2CA6F0A09">
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="<?php echo isset($pageTitle) ? $pageTitle . ' - ' . SITE_NAME : SITE_NAME; ?>">
    <meta property="og:description" content="<?php echo $metaDescription ?? 'Professional web hosting services with 24/7 support'; ?>">
    <meta property="og:type" content="website">
    <meta property="og:url" content="<?php echo SITE_URL . $_SERVER['REQUEST_URI']; ?>">
    <meta property="og:image" content="<?php echo SITE_URL; ?>/img/og-image.png">
    <meta property="og:site_name" content="<?php echo SITE_NAME; ?>">
    
    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="<?php echo isset($pageTitle) ? $pageTitle . ' - ' . SITE_NAME : SITE_NAME; ?>">
    <meta name="twitter:description" content="<?php echo $metaDescription ?? 'Professional web hosting services with 24/7 support'; ?>">
    <meta name="twitter:image" content="<?php echo SITE_URL; ?>/img/og-image.png">
    
    <!-- Favicon -->
    <link rel="icon" type="image/png" href="<?php echo SITE_URL; ?>/img/favicon.png">
    <link rel="apple-touch-icon" href="<?php echo SITE_URL; ?>/img/apple-touch-icon.png">
    
    <!-- Stylesheets -->
    <link rel="stylesheet" href="<?php echo SITE_URL; ?>/assets/css/style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    
    <!-- JSON-LD Schema -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "HostingBusiness",
        "name": "<?php echo SITE_NAME; ?>",
        "description": "<?php echo SITE_TAGLINE; ?>",
        "url": "<?php echo SITE_URL; ?>",
        "logo": "<?php echo SITE_URL; ?>/img/logo.png",
        "telephone": "<?php echo SITE_PHONE; ?>",
        "email": "<?php echo SITE_EMAIL; ?>",
        "address": {
            "@type": "PostalAddress",
            "addressCountry": "BD"
        },
        "sameAs": [
            "<?php echo FACEBOOK_URL; ?>",
            "<?php echo YOUTUBE_URL; ?>"
        ]
    }
    </script>
    
    <?php if (isset($additionalSchema)): ?>
        <?php echo $additionalSchema; ?>
    <?php endif; ?>
</head>
<body data-site-url="<?php echo SITE_URL; ?>">
    <!-- Header -->
    <header class="site-header">
        <!-- Top Bar -->
        <div class="top-bar">
            <div class="container">
                <div class="top-bar-content">
                    <div class="top-bar-left">
                        <a href="tel:<?php echo SITE_PHONE; ?>" class="top-bar-link">
                            <i class="fas fa-phone"></i> <?php echo SITE_PHONE; ?>
                        </a>
                        <a href="mailto:<?php echo SITE_EMAIL; ?>" class="top-bar-link">
                            <i class="fas fa-envelope"></i> <?php echo SITE_EMAIL; ?>
                        </a>
                    </div>
                    <div class="top-bar-right">
                        <!-- Currency Switcher -->
                        <div class="currency-switcher">
                            <button class="currency-btn <?php echo $_SESSION['currency'] === 'BDT' ? 'active' : ''; ?>" data-currency="BDT">
                                BDT (৳)
                            </button>
                            <span class="currency-divider">|</span>
                            <button class="currency-btn <?php echo $_SESSION['currency'] === 'USD' ? 'active' : ''; ?>" data-currency="USD">
                                USD ($)
                            </button>
                        </div>
                        <a href="<?php echo WHMCS_CLIENT_AREA; ?>" class="top-bar-link">
                            <i class="fas fa-circle-user"></i> Client Area
                        </a>
                        <a href="<?php echo WHMCS_CLIENT_AREA; ?>" class="top-bar-link">
                            <i class="fas fa-right-to-bracket"></i> Login
                        </a>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Main Navigation -->
        <nav class="main-nav">
            <div class="container">
                <div class="nav-wrapper">
                    <a href="<?php echo SITE_URL; ?>" class="logo">
                        <img src="<?php echo SITE_URL; ?>/img/logo.png" alt="<?php echo SITE_NAME; ?> Logo">
                    </a>
                    
                    <!-- Mobile Menu Toggle -->
                    <button class="mobile-menu-toggle" aria-label="Toggle navigation">
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                    
                    <!-- Navigation Menu -->
                    <ul class="nav-menu">
                        <li class="nav-item <?php echo getCurrentPage() === 'index' ? 'active' : ''; ?>">
                            <a href="<?php echo SITE_URL; ?>" class="nav-link">Home</a>
                        </li>
                        
                        <li class="nav-item has-dropdown">
                            <a href="#" class="nav-link" aria-expanded="false">Domain <i class="fas fa-chevron-down"></i></a>
                            <button class="submenu-toggle" aria-label="Toggle Domain menu" aria-expanded="false">
                                <i class="fas fa-chevron-down"></i>
                            </button>
                            <div class="dropdown-menu mega-menu">
                                <div class="mega-column">
                                    <h4>Domain Services</h4>
                                    <a href="<?php echo SITE_URL; ?>/domain-register">Register a New Domain</a>
                                    <a href="<?php echo SITE_URL; ?>/domain-transfer">Transfer in a Domain</a>
                                </div>
                                <div class="mega-column">
                                    <h4>Why CarrotHost?</h4>
                                    <p>Instant activation, free DNS management, and 24/7 expert support.</p>
                                </div>
                                <div class="mega-card">
                                    <span class="mega-label">Find Your Domain</span>
                                    <p>Search your perfect domain name in seconds.</p>
                                    <a class="btn btn-primary btn-sm" href="<?php echo WHMCS_DOMAIN_REGISTER; ?>">Search Now</a>
                                </div>
                            </div>
                        </li>
                        
                        <li class="nav-item has-dropdown">
                            <a href="#" class="nav-link" aria-expanded="false">Hosting <i class="fas fa-chevron-down"></i></a>
                            <button class="submenu-toggle" aria-label="Toggle Hosting menu" aria-expanded="false">
                                <i class="fas fa-chevron-down"></i>
                            </button>
                            <div class="dropdown-menu mega-menu">
                                <div class="mega-column">
                                    <h4>Shared Hosting</h4>
                                    <a href="<?php echo SITE_URL; ?>/cpanel-hosting">cPanel Hosting</a>
                                    <a href="<?php echo SITE_URL; ?>/webuzo-hosting">Webuzo Hosting</a>
                                </div>
                                <div class="mega-column">
                                    <h4>Included</h4>
                                    <p>SSD storage, LiteSpeed, free SSL, and daily malware scanning.</p>
                                </div>
                                <div class="mega-card">
                                    <span class="mega-label">Launch Today</span>
                                    <p>Get reliable hosting with fast setup and local support.</p>
                                    <a class="btn btn-primary btn-sm" href="<?php echo WHMCS_CART_URL; ?>">Order Now</a>
                                </div>
                            </div>
                        </li>
                        
                        <li class="nav-item has-dropdown">
                            <a href="#" class="nav-link" aria-expanded="false">Server <i class="fas fa-chevron-down"></i></a>
                            <button class="submenu-toggle" aria-label="Toggle Server menu" aria-expanded="false">
                                <i class="fas fa-chevron-down"></i>
                            </button>
                            <div class="dropdown-menu mega-menu">
                                <div class="mega-column">
                                    <h4>VPS & Dedicated</h4>
                                    <a href="<?php echo SITE_URL; ?>/dedicated-server">Dedicated Server</a>
                                    <a href="<?php echo SITE_URL; ?>/bdix-vps">BDIX VPS</a>
                                    <a href="<?php echo SITE_URL; ?>/xeon-vps">Xeon VPS</a>
                                    <a href="<?php echo SITE_URL; ?>/ryzen-vps">Ryzen VPS</a>
                                </div>
                                <div class="mega-column">
                                    <h4>Performance</h4>
                                    <p>NVMe storage, premium network, and enterprise-grade uptime.</p>
                                </div>
                                <div class="mega-card">
                                    <span class="mega-label">Need Help?</span>
                                    <p>Talk to our engineers to size the right server.</p>
                                    <a class="btn btn-primary btn-sm" href="https://wa.me/<?php echo WHATSAPP_NUMBER; ?>">Chat Now</a>
                                </div>
                            </div>
                        </li>
                    </ul>
                    
                    <!-- CTA Button -->
                    <a href="<?php echo WHMCS_CART_URL; ?>" class="btn btn-primary nav-cta">
                        Order Now
                    </a>
                </div>
            </div>
        </nav>
    </header>
    
    <!-- Main Content -->
    <main class="main-content">
