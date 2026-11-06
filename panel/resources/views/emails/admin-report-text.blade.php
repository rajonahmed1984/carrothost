{{ $heading }}
{{ $period }}
@foreach ($notes as $note)

! {{ $note }}
@endforeach
@foreach ($sections as $section)

== {{ $section['title'] }} ==
@if (count($section['rows']) === 0)
{{ $section['empty'] ?? 'Nothing to report.' }}
@else
@foreach ($section['rows'] as $row)
- {{ implode(' | ', $row) }}
@endforeach
@endif
@endforeach

Open Admin Panel: {{ $url }}
