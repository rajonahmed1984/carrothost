<?php
/**
 * 404 Error Page
 */

require_once 'config.php';
http_response_code(404);

$pageTitle = 'Page Not Found';
$metaDescription = 'The page you are looking for could not be found. Return to the homepage or contact support for help.';

include 'includes/header.php';
?>
<section class="section hero-section">
    <div class="container">
        <div class="section-header">
            <span class="section-subtitle"><i class="fas fa-triangle-exclamation"></i> 404 Error</span>
            <h1 class="section-title">We cannot find that page</h1>
            <p class="section-description">
                The page may have moved, been renamed, or is temporarily unavailable.
            </p>
            <div class="hero-cta">
                <a href="<?php echo SITE_URL; ?>" class="btn btn-primary">
                    <i class="fas fa-house"></i> Back to Home
                </a>
                <a href="https://wa.me/<?php echo WHATSAPP_NUMBER; ?>" class="btn btn-outline">
                    <i class="fab fa-whatsapp"></i> Chat Support
                </a>
            </div>
        </div>
    </div>
</section>

<?php include 'includes/footer.php'; ?>
