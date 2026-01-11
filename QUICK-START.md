# 🚀 CarrotHost Quick Start Guide

Get your hosting website up and running in 10 minutes!

## ⚡ Quick Setup (5 Steps)

### Step 1: Configure Your Site (2 min)

Open `config.php` and update these essential settings:

```php
// Your WHMCS URL
define('WHMCS_URL', 'https://portal.carrothost.com');

// Contact Information
define('SITE_EMAIL', 'support@carrothost.com');
define('SITE_PHONE', '+8801787882277');
define('WHATSAPP_NUMBER', '8801787882277');

// Currency Rate (Update monthly)
define('USD_TO_BDT_RATE', 120);
```

### Step 2: Add Your Logo (1 min)

Place your logo files in `assets/images/`:
- `logo.png` - For header (180x45px recommended)
- `logo-white.png` - For footer (white version)
- `favicon.png` - Browser icon (32x32px)

**Don't have logos yet?** The site will work without them, add later!

### Step 3: Configure WHMCS Product IDs (2 min)

Your WHMCS products need to be linked. Edit the product IDs in each page:

**cPanel Hosting** (`cpanel-hosting.php`):
```php
// Find and replace these product IDs:
getWHMCSProductURL(1)  // Basic Plan
getWHMCSProductURL(2)  // Standard Plan
getWHMCSProductURL(3)  // Premium Plan
getWHMCSProductURL(4)  // Business Plan
```

**Repeat for other pages**: `webuzo-hosting.php`, `bdix-vps.php`, `xeon-vps.php`, `ryzen-vps.php`, `dedicated-server.php`

### Step 4: Test Currency Switcher (1 min)

1. Open the homepage: `http://localhost/carrothost/`
2. Click BDT/USD buttons in top bar
3. Check if prices change
4. Verify prices persist on page reload

### Step 5: Enable Production Mode (1 min)

When going live:

1. **Enable HTTPS** in `.htaccess` (uncomment these lines):
   ```apache
   RewriteCond %{HTTPS} off
   RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
   ```

2. **Update SITE_URL** in `config.php`:
   ```php
   define('SITE_URL', 'https://carrothost.com');
   ```

3. **Upload to server** via FTP/cPanel File Manager

## ✅ Pre-Launch Checklist

- [ ] All pages load without errors
- [ ] Currency switcher works (BDT ↔ USD)
- [ ] Mobile responsive on phone/tablet
- [ ] Logo displays correctly
- [ ] WHMCS links work (test order button)
- [ ] Domain search redirects to WHMCS
- [ ] Contact info is correct
- [ ] Footer links work
- [ ] WhatsApp button opens correctly
- [ ] SSL certificate installed (production)

## 🎨 Quick Customization

### Change Prices

All prices are in BDT. Edit directly in page files:

```php
// Example from index.php
formatPrice(500)   // Displays ৳500 or $4.17
formatPrice(1500)  // Displays ৳1500 or $12.50
```

### Change Colors

Edit `assets/css/style.css`:

```css
:root {
    --primary-color: #f16922;    /* Your main brand color */
    --secondary-color: #009247;   /* Your accent color */
}
```

### Add/Edit Plans

Copy existing pricing card in any page:

```php
<div class="pricing-card" data-price-bdt="YOUR_PRICE">
    <div class="pricing-icon">
        <i class="fas fa-icon-name"></i>
    </div>
    <h3 class="pricing-name">Plan Name</h3>
    <!-- ... features ... -->
    <a href="<?php echo getWHMCSProductURL(YOUR_PRODUCT_ID); ?>" 
       class="btn btn-primary pricing-cta">
        Order Now
    </a>
</div>
```

## 🔧 Common Issues & Solutions

### Currency not switching?
**Solution**: Check if PHP sessions are enabled:
```php
<?php
session_start();
phpinfo(); // Check session section
?>
```

### 404 Page Not Found?
**Solution**: Enable mod_rewrite in Apache:
```bash
# Ubuntu/Debian
sudo a2enmod rewrite
sudo service apache2 restart

# Check .htaccess exists in root folder
```

### Prices not showing?
**Solution**: Make sure config.php is included:
```php
<?php require_once 'config.php'; ?>
```

### Mobile menu not working?
**Solution**: Ensure main.js is loaded:
- Check file path in footer.php
- Check browser console for errors (F12)

## 📱 Test on Mobile

1. **Chrome DevTools**: 
   - Press F12
   - Click mobile icon
   - Test different devices

2. **Real Device**:
   - Find your local IP: `ipconfig` (Windows) or `ifconfig` (Linux/Mac)
   - Access: `http://YOUR_IP/carrothost/` from phone

3. **Online Tools**:
   - BrowserStack
   - Responsinator
   - Mobile-Friendly Test (Google)

## 🚀 Going Live

### Upload to Server

**Via cPanel File Manager**:
1. Login to cPanel
2. File Manager → public_html
3. Upload all files (keep folder structure)
4. Set file permissions (644 for files, 755 for folders)

**Via FTP**:
1. Use FileZilla or similar
2. Connect to your server
3. Upload to public_html or your domain folder
4. Preserve folder structure

### After Upload

1. **Test all pages** on live URL
2. **Check SSL** certificate (https://)
3. **Test WHMCS links** (actual orders)
4. **Test on multiple devices**
5. **Submit to Google Search Console**

## 📊 SEO Setup (Post-Launch)

1. **Google Search Console**:
   - Add property
   - Submit sitemap (if created)
   - Monitor indexing

2. **Google Analytics**:
   - Create account
   - Add tracking code before `</head>` in header.php

3. **Facebook Pixel** (Optional):
   - Add pixel code to header.php
   - Track conversions

## 🔄 Regular Maintenance

### Weekly:
- [ ] Check for broken links
- [ ] Monitor contact form submissions
- [ ] Update currency rate if needed

### Monthly:
- [ ] Review pricing and update if needed
- [ ] Check WHMCS integration
- [ ] Backup website files and database

### Quarterly:
- [ ] Update PHP version
- [ ] Security audit
- [ ] Performance optimization

## 💡 Pro Tips

1. **Use a CDN**: CloudFlare (free tier) for faster loading
2. **Image Optimization**: Compress all images with TinyPNG
3. **Monitoring**: Use UptimeRobot for uptime monitoring
4. **Backup**: Set up automatic daily backups
5. **Analytics**: Track conversion rates on order buttons

## 📞 Need Help?

- **Documentation**: See main README.md
- **Images Guide**: See assets/images/README-IMAGES.md
- **Support**: support@carrothost.com
- **WhatsApp**: +8801787882277

## 🎉 You're Ready!

Your CarrotHost website is now configured and ready to accept orders. 

**Next Steps**:
1. Test all features thoroughly
2. Add your actual WHMCS product IDs
3. Upload your logo and images
4. Go live and start getting customers!

---

**Good luck with your hosting business! 🚀**
