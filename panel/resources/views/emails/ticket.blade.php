@extends('emails.layout', ['admin' => true])

@section('content')
    <h2 style="margin:0 0 16px;font-size:20px;color:#0f172a;">{{ $heading }}</h2>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:16px;font-size:14px;line-height:1.6;color:#334155;white-space:pre-line;">{{ $body }}</div>
    @include('emails.partials.button', ['url' => $url, 'label' => 'View ticket'])
@endsection
