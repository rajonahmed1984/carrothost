import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, LifeBuoy, Lock, LockOpen, LogIn, MessageSquare, Plus, ReceiptText, ShoppingCart, Trash2, UserPen } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api, basePath, errorMessage, money } from '../api';
import { Button, ErrorNote, Field, FilterTabs, Input, Modal, QueryState, Status, Table } from '../ui';
import { ClientForm, type Client } from './sales';

type InvoiceRow = { id: number; number: string; status: string; currency: string; total: string; due_date: string };
type ServiceRow = { id: number; domain: string | null; cycle: string; recurring_amount: string; status: string; next_due_date: string | null; provision_status: string; product: { name: string }; server: { name: string } | null };
type DomainRow = { id: number; name: string; status: string; expires_at: string | null; registrar: string | null; recurring_amount: string };

type Detail = Client & {
    country: string;
    notes: string | null;
    created_at: string;
    client_for: string;
    last_login_at: string | null;
    last_login_ip: string | null;
    invoice_totals: Record<'paid' | 'unpaid' | 'cancelled', { count: number; total: string }>;
    overdue_invoices: number;
    gross_revenue: string;
    service_counts: { type: string; total: number; active: number }[];
    services: ServiceRow[];
    domains: DomainRow[];
    invoices: InvoiceRow[];
    transactions: { id: number; gateway: string; transaction_id: string; amount: string; currency: string; created_at: string; invoice: { id: number; number: string } }[];
    log: { id: number; action: string; created_at: string; user: { name: string } | null }[];
};

const tabs = [
    { key: 'summary', label: 'Summary' },
    { key: 'profile', label: 'Profile' },
    { key: 'services', label: 'Products/Services' },
    { key: 'domains', label: 'Domains' },
    { key: 'invoices', label: 'Invoices' },
    { key: 'transactions', label: 'Transactions' },
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
            navigate(`/invoices/${invoice.id}`);
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
            if (action === 'delete') navigate('/clients');
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
                    ]} />
                </Panel>
            </div>
            <div className="min-w-0 space-y-4">
                <Panel title="Products/Services" footer={<><Action icon={<ShoppingCart size={14} />} onClick={() => onTab('services')}>View Services</Action><Action icon={<Plus size={14} />} to={`/orders?client=${c.id}`}>Add New Order</Action></>}>
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
                        <Action icon={<MessageSquare size={14} />} to={`/chats/${c.id}`}>Chat with Client</Action>
                        <Action icon={<LifeBuoy size={14} />} to={`/tickets?client=${c.id}`}>View Tickets</Action>
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

export function ClientDetailPage() {
    const { id } = useParams();
    const [params, setParams] = useSearchParams();
    const [editing, setEditing] = useState(false);
    const [invoicing, setInvoicing] = useState(false);
    const query = useQuery({ queryKey: ['/clients', id], queryFn: async () => (await api.get<Detail>(`/clients/${id}`)).data });
    const c = query.data;
    const tab = tabs.some((t) => t.key === params.get('tab')) ? (params.get('tab') as string) : 'summary';
    const setTab = (key: string) => setParams(key === 'summary' ? {} : { tab: key });

    return (
        <QueryState query={query}>
            {c && (
                <div className="space-y-4">
                    <div className="card overflow-hidden"><FilterTabs tabs={tabs} value={tab} onChange={setTab} /></div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 className="text-xl font-semibold text-slate-900">#{c.id} - {c.name}</h2>
                        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white/70 px-3 py-1.5 text-xs text-slate-600">
                            <span className="flex items-center gap-1.5">Status: <Status value={c.status} /></span>
                            <span>Client Login: <strong className="text-slate-800">{c.last_login_at ? 'Used' : 'Never used'}</strong></span>
                        </div>
                    </div>

                    {tab === 'summary' && <Summary key={c.notes ?? ''} c={c} onEdit={() => setEditing(true)} onInvoice={() => setInvoicing(true)} onTab={setTab} />}

                    {tab === 'profile' && (
                        <Panel title="Profile" footer={<Button variant="ghost" onClick={() => setEditing(true)}><UserPen size={14} /> Edit profile</Button>}>
                            <Rows rows={[['Name', c.name], ['Company', c.company], ['Email', c.email], ['Phone', c.phone], ['Address', c.address], ['City', c.city], ['Country', c.country], ['Status', <Status key="s" value={c.status} />]]} />
                        </Panel>
                    )}

                    {tab === 'services' && (
                        <Panel title="Products/Services">
                            <Table rows={c.services} empty="No services." columns={[
                                { header: 'Service', cell: (s) => <Link className="table-action-link font-semibold" to={`/services/${s.id}`}>{s.product.name}{s.domain ? ` - ${s.domain}` : ''}</Link> },
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
                                { header: 'Domain', cell: (d) => <Link className="table-action-link font-semibold" to={`/domains/${d.id}`}>{d.name}</Link> },
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
                                { header: 'Number', cell: (i) => <Link className="table-action-link font-semibold" to={`/invoices/${i.id}`}>{i.number}</Link> },
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
                                { header: 'Invoice', cell: (p) => <Link className="table-action-link" to={`/invoices/${p.invoice.id}`}>{p.invoice.number}</Link> },
                                { header: 'Gateway', cell: (p) => p.gateway },
                                { header: 'Transaction ID', cell: (p) => <span className="break-all">{p.transaction_id}</span> },
                                { header: 'Amount', cell: (p) => money(p.amount, p.currency), align: 'right' },
                            ]} />
                        </Panel>
                    )}

                    {tab === 'log' && (
                        <Panel title="Log">
                            <Table rows={c.log} empty="No activity." columns={[
                                { header: 'When', cell: (l) => new Date(l.created_at).toLocaleString() },
                                { header: 'Action', cell: (l) => l.action.replaceAll('.', ' ').replaceAll('_', ' ') },
                                { header: 'By', cell: (l) => l.user?.name ?? 'System' },
                            ]} />
                        </Panel>
                    )}

                    {editing && <ClientForm client={c} onClose={() => setEditing(false)} />}
                    {invoicing && <NewInvoice clientId={c.id} onClose={() => setInvoicing(false)} />}
                </div>
            )}
        </QueryState>
    );
}
