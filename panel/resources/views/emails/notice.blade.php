@extends('emails.layout', ['mailSubject' => $subjectLine ?? null])

@section('content')
    @if ($heading !== '')
        <h2 style="margin:0 0 16px;font-size:20px;color:#0f172a;">{{ $heading }}</h2>
    @endif
    @if ($richBody)
        <div style="font-size:14px;line-height:1.6;color:#334155;">{!! $richBody !!}</div>
    @else
        <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:16px;font-size:14px;line-height:1.6;color:#334155;white-space:pre-line;">{{ $body }}</div>
    @endif
    @if ($button !== '' && $url !== '')
        @include('emails.partials.button', ['url' => $url, 'label' => $button])
    @endif
@endsection
