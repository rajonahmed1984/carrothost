import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, FileText, LifeBuoy, Lock, LockOpen, LogIn, MessageSquare, Plus, ReceiptText, ShoppingCart, Trash2, UserPen, Users, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api, basePath, errorMessage, money } from '../api';
import { Button, ErrorNote, Field, FilterTabs, Input, Modal, PagedTable, QueryState, Status, Table } from '../ui';
import { ClientForm, type Client } from './sales';

type InvoiceRow = { id: number; number: string; status: string; currency: string; total: string; due_date: string };
type ServiceRow = { id: number; domain: string | null; cycle: string; recurring_amount: string; status: string; next_due_date: string | null; provision_status: string; product: { name: string }; server: { name: string } | null };
type DomainRow = { id: number; name: string; status: string; expires_at: string | null; registrar: string | null; recurring_amount: string };

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
    created_at: string;
};

type Detail = Client & {
    country: string;
    notes: string | null;
    created_at: string;
    client_for: string;
    last_login_at: string | null;
    last_login_ip: string | null;
    support_pin: string | null;
    support_pin_expires_at: string | null;
    invoice_totals: Record<'paid' | 'unpaid' | 'cancelled', { count: number; total: string }>;
    overdue_invoices: number;
    gross_revenue: string;
    service_counts: { type: string; total: number; active: number }[];
    services: ServiceRow[];
    domains: DomainRow[];
    invoices: InvoiceRow[];
    transactions: { id: number; gateway: string; transaction_id: string; amount: string; currency: string; created_at: string; invoice: { id: number; number: string } }[];
    users?: UserRow[];
    contacts?: {
        id: number;
        first_name: string;
        last_name: string;
        email: string;
        phone: string | null;
        company_name: string | null;
        address1: string | null;
        city: string | null;
        state: string | null;
        country: string | null;
        created_at: string;
    }[];
    tickets?: { id: number; ticket_mask: string; subject: string; status: string; priority: string; created_at: string }[];
    emails?: { id: number; to: string; subject: string; body: string; created_at: string }[];
};

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
    { key: 'contacts', label: 'Contacts' },
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

