@if ($name)
Dear {{ $name }},

@endif
{{ $intro }}

Verification code: {{ $code }}

{{ $instructions }}

{{ $footer }}
