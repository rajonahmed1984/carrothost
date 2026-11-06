<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #0f172a; font-size: 15px; line-height: 1.6;">
    {!! $html !!}
    @if (! empty($buttonUrl))
        <p style="margin: 20px 0;"><a href="{{ $buttonUrl }}" style="display: inline-block; background: #c2410c; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 8px; font-size: 14px; font-weight: bold;">{{ $buttonLabel }}</a></p>
        <p style="margin: 0; font-size: 12px; color: #94a3b8;">If the button does not work, open this address: {{ $buttonUrl }}</p>
    @endif
</div>
