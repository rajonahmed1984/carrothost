<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ChatMessage;
use App\Models\Client;
use App\Models\Invoice;
use App\Models\Ticket;
use App\Services\ChatService;
use App\Support\Attachments;
use Illuminate\Http\Request;

class ChatController extends Controller
{
    /** Conversations, newest activity first, with what staff have not read yet. */
    public function index(Request $request)
    {
        $latest = fn (string $column) => ChatMessage::select($column)->whereColumn('client_id', 'clients.id')->latest('id')->limit(1);

        return Client::query()
            ->whereHas('chatMessages')
            ->when($request->query('search'), fn ($q, $term) => $q->where(fn ($q) => $q->where('name', 'like', "%{$term}%")->orWhere('email', 'like', "%{$term}%")))
            ->select('id', 'name', 'email')
            ->addSelect(['last_message' => $latest('message'), 'last_message_at' => $latest('created_at')])
            ->withCount(['chatMessages as unread' => fn ($q) => $q->whereNull('user_id')->whereColumn('chat_messages.id', '>', 'clients.chat_staff_read_id')])
            ->orderByDesc('last_message_at')
            ->paginate(50);
    }

    public function show(Request $request, Client $client, ChatService $chat)
    {
        $items = $chat->messages($client, (int) $request->query('after_id'), (int) $request->query('before_id'));
        $chat->markRead($client, staff: true);

        return ['client' => $client->only('id', 'name', 'email'), 'items' => $items, 'seen_up_to' => $client->chat_read_id];
    }

    public function store(Request $request, Client $client, ChatService $chat)
    {
        $data = $request->validate([
            'message' => 'nullable|required_without:attachment|string|max:5000',
            'attachment' => Attachments::RULE,
        ]);

        return response()->json($chat->send($client, $request->user(), $data['message'] ?? null, Attachments::store($request, 'chat')), 201);
    }

    public function attachment(Client $client, ChatMessage $message)
    {
        abort_unless($message->client_id === $client->id, 404);

        return Attachments::download($message->attachment_path, $message->attachment_name);
    }

    /** Sidebar counts, polled. */
    public function badges(ChatService $chat)
    {
        return [
            'awaiting_tickets' => Ticket::whereIn('status', Ticket::AWAITING_REPLY)->count(),
            'unread_chat' => $chat->unreadForStaff(),
            // Same filters as the Unpaid and Overdue Invoices lists.
            'unpaid_invoices' => Invoice::where('status', 'unpaid')->count(),
            'overdue_invoices' => Invoice::where('status', 'unpaid')->whereDate('due_date', '<', today())->count(),
        ];
    }
}
