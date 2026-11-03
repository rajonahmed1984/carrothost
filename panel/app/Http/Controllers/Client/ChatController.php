<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Services\ChatService;
use App\Support\Attachments;
use Illuminate\Http\Request;

class ChatController extends Controller
{
    public function index(Request $request, ChatService $chat)
    {
        $client = $request->user('client');
        $items = $chat->messages($client, (int) $request->query('after_id'), (int) $request->query('before_id'));
        $chat->markRead($client, staff: false);

        return ['items' => $items, 'seen_up_to' => $client->chat_staff_read_id];
    }

    public function store(Request $request, ChatService $chat)
    {
        $data = $request->validate([
            'message' => 'nullable|required_without:attachment|string|max:5000',
            'attachment' => Attachments::RULE,
        ]);

        return response()->json($chat->send($request->user('client'), null, $data['message'] ?? null, Attachments::store($request, 'chat')), 201);
    }

    public function attachment(Request $request, int $message)
    {
        $message = $request->user('client')->chatMessages()->findOrFail($message);

        return Attachments::download($message->attachment_path, $message->attachment_name);
    }

    /** Sidebar counts, polled. */
    public function badges(Request $request, ChatService $chat)
    {
        $client = $request->user('client');

        return [
            'unread_chat' => $chat->unreadForClient($client),
            'answered_tickets' => $client->tickets()->where('status', 'answered')->count(),
        ];
    }
}
