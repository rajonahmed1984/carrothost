<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use LogicException;
use Throwable;

/**
 * The audit trail. Rows are written once and never changed: each is chained to the one before it
 * by an HMAC, and copied to the "audit" log file, so a row edited or removed in the database is
 * caught by `php artisan audit:verify`.
 */
class ActivityLog extends Model
{
    public const UPDATED_AT = null;

    protected $guarded = ['id'];

    protected $hidden = ['prev_hash', 'hash'];

    protected static function booted(): void
    {
        static::updating(fn () => throw new LogicException('Audit log entries cannot be changed.'));
        static::deleting(fn () => throw new LogicException('Audit log entries cannot be deleted.'));
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    protected function casts(): array
    {
        return ['context' => 'array'];
    }

    public static function record(string $action, ?Model $subject = null, array $context = []): self
    {
        $request = app()->runningInConsole() && ! app()->runningUnitTests() ? null : request();
        $fields = [
            'user_id' => auth('web')->id(),
            'action' => $action,
            'subject_type' => $subject?->getMorphClass(),
            'subject_id' => $subject?->getKey(),
            'context' => $context ?: null,
            'ip' => $request?->ip(),
            'user_agent' => $request ? mb_substr((string) $request->userAgent(), 0, 255) ?: null : null,
        ];

        // Locked so two requests at once cannot both chain onto the same row.
        $log = DB::transaction(function () use ($fields) {
            $prev = self::query()->whereNotNull('hash')->latest('id')->lockForUpdate()->value('hash');
            $row = new self([...$fields, 'prev_hash' => $prev]);
            $row->created_at = now();
            $row->hash = $row->computeHash();
            $row->save();

            return $row;
        });

        try {
            Log::channel('audit')->info($action, [...$fields, 'id' => $log->id, 'hash' => $log->hash]);
        } catch (Throwable) {
            // The database row is the record; a full disk must not stop the action itself.
        }

        return $log;
    }

    /** HMAC of the row's fields and the hash before it, keyed by the app key. */
    public function computeHash(): string
    {
        $context = $this->getAttributes()['context'] ?? null;
        $payload = json_encode([
            $this->prev_hash, $this->user_id, $this->action, $this->subject_type,
            $this->subject_id === null ? null : (string) $this->subject_id,
            is_string($context) ? json_decode($context, true) : $context,
            $this->ip, $this->user_agent, $this->created_at?->toIso8601String(),
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        return hash_hmac('sha256', $payload, (string) config('app.key'));
    }
}