function Summary({ c, onEdit, onInvoice, onTab }: { c: Detail; onEdit: () => void; onInvoice: () => void; onTab: (tab: string) => void }) {
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
        onError: (e) => window.alert(errorMessage(e)),
    });
    const impersonate = useMutation({
        mutationFn: () => api.post(`/clients/${c.id}/impersonate`),
        onSuccess: () => window.location.assign(`${basePath}/`),
        onError: (e) => window.alert(errorMessage(e)),
    });
    const t = c.invoice_totals;

    return (
        <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="min-w-0 space-y-4">
                <Panel title="Client Information" footer={<Action icon={<UserPen size={14} />} onClick={onEdit}>Edit Client</Action>}>
                    <Rows rows={[['Name', c.name], ['Company', c.company], ['Email', c.email], ['Phone', c.phone], ['Address', c.address], ['City', c.city], ['Country', c.country]]} />
                </Panel>
            </div>
            <div className="min-w-0 space-y-4">
                <Panel title="Invoices/Billing" footer={<Action icon={<ReceiptText size={14} />} onClick={onInvoice}>Create Invoice</Action>}>
                    <Rows rows={[
                        ['Paid', `${t.paid.count} (${money(t.paid.total)})`],
                        ['Unpaid/Due', `${t.unpaid.count} (${money(t.unpaid.total)})`],
                        ['Overdue', String(c.overdue_invoices)],
                        ['Cancelled', `${t.cancelled.count} (${money(t.cancelled.total)})`],
                        ['Gross Revenue', money(c.gross_revenue)],
                    ]} />
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
            <div className="min-w-0 space-y-4">
                <Panel title="Other Actions">
                    <div className="space-y-1 p-3">
                        {c.status === 'active' && <Action icon={<LogIn size={14} />} disabled={impersonate.isPending} onClick={() => impersonate.mutate()}>Login as Client</Action>}
                        <Action icon={<FileText size={14} />} onClick={() => onTab('transactions')}>View Transactions</Action>
                        <Action icon={<MessageSquare size={14} />} to={`/admin/chats/${c.id}`}>Chat with Client</Action>
                        <Action icon={<LifeBuoy size={14} />} to={`/admin/tickets?client=${c.id}`}>View Tickets</Action>
                        {c.status === 'closed'
                            ? <Action icon={<LockOpen size={14} />} disabled={act.isPending} onClick={() => act.mutate('reopen')}>Reopen Account</Action>
                            : <Action icon={<Lock size={14} />} disabled={act.isPending} onClick={() => { if (window.confirm(`Close ${c.name}'s account? They will no longer be able to log in.`)) act.mutate('close'); }}>Close Account</Action>}
                        <Action icon={<Trash2 size={14} />} danger disabled={act.isPending} onClick={() => { if (window.confirm(`Permanently delete ${c.name}? This cannot be undone.`)) act.mutate('delete'); }}>Delete Account</Action>
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
                                <strong className="font-semibold">Email Verified · Pending Admin Approval</strong>
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

    return (
        <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 bg-white">
                <Button variant="ghost" onClick={onAssociate} className="border border-slate-300 bg-white shadow-sm hover:bg-slate-50 text-slate-700 text-xs">
                    <Plus size={13} className="mr-1" /> Associate User
                </Button>
                <span className="text-xs text-slate-500 font-medium">
                    {users.length} user{users.length === 1 ? '' : 's'} linked to this account
                </span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="bg-[#154273] text-white text-xs">
                            <th className="px-4 py-2.5 font-semibold">Name / Email Address</th>
                            <th className="px-4 py-2.5 font-semibold">Last Login Time</th>
                            <th className="px-4 py-2.5 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {users.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-500">
                                    No users associated with this client.
                                </td>
                            </tr>
                        ) : (
                            users.map((u) => (
                                <tr key={u.id} className="hover:bg-slate-50/70">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-medium text-slate-900">{u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email}</span>
                                            {u.is_owner && (
                                                <span className="rounded bg-neutral-600 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase">
                                                    OWNER
                                                </span>
                                            )}
                                            {u.status === 'pending_approval' && (
                                                <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                                                    Pending Approval
                                                </span>
                                            )}
                                            {u.status === 'pending_verification' && (
                                                <span className="rounded-md bg-yellow-100 px-2 py-0.5 text-[11px] font-semibold text-yellow-800">
                                                    Pending Verification
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-slate-500 font-mono mt-0.5">{u.email}</div>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                                        {formatWhmcsDate(u.last_login_at)}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="inline-flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => onManage(u)}
                                                className="rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                                            >
                                                Manage User
                                            </button>
                                            {u.status === 'pending_approval' && (
                                                <button
                                                    type="button"
                                                    disabled={approveMutation.isPending}
                                                    onClick={() => approveMutation.mutate(u.id)}
                                                    className="rounded bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white shadow-sm hover:bg-emerald-700"
                                                >
                                                    Approve
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                disabled={u.is_owner || removeMutation.isPending}
                                                onClick={() => {
                                                    if (window.confirm(`Are you sure you want to remove ${u.name || u.email} from this client?`)) {
                                                        removeMutation.mutate(u.id);
                                                    }
                                                }}
                                                className="rounded bg-[#d9534f] px-2.5 py-1 text-xs font-medium text-white shadow-sm hover:bg-[#c9302c] disabled:opacity-40 inline-flex items-center gap-1"
                                            >
                                                Remove <ChevronDown size={12} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <div className="p-3">
                <ErrorNote error={removeMutation.error || approveMutation.error} />
            </div>
        </section>
    );
}

function ClientSelector({ currentId }: { currentId: number }) {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const clientsQuery = useQuery({
        queryKey: ['/clients-quick-list'],
        queryFn: async () => (await api.get<{ data: { id: number; name: string; company: string | null }[] }>('/clients?per_page=100')).data,
    });
    const clients = clientsQuery.data?.data ?? [];
    const currentTab = params.get('tab');

    return (
        <select
            value={currentId}
            onChange={(e) => navigate(`/admin/clients/${e.target.value}${currentTab ? `?tab=${currentTab}` : ''}`)}
            className="ui-input py-1.5 px-3 font-semibold text-xs min-w-[280px] max-w-md bg-white border-slate-300 rounded shadow-sm text-slate-800"
        >
            {clients.map((cl) => (
                <option key={cl.id} value={cl.id}>
                    {cl.name}{cl.company ? ` (${cl.company})` : ''} - #{cl.id}
                </option>
            ))}
        </select>
    );
}

function ContactsTab({ client }: { client: Detail }) {
    const contacts = client.contacts ?? [];
    return (
        <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 bg-white">
                <span className="text-xs text-slate-500 font-medium">
                    {contacts.length} contact{contacts.length === 1 ? '' : 's'} linked to this account
                </span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="bg-[#154273] text-white text-xs">
                            <th className="px-4 py-2.5 font-semibold">Name / Company</th>
                            <th className="px-4 py-2.5 font-semibold">Email</th>
                            <th className="px-4 py-2.5 font-semibold">Phone</th>
                            <th className="px-4 py-2.5 font-semibold">Location</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {contacts.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">
                                    No contacts found for this client.
                                </td>
                            </tr>
                        ) : (
                            contacts.map((c) => (
                                <tr key={c.id} className="hover:bg-slate-50/70">
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-slate-900">{c.first_name} {c.last_name}</div>
                                        {c.company_name && <div className="text-xs text-slate-500">{c.company_name}</div>}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-slate-600">{c.email}</td>
                                    <td className="px-4 py-3 text-xs text-slate-600">{c.phone || '-'}</td>
                                    <td className="px-4 py-3 text-xs text-slate-600">{[c.city, c.country].filter(Boolean).join(', ') || '-'}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </section>
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

    return (
        <QueryState query={query}>
            {c && (
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <h1 className="text-xl font-bold text-slate-800">Client Profile</h1>
                            <div className="mt-1">
                                <ClientSelector currentId={c.id} />
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white/70 px-3 py-1.5 text-xs text-slate-600">
                            <span className="flex items-center gap-1.5">Status: <Status value={c.status} /></span>
                            <span>Client Login: <strong className="text-slate-800">{c.last_login_at ? 'Used' : 'Never used'}</strong></span>
                        </div>
                    </div>

                    <div className="card overflow-hidden"><FilterTabs tabs={tabs} value={tab} onChange={setTab} /></div>

                    {tab === 'summary' && <Summary key={c.notes ?? ''} c={c} onEdit={() => setEditing(true)} onInvoice={() => setInvoicing(true)} onTab={setTab} />}

                    {tab === 'profile' && (
                        <Panel title="Profile" footer={<Button variant="ghost" onClick={() => setEditing(true)}><UserPen size={14} /> Edit profile</Button>}>
                            <Rows rows={[['Name', c.name], ['Company', c.company], ['Email', c.email], ['Phone', c.phone], ['Address', c.address], ['City', c.city], ['Country', c.country], ['Status', <Status key="s" value={c.status} />]]} />
                        </Panel>
                    )}

                    {tab === 'services' && (
                        <Panel title="Products/Services">
                            <Table rows={c.services} empty="No services." columns={[
                                { header: 'Service', cell: (s) => <Link className="table-action-link font-semibold" to={`/admin/products-services/${s.id}`}>{s.product.name}{s.domain ? ` - ${s.domain}` : ''}</Link> },
                                { header: 'Next due', cell: (s) => s.next_due_date ?? '-' },
                                { header: 'Amount', cell: (s) => `${money(s.recurring_amount)} / ${s.cycle}`, align: 'right' },
                                { header: 'Status', cell: (s) => <Status value={s.status} /> },
                                { header: 'Provisioning', cell: (s) => <Status value={s.provision_status} /> },
                            ]} />
                        </Panel>
                    )}

                    {tab === 'domains' && (
                        <Panel title="Domains">
                            <Table rows={c.domains} empty="No domains." columns={[
                                { header: 'Domain', cell: (d) => <Link className="table-action-link font-semibold" to={`/admin/domain-registrations/${d.id}`}>{d.name}</Link> },
                                { header: 'Registrar', cell: (d) => d.registrar ?? 'Manual' },
                                { header: 'Expires', cell: (d) => d.expires_at ?? '-' },
                                { header: 'Renewal', cell: (d) => money(d.recurring_amount), align: 'right' },
                                { header: 'Status', cell: (d) => <Status value={d.status} /> },
                            ]} />
                        </Panel>
                    )}

                    {tab === 'invoices' && (
                        <Panel title="Invoices" footer={<Button variant="ghost" onClick={() => setInvoicing(true)}><Plus size={14} /> Create invoice</Button>}>
                            <Table rows={c.invoices} empty="No invoices." columns={[
                                { header: 'Number', cell: (i) => <Link className="table-action-link font-semibold" to={`/admin/paid-invoices/${i.id}`}>{i.number}</Link> },
                                { header: 'Due', cell: (i) => i.due_date },
                                { header: 'Total', cell: (i) => money(i.total, i.currency), align: 'right' },
                                { header: 'Status', cell: (i) => <Status value={i.status} /> },
                            ]} />
                        </Panel>
                    )}

                    {tab === 'transactions' && (
                        <Panel title="Transactions">
                            <Table rows={c.transactions} empty="No transactions." columns={[
                                { header: 'Date', cell: (p) => new Date(p.created_at).toLocaleString() },
                                { header: 'Invoice', cell: (p) => <Link className="table-action-link" to={`/admin/paid-invoices/${p.invoice.id}`}>{p.invoice.number}</Link> },
                                { header: 'Gateway', cell: (p) => p.gateway },
                                { header: 'Transaction ID', cell: (p) => <span className="break-all">{p.transaction_id}</span> },
                                { header: 'Amount', cell: (p) => money(p.amount, p.currency), align: 'right' },
                            ]} />
                        </Panel>
                    )}

                    {tab === 'log' && (
                        <Panel title="Log">
                            <ClientLog clientId={c.id} />
                        </Panel>
                    )}

                    {tab === 'users' && (
                        <UsersTab
                            client={c}
                            onManage={(u) => setManagingUser(u)}
                            onAssociate={() => setAssociatingUser(true)}
                        />
                    )}

                    {tab === 'contacts' && (
                        <ContactsTab client={c} />
                    )}

                    {tab === 'tickets' && (
                        <Panel title="Tickets">
                            <Table rows={c.tickets ?? []} empty="No tickets." columns={[
                                { header: 'Ticket #', cell: (t) => <Link className="table-action-link font-semibold" to={`/admin/tickets/${t.id}`}>#{t.ticket_mask || t.id}</Link> },
                                { header: 'Subject', cell: (t) => t.subject },
                                { header: 'Status', cell: (t) => <Status value={t.status} /> },
                                { header: 'Created', cell: (t) => new Date(t.created_at).toLocaleString() },
                            ]} />
                        </Panel>
                    )}

                    {tab === 'emails' && (
                        <Panel title="Emails">
                            <Table rows={c.emails ?? []} empty="No emails logged." columns={[
                                { header: 'Date Sent', cell: (e) => new Date(e.created_at).toLocaleString() },
                                { header: 'To', cell: (e) => e.to },
                                { header: 'Subject', cell: (e) => e.subject },
                            ]} />
                        </Panel>
                    )}

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
