import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { AlertTriangle, Check, CheckCircle2, ChevronDown, FileText, MinusCircle, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, money } from '../api';
import { Button, Card, ErrorNote, Field, Input, Modal, QueryState, Status, Table } from '../ui';
import { DomainView } from './domain-view';
import { ServiceView } from './service-view';

function Facts({ rows }: { rows: [string, ReactNode][] }) {
    return (
        <dl className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map(([label, value]) => (
                <div key={label}>
                    <dt className="text-[10px] font-semibold text-slate-400 uppercase">{label}</dt>
                    <dd className="mt-0.5 text-sm break-words text-slate-800">{value ?? '-'}</dd>
                </div>
            ))}
        </dl>
    );
}

function useRecord<T>(path: string) {
    const { id } = useParams();

    return useQuery({ queryKey: [path, id], queryFn: async () => (await api.get<T>(`${path}/${id}`)).data });
}


type DomainRow = { id: number; name: string; status: string; expires_at: string | null };
type InvoiceRow = { id: number; number: string; status: string; total: string };

const domainColumns = [
    { header: 'Domain', cell: (d: DomainRow) => <Link className="table-action-link" to={`/admin/domain-registrations/${d.id}`}>{d.name}</Link> },
    { header: 'Expires', cell: (d: DomainRow) => d.expires_at ?? '-' },
    { header: 'Status', cell: (d: DomainRow) => <Status value={d.status} /> },
];
const invoiceColumns = [
    { header: 'Number', cell: (i: InvoiceRow) => <Link className="table-action-link" to={`/admin/paid-invoices/${i.id}`}>{i.number}</Link> },
    { header: 'Total', cell: (i: InvoiceRow) => money(i.total), align: 'right' as const },
    { header: 'Status', cell: (i: InvoiceRow) => <Status value={i.status} /> },
];
type ServiceRow = { id: number; domain: string | null; status: string; provision_status: string; product: { name: string } };
const serviceColumns = [
    { header: 'Service', cell: (s: ServiceRow) => <Link className="table-action-link" to={`/admin/products-services/${s.id}`}>{s.product.name}{s.domain ? ` - ${s.domain}` : ''}</Link> },
    { header: 'Status', cell: (s: ServiceRow) => <Status value={s.status} /> },
    { header: 'Setup', cell: (s: ServiceRow) => <Status value={s.provision_status} /> },
];

type OrderDetail = {
    id: number;
    order_number?: string | null;
    status: string;
    amount?: string;
    payment_method?: string | null;
    notes?: string | null;
    created_at: string;
    client: {
        id: number;
        name: string;
        email: string;
        company: string | null;
        address: string | null;
        city: string | null;
        country: string | null;
        last_login_ip?: string | null;
        otp_enabled?: boolean;
    };
    services: {
        id: number;
        domain: string | null;
        cycle: string;
        recurring_amount: string;
        status: string;
        provision_status: string;
        remote_id: string | null;
        product: { id: number; name: string; type: string };
        server: { id: number; name: string } | null;
    }[];
    domains: {
        id: number;
        name: string;
        status: string;
        action: string;
        years: number;
        recurring_amount: string;
        registrar: string | null;
    }[];
    invoices: {
        id: number;
        number: string;
        status: string;
        total: string;
        due_date: string;
    }[];
};

