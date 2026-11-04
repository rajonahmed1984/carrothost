<div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; color: #0f172a; font-size: 15px; line-height: 1.6;">
    <h2 style="margin: 0 0 16px; font-size: 20px;">{{ $hasPassword ? 'Reset your password' : 'Set your password' }}</h2>
    <p style="margin: 0 0 12px;">Dear <strong>{{ $name }}</strong>,</p>
    <p style="margin: 0 0 20px;">{{ $hasPassword ? 'We received a request to reset the password you use to sign in to CarrotHost.' : 'You have been given access to a CarrotHost client account. Choose a password to sign in.' }}</p>
    <p style="margin: 0 0 20px;"><a href="{{ $url }}" style="display: inline-block; background: #c2410c; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 8px; font-size: 14px; font-weight: bold;">{{ $hasPassword ? 'Reset Password' : 'Set Password' }}</a></p>
    <p style="margin: 0 0 16px; font-size: 13px; color: #475569;">This link expires in {{ $minutes }} minutes. If the button does not work, open this address: {{ $url }}</p>
    <p style="margin: 0; padding-top: 14px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">If you did not ask for this, you can ignore this email. Your password stays the same.</p>
</div>
