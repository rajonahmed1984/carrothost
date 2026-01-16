    </main>
    
    <!-- Footer -->
    <footer class="site-footer">
        <!-- Trust Badges -->
        <div class="footer-trust">
            <div class="container">
                <div class="trust-badges">
                    <div class="trust-badge">
                        <i class="fas fa-shield-halved"></i>
                        <div>
                            <strong>99.9% Uptime</strong>
                            <span>Guarantee</span>
                        </div>
                    </div>
                    <div class="trust-badge">
                        <i class="fas fa-headset"></i>
                        <div>
                            <strong>24/7 Support</strong>
                            <span>Expert Team</span>
                        </div>
                    </div>
                    <div class="trust-badge">
                        <i class="fas fa-lock"></i>
                        <div>
                            <strong>Free SSL</strong>
                            <span>Certificate</span>
                        </div>
                    </div>
                    <div class="trust-badge">
                        <i class="fas fa-rocket"></i>
                        <div>
                            <strong>SSD Storage</strong>
                            <span>Lightning Fast</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="footer-top">
            <div class="container">
                <div class="footer-grid">
                    <div class="footer-col footer-about">
                        <img src="<?php echo SITE_URL; ?>/img/logo.png" alt="<?php echo SITE_NAME; ?> Logo" class="footer-logo">
                        <p class="footer-description">
                            <?php echo SITE_NAME; ?> provides fast SSD hosting, managed VPS, dedicated servers, and domain services in Bangladesh with 24/7 expert support.
                        </p>
                        <div class="footer-contact">
                            <span><i class="fas fa-phone"></i> <?php echo SITE_PHONE; ?></span>
                            <span><i class="fas fa-envelope"></i> <?php echo SITE_EMAIL; ?></span>
                            <span><i class="fas fa-location-dot"></i> <?php echo SITE_ADDRESS; ?></span>
                        </div>
                    </div>
                    <div class="footer-col">
                        <h4 class="footer-title">Products</h4>
                        <ul class="footer-links">
                            <li><a href="<?php echo SITE_URL; ?>/cpanel-hosting">cPanel Hosting</a></li>
                            <li><a href="<?php echo SITE_URL; ?>/webuzo-hosting">Webuzo Hosting</a></li>
                            <li><a href="<?php echo SITE_URL; ?>/dedicated-server">Dedicated Server</a></li>
                            <li><a href="<?php echo SITE_URL; ?>/bdix-vps">BDIX VPS</a></li>
                            <li><a href="<?php echo SITE_URL; ?>/xeon-vps">Xeon VPS</a></li>
                            <li><a href="<?php echo SITE_URL; ?>/ryzen-vps">Ryzen VPS</a></li>
                        </ul>
                    </div>
                    
                    <div class="footer-col">
                        <h4 class="footer-title">Company</h4>
                        <ul class="footer-links">
                            <li><a href="<?php echo SITE_URL; ?>/about-us">About Us</a></li>
                            <li><a href="<?php echo SITE_URL; ?>/data-center">Data Center</a></li>
                            <li><a href="<?php echo WHMCS_URL; ?>/affiliates.php">Affiliate Program</a></li>
                            <li><a href="<?php echo YOUTUBE_URL; ?>">Video Tutorials</a></li>
                        </ul>
                    </div>
                    
                    <div class="footer-col">
                        <h4 class="footer-title">Support</h4>
                        <ul class="footer-links">
                            <li><a href="<?php echo WHMCS_CLIENT_AREA; ?>">Client Area</a></li>
                            <li><a href="<?php echo SUPPORT_TICKET_URL; ?>">Submit Ticket</a></li>
                            <li><a href="<?php echo KNOWLEDGEBASE_URL; ?>">Knowledgebase</a></li>
                            <li><a href="<?php echo WHOIS_URL; ?>">WHOIS Lookup</a></li>
                            <li><a href="<?php echo WHMCS_URL; ?>/announcements">Announcements</a></li>
                        </ul>
                    </div>
                    
                    <div class="footer-col">
                        <h4 class="footer-title">Legal</h4>
                        <ul class="footer-links">
                            <li><a href="<?php echo SITE_URL; ?>/privacy-policy">Privacy Policy</a></li>
                            <li><a href="<?php echo SITE_URL; ?>/terms-conditions">Terms & Conditions</a></li>
                        </ul>
                        <div class="payment-methods">
                            <img src="<?php echo SITE_URL; ?>/img/payments.png" alt="Payment methods" title="Payment methods" loading="lazy">
                        </div>
                        <div class="dmca-badge">
                            <img src="<?php echo SITE_URL; ?>/img/DMCA_logo-grn-btn.png" alt="DMCA Protected" loading="lazy">
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Footer Bottom -->
        <div class="footer-bottom">
            <div class="container">
                <div class="footer-bottom-content">
                    <p class="copyright">
                        &copy; <?php echo date('Y'); ?> <?php echo SITE_NAME; ?>. All Rights Reserved. A <a href="https://apptimatic.com/" target="_blank">Apptimatic</a> company.
                    </p>
                    <div class="footer-social">
                        <a href="<?php echo FACEBOOK_URL; ?>" target="_blank" rel="noopener" aria-label="Facebook">
                            <i class="fab fa-facebook-f"></i>
                        </a>
                        <a href="<?php echo YOUTUBE_URL; ?>" target="_blank" rel="noopener" aria-label="YouTube">
                            <i class="fab fa-youtube"></i>
                        </a>
                        <a href="https://wa.me/<?php echo WHATSAPP_NUMBER; ?>" target="_blank" rel="noopener" aria-label="WhatsApp">
                            <i class="fab fa-whatsapp"></i>
                        </a>
                    </div> 
                </div>
            </div>
        </div>
    </footer>
    
    <!-- Scroll to Top Button -->
    <button class="scroll-to-top" aria-label="Scroll to top">↑</button>
    
    <!-- Scripts -->
    <script src="<?php echo SITE_URL; ?>/assets/js/main.js" defer></script>
    <?php if (isset($additionalScripts)): ?>
        <?php echo $additionalScripts; ?>
    <?php endif; ?>
</body>
</html>



