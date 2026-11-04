Dear {{ $name }},

{{ $hasPassword ? 'We received a request to reset the password you use to sign in to CarrotHost.' : 'You have been given access to a CarrotHost client account. Choose a password to sign in.' }}

{{ $hasPassword ? 'Reset your password' : 'Set your password' }}: {{ $url }}

This link expires in {{ $minutes }} minutes. If you did not ask for this, you can ignore this email.
