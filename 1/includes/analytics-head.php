<?php if (defined('GTM_ID') && GTM_ID): ?>
<!-- Google Tag Manager -->
<script>
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});
var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','<?= htmlspecialchars(GTM_ID, ENT_QUOTES); ?>');
</script>
<!-- End Google Tag Manager -->
<?php endif; ?>

<?php if (defined('GA4_ID') && GA4_ID && !defined('GTM_ID')): ?>
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=<?= htmlspecialchars(GA4_ID, ENT_QUOTES); ?>"></script>
<script>
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '<?= htmlspecialchars(GA4_ID, ENT_QUOTES); ?>');
</script>
<?php endif; ?>

<?php if (defined('YANDEX_METRICA_ID') && YANDEX_METRICA_ID): ?>
<!-- Yandex.Metrica counter -->
<script>
(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
ym(<?= (int)YANDEX_METRICA_ID; ?>, "init", {clickmap:true, trackLinks:true, accurateTrackBounce:true, webvisor:true});
</script>
<!-- /Yandex.Metrica counter -->
<?php endif; ?>
