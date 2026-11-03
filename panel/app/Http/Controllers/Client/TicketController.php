<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Ticket;
use App\Models\TicketReply;
use App\Services\TicketService;
use App\Support\Attachments;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** The customer's own tickets. Staff names are shown, never their emails. */
class TicketController extends Controller
{
    public function index(Request $request)
    {
        $client = $request->user('client');

        return [
            'tickets' => $client->tickets()
                ->latest('last_reply_at')
                ->get(['id', 'number', 'department', 'subject', 'priority', 'status', 'last_reply_at', 'created_at']),
            'departments' => collect(config('billing.ticket_departments'))->map(fn ($name, $code) => ['code' => $code, 'name' => $name])->values(),
            'services' => $client->services()->with('product:id,name')->latest()->get(['id', 'product_id', 'domain']),
        ];
    }

    public function store(Request $request, TicketService $tickets)
    {
        $client = $request->user('client');
        $data = $request->validate([
            'department' => ['required', Rule::in(array_keys(config('billing.ticket_departments')))],
            'subject' => 'required|string|max:255',
            'priority' => 'required|in:low,medium,high',
            'service_id' => ['nullable', Rule::exists('services', 'id')->where('client_id', $client->id)],
            'message' => 'required|string|max:20000',
            'attachment' => Attachments::RULE,
        ]);
        unset($data['attachment']);

        return response()->json(['id' => $tickets->open($client, $data, Attachments::store($request, 'tickets'))->id], 201);
    }

    public function show(Request $request, int $id)
    {
        return $this->present($request->user('client')->tickets()->findOrFail($id));
    }

    public function reply(Request $request, int $id, TicketService $tickets)
    {
        $ticket = $request->user('client')->tickets()->findOrFail($id);
        $data = $request->validate(['message' => 'required|string|max:20000', 'attachment' => Attachments::RULE]);

        return $this->present($tickets->reply($ticket, $data['message'], attachment: Attachments::store($request, 'tickets')));
    }

    public function attachment(Request $request, int $id, int $reply)
    {
        $reply = $request->user('client')->tickets()->findOrFail($id)->replies()->findOrFail($reply);

        return Attachments::download($reply->attachment_path, $reply->attachment_name);
    }

    public function close(Request $request, int $id)
    {
        $ticket = $request->user('client')->tickets()->findOrFail($id);
        $ticket->update(['status' => 'closed']);
        ActivityLog::record('ticket.closed', $ticket, ['by' => 'client']);

        return $this->present($ticket);
    }

    private function present(Ticket $ticket): array
    {
        $ticket->load(['service.product:id,name', 'replies.user:id,name']);

        return [
            ...$ticket->only('id', 'number', 'department', 'subject', 'priority', 'status', 'last_reply_at', 'created_at'),
            'department_name' => config("billing.ticket_departments.{$ticket->department}", $ticket->department),
            'service' => $ticket->service ? ['id' => $ticket->service->id, 'name' => $ticket->service->product?->name, 'domain' => $ticket->service->domain] : null,
            'replies' => $ticket->replies->map(fn (TicketReply $reply) => [
                'id' => $reply->id,
                'message' => $reply->message,
                'staff' => $reply->user_id !== null,
                'attachment_name' => $reply->attachment_name,
                'author' => $reply->user?->name ?? ($reply->user_id ? 'Support team' : $ticket->client->name),
                'created_at' => $reply->created_at,
            ]),
        ];
    }
}
