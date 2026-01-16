<?php if (defined('GTM_ID') && GTM_ID): ?>
  <!-- Google Tag Manager (noscript) -->
  <noscript>
    <iframe src="https://www.googletagmanager.com/ns.html?id=<?= htmlspecialchars(GTM_ID, ENT_QUOTES); ?>"
            height="0" width="0" style="display:none;visibility:hidden"></iframe>
  </noscript>
  <!-- End Google Tag Manager (noscript) -->
<?php endif; ?>

<?php if (defined('YANDEX_METRICA_ID') && YANDEX_METRICA_ID): ?>
  <!-- Yandex.Metrica (noscript) -->
  <noscript>
    <div><img src="https://mc.yandex.ru/watch/<?= (int)YANDEX_METRICA_ID; ?>" style="position:absolute; left:-9999px;" alt="" /></div>
  </noscript>
  <!-- /Yandex.Metrica (noscript) -->
<?php endif; ?>
