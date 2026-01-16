<?php
http_response_code(404);
$pageTitle = 'Page Not Found';
$metaDescription = 'Sorry, the page you are looking for could not be found.';
require_once __DIR__ . '/includes/header.php';
?>

<main class="section error-section">
    <div class="container">
        <div class="error-card">
            <span class="error-code">404</span>
            <h1>We can&apos;t find that page.</h1>
            <p>The page may have moved, been renamed, or no longer exists. Please try one of the links below or return to the homepage.</p>
            <div class="error-actions">
                <a class="btn btn-primary" href="<?php echo SITE_URL; ?>">Go to Homepage</a>
                <a class="btn btn-secondary" href="<?php echo SUPPORT_TICKET_URL; ?>">Contact Support</a>
            </div>
        </div>
    </div>
</main>

<?php include __DIR__ . '/includes/footer.php'; ?>
