# CarrotHost - Professional Web Hosting Business Website

A complete, production-ready web hosting business website built with PHP, HTML5, CSS3, and JavaScript. Features dynamic currency switching (BDT ↔ USD), WHMCS integration, and full SEO optimization.

## 🎨 Brand Colors
- **Primary Color**: `#f16922` (Orange) - CTA buttons, pricing highlights, icons
- **Secondary Color**: `#009247` (Green) - Trust badges, headings accents, success states

## ✨ Features

### Core Features
- ✅ Dynamic Currency Switcher (BDT ↔ USD)
- ✅ WHMCS Integration Ready
- ✅ 100% Mobile Responsive (Mobile-First Design)
- ✅ SEO Optimized with Schema Markup
- ✅ Fast Loading & Core Web Vitals Optimized
- ✅ Professional UI/UX Design

### Technical Features
- ✅ Clean, SEO-friendly URLs with .htaccess
- ✅ PHP Session-based currency management
- ✅ localStorage for currency preference
- ✅ JSON-LD Schema for HostingBusiness
- ✅ OpenGraph & Twitter Card metadata
- ✅ Lazy loading images
- ✅ Browser caching & compression
- ✅ Security headers

## 📁 Project Structure

```
carrothost/
├── index.php                 # Homepage
├── config.php               # Configuration & functions
├── .htaccess                # URL rewriting & optimization
│
├── includes/
│   ├── header.php           # Header & navigation
│   └── footer.php           # Footer & scripts
│
├── api/
│   └── currency-switcher.php  # Currency API endpoint
│
├── assets/
│   ├── css/
│   │   ├── style.css        # Main styles
│   │   └── components.css   # Component styles
│   ├── js/
│   │   └── main.js          # Main JavaScript
│   └── images/              # Images folder
│
├── Hosting Pages:
├── cpanel-hosting.php       # cPanel hosting plans
├── webuzo-hosting.php       # Webuzo VPS hosting
│
├── Server Pages:
├── bdix-vps.php             # BDIX VPS hosting
├── xeon-vps.php             # Intel Xeon VPS
├── ryzen-vps.php            # AMD Ryzen VPS
├── dedicated-server.php     # Dedicated servers
│
└── Domain Pages:
    ├── domain-register.php  # Domain registration
    └── domain-transfer.php  # Domain transfer
```

## 🚀 Installation

### Requirements
- PHP 7.4 or higher
- Apache/Nginx web server
- mod_rewrite enabled (for Apache)

### Setup Steps

1. **Clone or download** the project to your web server:
   ```bash
   cd C:\xampp\htdocs\carrothost
   ```

2. **Configure WHMCS URLs** in `config.php`:
   ```php
   define('WHMCS_URL', 'https://portal.carrothost.com');
   ```

3. **Update Site Information** in `config.php`:
   ```php
   define('SITE_NAME', 'CarrotHost');
   define('SITE_EMAIL', 'support@carrothost.com');
   define('SITE_PHONE', '+8801787882277');
   ```

4. **Set Currency Conversion Rate** in `config.php`:
   ```php
   define('USD_TO_BDT_RATE', 120); // Update as needed
   ```

5. **Add Logo and Images** to `assets/images/`:
   - logo.png (Header logo)
   - logo-white.png (Footer logo)
   - favicon.png
   - og-image.jpg (Social media preview)
   - Payment method images

6. **Update WHMCS Product IDs** in page files:
   - Replace product IDs in `getWHMCSProductURL()` calls
   - Match with your actual WHMCS product IDs

7. **Test the website**:
   ```
   http://localhost/carrothost/
   ```

## 🎯 Menu Structure

```
Home

Domain
 ├─ Register a New Domain
 └─ Transfer in a Domain

Hosting
 ├─ cPanel Hosting
 └─ Webuzo Hosting

Server
 ├─ Dedicated Server
 ├─ BDIX VPS
 ├─ Xeon VPS
 └─ Ryzen VPS
```

## 💱 Currency Switcher

The currency switcher allows users to view prices in BDT or USD.

