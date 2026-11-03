import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Clock, CreditCard, Eye, FileText, MessageSquare, Paperclip, Plus, Reply, Search, Send, Server, ShoppingBag, X } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api, basePath } from '../api';
import { Button, Card, ErrorNote, Field, Input, PagedTable, QueryState, Select, Status, Table, useBranding } from '../ui';

const fileUrl = (path: string) => `${basePath}/api${path}`;
const isImage = (name: string) => /\.(png|jpe?g|gif)$/i.test(name);
const when = (value: string | null) => (value ? new Date(value).toLocaleString() : '-');
const ACCEPT = '.jpg,.jpeg,.png,.gif,.pdf';

function form(fields: Record<string, string | null | undefined>, file: File | null): FormData {
    const data = new FormData();
    Object.entries(fields).forEach(([key, value]) => value != null && value !== '' && data.append(key, value));
    if (file) data.append('attachment', file);

    return data;
}

function AttachmentLink({ name, href }: { name: string; href: string }) {
    return isImage(name) ? (
        <a href={href} target="_blank" rel="noreferrer" className="mt-2 block w-fit"><img src={href} alt={name} className="max-h-48 rounded-lg border border-slate-200" /></a>
    ) : (
        <a href={href} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"><Paperclip size={12} /> {name}</a>
    );
}

function FilePicker({ file, onChange }: { file: File | null; onChange: (file: File | null) => void }) {
    const input = useRef<HTMLInputElement>(null);

    return (
        <div className="flex min-w-0 items-center gap-2">
            <input ref={input} type="file" accept={ACCEPT} className="hidden" onChange={(e) => { onChange(e.target.files?.[0] ?? null); e.target.value = ''; }} />
            {file ? (
                <span className="inline-flex min-w-0 items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
                    <Paperclip size={12} className="shrink-0" /> <span className="truncate">{file.name}</span>
                    <button type="button" aria-label="Remove attachment" className="cursor-pointer text-slate-500 hover:text-slate-900" onClick={() => onChange(null)}><X size={12} /></button>
                </span>
            ) : (
                <Button type="button" variant="ghost" onClick={() => input.current?.click()}><Paperclip size={14} /> Attach file</Button>
            )}
        </div>
    );
}

// ---- Tickets -------------------------------------------------------------

type Reply = { id: number; message: string; staff: boolean; author: string; attachment_name: string | null; created_at: string };

