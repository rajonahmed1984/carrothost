@extends('emails.layout', ['admin' => true])

@section('content')
<div style="color: #334155;">
    <h2 style="color: #0f172a; margin: 0 0 4px;">{{ $heading }}</h2>
    <p style="margin: 0 0 16px; font-size: 13px; color: #64748b;">{{ $period }}</p>

    @foreach ($notes as $note)
        <p style="margin: 0 0 8px; padding: 10px 12px; border-radius: 8px; background: #fff7ed; border: 1px solid #fed7aa; color: #9a3412; font-size: 13px;">{{ $note }}</p>
    @endforeach

    @foreach ($sections as $section)
        <h3 style="margin: 20px 0 8px; font-size: 14px; color: #0f172a;">{{ $section['title'] }}</h3>
        @if (count($section['rows']) === 0)
            <p style="margin: 0; font-size: 13px; color: #64748b;">{{ $section['empty'] ?? 'Nothing to report.' }}</p>
        @else
            <table cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; font-size: 13px;">
                @if (! empty($section['columns']))
                    <tr>
                        @foreach ($section['columns'] as $column)
                            <th style="text-align: left; padding: 6px 8px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; color: #475569;">{{ $column }}</th>
                        @endforeach
                    </tr>
                @endif
                @foreach ($section['rows'] as $row)
                    <tr>
                        @foreach ($row as $i => $cell)
                            <td style="padding: 6px 8px; border-bottom: 1px solid #f1f5f9; vertical-align: top; {{ $i === 0 ? 'color: #0f172a;' : '' }}">{{ $cell }}</td>
                        @endforeach
                    </tr>
                @endforeach
            </table>
        @endif
    @endforeach

    @include('emails.partials.button', ['url' => $url, 'label' => 'Open Admin Panel'])
</div>
@endsection