### How it works:
1. User clicks BDT or USD button in top bar
2. JavaScript sends AJAX request to `/api/currency-switcher.php`
3. PHP updates session currency
4. JavaScript updates all prices on page
5. Preference saved to localStorage

### Usage in templates:
```php
// Display price with automatic currency conversion
<?php echo formatPrice(1500); ?>

// Get price details
<?php 
$price = convertPrice(1500);
echo $price['formatted']; // Output: ৳1500 or $12.50
?>
```

## 🔌 WHMCS Integration

### Product Links
```php
// Link to specific product
<a href="<?php echo getWHMCSProductURL(1); ?>">Order Now</a>

// Domain registration
<a href="<?php echo WHMCS_DOMAIN_REGISTER; ?>">Register Domain</a>

// Domain transfer
<a href="<?php echo WHMCS_DOMAIN_TRANSFER; ?>">Transfer Domain</a>
```

### JavaScript Integration
```javascript
// Order button with product ID
<button data-whmcs-product="1" data-whmcs-url="https://portal.carrothost.com">
    Order Now
</button>
```

## 🔍 SEO Features

### Per-Page SEO
Each page includes:
- Custom meta title & description
- Canonical URLs
- Proper H1-H6 hierarchy
- Schema.org markup (JSON-LD)
- OpenGraph tags
- Twitter Cards

### Keywords Focus
- Web Hosting Bangladesh
- cPanel Hosting
- VPS Hosting
- BDIX Hosting
- Dedicated Server
- Domain Registration

## 📱 Responsive Design

- **Mobile First**: Optimized for mobile devices
- **Breakpoints**:
  - Mobile: < 768px
  - Tablet: 768px - 992px
  - Desktop: > 992px

## ⚡ Performance

### Optimizations Included:
- Gzip compression
- Browser caching (1 year for images)
- Lazy loading images
- Minified CSS/JS ready
- CDN ready (Font Awesome from CDN)
- Optimized font loading (Google Fonts)

## 🎨 Customization

### Change Brand Colors
Edit in `assets/css/style.css`:
```css
:root {
    --primary-color: #f16922;
    --secondary-color: #009247;
}
```

### Add New Pricing Plan
1. Copy existing pricing card
2. Update:
   - Plan name
   - Price (use `convertPrice()`)
   - Features list
   - WHMCS product ID

### Modify Footer
Edit `includes/footer.php` to:
- Add/remove footer sections
- Update social media links
- Modify payment methods

## 📞 Support Information

Update in `config.php`:
```php
define('SITE_PHONE', '+8801787882277');
define('WHATSAPP_NUMBER', '8801787882277');
define('SITE_EMAIL', 'support@carrothost.com');
```

## 🔐 Security

### Implemented:
- HTTPS redirect (uncomment in .htaccess for production)
- Security headers (X-Frame-Options, X-XSS-Protection)
- CSRF protection ready
- Input sanitization
- Protected sensitive files

### For Production:
1. Enable HTTPS redirect in `.htaccess`
2. Update `SITE_URL` to https://
3. Install SSL certificate
4. Configure firewall rules
5. Regular backups

## 📄 License

This is a custom-built website for CarrotHost. All rights reserved.

## 👨‍💻 Development

### Tech Stack:
- **Backend**: PHP 7.4+
- **Frontend**: HTML5, CSS3 (with CSS Variables), Vanilla JavaScript
- **Fonts**: Google Fonts (Inter)
- **Icons**: Font Awesome 6.4
- **Architecture**: Component-based, modular design

### Browser Support:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🆘 Troubleshooting

### Currency not switching?
- Check if PHP sessions are enabled
- Verify `api/currency-switcher.php` is accessible
- Check browser console for JavaScript errors

### 404 Errors?
- Ensure mod_rewrite is enabled
- Check `.htaccess` file exists
- Verify file permissions

### Prices not displaying?
- Check `config.php` is included
- Verify `convertPrice()` function is called correctly
- Check PHP session is started

## 📞 Support

For technical support or customization requests, contact:
- **Email**: support@carrothost.com
- **WhatsApp**: +8801787882277
- **Website**: https://carrothost.com

---

**Built with ❤️ for CarrotHost - Professional Web Hosting Services**
