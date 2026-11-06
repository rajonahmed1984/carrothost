import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, FileText, KeyRound, LifeBuoy, Lock, LockOpen, LogIn, MessageSquare, MoreVertical, Plus, ReceiptText, Send, ShoppingCart, Trash2, UserPen, Users, Wallet, X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api, basePath, errorMessage, money } from '../api';
import { Button, Card, Dropdown, ErrorNote, Field, FilterTabs, Input, Modal, PagedTable, QueryState, Select, Status } from '../ui';
import { ClientForm, type Client } from './sales';
import { DomainsTab, EmailsTab, InvoicesTab, Notice, RecordsTable, ServicesTab, TicketsTab, TransactionsTab } from './client-tabs';
import { alertDialog, ask } from '../dialog';

export type InvoiceRow = { id: number; number: string; status: string; currency: string; total: string; due_date: string; paid_at: string | null; created_at: string; payment_method: string | null };
export type ServiceRow = { id: number; domain: string | null; cycle: string; recurring_amount: string; status: string; next_due_date: string | null; provision_status: string; product: { name: string }; server: { name: string } | null };
export type DomainRow = { id: number; name: string; status: string; expires_at: string | null; registrar: string | null; recurring_amount: string; created_at: string; years: number; auto_renew: boolean; action: string };

type UserRow = {
    id: number;
    first_name: string | null;
    last_name: string | null;
    name: string;
    email: string;
    phone: string | null;
    language: string;
    two_factor: boolean;
    is_owner: boolean;
    permissions: string | null;
    permissions_list: string[];
    status: string;
    verification_token: string | null;
    email_verified_at: string | null;
    last_login_at: string | null;
    has_password: boolean;
    created_at: string;
};

export type Detail = Client & {
    country: string;
    notes: string | null;
    created_at: string;
    client_for: string;
    last_login_at: string | null;
    last_login_ip: string | null;
    support_pin: string | null;
    support_pin_expires_at: string | null;
    invoice_totals: Record<'paid' | 'unpaid' | 'cancelled', { count: number; total: string }>;
    credit_balance: string;
    overdue_invoices: number;
    gross_revenue: string;
    service_counts: { type: string; total: number; active: number }[];
    services: ServiceRow[];
    domains: DomainRow[];
    invoices: InvoiceRow[];
    transactions: TransactionRow[];
    transaction_totals: { in: string; fees: string; out: string; balance: string };
    ticket_stats: { this_month: number; last_month: number; this_year: number; last_year: number };
    users?: UserRow[];
    tickets?: TicketRow[];
    emails?: EmailRow[];
};
export type TransactionRow = { id: number; gateway: string; gateway_name: string; transaction_id: string; amount: string; fee: string; currency: string; created_at: string; invoice: { id: number; number: string } };
export type TicketRow = { id: number; number: string; department_name: string; subject: string; status: string; priority: string; created_at: string; last_reply_at: string | null };
export type EmailRow = { id: number; to: string; subject: string; body: string | null; created_at: string };

