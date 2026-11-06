import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowUpDown, Check, ChevronDown, ChevronLeft, ChevronRight, Mail, MinusCircle, Plus, Trash2 } from 'lucide-react';
import { lazy, Suspense, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, money, type Page } from '../api';
import { Button, ErrorNote, Field, Input, Modal, PagedTable, Select, Status, useBranding, type Tab } from '../ui';
import { confirmDialog } from '../dialog';

const RichEditor = lazy(() => import('../editor'));

export type Client = { id: number; name: string; company: string | null; email: string; phone: string | null; address: string | null; city: string | null; status: string; currency?: string; services_count: number; active_services_count?: number; domains_count: number; active_domains_count?: number; created_at: string };

export function ClientForm({ client, onClose }: { client: Client | null; onClose: () => void }) {
    const qc = useQueryClient();
    const branding = useBranding();
    const [form, setForm] = useState({
        name: client?.name ?? '', company: client?.company ?? '', email: client?.email ?? '', phone: client?.phone ?? '',
        address: client?.address ?? '', city: client?.city ?? '', status: client?.status ?? 'active', password: '',
        currency: client?.currency ?? branding.default_currency ?? 'BDT',
    });
    const currencyChanged = !!client && (client.currency ?? 'BDT') !== form.currency;
    const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value });
    const save = useMutation({
        mutationFn: () => (client ? api.put(`/clients/${client.id}`, form) : api.post('/clients', form)),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['/clients'] }); onClose(); },
    });

    const submit = (e: FormEvent) => { e.preventDefault(); save.mutate(); };

    return (
        <Modal title={client ? 'Edit client' : 'Add client'} onClose={onClose}>
            <form onSubmit={submit} className="space-y-3">
                <Field label="Full name"><Input required value={form.name} onChange={set('name')} /></Field>
                <Field label="Email"><Input type="email" required value={form.email} onChange={set('email')} /></Field>
                <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Company"><Input value={form.company} onChange={set('company')} /></Field>
                    <Field label="Phone"><Input value={form.phone} onChange={set('phone')} /></Field>
                    <Field label="Address"><Input value={form.address} onChange={set('address')} /></Field>
                    <Field label="City"><Input value={form.city} onChange={set('city')} /></Field>
                </div>
                <Field label="Login password" hint={client ? 'Leave blank to keep the current password. At least 10 characters.' : 'Lets the client sign in at /login. At least 10 characters.'}><Input type="password" autoComplete="new-password" minLength={10} value={form.password} onChange={set('password')} /></Field>
                <Field label="Status">
                    <Select value={form.status} onChange={set('status')}>
                        <option value="active">Active</option><option value="inactive">Inactive</option><option value="closed">Closed</option>
                    </Select>
                </Field>
                <Field label="Currency" hint="The client's prices, invoices, renewals and credit are in this.">
                    <Select value={form.currency} onChange={set('currency')}>
                        {(branding.currencies ?? ['BDT', 'USD']).map((c) => <option key={c} value={c}>{c}</option>)}
                    </Select>
                </Field>
                {currencyChanged && (
                    <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                        Saving converts this client's service and domain renewal amounts and credit balance from {client?.currency ?? 'BDT'} to {form.currency} at the current rate. Unpaid invoices must be paid or cancelled first; past invoices stay as they were.
                    </p>
                )}
                <ErrorNote error={save.error} />
                <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button disabled={save.isPending}>Save client</Button></div>
            </form>
        </Modal>
    );
}

