<?php

namespace App\Support;

use Symfony\Component\HtmlSanitizer\HtmlSanitizer;
use Symfony\Component\HtmlSanitizer\HtmlSanitizerConfig;

/** HTML written in the panel's editor, made safe to email and show back to customers. */
class EmailHtml
{
    public const MAX_LENGTH = 200000;

    /** Keeps formatting, tables, links and images; drops scripts, forms, embeds and event handlers. */
    public static function clean(string $html): string
    {
        $config = (new HtmlSanitizerConfig)
            ->allowSafeElements()
            ->allowAttribute('style', '*')
            ->allowLinkSchemes(['http', 'https', 'mailto', 'tel'])
            ->allowMediaSchemes(['http', 'https'])
            ->allowRelativeLinks(false)
            ->allowRelativeMedias(false)
            ->withMaxInputLength(self::MAX_LENGTH);

        return (new HtmlSanitizer($config))->sanitize($html);
    }

    /** The plain-text part of the email, for clients that do not show HTML. */
    public static function toText(string $html): string
    {
        $html = preg_replace('#<br\s*/?>#i', "\n", $html);
        $html = preg_replace('#</(p|h[1-6]|blockquote|table|ul|ol)>#i', "$0\n\n", $html);
        $html = preg_replace('#</(div|li|tr)>#i', "$0\n", $html);
        $html = preg_replace('#<li[^>]*>#i', '- ', $html);
        // The editor writes empty lines as &nbsp;, which trim() would keep.
        $text = str_replace("\u{00A0}", ' ', html_entity_decode(strip_tags($html), ENT_QUOTES | ENT_HTML5, 'UTF-8'));

        return trim(preg_replace("/\n{3,}/", "\n\n", preg_replace('/[ \t]+\n/', "\n", $text)));
    }
}
