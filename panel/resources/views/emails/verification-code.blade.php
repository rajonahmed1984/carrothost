{{-- Kept plain on purpose: a "Verification code:" label right before the digits, written as ordinary
     text, is what lets Gmail and phones offer a "Copy code" button. Do not split the digits up. --}}
@extends('emails.layout')

@section('content')
    <h2 style="margin:0 0 16px;font-size:20px;color:#0f172a;">{{ $heading }}</h2>
    @if ($name)
        <p style="margin:0 0 12px;">Dear <strong>{{ $name }}</strong>,</p>
    @endif
    <p style="margin:0 0 16px;">{{ $intro }}</p>
    <p style="margin:0 0 4px;font-weight:bold;">Verification code:</p>
    <p style="margin:0 0 16px;font-family:'Courier New', monospace;font-size:30px;font-weight:bold;letter-spacing:6px;color:#0f172a;">{{ $code }}</p>
    <p style="margin:0 0 16px;font-size:13px;color:#475569;">{{ $instructions }}</p>
    <p style="margin:0;padding-top:14px;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;">{{ $footer }}</p>
@endsection
