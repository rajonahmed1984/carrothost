<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\CustomerNotice;
use App\Models\ActivityLog;
use App\Models\EmailTemplate;
use App\Support\EmailHtml;
use App\Support\EmailTemplates;
use App\Support\MailFrom;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
use Throwable;

/** Admin > Settings > Email > Email Templates: every email a customer receives, grouped as in WHMCS. */
class EmailTemplateController extends Controller
{
    public function index()
    {
        $templates = collect(EmailTemplates::definitions())->map(fn (array $d, string $key) => [
            'key' => $key,
            'name' => $d['name'],
            'description' => $d['description'],
            'group' => $d['group'],
            'locked' => (bool) ($d['locked'] ?? false),
            ...collect(EmailTemplates::current($key))->only('subject', 'is_active', 'customized')->all(),
        ]);

        return [
            'groups' => collect(EmailTemplates::GROUPS)->map(fn (string $name, string $group) => [
                'key' => $group,
                'name' => $name,
                'templates' => $templates->where('group', $group)->values(),
            ])->values(),
        ];
    }

    public function show(string $key)
    {
        $definition = $this->definition($key);

        return [
            'key' => $key,
            ...collect($definition)->only('name', 'description', 'group')->all(),
            'locked' => (bool) ($definition['locked'] ?? false),
            ...EmailTemplates::current($key),
            'fields' => [...$definition['fields'], ...EmailTemplates::COMMON_FIELDS],
            'required' => $definition['required'] ?? [],
            'default' => ['subject' => $definition['subject'], 'body' => $definition['body']],
        ];
    }

    public function update(Request $request, string $key)
    {
        $definition = $this->definition($key);
        $data = $request->validate([
            'subject' => 'required|string|max:255',
            'body' => 'required|string|max:'.EmailHtml::MAX_LENGTH,
            'is_active' => 'sometimes|boolean',
        ]);
        $body = self::clean($data['body']);

        foreach ($definition['required'] ?? [] as $field) {
            if (! str_contains($body, '{$'.$field.'}')) {
                throw ValidationException::withMessages(['body' => "This email must include {\${$field}}."]);
            }
        }

        // Unchanged parts are stored blank, so they follow the default if it is improved later.
        $subject = trim($data['subject']);
        EmailTemplate::updateOrCreate(['key' => $key], [
            'subject' => $subject === $definition['subject'] ? null : $subject,
            'body' => $body === self::clean($definition['body']) ? null : $body,
            'is_active' => ($definition['locked'] ?? false) ? true : (bool) ($data['is_active'] ?? EmailTemplates::current($key)['is_active']),
        ]);
        EmailTemplates::forget();
        ActivityLog::record('email_template.updated', context: ['template' => $key]);

        return $this->show($key);
    }

    /** Turns a template on or off from the list. */
    public function toggle(Request $request, string $key)
    {
        $definition = $this->definition($key);
        if ($definition['locked'] ?? false) {
            throw ValidationException::withMessages(['is_active' => 'Sign-in and password emails are always sent.']);
        }

        $on = (bool) $request->validate(['is_active' => 'required|boolean'])['is_active'];
        $template = EmailTemplate::firstOrNew(['key' => $key]);
        $template->forceFill(['is_active' => $on])->save();
        EmailTemplates::forget();
        ActivityLog::record($on ? 'email_template.enabled' : 'email_template.disabled', context: ['template' => $key]);

        return $this->index();
    }

    /** Back to the built-in subject and body. On/off stays as it is. */
    public function destroy(string $key)
    {
        $this->definition($key);
        EmailTemplate::whereKey($key)->update(['subject' => null, 'body' => null]);
        EmailTemplates::forget();
        ActivityLog::record('email_template.reset', context: ['template' => $key]);

        return $this->show($key);
    }

    /** The unsaved subject and body filled with sample values. */
    public function preview(Request $request, string $key)
    {
        $this->definition($key);
        $data = $request->validate(['subject' => 'required|string|max:255', 'body' => 'required|string|max:'.EmailHtml::MAX_LENGTH]);

        return EmailTemplates::fill($data['subject'], self::clean($data['body']), EmailTemplates::sampleValues());
    }

    /** Sends the sample preview to an address, to see it in a real inbox. */
    public function test(Request $request, string $key)
    {
        $this->definition($key);
        $data = $request->validate(['email' => 'required|email', 'subject' => 'required|string|max:255', 'body' => 'required|string|max:'.EmailHtml::MAX_LENGTH]);
        $mail = EmailTemplates::fill('[Test] '.$data['subject'], self::clean($data['body']), EmailTemplates::sampleValues());

        try {
            Mail::to($data['email'])->send(new CustomerNotice(
                sender: MailFrom::SUPPORT, subjectLine: $mail['subject'], heading: '', body: $mail['text'],
                url: url('/'), button: 'Open client area', richBody: $mail['html'],
            ));
        } catch (Throwable $e) {
            return response()->json(['message' => 'Sending failed: '.$e->getMessage()], 422);
        }

        return ['message' => "Test email sent to {$data['email']} with sample values."];
    }

    private function definition(string $key): array
    {
        return EmailTemplates::definitions()[$key] ?? abort(404);
    }

    /**
     * Sanitized HTML that keeps merge fields working inside links and images: the sanitizer drops an
     * href it cannot read as a URL, so each {$field} stands in as one while it runs.
     */
    private static function clean(string $html): string
    {
        $marked = preg_replace('/\{\$([a-z_]+)\}/', 'https://merge-field.invalid/$1', $html);

        return trim(preg_replace('#https://merge-field\.invalid/([a-z_]+)#', '{\$$1}', EmailHtml::clean($marked)));
    }
}
