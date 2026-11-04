import { Editor } from '@tinymce/tinymce-react';
import 'tinymce/tinymce';
import 'tinymce/models/dom';
import 'tinymce/themes/silver';
import 'tinymce/icons/default';
import 'tinymce/skins/ui/oxide/skin.min.css';
import 'tinymce/plugins/advlist';
import 'tinymce/plugins/anchor';
import 'tinymce/plugins/autolink';
import 'tinymce/plugins/charmap';
import 'tinymce/plugins/code';
import 'tinymce/plugins/directionality';
import 'tinymce/plugins/fullscreen';
import 'tinymce/plugins/help';
import 'tinymce/plugins/help/js/i18n/keynav/en';
import 'tinymce/plugins/image';
import 'tinymce/plugins/link';
import 'tinymce/plugins/lists';
import 'tinymce/plugins/media';
import 'tinymce/plugins/preview';
import 'tinymce/plugins/searchreplace';
import 'tinymce/plugins/table';
import 'tinymce/plugins/visualblocks';
import 'tinymce/plugins/visualchars';
import 'tinymce/plugins/wordcount';
import contentCss from 'tinymce/skins/content/default/content.min.css?raw';
import contentUiCss from 'tinymce/skins/ui/oxide/content.min.css?raw';

/**
 * TinyMCE, bundled with the panel instead of loaded from Tiny's cloud, for writing HTML email.
 * Kept in its own file so it is only downloaded when an editor opens.
 */
export default function RichEditor({ value, onChange, height = 420 }: { value: string; onChange: (html: string) => void; height?: number }) {
    return (
        <Editor
            licenseKey="gpl"
            value={value}
            onEditorChange={onChange}
            init={{
                height,
                skin: false,
                content_css: false,
                content_style: `${contentCss}\n${contentUiCss}\nbody { font-family: Helvetica, Arial, sans-serif; font-size: 11pt; }`,
                menubar: 'file edit view insert format table help',
                plugins: 'advlist anchor autolink charmap code directionality fullscreen help image link lists media preview searchreplace table visualblocks visualchars wordcount',
                toolbar: [
                    'blocks fontfamily fontsize | bold italic strikethrough underline forecolor backcolor | link unlink | bullist numlist',
                    'outdent indent blockquote | undo redo | cut copy paste pastetext | table | hr charmap image media | preview | ltr rtl | fullscreen | help code | removeformat',
                ],
                font_size_formats: '8pt 9pt 10pt 11pt 12pt 14pt 16pt 18pt 24pt 36pt',
                // Email clients need absolute links and images.
                relative_urls: false,
                remove_script_host: false,
                convert_urls: true,
                branding: false,
                promotion: false,
            }}
        />
    );
}
