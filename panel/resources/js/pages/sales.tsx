import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, money, type Page } from '../api';
import { Button, ErrorNote, Field, Input, Modal, PagedTable, Select, Status } from '../ui';

export type Client = { id: number; name: string; company: string | null; email: string; phone: string | null; address: string | null; city: string | null; status: string; services_count: number; domains_count: number };

export function ClientForm({ client, onClose }: { client: Client | null; onClose: () => void }) {
    const qc = useQueryClient();
    const [form, setForm] = useState({
        name: client?.name ?? '', company: client?.company ?? '', email: client?.email ?? '', phone: client?.phone ?? '',
        address: client?.address ?? '', city: client?.city ?? '', status: client?.status ?? 'active', password: '',
    });
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
                <ErrorNote error={save.error} />
                <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button disabled={save.isPending}>Save client</Button></div>
            </form>
        </Modal>
    );
}

export function ClientsPage() {
    const [search, setSearch] = useState('');
    const [editing, setEditing] = useState<Client | 'new' | null>(null);

    return (
        <>
            <PagedTable<Client>
                url="/clients"
                noun="clients"
                search={{ value: search, onChange: setSearch, placeholder: 'Search clients...' }}
                action={<Button onClick={() => setEditing('new')}><Plus size={14} /> Add client</Button>}
                params={search ? { q: search } : undefined}
                empty="No clients yet. Add your first client to create an order."
                columns={[
                    { header: 'Name', cell: (c) => <Link className="table-action-link font-semibold" to={`/clients/${c.id}`}>{c.name}</Link> },
                    { header: 'Email', cell: (c) => c.email },
                    { header: 'Company', cell: (c) => c.company ?? '-' },
                    { header: 'Services', cell: (c) => c.services_count, align: 'right' },
                    { header: 'Domains', cell: (c) => c.domains_count, align: 'right' },
                    { header: 'Status', cell: (c) => <Status value={c.status} /> },
                    { header: '', cell: (c) => <Button variant="link" onClick={() => setEditing(c)}>Edit</Button>, align: 'right' },
                ]}
            />
            {editing && <ClientForm client={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
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
    const [domains, setDomains] = useState<{ name: string; action: string; years: number }[]>([]);

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
                        {clients.data?.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
                    </Select>
                </Field>

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

type Order = { id: number; status: string; created_at: string; services_count: number; domains_count: number; client: { name: string }; invoices: { id: number; number: string; status: string; total: string }[] };

export function OrdersPage() {
    const [params] = useSearchParams();
    const initialClient = params.get('client') ?? '';
    const [adding, setAdding] = useState(initialClient !== '');

    return (
        <>
            <PagedTable<Order>
                url="/orders"
                noun="orders"
                action={<Button onClick={() => setAdding(true)}><Plus size={14} /> New order</Button>}
                empty="No orders yet."
                columns={[
                    { header: 'Order', cell: (o) => <Link className="table-action-link font-semibold" to={`/orders/${o.id}`}>#{o.id}</Link> },
                    { header: 'Client', cell: (o) => o.client.name },
                    { header: 'Items', cell: (o) => `${o.services_count} service, ${o.domains_count} domain` },
                    { header: 'Invoice', cell: (o) => o.invoices[0] ? <Link className="hover:text-accent" to={`/invoices/${o.invoices[0].id}`}>{o.invoices[0].number}</Link> : '-' },
                    { header: 'Total', cell: (o) => o.invoices[0] ? money(o.invoices[0].total) : '-', align: 'right' },
                    { header: 'Status', cell: (o) => <Status value={o.status} /> },
                ]}
            />
            {adding && <NewOrder initialClient={initialClient} onClose={() => setAdding(false)} />}
        </>
    );
}