export function SendMessage({ clientIds, onClose, onSent }: { clientIds: number[]; onClose: () => void; onSent: (message: string) => void }) {
    const [form, setForm] = useState({ sender: 'support', subject: '', message: '' });
    const [blank, setBlank] = useState(false);
    const send = useMutation({
        mutationFn: async () => (await api.post<{ message: string }>('/clients/message', { ...form, client_ids: clientIds })).data,
        onSuccess: (data) => onSent(data.message),
    });
    // The editor is not a form field, so "required" is checked here.
    const submit = (e: FormEvent) => {
        e.preventDefault();
        const empty = !new DOMParser().parseFromString(form.message, 'text/html').body.textContent?.trim() && !/<img/i.test(form.message);
        setBlank(empty);
        if (!empty) send.mutate();
    };

    return (
        <Modal wide title={`Send message to ${clientIds.length} client${clientIds.length === 1 ? '' : 's'}`} onClose={onClose}>
            <form onSubmit={submit} className="space-y-3">
                <Field label="From">
                    <Select value={form.sender} onChange={(e) => setForm({ ...form, sender: e.target.value })}>
                        <option value="support">Support (support@carrothost.com)</option>
                        <option value="sales">Sales (sales@carrothost.com)</option>
                        <option value="billing">Billing (billing@carrothost.com)</option>
                    </Select>
                </Field>
                <Field label="Subject"><Input required maxLength={200} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></Field>
                {/* Not a <Field>: inside a <label>, a click on blank toolbar space would press the first button. */}
                <div>
                    <span className="mb-1 block text-xs font-semibold text-slate-600">Message</span>
                    <Suspense fallback={<div className="grid h-[420px] place-items-center rounded-lg border border-slate-200 text-sm text-slate-500">Loading editor...</div>}>
                        <RichEditor value={form.message} onChange={(message) => setForm((f) => ({ ...f, message }))} />
                    </Suspense>
                    <span className={`mt-1 block text-xs ${blank ? 'font-semibold text-red-700' : 'text-slate-500'}`}>
                        {blank ? 'Write a message first.' : '{name}, {email} and {company} are replaced with each client\'s details. Use the <> button to edit the HTML.'}
                    </span>
                </div>
                <ErrorNote error={send.error} />
                <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button disabled={send.isPending}>{send.isPending ? 'Sending...' : 'Send message'}</Button></div>
            </form>
        </Modal>
    );
}