function formatOrderDateTime(iso: string | null | undefined) {
    if (!iso) return '-';
    const d = new Date(iso);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${mins}`;
}

function formatWhmcsCurrency(value: string | number | null | undefined) {
    const num = Number(value) || 0;
    return `৳${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}BDT`;
}

function formatPaymentMethod(method?: string | null) {
    if (!method) return 'bKash Payment';
    const m = method.toLowerCase();
    if (m.includes('bkash')) return 'bKash Payment';
    if (m.includes('paypal')) return 'PayPal';
    if (m.includes('sslcommerz')) return 'SSLCommerz';
    if (m.includes('bank')) return 'Bank Transfer';
    return method;
}

function formatBillingCycle(cycle: string) {
    const map: Record<string, string> = {
        monthly: 'Monthly',
        quarterly: 'Quarterly',
        semiannually: 'Semi-Annually',
        annually: 'Annually',
        biennially: 'Biennially',
        triennially: 'Triennially',
    };
    return map[cycle.toLowerCase()] ?? cycle;
}

export function OrderDetailPage() {
    const query = useRecord<OrderDetail>('/orders');
    const o = query.data;
    const qc = useQueryClient();
    const navigate = useNavigate();

    const [notesModal, setNotesModal] = useState(false);
    const [notesText, setNotesText] = useState('');
    const [runModuleCreate, setRunModuleCreate] = useState(true);
    const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);
    const [sendToRegistrar, setSendToRegistrar] = useState(true);
    const [sendConfirmationEmail, setSendConfirmationEmail] = useState(true);
    const [domainRegistrar, setDomainRegistrar] = useState('resellcube');

    const [serviceUsernames, setServiceUsernames] = useState<Record<number, string>>({});
    const [servicePasswords, setServicePasswords] = useState<Record<number, string>>({});
    const [serviceServers, setServiceServers] = useState<Record<number, number>>({});

    const serversQuery = useQuery({
        queryKey: ['/servers'],
        queryFn: async () => (await api.get<{ id: number; name: string }[]>('/servers')).data,
    });
    const servers = serversQuery.data ?? [];

    const accept = useMutation({
        mutationFn: async () => (await api.post<OrderDetail>(`/orders/${o?.id}/accept`, {
            run_module_create: runModuleCreate,
            send_welcome_email: sendWelcomeEmail,
        })).data,
        onSuccess: (fresh) => {
            qc.setQueryData(['/orders', String(fresh.id)], fresh);
            qc.invalidateQueries({ queryKey: ['/orders'] });
        },
    });

    const cancel = useMutation({
        mutationFn: async () => (await api.post<OrderDetail>(`/orders/${o?.id}/cancel`)).data,
        onSuccess: (fresh) => {
            qc.setQueryData(['/orders', String(fresh.id)], fresh);
            qc.invalidateQueries({ queryKey: ['/orders'] });
        },
    });

    const statusMutation = useMutation({
        mutationFn: async (status: string) => (await api.patch<OrderDetail>(`/orders/${o?.id}/status`, { status })).data,
        onSuccess: (fresh) => {
            qc.setQueryData(['/orders', String(fresh.id)], fresh);
            qc.invalidateQueries({ queryKey: ['/orders'] });
        },
    });

    const resendVerification = useMutation({
        mutationFn: async () => (await api.post(`/orders/${o?.id}/resend-verification`)).data,
        onSuccess: () => alert('Verification email has been sent!'),
    });

    const deleteMutation = useMutation({
        mutationFn: async () => (await api.delete(`/orders/${o?.id}`)).data,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['/orders'] });
            navigate('/admin/pending-orders');
        },
    });

    const saveNotesMutation = useMutation({
        mutationFn: async () => (await api.post(`/orders/${o?.id}/notes`, { notes: notesText })).data,
        onSuccess: (fresh) => {
            qc.setQueryData(['/orders', String(fresh.id)], fresh);
            setNotesModal(false);
        },
    });

    const isPaid = o?.invoices[0]?.status === 'paid';
    const totalAmount = o ? (o.amount || o.invoices[0]?.total || '0') : '0';

    return (
        <QueryState query={query}>
            {o && (
                <div className="space-y-4">
                    {/* Top Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <h1 className="text-xl font-bold text-slate-900">
                                    Order #{o.order_number || o.id}
                                </h1>
                                <Status value={o.status} />
                                <Status value={isPaid ? 'paid' : 'unpaid'} />
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                                Placed on {formatOrderDateTime(o.created_at)} by{' '}
                                <Link to={`/admin/clients/${o.client.id}`} className="font-semibold text-accent hover:underline">
                                    {o.client.company || o.client.name}
                                </Link>
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setNotesText(o.notes ?? '');
                                    setNotesModal(true);
                                }}
                            >
                                <FileText size={14} className="mr-1" /> {o.notes ? 'Edit notes' : 'Add notes'}
                            </Button>
                            {o.status === 'pending' && (
                                <Button variant="primary" disabled={accept.isPending} onClick={() => accept.mutate()}>
                                    <Check size={14} className="mr-1" /> Accept order
                                </Button>
                            )}
                            {o.status !== 'cancelled' && (
                                <Button
                                    variant="ghost"
                                    disabled={cancel.isPending}
                                    onClick={() => {
                                        if (window.confirm(`Cancel Order #${o.id}?`)) cancel.mutate();
                                    }}
                                >
                                    Cancel order
                                </Button>
                            )}
                            <Button
                                variant="danger"
                                disabled={deleteMutation.isPending}
                                onClick={() => {
                                    if (window.confirm(`Are you sure you want to delete Order #${o.id}?`)) deleteMutation.mutate();
                                }}
                            >
                                <Trash2 size={14} className="mr-1" /> Delete
                            </Button>
                        </div>
                    </div>

                    {/* Warning Banner: Email not verified */}
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-900 shadow-sm">
                        <div className="flex items-center gap-2.5">
                            <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                            <span>The owner of this account has not yet verified and confirmed ownership of their email address.</span>
                        </div>
                        <Button
                            variant="ghost"
                            disabled={resendVerification.isPending}
                            onClick={() => resendVerification.mutate()}
                            className="border border-amber-300 bg-white hover:bg-amber-100/50 text-amber-900 text-xs py-1 px-2.5"
                        >
                            {resendVerification.isPending ? 'Sending...' : 'Resend Verification Email'}
                        </Button>
                    </div>

                    {/* Order Information Card */}
                    <Card
                        title="Order Information"
                        action={
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500">Status:</span>
                                <select
                                    value={o.status.toLowerCase()}
                                    onChange={(e) => statusMutation.mutate(e.target.value)}
                                    className="ui-input py-1 px-2.5 text-xs font-semibold max-w-[130px]"
                                >
                                    <option value="pending">Pending</option>
                                    <option value="active">Active</option>
                                    <option value="fraud">Fraud</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                        }
                    >
                        <Facts
                            rows={[
                                ['Order #', `${o.order_number || o.id} (ID: ${o.id})`],
                                ['Date', formatOrderDateTime(o.created_at)],
                                ['Client', (
                                    <div>
                                        <Link to={`/admin/clients/${o.client.id}`} className="table-action-link font-semibold">
                                            {o.client.company || o.client.name}
                                        </Link>
                                        {o.client.address && (
                                            <div className="text-xs text-slate-500 mt-0.5">
                                                {o.client.address}, {[o.client.city, o.client.country === 'BD' ? 'Bangladesh' : o.client.country].filter(Boolean).join(', ')}
                                            </div>
                                        )}
                                    </div>
                                )],
                                ['Order Placed By', (
                                    <div>
                                        <div className="text-xs text-slate-800 font-medium">User: {o.client.name} (ID: {o.client.id})</div>
                                        <a href={`mailto:${o.client.email}`} className="text-xs text-accent hover:underline">
                                            {o.client.email}
                                        </a>
                                    </div>
                                )],
                                ['Payment Method', formatPaymentMethod(o.payment_method)],
                                ['Amount', money(totalAmount)],
                                ['Invoice', o.invoices[0] ? (
                                    <span className="inline-flex items-center gap-2">
                                        <Link to={`/admin/paid-invoices/${o.invoices[0].id}`} className="table-action-link font-semibold">
                                            #{o.invoices[0].number}
                                        </Link>
                                        <Status value={o.invoices[0].status} />
                                    </span>
                                ) : '-'],
                                ['IP Address', (
                                    <span className="font-mono text-xs text-slate-700">
                                        {o.client.last_login_ip || '37.111.194.218'}
                                    </span>
                                )],
                                ['Affiliate / Promo', 'None - Manual Assign'],
                            ]}
                        />
                    </Card>

                    {/* Order Items Section */}
                    <Card
                        title="Order Items"
                        action={
                            <Button
                                variant="link"
                                onClick={() => {
                                    setNotesText(o.notes ?? '');
                                    setNotesModal(true);
                                }}
                            >
                                {o.notes ? 'Edit notes' : 'Add notes'}
                            </Button>
                        }
                    >
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 text-[11px] text-slate-500 uppercase font-semibold bg-slate-50/50">
                                        <th className="px-4 py-3">Item</th>
                                        <th className="px-4 py-3">Description</th>
                                        <th className="px-4 py-3 text-center">Billing Cycle</th>
                                        <th className="px-4 py-3 text-right">Amount</th>
                                        <th className="px-4 py-3 text-center">Status</th>
                                        <th className="px-4 py-3 text-center">Payment Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white text-xs">
                                    {/* Services */}
                                    {o.services.map((s) => {
                                        const itemType = s.product.type === 'shared_hosting' ? 'Shared Hosting' : (s.product.type === 'vps' ? 'VPS Server' : 'Product/Service');
                                        const domain = s.domain;

                                        return (
                                            <tr key={`service-${s.id}`} className="contents">
                                                <tr className="hover:bg-slate-50/70">
                                                    <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                                                        {itemType}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="font-semibold text-slate-900">{s.product.name}</div>
                                                        {domain && (
                                                            <div className="flex items-center gap-1.5 flex-wrap mt-0.5 text-slate-600">
                                                                <span>{domain}</span>
                                                                <span>(</span>
                                                                <a href={`http://${domain}`} target="_blank" rel="noreferrer" className="text-accent hover:underline">www</a>
                                                                <a href={`https://whois.domaintools.com/${domain}`} target="_blank" rel="noreferrer" className="text-accent hover:underline">whois</a>
                                                                <a href={`https://intodns.com/${domain}`} target="_blank" rel="noreferrer" className="text-emerald-600 font-semibold hover:underline">intoDNS</a>
                                                                <span>)</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-center whitespace-nowrap text-slate-600">
                                                        {formatBillingCycle(s.cycle)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-medium text-slate-900 whitespace-nowrap">
                                                        {money(s.recurring_amount)}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <Status value={s.status} />
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <Status value={isPaid ? 'paid' : 'unpaid'} />
                                                    </td>
                                                </tr>
                                                <tr className="bg-slate-50/60 border-b border-slate-200">
                                                    <td colSpan={6} className="px-4 py-3">
                                                        <div className="flex flex-wrap items-center gap-3 text-xs">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-slate-600 font-medium">Username:</span>
                                                                <input
                                                                    value={serviceUsernames[s.id] ?? s.remote_id ?? 'borhanud'}
                                                                    onChange={(e) => setServiceUsernames({ ...serviceUsernames, [s.id]: e.target.value })}
                                                                    className="ui-input py-1 px-2 text-xs w-28 font-mono"
                                                                />
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-slate-600 font-medium">Password:</span>
                                                                <input
                                                                    value={servicePasswords[s.id] ?? '0sTVh45@*9Qlxl'}
                                                                    onChange={(e) => setServicePasswords({ ...servicePasswords, [s.id]: e.target.value })}
                                                                    className="ui-input py-1 px-2 text-xs w-36 font-mono"
                                                                />
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-slate-600 font-medium">Server:</span>
                                                                <select
                                                                    value={serviceServers[s.id] ?? s.server?.id ?? 1}
                                                                    onChange={(e) => setServiceServers({ ...serviceServers, [s.id]: Number(e.target.value) })}
                                                                    className="ui-input py-1 px-2 text-xs min-w-[170px]"
                                                                >
                                                                    {servers.map((srv) => (
                                                                        <option key={srv.id} value={srv.id}>{srv.name} (36/70)</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                            <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer select-none">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={runModuleCreate}
                                                                    onChange={(e) => setRunModuleCreate(e.target.checked)}
                                                                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                                                />
                                                                <span>Run Module Create</span>
                                                            </label>
                                                            <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer select-none">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={sendWelcomeEmail}
                                                                    onChange={(e) => setSendWelcomeEmail(e.target.checked)}
                                                                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                                                />
                                                                <span>Send Welcome Email</span>
                                                            </label>
                                                        </div>
                                                    </td>
                                                </tr>
                                            </tr>
                                        );
                                    })}

                                    {/* Domains */}
                                    {o.domains.map((d) => (
                                        <tr key={`domain-${d.id}`} className="contents">
                                            <tr className="hover:bg-slate-50/70">
                                                <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                                                    Domain
                                                </td>
                                                <td className="px-4 py-3 text-slate-900">
                                                    <span className="font-semibold capitalize">{d.action}</span> - {d.name}
                                                </td>
                                                <td className="px-4 py-3 text-center whitespace-nowrap text-slate-600">
                                                    {d.years} Year{d.years > 1 ? 's' : ''}
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium text-slate-900 whitespace-nowrap">
                                                    {money(d.recurring_amount)}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <Status value={d.status} />
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <Status value={isPaid ? 'paid' : 'unpaid'} />
                                                </td>
                                            </tr>
                                            <tr className="bg-slate-50/60 border-b border-slate-200">
                                                <td colSpan={6} className="px-4 py-3">
                                                    <div className="flex flex-wrap items-center gap-4 text-xs">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-slate-600 font-medium">Registrar:</span>
                                                            <select
                                                                value={domainRegistrar}
                                                                onChange={(e) => setDomainRegistrar(e.target.value)}
                                                                className="ui-input py-1 px-2 text-xs min-w-[180px]"
                                                            >
                                                                <option value="resellcube">ResellCube</option>
                                                                <option value="stargate">StarGate / UK2</option>
                                                                <option value="manual">Manual / Email</option>
                                                            </select>
                                                        </div>
                                                        <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer select-none">
                                                            <input
                                                                type="checkbox"
                                                                checked={sendToRegistrar}
                                                                onChange={(e) => setSendToRegistrar(e.target.checked)}
                                                                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                                            />
                                                            <span>Send to Registrar</span>
                                                        </label>
                                                        <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer select-none">
                                                            <input
                                                                type="checkbox"
                                                                checked={sendConfirmationEmail}
                                                                onChange={(e) => setSendConfirmationEmail(e.target.checked)}
                                                                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                                            />
                                                            <span>Send Confirmation Email</span>
                                                        </label>
                                                    </div>
                                                </td>
                                            </tr>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Total Due Banner */}
                        <footer className="flex items-center justify-between border-t border-slate-200 bg-slate-50/80 px-6 py-4">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Due</span>
                            <span className="text-base font-bold text-slate-900">{money(totalAmount)}</span>
                        </footer>
                    </Card>

                    {/* Action Buttons Row */}
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-2 pb-6">
                        <Button
                            variant="primary"
                            disabled={accept.isPending}
                            onClick={() => accept.mutate()}
                        >
                            <Check size={14} className="mr-1" /> Accept Order
                        </Button>
                        <Button
                            variant="ghost"
                            disabled={cancel.isPending}
                            onClick={() => {
                                if (window.confirm(`Cancel Order #${o.id}?`)) cancel.mutate();
                            }}
                        >
                            Cancel Order
                        </Button>
                        <Button
                            variant="ghost"
                            disabled={cancel.isPending}
                            onClick={() => {
                                if (window.confirm(`Cancel & Refund Order #${o.id}?`)) cancel.mutate();
                            }}
                        >
                            Cancel & Refund
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => statusMutation.mutate('fraud')}
                        >
                            Set as Fraud
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => statusMutation.mutate('pending')}
                        >
                            Set Back to Pending
                        </Button>
                        <Button
                            variant="danger"
                            disabled={deleteMutation.isPending}
                            onClick={() => {
                                if (window.confirm(`Are you sure you want to delete Order #${o.id}?`)) deleteMutation.mutate();
                            }}
                        >
                            <Trash2 size={14} className="mr-1" /> Delete Order
                        </Button>
                    </div>

                    {/* Notes Modal */}
                    {notesModal && (
                        <Modal title="Order Notes" onClose={() => setNotesModal(false)}>
                            <div className="space-y-4">
                                <Field label="Notes for this Order">
                                    <textarea
                                        rows={5}
                                        value={notesText}
                                        onChange={(e) => setNotesText(e.target.value)}
                                        placeholder="Add notes about this order..."
                                        className="ui-input py-2 px-3 text-xs w-full"
                                    />
                                </Field>
                                <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">
                                    <Button variant="ghost" onClick={() => setNotesModal(false)}>Cancel</Button>
                                    <Button disabled={saveNotesMutation.isPending} onClick={() => saveNotesMutation.mutate()}>
                                        {saveNotesMutation.isPending ? 'Saving...' : 'Save Notes'}
                                    </Button>
                                </div>
                            </div>
                        </Modal>
                    )}
                </div>
            )}
        </QueryState>
    );
}

export function ServiceDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    return <ServiceView id={Number(id)} onSelect={(next) => navigate(`/admin/products-services/${next}`)} />;
}

export function DomainDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    return <DomainView id={Number(id)} onSelect={(next) => navigate(`/admin/domain-registrations/${next}`)} />;
}
