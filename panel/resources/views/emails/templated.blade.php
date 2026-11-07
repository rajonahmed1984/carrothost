@extends('emails.layout')

@section('content')
    <div style="font-size:14px;line-height:1.6;color:#334155;">{!! $html !!}</div>
    @if (! empty($buttonUrl))
        @include('emails.partials.button', ['url' => $buttonUrl, 'label' => $buttonLabel])
    @endif
@endsection
