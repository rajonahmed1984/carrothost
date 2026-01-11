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
    const siteUrl = document.body && document.body.dataset.siteUrl ? document.body.dataset.siteUrl.replace(/\/+$/, '') : '';
    
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
                const apiUrl = siteUrl ? `${siteUrl}/api/currency-switcher.php` : '/api/currency-switcher.php';
                fetch(apiUrl, {
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
        
        document.querySelectorAll('[data-price-bdt]').forEach(element => {
            const bdtPrice = parseFloat(element.dataset.priceBdt);
            if (Number.isNaN(bdtPrice)) {
                return;
            }
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
    // DOMAIN PRICING (WHMCS)
    // ==========================================
    let whmcsPricing = {};
    const tldElements = document.querySelectorAll('[data-tld]');

    if (tldElements.length) {
        const normalizeTld = (tld) => {
            if (!tld) {
                return '';
            }
            return `.${tld.toLowerCase().replace(/^\./, '')}`;
        };

        const tldList = Array.from(tldElements)
            .map((el) => normalizeTld(el.dataset.tld))
            .filter(Boolean);
        const uniqueTlds = Array.from(new Set(tldList));
        const priceTypes = Array.from(new Set(
            Array.from(tldElements).map((el) => (el.dataset.priceType || 'register').toLowerCase())
        ));

        const apiUrl = siteUrl
            ? `${siteUrl}/api/whmcs-domain-pricing.php?tlds=${encodeURIComponent(uniqueTlds.join(','))}&types=${encodeURIComponent(priceTypes.join(','))}`
            : `/api/whmcs-domain-pricing.php?tlds=${encodeURIComponent(uniqueTlds.join(','))}&types=${encodeURIComponent(priceTypes.join(','))}`;

        fetch(apiUrl)
            .then((response) => response.json())
            .then((data) => {
                if (!data.success || !data.pricing) {
                    return;
                }
                whmcsPricing = data.pricing || {};

                tldElements.forEach((element) => {
                    const tld = normalizeTld(element.dataset.tld);
                    if (!tld) {
                        return;
                    }

                    const priceType = (element.dataset.priceType || 'register').toLowerCase();
                    const tldPricing = data.pricing[tld];

                    if (!tldPricing || tldPricing[priceType] == null) {
                        return;
                    }

                    if (element.classList.contains('pricing-card')) {
                        element.dataset.priceBdt = tldPricing[priceType];
                        return;
                    }

                    if (element.dataset.priceBdt !== undefined) {
                        element.dataset.priceBdt = tldPricing[priceType];
                        return;
                    }

                    const priceTarget = element.querySelector('.extension-price[data-price-bdt]');
                    if (priceTarget) {
                        priceTarget.dataset.priceBdt = tldPricing[priceType];
                    }
                });

                updatePrices();
            })
            .catch(() => {
                // Silent fail to keep static pricing as fallback.
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
    
    // Mobile dropdown toggle (accordion behavior)
    const closeOtherDropdowns = (currentItem) => {
        dropdownItems.forEach((item) => {
            if (item !== currentItem) {
                item.classList.remove('open');
                const link = item.querySelector('.nav-link');
                const toggle = item.querySelector('.submenu-toggle');
                if (link) link.setAttribute('aria-expanded', 'false');
                if (toggle) toggle.setAttribute('aria-expanded', 'false');
            }
        });
    };

    dropdownItems.forEach(item => {
        const link = item.querySelector('.nav-link');
        const toggle = item.querySelector('.submenu-toggle');

        const handleToggle = (e) => {
            if (link && link.getAttribute('href') === '#') {
                e.preventDefault();
            }
            if (window.innerWidth <= 992) {
                const willOpen = !item.classList.contains('open');
                closeOtherDropdowns(item);
                item.classList.toggle('open', willOpen);
                if (link) link.setAttribute('aria-expanded', String(willOpen));
                if (toggle) toggle.setAttribute('aria-expanded', String(willOpen));
            }
        };

        if (link) {
            link.addEventListener('click', handleToggle);
        }
        if (toggle) {
            toggle.addEventListener('click', handleToggle);
        }
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        if (window.innerWidth <= 992) {
            const isClickInside = navMenu.contains(event.target) || mobileMenuToggle.contains(event.target);
            
            if (!isClickInside && navMenu.classList.contains('active')) {
                mobileMenuToggle.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
                dropdownItems.forEach((item) => {
                    item.classList.remove('open');
                    const link = item.querySelector('.nav-link');
                    const toggle = item.querySelector('.submenu-toggle');
                    if (link) link.setAttribute('aria-expanded', 'false');
                    if (toggle) toggle.setAttribute('aria-expanded', 'false');
                });
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
    const domainSearchForms = document.querySelectorAll('.domain-search-form');

    const escapeHtml = (value) => value.replace(/[&<>"']/g, (char) => {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return map[char] || char;
    });

    const normalizeInputDomain = (value, defaultTld) => {
        let cleaned = value.trim().toLowerCase();
        cleaned = cleaned.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
        if (!cleaned) {
            return '';
        }
        if (!cleaned.includes('.')) {
            const suffix = defaultTld && defaultTld.startsWith('.') ? defaultTld : `.${defaultTld || 'com'}`;
            cleaned = `${cleaned}${suffix}`;
        }
        return cleaned;
    };

    const getTldFromDomain = (domain) => `.${domain.split('.').slice(1).join('.')}`;

    domainSearchForms.forEach((form) => {
        let result = form.parentElement.querySelector('.domain-search-result');
        if (!result) {
            result = document.createElement('div');
            result.className = 'domain-search-result';
            result.setAttribute('aria-live', 'polite');
            form.parentElement.appendChild(result);
        }

        form.addEventListener('submit', function(e) {
            e.preventDefault();

            const domainInput = form.querySelector('.domain-input');
            const rawDomain = domainInput ? domainInput.value : '';
            const defaultTld = form.dataset.defaultTld || '.com';
            const mode = (form.dataset.checkMode || 'register').toLowerCase();
            const domain = normalizeInputDomain(rawDomain, defaultTld);

            if (!domain) {
                return;
            }

            result.classList.remove('available', 'unavailable');
            result.classList.add('loading');
            result.textContent = 'Checking availability...';

            const apiUrl = siteUrl
                ? `${siteUrl}/api/whmcs-domain-check.php?domain=${encodeURIComponent(domain)}`
                : `/api/whmcs-domain-check.php?domain=${encodeURIComponent(domain)}`;
            const whmcsUrl = form.dataset.whmcsUrl || 'https://portal.carrothost.com';
            const actionUrl = mode === 'transfer'
                ? `${whmcsUrl}/cart.php?a=add&domain=transfer&domain=${encodeURIComponent(domain)}`
                : `${whmcsUrl}/cart.php?a=add&domain=register&query=${encodeURIComponent(domain)}`;

            fetch(apiUrl)
                .then((response) => response.json())
                .then((data) => {
                    result.classList.remove('loading');
                    if (!data.success) {
                        result.classList.add('unavailable');
                        result.textContent = 'Unable to check domain availability right now.';
                        return;
                    }

                    const available = !!data.available;
                    const safeDomain = escapeHtml(domain);
                    const tld = getTldFromDomain(domain);
                    const priceType = mode === 'transfer' ? 'transfer' : 'register';
                    const tldPricing = whmcsPricing && whmcsPricing[tld] ? whmcsPricing[tld][priceType] : null;
                    const priceHtml = tldPricing != null
                        ? ` <span class="domain-search-price" data-price-bdt="${tldPricing}"></span> /year`
                        : '';

                    if (mode === 'transfer') {
                        if (available) {
                            result.classList.add('unavailable');
                            result.innerHTML = `${safeDomain} is available and cannot be transferred.`;
                        } else {
                            result.classList.add('available');
                            result.innerHTML = `${safeDomain} is eligible for transfer.${priceHtml} <a class="btn btn-primary btn-sm domain-search-cta" href="${actionUrl}">Transfer Now</a>`;
                        }
                    } else {
                        if (available) {
                            result.classList.add('available');
                            result.innerHTML = `${safeDomain} is available.${priceHtml} <a class="btn btn-primary btn-sm domain-search-cta" href="${actionUrl}">Register Now</a>`;
                        } else {
                            result.classList.add('unavailable');
                            result.innerHTML = `${safeDomain} is already taken.`;
                        }
                    }

                    updatePrices();
                })
                .catch(() => {
                    window.location.href = actionUrl;
                });
        });
    });

    // ==========================================
    // DOMAIN PRICING BROWSER (CATEGORIES)
    // ==========================================
    const pricingBrowser = document.querySelector('.domain-pricing-browser');

    if (pricingBrowser) {
        const tableBody = pricingBrowser.querySelector('[data-domain-pricing-body]');
        const filterButtons = pricingBrowser.querySelectorAll('.category-btn');
        const categoryCounts = {};

        const formatTld = (tld) => `.${tld.replace(/^\./, '').toLowerCase()}`;

        const categoryMatchers = [
            { name: 'Popular', matches: (tld) => ['.com', '.net', '.org', '.info', '.xyz', '.biz', '.us', '.bd', '.com.bd', '.net.bd', '.org.bd'].includes(tld) },
            { name: 'Arts and Entertainment', matches: (tld) => /(art|arts|music|movie|film|tv|video|media|news|show|play|game|games|fun|design|photo|gallery|theater|theatre|band|radio|live)/.test(tld) },
            { name: 'Business', matches: (tld) => /(biz|business|company|corp|ltd|inc|llc|llp|co$|group|enterprises?|agency|consulting|ventures?)/.test(tld) },
            { name: 'Geographic', matches: (tld) => tld.length === 3 || /\.bd$/.test(tld) },
            { name: 'Sports', matches: (tld) => /(sport|sports|football|soccer|golf|tennis|cricket|basketball|hockey|club)/.test(tld) },
            { name: 'Technology', matches: (tld) => /(tech|dev|app|ai|cloud|digital|software|systems?|hosting|server|data|network|io$|it$|xyz$)/.test(tld) },
            { name: 'Services', matches: (tld) => /(services?|support|help|solutions?|care|center|centre|pro$|expert|legal|law|repair)/.test(tld) },
            { name: 'Money and Finance', matches: (tld) => /(bank|finance|money|cash|pay|card|capital|fund|loan|credit|forex)/.test(tld) },
            { name: 'Education', matches: (tld) => /(edu|school|college|university|academy|training|learn|study|courses?)/.test(tld) },
            { name: 'Food and Drink', matches: (tld) => /(food|cafe|coffee|pizza|restaurant|bar|pub|beer|wine|tea|kitchen)/.test(tld) },
            { name: 'Leisure and Recreation', matches: (tld) => /(travel|tours?|holiday|vacation|trip|hotel|resort|fun|play|games|club|hobby)/.test(tld) },
            { name: 'Shopping', matches: (tld) => /(shop|store|market|buy|sale|deals?|mall)/.test(tld) },
            { name: 'Real Estate', matches: (tld) => /(realty|estate|property|homes?|house|rent|rentals?)/.test(tld) },
            { name: 'Novelty', matches: (tld) => /(lol|fun|cool|ninja|guru|buzz|party|pink|rocks)/.test(tld) }
        ];

        const pickCategory = (tld) => {
            for (const matcher of categoryMatchers) {
                if (matcher.matches(tld)) {
                    return matcher.name;
                }
            }
            return 'Other';
        };

        const buildRows = (pricing) => {
            const rows = [];
            Object.keys(pricing).forEach((tld) => {
                const key = formatTld(tld);
                const register = pricing[tld].register ?? null;
                const transfer = pricing[tld].transfer ?? null;
                const renew = pricing[tld].renew ?? null;
                rows.push({
                    tld: key,
                    category: pickCategory(key),
                    register,
                    transfer,
                    renew
                });
                categoryCounts[pickCategory(key)] = (categoryCounts[pickCategory(key)] || 0) + 1;
            });

            rows.sort((a, b) => a.tld.localeCompare(b.tld));
            return rows;
        };

        const renderTable = (rows, activeCategory) => {
            if (!tableBody) {
                return;
            }

            const filtered = rows.filter((row) => row.category === activeCategory);
            if (!filtered.length) {
                tableBody.innerHTML = '<tr><td colspan="4">No extensions found.</td></tr>';
                return;
            }

            tableBody.innerHTML = filtered.map((row) => {
                const register = row.register != null ? row.register : 0;
                const transfer = row.transfer != null ? row.transfer : 0;
                const renew = row.renew != null ? row.renew : 0;

                return `
                    <tr data-category="${row.category}">
                        <td><strong>${row.tld}</strong></td>
                        <td><span class="extension-price" data-tld="${row.tld}" data-price-type="register" data-price-bdt="${register}"></span> /year</td>
                        <td><span class="extension-price" data-tld="${row.tld}" data-price-type="transfer" data-price-bdt="${transfer}"></span> /year</td>
                        <td><span class="extension-price" data-tld="${row.tld}" data-price-type="renew" data-price-bdt="${renew}"></span> /year</td>
                    </tr>
                `;
            }).join('');

            updatePrices();
        };

        const updateFilterCounts = () => {
            filterButtons.forEach((button) => {
                const category = button.dataset.category;
                const count = categoryCounts[category] || 0;
                button.textContent = `${category} (${count})`;
            });
        };

        const setActiveCategory = (category, rows) => {
            filterButtons.forEach((button) => {
                button.classList.toggle('active', button.dataset.category === category);
            });
            renderTable(rows, category);
        };

        const apiUrl = siteUrl
            ? `${siteUrl}/api/whmcs-domain-pricing.php?types=register,transfer,renew`
            : '/api/whmcs-domain-pricing.php?types=register,transfer,renew';

        fetch(apiUrl)
            .then((response) => response.json())
            .then((data) => {
                if (!data.success || !data.pricing) {
                    if (tableBody) {
                        tableBody.innerHTML = '<tr><td colspan="4">Unable to load pricing.</td></tr>';
                    }
                    return;
                }

                whmcsPricing = data.pricing || {};
                const rows = buildRows(data.pricing);
                updateFilterCounts();
                setActiveCategory('Popular', rows);

                filterButtons.forEach((button) => {
                    button.addEventListener('click', () => {
                        setActiveCategory(button.dataset.category, rows);
                    });
                });
            })
            .catch(() => {
                if (tableBody) {
                    tableBody.innerHTML = '<tr><td colspan="4">Unable to load pricing.</td></tr>';
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
    let isTicking = false;
    
    window.addEventListener('scroll', function() {
        if (!siteHeader) {
            return;
        }
        
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (!isTicking) {
            window.requestAnimationFrame(() => {
                const isMenuOpen = navMenu && navMenu.classList.contains('active');
                
                if (scrollTop > 100) {
                    siteHeader.classList.add('scrolled');
                    
                    if (!isMenuOpen && scrollTop > lastScrollTop + 5) {
                        siteHeader.classList.add('header-hidden');
                    } else if (scrollTop < lastScrollTop - 5) {
                        siteHeader.classList.remove('header-hidden');
                    }
                } else {
                    siteHeader.classList.remove('scrolled');
                    siteHeader.classList.remove('header-hidden');
                }
                
                lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
                isTicking = false;
            });
            
            isTicking = true;
        }
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
})();