export function ClientsPage() {
    const [search, setSearch] = useState('');
    const [hideInactive, setHideInactive] = useState(true);
    const [editing, setEditing] = useState<Client | 'new' | null>(null);
    const [selected, setSelected] = useState<number[]>([]);
    const [messaging, setMessaging] = useState(false);
    const [sent, setSent] = useState('');
    const params: Record<string, string> = { ...(search ? { q: search } : {}), ...(hideInactive ? { hide_inactive: '1' } : {}) };

    return (
        <>
            {sent && <p role="status" className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">{sent}</p>}
            <PagedTable<Client>
                url="/clients"
                noun="clients"
                search={{ value: search, onChange: setSearch, placeholder: 'Name, company, email or phone' }}
                action={
                    <div className="flex flex-wrap items-center gap-3">
                        <label className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={hideInactive} onChange={(e) => setHideInactive(e.target.checked)} /> Hide inactive clients</label>
                        <Button onClick={() => setEditing('new')}><Plus size={14} /> Add client</Button>
                    </div>
                }
                selection={{ ids: selected, onChange: (ids) => { setSelected(ids); setSent(''); } }}
                bulk={<Button className="px-3 py-1.5 text-xs" onClick={() => setMessaging(true)}><Mail size={13} /> Send Message</Button>}
                params={params}
                empty="No clients yet. Add your first client to create an order."
                columns={[
                    { header: 'ID', cell: (c) => <Link className="table-action-link font-semibold tabular-nums" to={`/admin/clients/${c.id}`}>{c.id}</Link> },
                    { header: 'Name', cell: (c) => <Link className="table-action-link font-semibold" to={`/admin/clients/${c.id}`}>{c.name}</Link> },
                    { header: 'Company Name', cell: (c) => c.company ?? '-' },
                    { header: 'Email Address', cell: (c) => c.email },
                    { header: 'Services', cell: (c) => <span title="Active (total)">{c.active_services_count ?? 0} ({c.services_count})</span>, align: 'right' },
                    { header: 'Domains', cell: (c) => <span title="Active (total)">{c.active_domains_count ?? 0} ({c.domains_count})</span>, align: 'right' },
                    { header: 'Created', cell: (c) => new Date(c.created_at).toLocaleDateString('en-GB') },
                    { header: 'Status', cell: (c) => <Status value={c.status} /> },
                    { header: 'Action', cell: (c) => <Button variant="link" onClick={() => setEditing(c)}>Edit</Button>, align: 'right' },
                ]}
            />
            {editing && <ClientForm client={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
            {messaging && <SendMessage clientIds={selected} onClose={() => setMessaging(false)} onSent={(message) => { setMessaging(false); setSelected([]); setSent(message); }} />}
        </>
    );
}

type Product = { id: number; name: string; is_active: boolean; prices: { cycle: string; price: string; setup_fee: string }[] };

function NewOrder({ initialClient, onClose }: { initialClient: string; onClose: () => void }) {
    const qc = useQueryClient();
    const clients = useQuery({ queryKey: ['order-clients'], queryFn: async () => (await api.get<Page<Client>>('/clients', { params: { per_page: 500 } })).data.data });
    const products = useQuery({ queryKey: ['order-products'], queryFn: async () => (await api.get<Product[]>('/products')).data.filter((p) => p.is_active) });
    const [clientId, setClientId] = useState(initialClient);
    const [services, setServices] = useState<{ product_id: string; cycle: string; domain: string }[]>([]);
    const [domains, setDomains] = useState<{ name: string; action: string; years: number; epp_code?: string }[]>([]);

    const save = useMutation({
        mutationFn: () => api.post('/orders', {
            client_id: clientId,
            services: services.map((s) => ({ ...s, domain: s.domain || null })),
            domains,
        }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['/orders'] });
            qc.invalidateQueries({ queryKey: ['/invoices'] });
            qc.invalidateQueries({ queryKey: ['dashboard'] });
            onClose();
        },
    });

    const patchService = (i: number, patch: Partial<(typeof services)[number]>) => setServices(services.map((s, n) => (n === i ? { ...s, ...patch } : s)));
    const patchDomain = (i: number, patch: Partial<(typeof domains)[number]>) => setDomains(domains.map((d, n) => (n === i ? { ...d, ...patch } : d)));

    return (
        <Modal title="New order" onClose={onClose}>
            <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-4">
                <Field label="Client">
                    <Select required value={clientId} onChange={(e) => setClientId(e.target.value)}>
                        <option value="">Select a client</option>
                        {clients.data?.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.email}){c.currency && c.currency !== 'BDT' ? ` · ${c.currency}` : ''}</option>)}
                    </Select>
                </Field>
                {(() => {
                    const cur = clients.data?.find((c) => String(c.id) === clientId)?.currency;
                    return cur && cur !== 'BDT'
                        ? <p className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900">This client is billed in {cur}. Prices below are in BDT; the invoice uses each item's fixed {cur} price, or the BDT price converted at the rate in Settings &gt; Currencies.</p>
                        : null;
                })()}

                {services.map((s, i) => {
                    const product = products.data?.find((p) => String(p.id) === s.product_id);

                    return (
                        <fieldset key={i} className="space-y-2 rounded-xl border border-slate-200 p-3">
                            <Field label="Product">
                                <Select required value={s.product_id} onChange={(e) => {
                                    const next = products.data?.find((p) => String(p.id) === e.target.value);
                                    patchService(i, { product_id: e.target.value, cycle: next?.prices[0]?.cycle ?? '' });
                                }}>
                                    <option value="">Select a product</option>
                                    {products.data?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </Select>
                            </Field>
                            <div className="grid gap-2 sm:grid-cols-2">
                                <Field label="Billing cycle">
                                    <Select required value={s.cycle} onChange={(e) => patchService(i, { cycle: e.target.value })}>
                                        {product?.prices.map((p) => <option key={p.cycle} value={p.cycle}>{p.cycle} - {money(p.price)}</option>)}
                                    </Select>
                                </Field>
                                <Field label="Domain"><Input placeholder="example.com" value={s.domain} onChange={(e) => patchService(i, { domain: e.target.value })} /></Field>
                            </div>
                            <Button type="button" variant="ghost" onClick={() => setServices(services.filter((_, n) => n !== i))}><Trash2 size={14} /> Remove</Button>
                        </fieldset>
                    );
                })}

                {domains.map((d, i) => (
                    <fieldset key={i} className="space-y-2 rounded-xl border border-slate-200 p-3">
                        <Field label="Domain name"><Input required placeholder="example.com.bd" value={d.name} onChange={(e) => patchDomain(i, { name: e.target.value })} /></Field>
                        <div className="grid gap-2 sm:grid-cols-2">
                            <Field label="Action">
                                <Select value={d.action} onChange={(e) => patchDomain(i, { action: e.target.value })}><option value="register">Register</option><option value="transfer">Transfer</option></Select>
                            </Field>
                            <Field label="Years"><Input type="number" min={1} max={10} required value={d.years} onChange={(e) => patchDomain(i, { years: Number(e.target.value) })} /></Field>
                        </div>
                        {d.action === 'transfer' && <Field label="EPP code" hint="Optional here; you can collect it later."><Input autoComplete="off" value={d.epp_code ?? ''} onChange={(e) => patchDomain(i, { epp_code: e.target.value })} /></Field>}
                        <Button type="button" variant="ghost" onClick={() => setDomains(domains.filter((_, n) => n !== i))}><Trash2 size={14} /> Remove</Button>
                    </fieldset>
                ))}

                <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="ghost" onClick={() => setServices([...services, { product_id: '', cycle: '', domain: '' }])}><Plus size={14} /> Add hosting / VPS</Button>
                    <Button type="button" variant="ghost" onClick={() => setDomains([...domains, { name: '', action: 'register', years: 1 }])}><Plus size={14} /> Add domain</Button>
                </div>
                <ErrorNote error={save.error} />
                <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button disabled={save.isPending || (!services.length && !domains.length)}>Create order and invoice</Button></div>
            </form>
        </Modal>
    );
}