function formatWhmcsDate(iso: string | null) {
    if (!iso) return 'Never';
    const d = new Date(iso);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${mins}`;
}

type LogRow = { id: number; action: string; created_at: string; context: { description?: string; by?: string; ip?: string } | null; user: { name: string } | null };

function ClientLog({ clientId }: { clientId: number }) {
    return (
        <PagedTable<LogRow>
            url={`/clients/${clientId}/log`}
            noun="entries"
            empty="No activity."
            columns={[
                { header: 'Description', cell: (l) => <span className="whitespace-pre-line">{l.context?.description ?? l.action.replaceAll('.', ' ').replaceAll('_', ' ')}</span> },
                { header: 'When', cell: (l) => <span className="whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</span> },
                { header: 'By', cell: (l) => l.user?.name ?? l.context?.by ?? 'System' },
                { header: 'IP', cell: (l) => l.context?.ip ?? '-' },
            ]}
        />
    );
}

const tabs = [
    { key: 'summary', label: 'Summary' },
    { key: 'profile', label: 'Profile' },
    { key: 'users', label: 'Users' },
    { key: 'services', label: 'Products/Services' },
    { key: 'domains', label: 'Domains' },
    { key: 'invoices', label: 'Invoices' },
    { key: 'transactions', label: 'Transactions' },
    { key: 'tickets', label: 'Tickets' },
    { key: 'emails', label: 'Emails' },
    { key: 'log', label: 'Log' },
];

const typeLabels: Record<string, string> = { shared_hosting: 'Shared Hosting', vps: 'VPS/Server', other: 'Product/Service' };

function Panel({ title, children, footer }: { title: string; children: ReactNode; footer?: ReactNode }) {
    return (
        <section className="card overflow-hidden">
            <h2 className="border-b border-slate-200 px-4 py-3 text-center font-semibold text-slate-900">{title}</h2>
            {children}
            {footer && <div className="space-y-1 border-t border-slate-100 p-3">{footer}</div>}
        </section>
    );
}

function Rows({ rows }: { rows: [string, ReactNode][] }) {
    return (
        <dl className="divide-y divide-slate-100 text-xs">
            {rows.map(([label, value]) => (
                <div key={label} className="grid grid-cols-[40%_1fr] gap-2 px-4 py-2 even:bg-slate-50/60">
                    <dt className="text-slate-500">{label}</dt>
                    <dd className="break-words font-medium text-slate-800">{value || '-'}</dd>
                </div>
            ))}
        </dl>
    );
}

function Action({ icon, children, onClick, to, danger, disabled }: { icon: ReactNode; children: ReactNode; onClick?: () => void; to?: string; danger?: boolean; disabled?: boolean }) {
    const className = `flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-medium transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 ${danger ? 'text-rose-700' : 'text-slate-700'}`;

    return to ? <Link to={to} className={className}>{icon}{children}</Link> : <button type="button" disabled={disabled} onClick={onClick} className={className}>{icon}{children}</button>;
}

function NewInvoice({ clientId, onClose }: { clientId: number; onClose: () => void }) {
    const qc = useQueryClient();
    const navigate = useNavigate();
    const [dueDate, setDueDate] = useState(() => new Date().toLocaleDateString('en-CA'));
    const [items, setItems] = useState([{ description: '', amount: '' }]);
    const save = useMutation({
        mutationFn: async () => (await api.post<{ id: number }>(`/clients/${clientId}/invoices`, { due_date: dueDate, items })).data,
        onSuccess: (invoice) => {
            qc.invalidateQueries({ queryKey: ['/clients'] });
            qc.invalidateQueries({ queryKey: ['/invoices'] });
            navigate(`/admin/paid-invoices/${invoice.id}`);
        },
    });
    const patch = (i: number, change: Partial<(typeof items)[number]>) => setItems(items.map((item, n) => (n === i ? { ...item, ...change } : item)));

    return (
        <Modal title="Create invoice" onClose={onClose}>
            <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-3">
                <Field label="Due date"><Input type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></Field>
                {items.map((item, i) => (
                    <div key={i} className="grid grid-cols-[1fr_7rem_auto] items-end gap-2">
                        <Field label="Description"><Input required value={item.description} onChange={(e) => patch(i, { description: e.target.value })} /></Field>
                        <Field label="Amount"><Input type="number" min="0.01" step="0.01" required value={item.amount} onChange={(e) => patch(i, { amount: e.target.value })} /></Field>
                        <Button type="button" variant="ghost" aria-label="Remove line" disabled={items.length === 1} onClick={() => setItems(items.filter((_, n) => n !== i))}><Trash2 size={14} /></Button>
                    </div>
                ))}
                <Button type="button" variant="ghost" onClick={() => setItems([...items, { description: '', amount: '' }])}><Plus size={14} /> Add line</Button>
                <ErrorNote error={save.error} />
                <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button disabled={save.isPending}>Create invoice</Button></div>
            </form>
        </Modal>
    );
}

type CreditRow = { id: number; description: string; amount: string; created_at: string; user: { name: string } | null; invoice: { id: number; number: string } | null };

/** Manage Credits: the balance, a form to add or remove credit, and every change so far. */
function ManageCredits({ client, onClose }: { client: Detail; onClose: () => void }) {
    const qc = useQueryClient();
    const [form, setForm] = useState({ type: 'add', amount: '', description: '' });
    const [balance, setBalance] = useState(client.credit_balance);
    const save = useMutation({
        mutationFn: async () => (await api.post<{ balance: string }>(`/clients/${client.id}/credits`, form)).data,
        onSuccess: (data) => {
            setBalance(data.balance);
            setForm({ type: form.type, amount: '', description: '' });
            qc.invalidateQueries({ queryKey: [`/clients/${client.id}/credits`] });
            qc.invalidateQueries({ queryKey: ['/clients'] });
        },
    });

    return (
        <Modal wide title={`Manage Credits: ${client.name}`} onClose={onClose}>
            <div className="space-y-4">
                <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                    Available credit: <strong className="tabular-nums">{money(balance, client.currency)}</strong>
                    <span className="block text-xs text-emerald-800">Added credit pays the client's unpaid invoices straight away, oldest due first.</span>
                </p>
                <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="grid items-end gap-3 sm:grid-cols-[8rem_9rem_1fr_auto]">
                    <Field label="Action">
                        <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="add">Add credit</option><option value="remove">Remove credit</option></Select>
                    </Field>
                    <Field label="Amount"><Input type="number" min="0.01" step="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></Field>
                    <Field label="Description"><Input required maxLength={255} placeholder={form.type === 'add' ? 'e.g. Refund for invoice #1234' : 'e.g. Credit refunded to bKash'} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
                    <Button disabled={save.isPending}>{save.isPending ? 'Saving...' : form.type === 'add' ? 'Add' : 'Remove'}</Button>
                </form>
                <ErrorNote error={save.error} />
                <PagedTable<CreditRow>
                    url={`/clients/${client.id}/credits`}
                    noun="entries"
                    empty="No credit history yet."
                    columns={[
                        { header: 'Date', cell: (r) => <span className="whitespace-nowrap">{formatWhmcsDate(r.created_at)}</span> },
                        { header: 'Description', cell: (r) => r.invoice ? <Link className="table-action-link" to={`/admin/paid-invoices/${r.invoice.id}`}>{r.description}</Link> : r.description },
                        { header: 'By', cell: (r) => r.user?.name ?? 'System' },
                        { header: 'Amount', cell: (r) => <span className={Number(r.amount) < 0 ? 'text-rose-600' : 'text-emerald-700'}>{money(r.amount, client.currency)}</span>, align: 'right' },
                    ]}
                />
            </div>
        </Modal>
    );
}

function Summary({ c, onEdit, onInvoice, onTab }: { c: Detail; onEdit: () => void; onInvoice: () => void; onTab: (tab: string) => void }) {
    const [credits, setCredits] = useState(false);
    const qc = useQueryClient();
    const navigate = useNavigate();
    const [notes, setNotes] = useState(c.notes ?? '');
    const refresh = () => qc.invalidateQueries({ queryKey: ['/clients'] });
    const saveNotes = useMutation({ mutationFn: () => api.put(`/clients/${c.id}/notes`, { notes }), onSuccess: refresh });
    const act = useMutation({
        mutationFn: (action: 'close' | 'reopen' | 'delete') => (action === 'delete' ? api.delete(`/clients/${c.id}`) : api.post(`/clients/${c.id}/${action}`)),
        onSuccess: (_, action) => {
            refresh();
            if (action === 'delete') navigate('/admin/clients');
        },
        onError: (e) => alertDialog(errorMessage(e)),
    });
    const impersonate = useMutation({
        mutationFn: () => api.post(`/clients/${c.id}/impersonate`),
        onSuccess: () => window.location.assign(`${basePath}/`),
        onError: (e) => alertDialog(errorMessage(e)),
    });
    const t = c.invoice_totals;

    return (
        <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="min-w-0 space-y-4">
                <Panel title="Client Information" footer={<Action icon={<UserPen size={14} />} onClick={onEdit}>Edit Client</Action>}>
                    <Rows rows={[['Name', c.name], ['Company', c.company], ['Email', c.email], ['Phone', c.phone], ['Address', c.address], ['City', c.city], ['Country', c.country]]} />
                </Panel>
                <Panel title="Other Information">
                    <Rows rows={[
                        ['Status', <Status key="s" value={c.status} />],
                        ['Signup Date', new Date(c.created_at).toLocaleDateString()],
                        ['Client For', c.client_for],
                        ['Last Login', c.last_login_at ? `${new Date(c.last_login_at).toLocaleString()} (${c.last_login_ip ?? 'no IP'})` : 'Never'],
                        ['Support Token', c.support_pin ? <span key="pin"><span className="font-mono font-bold tracking-widest">{c.support_pin}</span> <span className="text-slate-500">until {new Date(c.support_pin_expires_at!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></span> : 'None active'],
                    ]} />
                </Panel>
            </div>
            <div className="min-w-0 space-y-4">
                <Panel title="Invoices/Billing" footer={<><Action icon={<ReceiptText size={14} />} onClick={onInvoice}>Create Invoice</Action><Action icon={<Wallet size={14} />} onClick={() => setCredits(true)}>Manage Credits</Action></>}>
                    <Rows rows={[
                        ['Paid', `${t.paid.count} (${money(t.paid.total, c.currency)})`],
                        ['Unpaid/Due', `${t.unpaid.count} (${money(t.unpaid.total, c.currency)})`],
                        ['Overdue', String(c.overdue_invoices)],
                        ['Cancelled', `${t.cancelled.count} (${money(t.cancelled.total, c.currency)})`],
                        ['Gross Revenue', money(c.gross_revenue, c.currency)],
                        ['Credit Balance', <span key="credit" className="font-semibold text-emerald-700">{money(c.credit_balance, c.currency)}</span>],
                    ]} />
                </Panel>
                {credits && <ManageCredits client={c} onClose={() => setCredits(false)} />}
                <Panel title="Products/Services" footer={<><Action icon={<ShoppingCart size={14} />} onClick={() => onTab('services')}>View Services</Action><Action icon={<Plus size={14} />} to={`/admin/active-orders?client=${c.id}`}>Add New Order</Action></>}>
                    <Rows rows={[
                        ...Object.entries(typeLabels).map(([type, label]): [string, ReactNode] => {
                            const row = c.service_counts.find((s) => s.type === type);

                            return [label, `${Number(row?.active ?? 0)} active (${Number(row?.total ?? 0)} total)`];
                        }),
                        ['Domains', `${c.domains.filter((d) => d.status === 'active').length} active (${c.domains.length} total)`],
                    ]} />
                </Panel>
            </div>
            <div className="min-w-0 space-y-4 md:col-span-2 xl:col-span-1">
                <Panel title="Other Actions">
                    <div className="space-y-1 p-3">
                        {c.status === 'active' && <Action icon={<LogIn size={14} />} disabled={impersonate.isPending} onClick={() => impersonate.mutate()}>Login as Client</Action>}
                        <Action icon={<FileText size={14} />} onClick={() => onTab('transactions')}>View Transactions</Action>
                        <Action icon={<MessageSquare size={14} />} to={`/admin/chats/${c.id}`}>Chat with Client</Action>
                        <Action icon={<LifeBuoy size={14} />} to={`/admin/tickets?client=${c.id}`}>View Tickets</Action>
                        {c.status === 'closed'
                            ? <Action icon={<LockOpen size={14} />} disabled={act.isPending} onClick={() => act.mutate('reopen')}>Reopen Account</Action>
                            : <Action icon={<Lock size={14} />} disabled={act.isPending} onClick={() => { ask(`Close ${c.name}'s account? They will no longer be able to log in.`, () => act.mutate('close')); }}>Close Account</Action>}
                        <Action icon={<Trash2 size={14} />} danger disabled={act.isPending} onClick={() => { ask(`Permanently delete ${c.name}? This cannot be undone.`, () => act.mutate('delete')); }}>Delete Account</Action>
                    </div>
                </Panel>
                <Panel title="Admin Notes">
                    <form onSubmit={(e) => { e.preventDefault(); saveNotes.mutate(); }} className="space-y-2 p-3 text-center">
                        <textarea rows={6} aria-label="Admin notes" className="ui-input py-2" value={notes} onChange={(e) => setNotes(e.target.value)} />
                        <ErrorNote error={saveNotes.error} />
                        <Button variant="ghost" disabled={saveNotes.isPending}>{saveNotes.isPending ? 'Saving...' : saveNotes.isSuccess && notes === (c.notes ?? '') ? 'Saved' : 'Save notes'}</Button>
                    </form>
                </Panel>
            </div>
        </div>
    );
}


