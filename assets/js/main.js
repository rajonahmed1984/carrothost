/**
 * CarrotHost Main JavaScript
 * Handles currency switching, mobile menu, scroll effects, and WHMCS integration
 */

(function() {
    'use strict';
    
    // ==========================================
    // CURRENCY SWITCHER
    // ==========================================
    const currencyButtons = document.querySelectorAll('.currency-btn');
    const priceElements = document.querySelectorAll('[data-price-bdt]');
    
    // Load saved currency preference
    let currentCurrency = localStorage.getItem('currency') || 'BDT';
    
    // Initialize currency on page load
    initCurrency();
    
    function initCurrency() {
        // Update active button
        currencyButtons.forEach(btn => {
            if (btn.dataset.currency === currentCurrency) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Update all prices
        updatePrices();
    }
    
    // Currency button click handler
    currencyButtons.forEach(button => {
        button.addEventListener('click', function() {
            const newCurrency = this.dataset.currency;
            
            if (newCurrency !== currentCurrency) {
                currentCurrency = newCurrency;
                
                // Save to localStorage
                localStorage.setItem('currency', currentCurrency);
                
                // Update server session
                fetch('/api/currency-switcher.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ currency: newCurrency })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        initCurrency();
                    }
                })
                .catch(error => console.error('Currency switch error:', error));
            }
        });
    });
    
    function updatePrices() {
        const usdRate = 120; // BDT to USD conversion rate
        const symbol = currentCurrency === 'BDT' ? '৳' : '$';
        
        priceElements.forEach(element => {
            const bdtPrice = parseFloat(element.dataset.priceBdt);
            let displayPrice;
            
            if (currentCurrency === 'USD') {
                displayPrice = (bdtPrice / usdRate).toFixed(2);
            } else {
                displayPrice = Math.round(bdtPrice).toLocaleString();
            }
            
            // Update price display
            const priceAmount = element.querySelector('.price-amount');
            if (priceAmount) {
                const currency = priceAmount.querySelector('.price-currency');
                const number = priceAmount.querySelector('.price-number');
                
                if (currency) currency.textContent = symbol;
                if (number) number.textContent = displayPrice;
            } else {
                // For simple price elements
                element.innerHTML = `${symbol}${displayPrice}`;
            }
        });
    }
    
    // ==========================================
    // MOBILE MENU
    // ==========================================
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const dropdownItems = document.querySelectorAll('.nav-item.has-dropdown');
    
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function() {
            this.classList.toggle('active');
            navMenu.classList.toggle('active');
            document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
        });
    }
    
    // Mobile dropdown toggle
    dropdownItems.forEach(item => {
        const link = item.querySelector('a');
        link.addEventListener('click', function(e) {
            if (window.innerWidth <= 992) {
                e.preventDefault();
                item.classList.toggle('open');
            }
        });
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        if (window.innerWidth <= 992) {
            const isClickInside = navMenu.contains(event.target) || mobileMenuToggle.contains(event.target);
            
            if (!isClickInside && navMenu.classList.contains('active')) {
                mobileMenuToggle.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
            }
        }
    });
    
    // ==========================================
    // SCROLL TO TOP BUTTON
    // ==========================================
    const scrollToTopBtn = document.querySelector('.scroll-to-top');
    
    if (scrollToTopBtn) {
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                scrollToTopBtn.classList.add('visible');
            } else {
                scrollToTopBtn.classList.remove('visible');
            }
        });
        
        scrollToTopBtn.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
    
    // ==========================================
    // SMOOTH SCROLL FOR ANCHOR LINKS
    // ==========================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const target = document.querySelector(this.getAttribute('href'));
            
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // ==========================================
    // DOMAIN SEARCH
    // ==========================================
    const domainSearchForm = document.querySelector('.domain-search-form');
    
    if (domainSearchForm) {
        domainSearchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const domainInput = this.querySelector('.domain-input');
            const domain = domainInput.value.trim();
            
            if (domain) {
                // Redirect to WHMCS domain search
                const whmcsUrl = domainSearchForm.dataset.whmcsUrl || 'https://portal.carrothost.com';
                window.location.href = `${whmcsUrl}/cart.php?a=add&domain=register&query=${encodeURIComponent(domain)}`;
            }
        });
    }
    
    // ==========================================
    // WHMCS ORDER BUTTONS
    // ==========================================
    document.querySelectorAll('[data-whmcs-product]').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const productId = this.dataset.whmcsProduct;
            const whmcsUrl = this.dataset.whmcsUrl || 'https://portal.carrothost.com';
            
            window.location.href = `${whmcsUrl}/cart.php?a=add&pid=${productId}`;
        });
    });
    
    // ==========================================
    // LAZY LOADING IMAGES
    // ==========================================
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.add('loaded');
                    observer.unobserve(img);
                }
            });
        });
        
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
    
    // ==========================================
    // PRICING CARD ANIMATIONS
    // ==========================================
    const pricingCards = document.querySelectorAll('.pricing-card');
    
    if ('IntersectionObserver' in window) {
        const cardObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }, index * 100);
                    cardObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        
        pricingCards.forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            card.style.transition = 'all 0.5s ease';
            cardObserver.observe(card);
        });
    }
    
    // ==========================================
    // STICKY HEADER
    // ==========================================
    const siteHeader = document.querySelector('.site-header');
    let lastScrollTop = 0;
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > 100) {
            siteHeader.classList.add('scrolled');
        } else {
            siteHeader.classList.remove('scrolled');
        }
        
        lastScrollTop = scrollTop;
    });
    
    // ==========================================
    // FORM VALIDATION
    // ==========================================
    const forms = document.querySelectorAll('form[data-validate]');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            let isValid = true;
            const requiredFields = form.querySelectorAll('[required]');
            
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    field.classList.add('error');
                } else {
                    field.classList.remove('error');
                }
            });
            
            if (!isValid) {
                e.preventDefault();
                alert('Please fill in all required fields.');
            }
        });
    });
    
    // ==========================================
    // COUNTER ANIMATION
    // ==========================================
    function animateCounter(element) {
        const target = parseInt(element.dataset.count);
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;
        
        const timer = setInterval(() => {
            current += step;
            if (current >= target) {
                element.textContent = target.toLocaleString();
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current).toLocaleString();
            }
        }, 16);
    }
    
    const statNumbers = document.querySelectorAll('.stat-number[data-count]');
    
    if (statNumbers.length && 'IntersectionObserver' in window) {
        const statsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    statsObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        statNumbers.forEach(stat => statsObserver.observe(stat));
    }
    
    // ==========================================
    // CONSOLE LOG - Remove in production
    // ==========================================
    console.log('%c🥕 CarrotHost', 'color: #f16922; font-size: 20px; font-weight: bold;');
    console.log('%cProfessional Web Hosting Services', 'color: #009247; font-size: 14px;');
    
})();