function Thread({ replies, attachment }: { replies: Reply[]; attachment: (id: number) => string }) {
    return (
        <div className="space-y-3">
            {replies.map((r) => (
                <article key={r.id} className={`card overflow-hidden ${r.staff ? 'border-l-4 border-l-[var(--accent)]' : ''}`}>
                    <header className={`flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-2 ${r.staff ? 'bg-[var(--accent-soft)]' : 'bg-slate-50'}`}>
                        <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                            {r.author}
                            {r.staff && <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-white uppercase">Staff</span>}
                        </span>
                        <time className="text-xs text-slate-500">{when(r.created_at)}</time>
                    </header>
                    <div className="px-4 py-3 text-sm break-words whitespace-pre-line text-slate-700">
                        {r.message}
                        {r.attachment_name && <div><AttachmentLink name={r.attachment_name} href={fileUrl(attachment(r.id))} /></div>}
                    </div>
                </article>
            ))}
        </div>
    );
}

function ReplyBox({ onSend, children, note }: { onSend: (message: string, file: File | null) => Promise<unknown>; children?: ReactNode; note?: string }) {
    const [message, setMessage] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const send = useMutation({
        mutationFn: () => onSend(message, file),
        onSuccess: () => { setMessage(''); setFile(null); },
    });

    return (
        <Card title="Reply">
            <form onSubmit={(e) => { e.preventDefault(); send.mutate(); }} className="space-y-3 p-4">
                {note && <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">{note}</p>}
                <textarea required rows={5} className="ui-input py-2" style={{ height: 'auto' }} value={message} onChange={(e) => setMessage(e.target.value)} />
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <FilePicker file={file} onChange={setFile} />
                    <div className="flex flex-wrap items-center gap-2">
                        {children}
                        <Button disabled={send.isPending}><Send size={14} /> {send.isPending ? 'Sending...' : 'Send reply'}</Button>
                    </div>
                </div>
                <p className="text-[11px] text-slate-500">JPG, PNG, GIF or PDF up to 5 MB.</p>
                <ErrorNote error={send.error} />
            </form>
        </Card>
    );
}

function Facts({ rows }: { rows: [string, ReactNode][] }) {
    return (
        <dl className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
            {rows.map(([label, value]) => (
                <div key={label}>
                    <dt className="text-[10px] font-semibold text-slate-400 uppercase">{label}</dt>
                    <dd className="mt-0.5 text-sm break-words text-slate-800">{value ?? '-'}</dd>
                </div>
            ))}
        </dl>
    );
}

const priorities = ['low', 'medium', 'high'];
const statusOptions: [string, string][] = [['open', 'Open'], ['answered', 'Answered'], ['customer_reply', 'Customer Reply'], ['on_hold', 'On Hold'], ['closed', 'Closed']];

type TicketRow = { id: number; number: string; subject: string; department: string; priority: string; status: string; last_reply_at: string | null; client?: { id: number; name: string } };

const useDepartments = () => useQuery({ queryKey: ['meta'], queryFn: async () => (await api.get<{ ticket_departments: Record<string, string> }>('/meta')).data, staleTime: Infinity, select: (m) => m.ticket_departments });

export function TicketsPage() {
    const [params] = useSearchParams();
    const clientId = params.get('client');
    const [status, setStatus] = useState(clientId ? '' : 'awaiting');
    const departments = useDepartments();

    return (
        <PagedTable<TicketRow>
            url="/tickets"
            noun="tickets"
            params={{ ...(status ? { status } : {}), ...(clientId ? { client_id: clientId } : {}) }}
            tabs={{ value: status, onChange: setStatus, options: [{ key: 'awaiting', label: 'Awaiting Reply' }, { key: '', label: 'All' }, ...statusOptions.map(([key, label]) => ({ key, label }))] }}
            empty="No tickets here."
            columns={[
                { header: 'Ticket', cell: (t) => <Link className="table-action-link font-semibold" to={`/admin/tickets/${t.id}`}>#{t.number} - {t.subject}</Link> },
                { header: 'Client', cell: (t) => t.client && <Link className="table-action-link" to={`/admin/clients/${t.client.id}`}>{t.client.name}</Link> },
                { header: 'Department', cell: (t) => departments.data?.[t.department] ?? t.department },
                { header: 'Priority', cell: (t) => <Status value={t.priority} /> },
                { header: 'Status', cell: (t) => <Status value={t.status} /> },
                { header: 'Last reply', cell: (t) => when(t.last_reply_at) },
            ]}
        />
    );
}

type AdminTicket = TicketRow & {
    created_at: string;
    client: { id: number; name: string; email: string };
    service: { id: number; domain: string | null; product: { name: string } | null } | null;
    replies: { id: number; message: string; user_id: number | null; user: { name: string } | null; attachment_name: string | null; created_at: string }[];
    departments: { code: string; name: string }[];
};

export function TicketDetailPage() {
    const { id } = useParams();
    const qc = useQueryClient();
    const key = ['ticket', id];
    const query = useQuery({ queryKey: key, queryFn: async () => (await api.get<AdminTicket>(`/tickets/${id}`)).data });
    const [after, setAfter] = useState('answered');
    const saved = (t: AdminTicket) => { qc.setQueryData(key, t); qc.invalidateQueries({ queryKey: ['badges'] }); };
    const update = useMutation({ mutationFn: async (body: Record<string, string>) => (await api.put<AdminTicket>(`/tickets/${id}`, body)).data, onSuccess: saved });
    const t = query.data;

    return (
        <QueryState query={query}>
            {t && (
                <div className="space-y-4">
                    <Card title={`#${t.number} - ${t.subject}`} action={<Status value={t.status} />}>
                        <Facts rows={[
                            ['Client', <Link key="c" className="table-action-link" to={`/admin/clients/${t.client.id}`}>{t.client.name}</Link>],
                            ['Email', t.client.email],
                            ['Related service', t.service ? <Link key="s" className="table-action-link" to={`/admin/products-services/${t.service.id}`}>{t.service.product?.name}{t.service.domain ? ` - ${t.service.domain}` : ''}</Link> : 'None'],
                            ['Opened', when(t.created_at)],
                        ]} />
                        <div className="grid gap-3 border-t border-slate-200 p-4 sm:grid-cols-3">
                            <Field label="Status">
                                <Select value={t.status} disabled={update.isPending} onChange={(e) => update.mutate({ status: e.target.value })}>
                                    {statusOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                </Select>
                            </Field>
                            <Field label="Priority">
                                <Select value={t.priority} disabled={update.isPending} onChange={(e) => update.mutate({ priority: e.target.value })}>
                                    {priorities.map((p) => <option key={p} value={p}>{p}</option>)}
                                </Select>
                            </Field>
                            <Field label="Department">
                                <Select value={t.department} disabled={update.isPending} onChange={(e) => update.mutate({ department: e.target.value })}>
                                    {t.departments.map((d) => <option key={d.code} value={d.code}>{d.name}</option>)}
                                </Select>
                            </Field>
                        </div>
                        <div className="px-4 pb-4"><ErrorNote error={update.error} /></div>
                    </Card>
                    <Thread
                        replies={t.replies.map((r) => ({ id: r.id, message: r.message, staff: r.user_id !== null, author: r.user?.name ?? (r.user_id ? 'Staff' : t.client.name), attachment_name: r.attachment_name, created_at: r.created_at }))}
                        attachment={(reply) => `/tickets/${t.id}/replies/${reply}/attachment`}
                    />
                    <ReplyBox onSend={async (message, file) => saved((await api.post<AdminTicket>(`/tickets/${t.id}/replies`, form({ message, status: after }, file))).data)}>
                        <label className="flex items-center gap-2 text-xs text-slate-600">
                            Then set
                            <select className="ui-input w-auto" value={after} onChange={(e) => setAfter(e.target.value)}>
                                {statusOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                            </select>
                        </label>
                    </ReplyBox>
                </div>
            )}
        </QueryState>
    );
}

type ClientTickets = {
    tickets: TicketRow[];
    departments: { code: string; name: string }[];
    services: { id: number; domain: string | null; product: { name: string } }[];
};

const useClientTickets = () => useQuery({ queryKey: ['client-tickets'], queryFn: async () => (await api.get<ClientTickets>('/client/tickets')).data });

type ClientTicketRow = TicketRow & { created_at: string };

const ticketStatusPill: Record<string, string> = {
    open: 'border-amber-200 bg-amber-50 text-amber-800',
    answered: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    customer_reply: 'border-sky-200 bg-sky-50 text-sky-700',
    on_hold: 'border-violet-200 bg-violet-50 text-violet-700',
    closed: 'border-slate-200 bg-slate-100 text-slate-700',
};
const ticketStatusLabel: Record<string, string> = { open: 'Open', answered: 'Answered', customer_reply: 'In Progress', on_hold: 'On Hold', closed: 'Closed' };
const priorityPill: Record<string, string> = {
    high: 'border-rose-200 bg-rose-50 text-rose-700',
    medium: 'border-amber-200 bg-amber-50 text-amber-800',
    low: 'border-slate-200 bg-slate-50 text-slate-600',
};
const departmentIcon: Record<string, { icon: ReactNode; tone: string }> = {
    support: { icon: <Server size={16} />, tone: 'bg-indigo-50 text-indigo-600' },
    billing: { icon: <CreditCard size={16} />, tone: 'bg-emerald-50 text-emerald-600' },
    sales: { icon: <ShoppingBag size={16} />, tone: 'bg-orange-50 text-orange-600' },
};
const fullDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const clock = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

function TicketStat({ icon, tone, valueTone, label, value, note }: { icon: ReactNode; tone: string; valueTone: string; label: string; value: number; note: string }) {
    return (
        <section className="card flex items-center gap-4 p-5">
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${tone}`}>{icon}</span>
            <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-800">{label}</div>
                <div className={`text-2xl font-bold tabular-nums ${valueTone}`}>{value}</div>
                <div className="text-xs text-slate-500">{note}</div>
            </div>
        </section>
    );
}

export function ClientTicketsPage() {
    const query = useClientTickets();
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [department, setDepartment] = useState('');
    const [sort, setSort] = useState('latest');
    const [page, setPage] = useState(1);
    const perPage = 10;
    const departments = Object.fromEntries(query.data?.departments.map((d) => [d.code, d.name]) ?? []);
    const all = (query.data?.tickets ?? []) as ClientTicketRow[];
    const updated = (t: ClientTicketRow) => t.last_reply_at ?? t.created_at;
    const rank = { high: 0, medium: 1, low: 2 } as Record<string, number>;
    const rows = all
        .filter((t) => !status || (status === 'active' ? t.status !== 'closed' : t.status === status))
        .filter((t) => !department || t.department === department)
        .filter((t) => !search || `${t.number} ${t.subject}`.toLowerCase().includes(search.toLowerCase().replace('#', '').trim()))
        .sort((a, b) => sort === 'oldest' ? updated(a).localeCompare(updated(b)) : sort === 'priority' ? (rank[a.priority] ?? 3) - (rank[b.priority] ?? 3) || updated(b).localeCompare(updated(a)) : updated(b).localeCompare(updated(a)));
    const pages = Math.max(1, Math.ceil(rows.length / perPage));
    const current = Math.min(page, pages);
    const shown = rows.slice((current - 1) * perPage, current * perPage);
    const count = (...statuses: string[]) => all.filter((t) => statuses.includes(t.status)).length;
    const reset = <T,>(set: (v: T) => void) => (v: T) => { set(v); setPage(1); };

    return (
        <div className="space-y-5">
            <QueryState query={query}>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <TicketStat icon={<MessageSquare size={22} />} tone="bg-emerald-100 text-emerald-700" valueTone="text-emerald-700" label="Pending Tickets" value={count('open')} note="Open tickets" />
                    <TicketStat icon={<Clock size={22} />} tone="bg-sky-100 text-sky-700" valueTone="text-sky-700" label="In Progress Tickets" value={count('customer_reply', 'on_hold')} note="Being processed" />
                    <TicketStat icon={<Reply size={22} />} tone="bg-orange-100 text-orange-600" valueTone="text-orange-600" label="Answered Tickets" value={count('answered')} note="Awaiting your response" />
                    <TicketStat icon={<FileText size={22} />} tone="bg-violet-100 text-violet-700" valueTone="text-violet-700" label="All Tickets" value={all.length} note="All times" />
                </div>

                <section className="card overflow-hidden">
                    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 p-5">
                        <div className="flex flex-wrap items-end gap-3">
                            <div className="relative w-60">
                                <Search size={15} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
                                <input type="search" aria-label="Search tickets" className="ui-input pl-9" placeholder="Search tickets..." value={search} onChange={(e) => reset(setSearch)(e.target.value)} />
                            </div>
                            <label className="w-40 text-xs font-medium text-slate-600">Status
                                <Select value={status} onChange={(e) => reset(setStatus)(e.target.value)}>
                                    <option value="">All Status</option>
                                    <option value="active">All except closed</option>
                                    {Object.entries(ticketStatusLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                </Select>
                            </label>
                            <label className="w-44 text-xs font-medium text-slate-600">Department
                                <Select value={department} onChange={(e) => reset(setDepartment)(e.target.value)}>
                                    <option value="">All Departments</option>
                                    {query.data?.departments.map((d) => <option key={d.code} value={d.code}>{d.name}</option>)}
                                </Select>
                            </label>
                            <label className="w-40 text-xs font-medium text-slate-600">Sort By
                                <Select value={sort} onChange={(e) => setSort(e.target.value)}>
                                    <option value="latest">Latest First</option>
                                    <option value="oldest">Oldest First</option>
                                    <option value="priority">Priority</option>
                                </Select>
                            </label>
                        </div>
                        <Link to="/tickets/new" className="ui-btn ui-btn-primary"><Plus size={14} /> Open Ticket</Link>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[56rem] text-left text-sm">
                            <thead className="border-b border-slate-200 text-xs text-slate-700">
                                <tr>{['Ticket ID', 'Subject', 'Department', 'Status', 'Priority', 'Last Updated', 'Actions'].map((h) => <th key={h} className={`px-5 py-3 font-semibold ${h === 'Actions' ? 'text-center' : ''}`}>{h}</th>)}</tr>
                            </thead>
                            <tbody>
                                {shown.length === 0 && (
                                    <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-500">
                                        {all.length ? 'No tickets match these filters.' : 'You have no support tickets. Open one if you need help with a service or a bill.'}
                                    </td></tr>
                                )}
                                {shown.map((t) => {
                                    const dept = departmentIcon[t.department] ?? { icon: <MessageSquare size={16} />, tone: 'bg-slate-100 text-slate-600' };

                                    return (
                                        <tr key={t.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70">
                                            <td className="px-5 py-3.5">
                                                <Link to={`/admin/tickets/${t.id}`} className="font-semibold text-slate-900 hover:text-accent">#{t.number}</Link>
                                                <div className="text-xs text-slate-500">Created: {fullDate(t.created_at)}</div>
                                            </td>
                                            <td className="max-w-72 px-5 py-3.5 text-slate-800"><Link to={`/admin/tickets/${t.id}`} className="line-clamp-2 hover:text-accent">{t.subject}</Link></td>
                                            <td className="px-5 py-3.5">
                                                <span className="flex items-center gap-3"><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${dept.tone}`}>{dept.icon}</span>{departments[t.department] ?? t.department}</span>
                                            </td>
                                            <td className="px-5 py-3.5"><span className={`inline-block rounded-md border px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${ticketStatusPill[t.status] ?? ticketStatusPill.closed}`}>{ticketStatusLabel[t.status] ?? t.status}</span></td>
                                            <td className="px-5 py-3.5"><span className={`inline-block rounded-md border px-2.5 py-1 text-xs font-semibold capitalize ${priorityPill[t.priority] ?? priorityPill.low}`}>{t.priority}</span></td>
                                            <td className="px-5 py-3.5 whitespace-nowrap"><div className="text-slate-800">{fullDate(updated(t))}</div><div className="text-xs text-slate-500">{clock(updated(t))}</div></td>
                                            <td className="px-5 py-3.5 text-center">
                                                <Link to={`/admin/tickets/${t.id}`} aria-label={`View ticket #${t.number}`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:border-[var(--accent)] hover:text-accent"><Eye size={16} /></Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-4 text-sm text-slate-600">
                        <span>Showing {rows.length ? (current - 1) * perPage + 1 : 0} to {Math.min(current * perPage, rows.length)} of {rows.length} tickets</span>
                        {pages > 1 && (
                            <nav aria-label="Pages" className="flex items-center gap-1.5">
                                <button type="button" aria-label="Previous page" disabled={current <= 1} onClick={() => setPage(current - 1)} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 disabled:opacity-40"><ChevronLeft size={14} /></button>
                                {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                                    <button key={n} type="button" aria-current={n === current ? 'page' : undefined} onClick={() => setPage(n)} className={`h-9 min-w-9 cursor-pointer rounded-lg border px-2 text-sm font-semibold ${n === current ? 'border-[var(--accent)] bg-[var(--accent)] text-white' : 'border-slate-200 text-slate-700 hover:border-[var(--accent)]'}`}>{n}</button>
                                ))}
                                <button type="button" aria-label="Next page" disabled={current >= pages} onClick={() => setPage(current + 1)} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 disabled:opacity-40"><ChevronRight size={14} /></button>
                            </nav>
                        )}
                    </div>
                </section>
            </QueryState>
        </div>
    );
}

export function ClientNewTicketPage() {
    const navigate = useNavigate();
    const qc = useQueryClient();
    const query = useClientTickets();
    const [params] = useSearchParams();
    const [fields, setFields] = useState({ department: 'support', service_id: params.get('service') ?? '', subject: params.get('subject') ?? '', priority: 'medium', message: '' });
    const [file, setFile] = useState<File | null>(null);
    const set = (key: keyof typeof fields) => (e: { target: { value: string } }) => setFields({ ...fields, [key]: e.target.value });
    const open = useMutation({
        mutationFn: async () => (await api.post<{ id: number }>('/client/tickets', form(fields, file))).data,
        onSuccess: ({ id }) => { qc.invalidateQueries({ queryKey: ['client-tickets'] }); navigate(`/tickets/${id}`); },
    });

    return (
        <Card title="Open a support ticket">
            <QueryState query={query}>
                <form onSubmit={(e) => { e.preventDefault(); open.mutate(); }} className="space-y-3 p-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                        <Field label="Department">
                            <Select value={fields.department} onChange={set('department')}>
                                {query.data?.departments.map((d) => <option key={d.code} value={d.code}>{d.name}</option>)}
                            </Select>
                        </Field>
                        <Field label="Related service">
                            <Select value={fields.service_id} onChange={set('service_id')}>
                                <option value="">None</option>
                                {query.data?.services.map((s) => <option key={s.id} value={s.id}>{s.product.name}{s.domain ? ` - ${s.domain}` : ''}</option>)}
                            </Select>
                        </Field>
                        <Field label="Priority">
                            <Select value={fields.priority} onChange={set('priority')}>
                                {priorities.map((p) => <option key={p} value={p} className="capitalize">{p}</option>)}
                            </Select>
                        </Field>
                    </div>
                    <Field label="Subject"><Input required maxLength={255} value={fields.subject} onChange={set('subject')} /></Field>
                    <Field label="Message" hint="Describe the problem, and for a billing question include the invoice number.">
                        <textarea required rows={7} className="ui-input py-2" style={{ height: 'auto' }} value={fields.message} onChange={set('message')} />
                    </Field>
                    <FilePicker file={file} onChange={setFile} />
                    <p className="text-[11px] text-slate-500">JPG, PNG, GIF or PDF up to 5 MB.</p>
                    <ErrorNote error={open.error} />
                    <div className="flex justify-end gap-2">
                        <Link to="/tickets" className="ui-btn ui-btn-secondary">Cancel</Link>
                        <Button disabled={open.isPending}>{open.isPending ? 'Submitting...' : 'Submit ticket'}</Button>
                    </div>
                </form>
            </QueryState>
        </Card>
    );
}

type ClientTicket = TicketRow & { department_name: string; created_at: string; service: { id: number; name: string | null; domain: string | null } | null; replies: Reply[] };

export function ClientTicketPage() {
    const { id } = useParams();
    const qc = useQueryClient();
    const key = ['client-ticket', id];
    const query = useQuery({ queryKey: key, queryFn: async () => (await api.get<ClientTicket>(`/client/tickets/${id}`)).data });
    const saved = (t: ClientTicket) => { qc.setQueryData(key, t); qc.invalidateQueries({ queryKey: ['client-tickets'] }); qc.invalidateQueries({ queryKey: ['client-badges'] }); };
    const close = useMutation({ mutationFn: async () => (await api.post<ClientTicket>(`/client/tickets/${id}/close`)).data, onSuccess: saved });
    const t = query.data;

    return (
        <QueryState query={query}>
            {t && (
                <div className="space-y-4">
                    <Card
                        title={`#${t.number} - ${t.subject}`}
                        action={
                            <div className="flex items-center gap-3">
                                <Status value={t.status} />
                                {t.status !== 'closed' && <Button variant="ghost" disabled={close.isPending} onClick={() => window.confirm('Close this ticket?') && close.mutate()}>Close ticket</Button>}
                            </div>
                        }
                    >
                        <Facts rows={[
                            ['Department', t.department_name],
                            ['Priority', <span key="p" className="capitalize">{t.priority}</span>],
                            ['Related service', t.service ? <Link key="s" className="table-action-link" to={`/admin/products-services/${t.service.id}`}>{t.service.name ?? 'Service'}{t.service.domain ? ` - ${t.service.domain}` : ''}</Link> : 'None'],
                            ['Opened', when(t.created_at)],
                        ]} />
                        <div className="px-4 pb-4"><ErrorNote error={close.error} /></div>
                    </Card>
                    <Thread replies={t.replies} attachment={(reply) => `/client/tickets/${t.id}/replies/${reply}/attachment`} />
                    <ReplyBox
                        note={t.status === 'closed' ? 'This ticket is closed. Replying will reopen it.' : undefined}
                        onSend={async (message, file) => saved((await api.post<ClientTicket>(`/client/tickets/${t.id}/replies`, form({ message }, file))).data)}
                    />
                    <Link className="table-action-link" to="/tickets">Back to my tickets</Link>
                </div>
            )}
        </QueryState>
    );
}

// ---- Chat ----------------------------------------------------------------

type ChatItem = { id: number; message: string | null; staff: boolean; author: string; attachment_name: string | null; created_at: string };
type ChatPage = { items: ChatItem[]; seen_up_to: number; client?: { id: number; name: string; email: string } };

const PAGE = 50;
const POLL_MS = 4000;

/** One conversation. New messages arrive by polling with after_id, older ones load on demand. */
function ChatWindow({ url, attachment, staffSide, title, onActivity }: {
    url: string;
    attachment: (id: number) => string;
    staffSide: boolean;
    title: (page: ChatPage | null) => ReactNode;
    onActivity?: () => void;
}) {
    const [items, setItems] = useState<ChatItem[]>([]);
    const [meta, setMeta] = useState<ChatPage | null>(null);
    const [seen, setSeen] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [error, setError] = useState<unknown>(null);
    const [message, setMessage] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const box = useRef<HTMLDivElement>(null);
    const stick = useRef(true);
    const keepOffset = useRef<number | null>(null);
    const lastId = useRef(0);
    const activity = useRef(onActivity);
    activity.current = onActivity;

    const merge = (incoming: ChatItem[], older = false) => setItems((current) => {
        const known = new Set(current.map((m) => m.id));
        const fresh = incoming.filter((m) => !known.has(m.id));
        const next = older ? [...fresh, ...current] : [...current, ...fresh];
        lastId.current = next.length ? next[next.length - 1].id : 0;

        return next;
    });

    useEffect(() => {
        let alive = true;
        let ready = false;
        setItems([]); setMeta(null); setError(null); lastId.current = 0; stick.current = true;

        api.get<ChatPage>(url).then(({ data }) => {
            if (!alive) return;
            merge(data.items); setMeta(data); setSeen(data.seen_up_to); setHasMore(data.items.length >= PAGE);
            ready = true;
            activity.current?.();
        }).catch((e) => alive && setError(e));

        const timer = window.setInterval(async () => {
            if (!ready || document.hidden) return;
            try {
                const { data } = await api.get<ChatPage>(url, { params: { after_id: lastId.current } });
                if (!alive) return;
                setSeen(data.seen_up_to);
                if (data.items.length) { merge(data.items); activity.current?.(); }
            } catch {
                // The next tick tries again.
            }
        }, POLL_MS);

        return () => { alive = false; window.clearInterval(timer); };
    }, [url]);

    useLayoutEffect(() => {
        const el = box.current;
        if (!el) return;
        if (keepOffset.current !== null) {
            el.scrollTop = el.scrollHeight - keepOffset.current;
            keepOffset.current = null;
        } else if (stick.current) {
            el.scrollTop = el.scrollHeight;
        }
    }, [items]);

    const older = useMutation({
        mutationFn: async () => (await api.get<ChatPage>(url, { params: { before_id: items[0]?.id } })).data,
        onSuccess: (data) => {
            keepOffset.current = (box.current?.scrollHeight ?? 0) - (box.current?.scrollTop ?? 0);
            merge(data.items, true);
            setHasMore(data.items.length >= PAGE);
        },
    });

    const send = useMutation({
        mutationFn: async () => (await api.post<ChatItem>(url, form({ message: message.trim() }, file))).data,
        onSuccess: (item) => { stick.current = true; merge([item]); setMessage(''); setFile(null); },
    });

    const mine = (m: ChatItem) => (staffSide ? m.staff : !m.staff);
    const lastMine = [...items].reverse().find(mine);
    const submit = () => (message.trim() || file) && !send.isPending && send.mutate();

    return (
        <section className="card flex h-[calc(100dvh-11rem)] min-h-[24rem] flex-col overflow-hidden md:h-[calc(100dvh-8rem)]">
            <header className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">{title(meta)}</header>
            <div
                ref={box}
                onScroll={(e) => { const el = e.currentTarget; stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80; }}
                className="flex-1 space-y-3 overflow-y-auto bg-slate-50/60 px-3 py-4 sm:px-4"
            >
                {error ? <ErrorNote error={error} /> : null}
                {!meta && !error && <p className="text-center text-sm text-slate-500">Loading...</p>}
                {hasMore && <div className="text-center"><Button variant="ghost" disabled={older.isPending} onClick={() => older.mutate()}>Load earlier messages</Button></div>}
                {meta && items.length === 0 && (
                    <div className="grid h-full place-items-center text-center text-sm text-slate-500">
                        <div><MessageSquare className="mx-auto mb-2 text-slate-300" size={32} />{staffSide ? 'No messages yet.' : 'Send us a message and our team will reply here.'}</div>
                    </div>
                )}
                {items.map((m) => (
                    <div key={m.id} className={`flex ${mine(m) ? 'justify-end' : 'justify-start'}`}>
                        <div className="max-w-[85%] sm:max-w-[70%]">
                            <div className={`mb-0.5 text-[11px] text-slate-500 ${mine(m) ? 'text-right' : ''}`}>{m.author} · {new Date(m.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</div>
                            <div className={`rounded-2xl px-3.5 py-2 text-sm break-words whitespace-pre-line ${mine(m) ? 'rounded-br-md bg-accent text-white' : 'rounded-bl-md border border-slate-200 bg-white text-slate-800'}`}>
                                {m.message}
                                {m.attachment_name && <AttachmentLink name={m.attachment_name} href={fileUrl(attachment(m.id))} />}
                            </div>
                            {m.id === lastMine?.id && seen >= m.id && <div className="mt-0.5 text-right text-[10px] text-slate-400">Seen</div>}
                        </div>
                    </div>
                ))}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-2 border-t border-slate-200 bg-white p-3">
                <ErrorNote error={send.error} />
                <div className="flex items-end gap-2">
                    <textarea
                        rows={1}
                        aria-label="Message"
                        placeholder="Type a message"
                        className="ui-input max-h-32 min-h-9 flex-1 resize-none py-2"
                        style={{ height: 'auto' }}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
                    />
                    <Button aria-label="Send" disabled={send.isPending || (!message.trim() && !file)}><Send size={14} /></Button>
                </div>
                <FilePicker file={file} onChange={setFile} />
            </form>
        </section>
    );
}

type Conversation = { id: number; name: string; email: string; last_message: string | null; last_message_at: string; unread: number };

export function ChatsPage() {
    const { clientId } = useParams();
    const qc = useQueryClient();
    const [search, setSearch] = useState('');
    const list = useQuery({
        queryKey: ['chats', search],
        queryFn: async () => (await api.get<{ data: Conversation[] }>('/chats', { params: search ? { search } : {} })).data.data,
        refetchInterval: 10000,
    });

    return (
        <div className="grid gap-4 md:grid-cols-[18rem_1fr]">
            <section className={`card flex flex-col overflow-hidden md:h-[calc(100dvh-8rem)] ${clientId ? 'hidden md:flex' : ''}`}>
                <div className="border-b border-slate-200 p-3"><input type="search" aria-label="Search chats" className="ui-input" placeholder="Search clients" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
                <QueryState query={list}>
                    <ul className="flex-1 divide-y divide-slate-100 overflow-y-auto">
                        {list.data?.length === 0 && <li className="p-6 text-center text-sm text-slate-500">No conversations yet. Start one from a client's page.</li>}
                        {list.data?.map((c) => (
                            <li key={c.id}>
                                <Link to={`/admin/chats/${c.id}`} className={`flex items-start gap-3 px-3 py-3 hover:bg-slate-50 ${String(c.id) === clientId ? 'bg-[var(--accent-soft)]' : ''}`}>
                                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">{c.name.charAt(0).toUpperCase()}</span>
                                    <span className="min-w-0 flex-1">
                                        <span className="flex items-center justify-between gap-2">
                                            <span className={`truncate text-sm ${c.unread ? 'font-bold text-slate-900' : 'font-medium text-slate-800'}`}>{c.name}</span>
                                            {c.unread > 0 && <span className="rounded-full bg-accent px-1.5 text-[10px] font-bold text-white">{c.unread}</span>}
                                        </span>
                                        <span className="block truncate text-xs text-slate-500">{c.last_message ?? 'Attachment'}</span>
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </QueryState>
            </section>
            {clientId ? (
                <ChatWindow
                    url={`/chats/${clientId}`}
                    staffSide
                    attachment={(m) => `/chats/${clientId}/messages/${m}/attachment`}
                    onActivity={() => { qc.invalidateQueries({ queryKey: ['chats'] }); qc.invalidateQueries({ queryKey: ['badges'] }); }}
                    title={(page) => (
                        <>
                            <Link to="/admin/chats" aria-label="All chats" className="icon-btn md:hidden"><X size={16} /></Link>
                            <div className="min-w-0">
                                <div className="truncate font-semibold text-slate-900">{page?.client ? <Link className="hover:underline" to={`/admin/clients/${page.client.id}`}>{page.client.name}</Link> : 'Chat'}</div>
                                {page?.client && <div className="truncate text-xs text-slate-500">{page.client.email}</div>}
                            </div>
                        </>
                    )}
                />
            ) : (
                <div className="card hidden place-items-center p-10 text-center text-sm text-slate-500 md:grid">Pick a conversation.</div>
            )}
        </div>
    );
}

export function ClientChatPage() {
    const qc = useQueryClient();
    const brand = useBranding().name;

    return (
        <ChatWindow
            url="/client/chat"
            staffSide={false}
            attachment={(m) => `/client/chat/${m}/attachment`}
            onActivity={() => qc.invalidateQueries({ queryKey: ['client-badges'] })}
            title={() => (
                <div>
                    <div className="font-semibold text-slate-900">{brand} Support</div>
                    <div className="text-xs text-slate-500">We usually reply within a few hours. For anything detailed, <Link className="table-action-link" to="/tickets/new">open a ticket</Link>.</div>
                </div>
            )}
        />
    );
}
