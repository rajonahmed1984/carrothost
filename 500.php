<?php
/**
 * 500 Error Page
 */

require_once 'config.php';
http_response_code(500);

$pageTitle = 'Server Error';
$metaDescription = 'We are experiencing a temporary issue. Please try again shortly or contact support.';

include 'includes/header.php';
?>
<section class="section hero-section">
    <div class="container">
        <div class="section-header">
            <span class="section-subtitle"><i class="fas fa-circle-exclamation"></i> 500 Error</span>
            <h1 class="section-title">Something went wrong</h1>
            <p class="section-description">
                Our team has been notified. Please refresh the page or try again later.
            </p>
            <div class="hero-cta">
                <a href="<?php echo SITE_URL; ?>" class="btn btn-primary">
                    <i class="fas fa-house"></i> Back to Home
                </a>
                <a href="mailto:<?php echo SITE_EMAIL; ?>" class="btn btn-outline">
                    <i class="fas fa-envelope"></i> Email Support
                </a>
            </div>
        </div>
    </div>
</section>

<?php include 'includes/footer.php'; ?>
