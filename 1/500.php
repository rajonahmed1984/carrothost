<?php
http_response_code(500);
$pageTitle = 'Server Error';
$metaDescription = 'Something went wrong on our side. Please try again later.';
require_once __DIR__ . '/includes/header.php';
?>

<main class="section error-section">
    <div class="container">
        <div class="error-card">
            <span class="error-code">500</span>
            <h1>Server Error</h1>
            <p>Our team has been notified. Please try again shortly or reach out to support if the issue persists.</p>
            <div class="error-actions">
                <a class="btn btn-primary" href="<?php echo SITE_URL; ?>">Try Again</a>
                <a class="btn btn-secondary" href="<?php echo SUPPORT_TICKET_URL; ?>">Contact Support</a>
            </div>
        </div>
    </div>
</main>

<?php include __DIR__ . '/includes/footer.php'; ?>
