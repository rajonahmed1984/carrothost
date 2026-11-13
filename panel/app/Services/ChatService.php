<?php

namespace App\Services;

use App\Models\ChatMessage;
use App\Models\Client;
use App\Models\User;
use Illuminate\Support\Collection;

/** The support chat: one conversation per client, read by polling with after_id. */
class ChatService
{
    private const PAGE = 50;

    /** Newer than $afterId, or the latest page (or the page before $beforeId) when it is 0. */
    public function messages(Client $client, int $afterId = 0, int $beforeId = 0): Collection
    {
        $query = $client->chatMessages()->with('user:id,name');

        if ($afterId > 0) {
            return $query->where('id', '>', $afterId)->orderBy('id')->limit(self::PAGE)->get()->map(fn ($m) => $this->item($m, $client));
        }

        return $query->when($beforeId > 0, fn ($q) => $q->where('id', '<', $beforeId))
            ->orderByDesc('id')->limit(self::PAGE)->get()->reverse()->values()
            ->map(fn ($m) => $this->item($m, $client));
    }

    public function send(Client $client, ?User $staff, ?string $message, array $attachment = []): array
    {
        $staffReadId = (int) $client->chat_staff_read_id;
        $chat = $client->chatMessages()->create(['user_id' => $staff?->id, 'message' => $message, ...$attachment]);
        if (! $staff) {
            app(AdminNotifier::class)->chat($chat->setRelation('client', $client), $staffReadId);
        }

        // Sending means the sender has seen everything before it.
        $client->forceFill($staff ? ['chat_staff_read_id' => $chat->id] : ['chat_read_id' => $chat->id])->save();

        return $this->item($chat->setRelation('user', $staff), $client);
    }

    /** Read markers only move forward, so an old poll cannot unread newer messages. */
    public function markRead(Client $client, bool $staff): void
    {
        $column = $staff ? 'chat_staff_read_id' : 'chat_read_id';
        $latest = (int) $client->chatMessages()->max('id');

        if ($latest > $client->{$column}) {
            $client->forceFill([$column => $latest])->save();
        }
    }

    public function unreadForClient(Client $client): int
    {
        return $client->chatMessages()->whereNotNull('user_id')->where('id', '>', $client->chat_read_id)->count();
    }

    public function unreadForStaff(): int
    {
        return ChatMessage::whereNull('user_id')
            ->whereHas('client', fn ($q) => $q->whereColumn('chat_messages.id', '>', 'clients.chat_staff_read_id'))
            ->count();
    }

    private function item(ChatMessage $message, Client $client): array
    {
        return [
            'id' => $message->id,
            'message' => $message->message,
            'staff' => $message->user_id !== null,
            'author' => $message->user_id ? ($message->user?->name ?? 'Support team') : $client->name,
            'attachment_name' => $message->attachment_name,
            'created_at' => $message->created_at,
        ];
    }
}