const PERMISSION_COLUMNS = [
    // Column 1 (Left column in WHMCS screenshot)
    [
        { key: 'profile', label: 'Modify Master Account Profile' },
        { key: 'products', label: 'View Products & Services' },
        { key: 'productsso', label: 'Allow Single Signon' },
        { key: 'managedomains', label: 'Manage Domain Settings' },
        { key: 'quotes', label: 'View & Accept Quotes' },
        { key: 'affiliates', label: 'View & Manage Affiliate Account' },
        { key: 'orders', label: 'Place New Orders/Upgrades/Cancellations' },
    ],
    // Column 2 (Right column in WHMCS screenshot)
    [
        { key: 'contacts', label: 'View & Manage Contacts' },
        { key: 'manageproducts', label: 'View & Modify Product Passwords' },
        { key: 'domains', label: 'View Domains' },
        { key: 'invoices', label: 'View & Pay Invoices' },
        { key: 'tickets', label: 'View & Open Support Tickets' },
        { key: 'emails', label: 'View Emails' },
    ],
];
const ALL_PERMISSION_KEYS = PERMISSION_COLUMNS.flat().map((p) => p.key);

function ManageUserModal({
    user,
    client,
    onClose,
    onSaved,
}: {
    user: UserRow;
    client: Detail;
    onClose: () => void;
    onSaved: () => void;
}) {
    const qc = useQueryClient();
    const [firstName, setFirstName] = useState(user.first_name ?? '');
    const [lastName, setLastName] = useState(user.last_name ?? '');
    const [email, setEmail] = useState(user.email ?? '');
    const [language, setLanguage] = useState(user.language ?? 'English');
    const [twoFactor, setTwoFactor] = useState(user.two_factor ?? false);
    const [makeOwner, setMakeOwner] = useState(user.is_owner);
    const [status, setStatus] = useState(user.status ?? 'active');

    const initialPerms = new Set(
        user.permissions_list && user.permissions_list.length > 0
            ? user.permissions_list
            : user.permissions
            ? user.permissions.split(',').map((s) => s.trim())
            : []
    );
    const [permissions, setPermissions] = useState<Set<string>>(initialPerms);

    const togglePerm = (key: string) => {
        setPermissions((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const toggleAll = () => {
        if (permissions.size === ALL_PERMISSION_KEYS.length) {
            setPermissions(new Set());
        } else {
            setPermissions(new Set(ALL_PERMISSION_KEYS));
        }
    };

    const saveMutation = useMutation({
        mutationFn: async () => {
            return (await api.put(`/clients/${client.id}/users/${user.id}`, {
                first_name: firstName,
                last_name: lastName,
                email,
                language,
                two_factor: twoFactor,
                is_owner: makeOwner,
                status,
                permissions: Array.from(permissions),
            })).data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['/clients', String(client.id)] });
            onSaved();
        },
    });

    const approveMutation = useMutation({
        mutationFn: async () => {
            return (await api.post(`/clients/${client.id}/users/${user.id}/approve`)).data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['/clients', String(client.id)] });
            onSaved();
        },
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow-2xl">
                {/* WHMCS style modal header */}
                <div className="flex items-center justify-between bg-[#1a365d] px-5 py-3 text-white">
                    <h3 className="text-base font-semibold">Manage User: {user.email}</h3>
                    <button type="button" onClick={onClose} className="text-white/80 hover:text-white">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="max-h-[82vh] overflow-y-auto p-6 space-y-4 text-sm">
                    {/* Pending approval notice & 1-click approve */}
                    {status === 'pending_approval' && (
                        <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
                            <div>
                                <strong className="font-semibold">Email Verified Â· Pending Admin Approval</strong>
                                <p className="text-xs text-amber-700">This user has verified their email address and is awaiting approval.</p>
                            </div>
                            <Button
                                type="button"
                                onClick={() => approveMutation.mutate()}
                                disabled={approveMutation.isPending}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium"
                            >
                                {approveMutation.isPending ? 'Approving...' : 'Approve User Now'}
                            </Button>
                        </div>
                    )}

                    {status === 'pending_verification' && (
                        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-800">
                            <strong className="font-semibold">Pending Email Verification:</strong> The user has not yet verified their email address.
                        </div>
                    )}

                    <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 md:items-center gap-2">
                            <label className="md:text-right font-medium text-slate-700">First Name</label>
                            <div className="md:col-span-2">
                                <Input required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 md:items-center gap-2">
                            <label className="md:text-right font-medium text-slate-700">Last Name</label>
                            <div className="md:col-span-2">
                                <Input required value={lastName} onChange={(e) => setLastName(e.target.value)} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 md:items-center gap-2">
                            <label className="md:text-right font-medium text-slate-700">Email Address</label>
                            <div className="md:col-span-2">
                                <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 md:items-center gap-2">
                            <label className="md:text-right font-medium text-slate-700">Language</label>
                            <div className="md:col-span-2">
                                <select className="ui-input" value={language} onChange={(e) => setLanguage(e.target.value)}>
                                    <option value="English">English</option>
                                    <option value="Bengali">Bengali</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 md:items-center gap-2">
                            <label className="md:text-right font-medium text-slate-700">Two-Factor Authentication</label>
                            <div className="md:col-span-2 flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setTwoFactor(!twoFactor)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${twoFactor ? 'bg-sky-600' : 'bg-slate-300'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${twoFactor ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                                <span className="text-xs font-semibold uppercase text-slate-600">{twoFactor ? 'ON' : 'OFF'}</span>
                            </div>
                        </div>

                        {/* Permissions Grid matching WHMCS Screenshot 2 */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2">
                            <label className="md:text-right font-medium text-slate-700 pt-1">Permissions</label>
                            <div className="md:col-span-2 space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
                                    {/* Left Column */}
                                    <div className="space-y-2">
                                        {PERMISSION_COLUMNS[0].map((p) => (
                                            <label key={p.key} className="flex items-center gap-2 text-xs text-slate-800 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                                    checked={permissions.has(p.key)}
                                                    onChange={() => togglePerm(p.key)}
                                                />
                                                <span>{p.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                    {/* Right Column */}
                                    <div className="space-y-2">
                                        {PERMISSION_COLUMNS[1].map((p) => (
                                            <label key={p.key} className="flex items-center gap-2 text-xs text-slate-800 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                                    checked={permissions.has(p.key)}
                                                    onChange={() => togglePerm(p.key)}
                                                />
                                                <span>{p.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <button
                                        type="button"
                                        onClick={toggleAll}
                                        className="text-xs text-sky-700 hover:text-sky-900 underline font-medium"
                                    >
                                        {permissions.size === ALL_PERMISSION_KEYS.length ? 'Uncheck All' : 'Check All'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Make Owner Checkbox */}
                        <div className="grid grid-cols-1 md:grid-cols-3 md:items-center gap-2 pt-3 border-t border-slate-200">
                            <label className="md:text-right font-medium text-slate-700">Make Owner</label>
                            <div className="md:col-span-2">
                                <label className="flex items-center gap-2 text-xs text-slate-800 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                        checked={makeOwner}
                                        onChange={(e) => setMakeOwner(e.target.checked)}
                                    />
                                    <span>Check to transfer ownership of '{client.company || client.name}' to this user.</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <ErrorNote error={saveMutation.error || approveMutation.error} />

                    <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
                        <Button type="button" variant="ghost" onClick={onClose}>Close</Button>
                        <Button disabled={saveMutation.isPending} className="bg-sky-700 hover:bg-sky-800 text-white font-medium">
                            {saveMutation.isPending ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function AssociateUserModal({
    client,
    onClose,
    onSaved,
}: {
    client: Detail;
    onClose: () => void;
    onSaved: () => void;
}) {
    const qc = useQueryClient();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [language, setLanguage] = useState('English');
    const [activateImmediately, setActivateImmediately] = useState(true);
    const [permissions, setPermissions] = useState<Set<string>>(new Set(ALL_PERMISSION_KEYS));

    const togglePerm = (key: string) => {
        setPermissions((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const toggleAll = () => {
        if (permissions.size === ALL_PERMISSION_KEYS.length) {
            setPermissions(new Set());
        } else {
            setPermissions(new Set(ALL_PERMISSION_KEYS));
        }
    };

    const saveMutation = useMutation({
        mutationFn: async () => {
            return (await api.post(`/clients/${client.id}/users`, {
                first_name: firstName,
                last_name: lastName,
                email,
                language,
                two_factor: false,
                is_owner: false,
                status: activateImmediately ? 'active' : 'pending_verification',
                permissions: Array.from(permissions),
            })).data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['/clients', String(client.id)] });
            onSaved();
        },
    });

    return (
        <Modal title="Associate User" onClose={onClose}>
            <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                    <Field label="First Name"><Input required value={firstName} onChange={(e) => setFirstName(e.target.value)} /></Field>
                    <Field label="Last Name"><Input required value={lastName} onChange={(e) => setLastName(e.target.value)} /></Field>
                </div>
                <Field label="Email Address"><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>

                <div className="space-y-2 pt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-700">Permissions</span>
                        <button type="button" onClick={toggleAll} className="text-xs text-sky-600 hover:underline">
                            {permissions.size === ALL_PERMISSION_KEYS.length ? 'Uncheck All' : 'Check All'}
                        </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                        {ALL_PERMISSION_KEYS.map((key) => {
                            const label = PERMISSION_COLUMNS.flat().find((p) => p.key === key)?.label ?? key;
                            return (
                                <label key={key} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                        checked={permissions.has(key)}
                                        onChange={() => togglePerm(key)}
                                    />
                                    <span>{label}</span>
                                </label>
                            );
                        })}
                    </div>
                </div>

                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-2 border-t border-slate-200">
                    <input
                        type="checkbox"
                        className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                        checked={activateImmediately}
                        onChange={(e) => setActivateImmediately(e.target.checked)}
                    />
                    <span>Activate user immediately (skip email verification)</span>
                </label>

                <ErrorNote error={saveMutation.error} />
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                    <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Associating...' : 'Associate User'}</Button>
                </div>
            </form>
        </Modal>
    );
}

function ChangeUserPassword({ client, user, onClose, onDone }: { client: Detail; user: UserRow; onClose: () => void; onDone: (message: string) => void }) {
    const [password, setPassword] = useState('');
    const save = useMutation({
        mutationFn: async () => (await api.put<{ message: string }>(`/clients/${client.id}/users/${user.id}/password`, { password })).data,
        onSuccess: (data) => onDone(data.message),
    });

    return (
        <Modal title={`Change password for ${user.email}`} onClose={onClose}>
            <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-3">
                <Field label="New password" hint="At least 10 characters. Tell the user securely; they can change it after signing in.">
                    <Input type="password" required minLength={10} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </Field>
                <ErrorNote error={save.error} />
                <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button disabled={save.isPending}>Change password</Button></div>
            </form>
        </Modal>
    );
}

function UsersTab({
    client,
    onManage,
    onAssociate,
}: {
    client: Detail;
    onManage: (u: UserRow) => void;
    onAssociate: () => void;
}) {
    const qc = useQueryClient();
    const removeMutation = useMutation({
        mutationFn: async (userId: number) => (await api.delete(`/clients/${client.id}/users/${userId}`)).data,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['/clients', String(client.id)] }),
    });

    const approveMutation = useMutation({
        mutationFn: async (userId: number) => (await api.post(`/clients/${client.id}/users/${userId}/approve`)).data,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['/clients', String(client.id)] }),
    });

    const users = client.users ?? [];
    // Every user has a login: the owner's is the client's own, the rest have their own password.
    const [changingPassword, setChangingPassword] = useState<UserRow | null>(null);
    const [notice, setNotice] = useState('');
    const sendReset = useMutation({
        mutationFn: async (userId: number) => (await api.post<{ message: string }>(`/clients/${client.id}/users/${userId}/password-reset`)).data,
        onSuccess: (data) => setNotice(data.message),
        onError: (e) => alertDialog(errorMessage(e)),
    });

    return (
        <div className="space-y-3">
            {notice && <Notice text={notice} onClose={() => setNotice('')} />}
            <ErrorNote error={removeMutation.error || approveMutation.error} />
            {changingPassword && <ChangeUserPassword client={client} user={changingPassword} onClose={() => setChangingPassword(null)} onDone={(message) => { setChangingPassword(null); setNotice(message); qc.invalidateQueries({ queryKey: ['/clients', String(client.id)] }); }} />}
            <RecordsTable<UserRow>
                rows={users}
                noun="users"
                empty="No users associated with this client."
                search={{ placeholder: 'Name, email or phone', text: (u) => `${u.name} ${u.email} ${u.phone ?? ''}` }}
                action={<Button onClick={onAssociate}><Plus size={14} /> Associate User</Button>}
                columns={[
                    {
                        header: 'Name / Email',
                        wrap: true,
                        cell: (u) => (
                            <div>
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="font-semibold text-slate-900">{u.name || u.email}</span>
                                    {u.is_owner && <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">Owner</span>}
                                    {u.status !== 'active' && <Status value={u.status} />}
                                    {!u.has_password && <span title="This user cannot sign in until they set a password. Send them a password reset email." className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">No password yet</span>}
                                </div>
                                <div className="mt-0.5 text-xs font-normal text-slate-500">{u.email}</div>
                                {u.phone && <div className="text-xs font-normal text-slate-500">{u.phone}</div>}
                            </div>
                        ),
                    },
                    { header: 'Permissions', cell: (u) => (u.is_owner ? 'Full access' : `${u.permissions_list.length} of ${ALL_PERMISSION_KEYS.length}`) },
                    { header: 'Location', cell: () => [client.city, client.country].filter(Boolean).join(', ') || '-' },
                    { header: 'Added', cell: (u) => formatWhmcsDate(u.created_at).slice(0, 10), sort: (u) => u.created_at },
                    { header: 'Last Login', cell: (u) => formatWhmcsDate(u.last_login_at) },
                    {
                        header: '',
                        align: 'right',
                        cell: (u) => (
                            <span className="inline-flex items-center gap-2">
                                {u.status === 'pending_approval' && <Button className="h-8 px-3" disabled={approveMutation.isPending} onClick={() => approveMutation.mutate(u.id)}>Approve</Button>}
                                <Button variant="ghost" className="h-8 px-3" onClick={() => onManage(u)}>Manage User</Button>
                                <Dropdown label={`More actions for ${u.email}`} buttonClassName="icon-btn h-8 w-8" button={<MoreVertical size={15} />} menuClassName="w-56 py-1 text-sm">
                                    <button type="button" role="menuitem" disabled={sendReset.isPending} onClick={() => sendReset.mutate(u.id)} className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left text-slate-700 hover:bg-slate-50"><Send size={14} className="text-slate-400" /> Send Password Reset Email</button>
                                    <button type="button" role="menuitem" onClick={() => setChangingPassword(u)} className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left text-slate-700 hover:bg-slate-50"><KeyRound size={14} className="text-slate-400" /> Change Password</button>
                                    {!u.is_owner && (
                                        <button
                                            type="button"
                                            role="menuitem"
                                            disabled={removeMutation.isPending}
                                            onClick={() => ask(`Remove ${u.name || u.email} from this client? They will no longer be able to sign in.`, () => removeMutation.mutate(u.id))}
                                            className="flex w-full cursor-pointer items-center gap-2 border-t border-slate-100 px-4 py-2 text-left text-rose-600 hover:bg-rose-50"
                                        >
                                            <Trash2 size={14} /> Remove User
                                        </button>
                                    )}
                                </Dropdown>
                            </span>
                        ),
                    },
                ]}
            />
        </div>
    );
}

type PickerClient = { id: number; name: string; company: string | null; email: string };

/** Jump to another client: type a name, company, email, phone or #ID. Searches every client, not just the first page. */
function ClientSelector({ current }: { current: PickerClient }) {
    const [params] = useSearchParams();
    const [search, setSearch] = useState('');
    const [term, setTerm] = useState('');
    const tab = params.get('tab');
    const list = useQuery({
        queryKey: ['/clients-picker', term],
        queryFn: async () => (await api.get<{ data: PickerClient[] }>('/clients', { params: { q: term, per_page: 50 } })).data.data,
        placeholderData: keepPreviousData,
    });

    useEffect(() => {
        const timer = window.setTimeout(() => setTerm(search.trim()), 250);

        return () => window.clearTimeout(timer);
    }, [search]);

    const label = (cl: PickerClient) => `${cl.name}${cl.company && cl.company !== cl.name ? ` (${cl.company})` : ''} - #${cl.id}`;

    return (
        <Dropdown
            label="Switch client"
            buttonClassName="ui-input flex min-w-[280px] max-w-md cursor-pointer items-center justify-between gap-2 bg-white py-1.5 text-left text-xs font-semibold text-slate-800"
            button={<><span className="truncate">{label(current)}</span><ChevronDown size={14} className="shrink-0 text-slate-400" /></>}
            menuClassName="w-[24rem] text-xs"
        >
            <div className="border-b border-slate-100 p-2">
                <input
                    autoFocus
                    type="search"
                    aria-label="Search clients"
                    placeholder="Search name, company, email, phone or #ID"
                    className="ui-input h-9 py-1 text-xs"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    // Enter opens the first match.
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.closest('[role="menu"]')?.querySelector<HTMLAnchorElement>('a[data-match]')?.click(); } }}
                />
            </div>
            <div className="max-h-80 overflow-y-auto py-1">
                {list.isLoading && <p className="px-3 py-3 text-slate-500">Loading...</p>}
                {list.data?.length === 0 && <p className="px-3 py-3 text-slate-500">No client matches "{term}".</p>}
                {list.data?.map((cl) => (
                    <Link
                        key={cl.id}
                        data-match
                        role="menuitem"
                        to={`/admin/clients/${cl.id}${tab ? `?tab=${tab}` : ''}`}
                        onClick={() => setSearch('')}
                        className={`block px-3 py-1.5 hover:bg-slate-100 ${cl.id === current.id ? 'bg-sky-600 text-white hover:bg-sky-600' : 'text-slate-700'}`}
                    >
                        <span className="block truncate">{label(cl)}</span>
                        <span className={`block truncate text-[11px] ${cl.id === current.id ? 'text-sky-100' : 'text-slate-400'}`}>{cl.email}</span>
                    </Link>
                ))}
            </div>
        </Dropdown>
    );
}


export function ClientDetailPage() {
    const { id } = useParams();
    const [params, setParams] = useSearchParams();
    const [editing, setEditing] = useState(false);
    const [invoicing, setInvoicing] = useState(false);
    const [managingUser, setManagingUser] = useState<UserRow | null>(null);
    const [associatingUser, setAssociatingUser] = useState(false);
    const query = useQuery({ queryKey: ['/clients', id], queryFn: async () => (await api.get<Detail>(`/clients/${id}`)).data });
    const c = query.data;
    const tab = tabs.some((t) => t.key === params.get('tab')) ? (params.get('tab') as string) : 'summary';
    const setTab = (key: string) => setParams(key === 'summary' ? {} : { tab: key });
    // A service or domain opened from its tab stays in the URL, so refresh and Back keep it.
    const viewing = Number(params.get('view')) || null;
    const editingRecord = params.get('edit') === '1';
    const openRecord = (id: number | null, edit = false) => setParams(id ? { tab, view: String(id), ...(edit ? { edit: '1' } : {}) } : { tab });
    const goTo = (target: string, id: number) => setParams({ tab: target, view: String(id) });

    return (
        <QueryState query={query}>
            {c && (
                <div className="space-y-4">
                    {/* The client picker sits in the tab bar, on the right where there is room. */}
                    <div className="card flex flex-col overflow-hidden xl:flex-row xl:items-center">
                        <div className="min-w-0 flex-1 [&>div]:border-b-0"><FilterTabs tabs={tabs} value={tab} onChange={setTab} /></div>
                        <div className="shrink-0 px-4 pb-3 xl:py-3 xl:pl-0"><ClientSelector current={c} /></div>
                    </div>

                    {tab === 'summary' && <Summary key={c.notes ?? ''} c={c} onEdit={() => setEditing(true)} onInvoice={() => setInvoicing(true)} onTab={setTab} />}

                    {tab === 'profile' && (
                        <Card title="Profile" action={<Button onClick={() => setEditing(true)}><UserPen size={14} /> Edit Profile</Button>}>
                            <dl className="grid gap-x-8 sm:grid-cols-2">
                                {([['Name', c.name], ['Company', c.company], ['Email', c.email], ['Phone', c.phone], ['Address', c.address], ['City', c.city], ['Country', c.country], ['Status', <Status key="s" value={c.status} />], ['Signup Date', new Date(c.created_at).toLocaleDateString('en-GB')], ['Currency', c.currency ?? 'BDT'], ['Credit Balance', money(c.credit_balance, c.currency)]] as [string, ReactNode][]).map(([label, value]) => (
                                    <div key={label} className="flex items-center justify-between gap-4 border-b border-slate-100 px-4 py-3 text-sm">
                                        <dt className="text-slate-500">{label}</dt>
                                        <dd className="text-right font-medium break-words text-slate-800">{value || '-'}</dd>
                                    </div>
                                ))}
                            </dl>
                        </Card>
                    )}

                    {tab === 'services' && <ServicesTab client={c} open={viewing} onOpen={openRecord} />}

                    {tab === 'domains' && <DomainsTab client={c} open={viewing} onOpen={openRecord} />}

                    {tab === 'invoices' && <InvoicesTab client={c} onCreate={() => setInvoicing(true)} open={viewing} onOpen={openRecord} edit={editingRecord} onGo={goTo} />}

                    {tab === 'transactions' && <TransactionsTab client={c} open={viewing} onOpen={openRecord} edit={editingRecord} onGo={goTo} />}

                    {tab === 'log' && <ClientLog clientId={c.id} />}

                    {tab === 'users' && (
                        <UsersTab
                            client={c}
                            onManage={(u) => setManagingUser(u)}
                            onAssociate={() => setAssociatingUser(true)}
                        />
                    )}


                    {tab === 'tickets' && <TicketsTab client={c} open={viewing} onOpen={openRecord} />}

                    {tab === 'emails' && <EmailsTab client={c} />}

                    {editing && <ClientForm client={c} onClose={() => setEditing(false)} />}
                    {invoicing && <NewInvoice clientId={c.id} onClose={() => setInvoicing(false)} />}
                    {managingUser && (
                        <ManageUserModal
                            client={c}
                            user={managingUser}
                            onClose={() => setManagingUser(null)}
                            onSaved={() => setManagingUser(null)}
                        />
                    )}
                    {associatingUser && (
                        <AssociateUserModal
                            client={c}
                            onClose={() => setAssociatingUser(false)}
                            onSaved={() => setAssociatingUser(false)}
                        />
                    )}
                </div>
            )}
        </QueryState>
    );
}
