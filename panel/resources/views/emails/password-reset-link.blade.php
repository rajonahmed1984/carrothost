@extends('emails.layout')

@section('content')
    <h2 style="margin:0 0 16px;font-size:20px;color:#0f172a;">{{ $hasPassword ? 'Reset your password' : 'Set your password' }}</h2>
    <p style="margin:0 0 12px;">Dear <strong>{{ $name }}</strong>,</p>
    <p style="margin:0 0 4px;">{{ $hasPassword ? 'We received a request to reset the password you use to sign in to '.config('app.name').'.' : 'You have been given access to a '.config('app.name').' client account. Choose a password to sign in.' }}</p>
    @include('emails.partials.button', ['url' => $url, 'label' => $hasPassword ? 'Reset Password' : 'Set Password'])
    <p style="margin:16px 0 0;font-size:13px;color:#475569;">This link expires in {{ $minutes }} minutes.</p>
    <p style="margin:16px 0 0;padding-top:14px;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;">If you did not ask for this, you can ignore this email. Your password stays the same.</p>
@endsection
