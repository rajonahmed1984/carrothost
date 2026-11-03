<?php

namespace App\Support;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

/** Ticket and chat files live on the private disk and are only served through an authorised route. */
class Attachments
{
    public const RULE = 'nullable|file|mimes:jpg,jpeg,png,gif,pdf|max:5120';

    /** @return array{attachment_path: ?string, attachment_name: ?string} */
    public static function store(Request $request, string $folder): array
    {
        $file = $request->file('attachment');

        if (! $file) {
            return ['attachment_path' => null, 'attachment_name' => null];
        }

        return [
            'attachment_path' => $file->store($folder, 'local'),
            'attachment_name' => mb_substr($file->getClientOriginalName(), 0, 191),
        ];
    }

    public static function download(?string $path, ?string $name): StreamedResponse
    {
        abort_unless($path && Storage::disk('local')->exists($path), 404);

        return Storage::disk('local')->response($path, $name, ['X-Content-Type-Options' => 'nosniff']);
    }
}
