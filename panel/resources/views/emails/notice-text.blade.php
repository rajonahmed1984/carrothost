@if ($heading !== '')
{{ $heading }}

@endif
{{ $body }}
@if ($button !== '' && $url !== '')

{{ $button }}: {{ $url }}
@endif
