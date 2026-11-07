@extends('emails.layout', ['admin' => true, 'mailSubject' => $subjectLine])

@section('content')
    <h2 style="margin:0 0 8px;font-size:20px;color:#0f172a;">{{ $heading }}</h2>
    @if ($intro !== '')
        <p style="margin:0 0 16px;">{{ $intro }}</p>
    @endif

    @foreach ($groups as $group)
        <p style="margin:16px 0 4px;"><strong>{{ $group['title'] }}</strong></p>
        <p style="margin:0;">
            @foreach ($group['rows'] as $label => $value)
                {{ $label }}:
                @if ($value === null || $value === '')
                    --
                @elseif (filter_var($value, FILTER_VALIDATE_EMAIL))
                    <a href="mailto:{{ $value }}" style="color:#c2410c;">{{ $value }}</a>
                @else
                    {{ $value }}
                @endif
                @if (! $loop->last)<br>@endif
            @endforeach
        </p>
    @endforeach

    @if ($items)
        <p style="margin:16px 0 6px;"><strong>Items</strong></p>
        <table cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
            <tr>
                <th align="left" style="padding:8px 6px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#64748b;">Item</th>
                <th align="right" style="padding:8px 6px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#64748b;">Amount</th>
            </tr>
            @foreach ($items as [$description, $amount])
                <tr>
                    <td style="padding:8px 6px;border-bottom:1px solid #f1f5f9;">{{ $description }}</td>
                    <td align="right" style="padding:8px 6px;border-bottom:1px solid #f1f5f9;white-space:nowrap;">{{ $amount }}</td>
                </tr>
            @endforeach
            @if ($total !== null)
                <tr>
                    <td style="padding:10px 6px;font-weight:bold;">{{ $totalLabel ?? 'Total' }}</td>
                    <td align="right" style="padding:10px 6px;font-weight:bold;white-space:nowrap;">{{ $total }}</td>
                </tr>
            @endif
        </table>
    @endif

    @include('emails.partials.button', ['url' => $url, 'label' => $button])
@endsection