type Order = {
    id: number;
    order_number?: string | null;
    status: string;
    amount?: string;
    payment_method?: string | null;
    created_at: string;
    services_count: number;
    domains_count: number;
    client: { id: number; name: string };
    invoices: { id: number; number: string; status: string; total: string }[];
};

/** The order's saved total, or its invoices' when it was never saved (older panel orders). */
const orderAmount = (o: { amount?: string | null; invoices: { total: string }[] }) =>
    Number(o.amount) > 0 ? String(o.amount) : String(o.invoices.reduce((sum, i) => sum + Number(i.total), 0));

function formatOrderDate(iso: string) {
    const d = new Date(iso);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${mins}`;
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

function formatOrderTotal(order: Order) {
    const raw = orderAmount(order);
    const num = Number(raw) || 0;
    return `৳${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}BDT`;
}

export function OrdersPage({ mode = 'active' }: { mode?: 'active' | 'cancelled' | 'pending' } = {}) {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const initialClient = params.get('client') ?? '';
    const [adding, setAdding] = useState(initialClient !== '');
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const qc = useQueryClient();

    const batchMutation = useMutation({
        mutationFn: async (action: 'accept' | 'cancel' | 'delete') => {
            if (selectedIds.length === 0) return;
            return (await api.post('/orders/batch-action', { order_ids: selectedIds, action })).data;
        },
        onSuccess: () => {
            setSelectedIds([]);
            qc.invalidateQueries({ queryKey: ['/orders'] });
        },
    });

    const handleBatch = async (action: 'accept' | 'cancel' | 'delete') => {
        if (selectedIds.length === 0) return;
        if (action === 'delete' && !(await confirmDialog(`Are you sure you want to delete ${selectedIds.length} selected order(s)?`))) return;
        if (action === 'cancel' && !(await confirmDialog(`Are you sure you want to cancel ${selectedIds.length} selected order(s)?`))) return;
        batchMutation.mutate(action);
    };

    const toggleSelect = (id: number) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    const queryParams: Record<string, string> = {
        ...(search ? { q: search } : {}),
        status: mode,
    };

    const tabs: Tab[] = [
        { key: 'pending', label: 'Pending Orders' },
        { key: 'active', label: 'Active Orders' },
        { key: 'cancelled', label: 'Cancelled Orders' },
    ];

    return (
        <>
            <PagedTable<Order>
                url="/orders"
                noun={`${mode} orders`}
                search={{ value: search, onChange: setSearch, placeholder: 'Order #, client name, email or amount' }}
                tabs={{
                    options: tabs,
                    value: mode,
                    onChange: (key) => {
                        setSelectedIds([]);
                        navigate(`/admin/${key}-orders`);
                    },
                }}
                action={
                    <div className="flex flex-wrap items-center gap-2">
                        {selectedIds.length > 0 && (
                            <div className="flex items-center gap-1.5">
                                <Button
                                    variant="primary"
                                    disabled={batchMutation.isPending}
                                    onClick={() => handleBatch('accept')}
                                    className="text-xs py-1.5 px-3"
                                >
                                    <Check size={13} className="mr-1" /> Accept ({selectedIds.length})
                                </Button>
                                <Button
                                    variant="ghost"
                                    disabled={batchMutation.isPending}
                                    onClick={() => handleBatch('cancel')}
                                    className="text-xs py-1.5 px-3"
                                >
                                    Cancel ({selectedIds.length})
                                </Button>
                                <Button
                                    variant="danger"
                                    disabled={batchMutation.isPending}
                                    onClick={() => handleBatch('delete')}
                                    className="text-xs py-1.5 px-3"
                                >
                                    <Trash2 size={13} className="mr-1" /> Delete ({selectedIds.length})
                                </Button>
                            </div>
                        )}
                        <Button onClick={() => setAdding(true)}>
                            <Plus size={14} /> New order
                        </Button>
                    </div>
                }
                params={queryParams}
                empty={`No ${mode} orders found.`}
                columns={[
                    {
                        header: '',
                        cell: (o) => (
                            <input
                                type="checkbox"
                                aria-label={`Select order ${o.id}`}
                                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                checked={selectedIds.includes(o.id)}
                                onChange={() => toggleSelect(o.id)}
                            />
                        ),
                    },
                    {
                        header: 'ID',
                        cell: (o) => (
                            <Link className="table-action-link font-semibold tabular-nums" to={`/admin/orders/${o.id}`}>
                                #{o.id}
                            </Link>
                        ),
                    },
                    {
                        header: 'Order #',
                        cell: (o) => (
                            <Link className="table-action-link font-mono font-medium" to={`/admin/orders/${o.id}`}>
                                {o.order_number || o.id}
                            </Link>
                        ),
                    },
                    {
                        header: 'Date',
                        cell: (o) => new Date(o.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
                    },
                    {
                        header: 'Client',
                        cell: (o) => (
                            <Link className="table-action-link font-semibold" to={`/admin/clients/${o.client.id}`}>
                                {o.client.name}
                            </Link>
                        ),
                    },
                    {
                        header: 'Invoice',
                        cell: (o) => o.invoices.length
                            ? <span className="flex flex-wrap gap-x-2">{o.invoices.map((i) => <Link key={i.id} className="table-action-link font-mono" to={`/admin/paid-invoices/${i.id}`}>#{i.number}</Link>)}</span>
                            : <span className="text-slate-400">-</span>,
                    },
                    {
                        header: 'Payment Method',
                        cell: (o) => formatPaymentMethod(o.payment_method),
                    },
                    {
                        header: 'Total',
                        cell: (o) => money(orderAmount(o)),
                        align: 'right',
                    },
                    {
                        header: 'Payment Status',
                        cell: (o) => <Status value={o.invoices[0]?.status === 'paid' ? 'paid' : 'unpaid'} />,
                    },
                    {
                        header: 'Status',
                        cell: (o) => <Status value={o.status} />,
                    },
                    {
                        header: 'Action',
                        cell: (o) => (
                            <Link to={`/admin/orders/${o.id}`}>
                                <Button variant="link">Manage</Button>
                            </Link>
                        ),
                        align: 'right',
                    },
                ]}
            />
            {adding && <NewOrder initialClient={initialClient} onClose={() => setAdding(false)} />}
        </>
    );
}