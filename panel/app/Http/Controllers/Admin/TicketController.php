<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Ticket;
use App\Models\TicketReply;
use App\Services\TicketService;
use App\Support\Attachments;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TicketController extends Controller
{
    private const STATUSES = ['open', 'answered', 'customer_reply', 'on_hold', 'closed'];

    public function index(Request $request)
    {
        $status = $request->query('status');

        return Ticket::with('client:id,name')
            ->when($status === 'awaiting', fn ($q) => $q->whereIn('status', Ticket::AWAITING_REPLY))
            ->when($status && $status !== 'awaiting', fn ($q) => $q->where('status', $status))
            ->when($request->query('client_id'), fn ($q, $id) => $q->where('client_id', $id))
            ->latest('last_reply_at')
            ->paginate(25);
    }

    public function show(Ticket $ticket)
    {
        return $this->present($ticket);
    }

    public function reply(Request $request, Ticket $ticket, TicketService $tickets)
    {
        $data = $request->validate([
            'message' => 'required|string|max:20000',
            'status' => ['nullable', Rule::in(self::STATUSES)],
            'attachment' => Attachments::RULE,
        ]);

        return $this->present($tickets->reply($ticket, $data['message'], $request->user(), $data['status'] ?? null, Attachments::store($request, 'tickets')));
    }

    public function attachment(Ticket $ticket, TicketReply $reply)
    {
        abort_unless($reply->ticket_id === $ticket->id, 404);

        return Attachments::download($reply->attachment_path, $reply->attachment_name);
    }

    public function update(Request $request, Ticket $ticket)
    {
        $data = $request->validate([
            'status' => ['sometimes', Rule::in(self::STATUSES)],
            'priority' => 'sometimes|in:low,medium,high',
            'department' => ['sometimes', Rule::in(array_keys(config('billing.ticket_departments')))],
        ]);

        $ticket->update($data);
        ActivityLog::record('ticket.updated', $ticket, $data);

        return $this->present($ticket);
    }

    private function present(Ticket $ticket): array
    {
        return [
            ...$ticket->load(['client:id,name,email', 'service.product:id,name', 'replies.user:id,name'])->toArray(),
            'departments' => collect(config('billing.ticket_departments'))->map(fn ($name, $code) => ['code' => $code, 'name' => $name])->values(),
        ];
    }
}
