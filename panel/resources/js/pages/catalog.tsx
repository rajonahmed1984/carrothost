import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, CheckCircle2, Eye, EyeOff, FolderPlus, MinusCircle, Plus, PlugZap, RefreshCw, Trash2, X, XCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api, errorMessage, money } from '../api';
import { Button, Card, ErrorNote, Field, Input, Modal, QueryState, Select, Status, Table, type Column } from '../ui';

import { Profit, ServerCostsModal, ServerProfitReport, thisMonth, type Cell } from './server-profit';
import { alertDialog, ask } from '../dialog';
import { RegistrarTldList, type TldPreset } from './registrar-tlds';

type Option = { code: string; name: string; connected: boolean };
type Meta = { currency: string; cycles: string[]; modules: Option[]; registrars: Option[] };

const useMeta = () => useQuery({ queryKey: ['meta'], queryFn: async () => (await api.get<Meta>('/meta')).data, staleTime: Infinity });
const optionLabel = (o: Option) => (o.connected ? o.name : `${o.name} (not connected yet, manual)`);

type Group = { id: number; name: string; slug: string; headline: string | null; sort_order: number; is_visible: boolean; products_count: number };

const useGroups = () => useQuery({ queryKey: ['product-groups'], queryFn: async () => (await api.get<Group[]>('/product-groups')).data });

function GroupForm({ group, onClose }: { group: Group | null; onClose: () => void }) {
    const qc = useQueryClient();
    const [form, setForm] = useState({ name: group?.name ?? '', slug: group?.slug ?? '', headline: group?.headline ?? '', sort_order: String(group?.sort_order ?? 0), is_visible: group?.is_visible ?? true });
    const done = () => { qc.invalidateQueries({ queryKey: ['product-groups'] }); onClose(); };
    const save = useMutation({
        mutationFn: () => {
            const body = { ...form, headline: form.headline || null, sort_order: Number(form.sort_order) || 0 };

            return group ? api.put(`/product-groups/${group.id}`, body) : api.post('/product-groups', body);
        },
        onSuccess: done,
    });
    const remove = useMutation({ mutationFn: () => api.delete(`/product-groups/${group?.id}`), onSuccess: done });

    return (
        <Modal title={group ? `Edit ${group.name}` : 'Add product group'} onClose={onClose}>
            <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Group name"><Input required placeholder="Shared Hosting" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
                    <Field label="URL slug" hint="Left blank, it is made from the name."><Input placeholder="shared-hosting" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></Field>
                </div>
                <Field label="Headline" hint="Shown above the products on the customer's order page."><Input value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} /></Field>
                <Field label="Menu order" hint="Lower numbers come first in the customer menu."><Input type="number" min="0" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} /></Field>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_visible} onChange={(e) => setForm({ ...form, is_visible: e.target.checked })} /> Show in the customer menu</label>
                <ErrorNote error={save.error ?? remove.error} />
                <div className="flex flex-wrap items-center justify-between gap-2">
                    {group ? <Button type="button" variant="link-danger" disabled={remove.isPending} onClick={() => ask(`Delete the ${group.name} group?`, () => remove.mutate())}>Delete group</Button> : <span />}
                    <div className="flex gap-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button disabled={save.isPending}>Save group</Button></div>
                </div>
            </form>
        </Modal>
    );
}

type Product = {
    id: number; product_group_id: number | null; name: string; type: string; description: string | null; module: string | null; module_package: string | null;
    server_id: number | null; setup_mode: string; is_active: boolean; prices: { cycle: string; price: string; setup_fee: string }[];
};
type Package = { id: string; name: string };

const productTabs = [
    { key: 'details', label: 'Details' },
    { key: 'pricing', label: 'Pricing' },
    { key: 'module', label: 'Module Settings' },
];

const setupModes = [
    { value: 'order', label: 'Automatically set up the product as soon as an order is placed' },
    { value: 'payment', label: 'Automatically set up the product as soon as the first payment is received' },
    { value: 'accept', label: 'Automatically set up the product when you manually accept a pending order' },
    { value: 'manual', label: 'Do not automatically set up this product' },
];

function PlanPicker({ module, serverId, value, onChange }: { module: string; serverId: string; value: string; onChange: (value: string) => void }) {
    const plans = useQuery({
        queryKey: ['product-packages', module, serverId],
        queryFn: async () => (await api.get<{ server: string; packages: Package[] }>('/products/packages', { params: { module, server_id: serverId || undefined } })).data,
        retry: false,
        staleTime: 60000,
    });
    const list = plans.data?.packages ?? [];

    if (plans.isError || (plans.isSuccess && list.length === 0)) {
        return (
            <Field label="Plan" hint={plans.isError ? `${errorMessage(plans.error)} Type the plan name instead.` : 'The server has no plans yet. Type the plan name instead.'}>
                <Input value={value} onChange={(e) => onChange(e.target.value)} />
            </Field>
        );
    }

    return (
        <Field label="Select plan" hint={plans.data ? `Loaded from ${plans.data.server}.` : 'Loading plans from the server...'}>
            <div className="flex gap-2">
                <Select required value={value} disabled={plans.isFetching} onChange={(e) => onChange(e.target.value)}>
                    <option value="">Choose a plan</option>
                    {value && !list.some((p) => p.id === value) && <option value={value}>{value} (not on the server)</option>}
                    {list.map((p) => <option key={p.id} value={p.id}>{p.id} (Name : {p.name})</option>)}
                </Select>
                <Button type="button" variant="ghost" aria-label="Reload plans" disabled={plans.isFetching} onClick={() => plans.refetch()}><RefreshCw size={14} /></Button>
            </div>
        </Field>
    );
}

function ProductEditor({ product, groupId }: { product: Product | null; groupId: number | null }) {
    const qc = useQueryClient();
    const navigate = useNavigate();
    const meta = useMeta();
    const groups = useGroups();
    const servers = useQuery({ queryKey: ['servers'], queryFn: async () => (await api.get<ServerRow[]>('/servers')).data });
    const [params, setParams] = useSearchParams();
    const tab = productTabs.find((t) => t.key === params.get('tab')) ?? productTabs[0];
    const [form, setForm] = useState({
        name: product?.name ?? '', product_group_id: String((product ? product.product_group_id : groupId) ?? ''), type: product?.type ?? 'shared_hosting', module: product?.module ?? '',
        module_package: product?.module_package ?? '', server_id: String(product?.server_id ?? ''), setup_mode: product?.setup_mode ?? 'payment',
        description: product?.description ?? '', is_active: product?.is_active ?? true,
    });
    const [prices, setPrices] = useState(product?.prices.map((p) => ({ ...p })) ?? [{ cycle: 'annually', price: '', setup_fee: '0' }]);
    const moduleServers = servers.data?.filter((sv) => sv.module === form.module) ?? [];
    const connected = meta.data?.modules.find((m) => m.code === form.module)?.connected ?? false;

    const save = useMutation({
        mutationFn: async () => {
            const body = {
                ...form, product_group_id: form.product_group_id ? Number(form.product_group_id) : null, description: form.description || null,
                module: form.module || null, module_package: form.module ? form.module_package || null : null, server_id: form.module && form.server_id ? Number(form.server_id) : null, prices,
            };

            return (product ? await api.put<Product>(`/products/${product.id}`, body) : await api.post<Product>('/products', body)).data;
        },
        onSuccess: (saved) => {
            qc.invalidateQueries({ queryKey: ['products'] });
            qc.invalidateQueries({ queryKey: ['product-groups'] });
            qc.setQueryData(['product', String(saved.id)], saved);
            if (!product) navigate(`/admin/products-pricing/${saved.id}?tab=${tab.key}`, { replace: true });
        },
    });
    const remove = useMutation({
        mutationFn: () => api.delete(`/products/${product?.id}`),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); qc.invalidateQueries({ queryKey: ['product-groups'] }); navigate('/admin/products-pricing'); },
    });

    return (
        <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-4">
            <div className="card p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                        <Link className="table-action-link text-xs" to="/admin/products-pricing">All products</Link>
                        <h2 className="truncate text-lg font-semibold text-slate-900">{product ? product.name : 'New product'}</h2>
                    </div>
                    {product && <Button type="button" variant="link-danger" disabled={remove.isPending} onClick={() => ask(`Delete ${product.name}?`, () => remove.mutate())}>Delete product</Button>}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                    {productTabs.map((t) => (
                        <button
                            key={t.key}
                            type="button"
                            onClick={() => setParams({ ...Object.fromEntries(params), tab: t.key }, { replace: true })}
                            className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold transition ${t.key === tab.key ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-[var(--accent)] hover:text-accent'}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className={tab.key === 'details' ? 'card space-y-4 p-5' : 'hidden'}>
                <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Product name"><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
                    <Field label="Product type">
                        <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                            <option value="shared_hosting">Shared hosting</option><option value="vps">VPS</option><option value="other">Other</option>
                        </Select>
                    </Field>
                    <Field label="Product group" hint="Customers can only order products in a visible group.">
                        <Select value={form.product_group_id} onChange={(e) => setForm({ ...form, product_group_id: e.target.value })}>
                            <option value="">No group</option>
                            {groups.data?.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </Select>
                    </Field>
                </div>
                <Field label="Description" hint="Shown to customers on the order page. One feature per line works well.">
                    <textarea rows={5} className="ui-input py-2" style={{ height: 'auto' }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </Field>
                <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Available for new orders</label>
            </div>

            <div className={tab.key === 'pricing' ? 'card space-y-3 p-5' : 'hidden'}>
                <p className="text-xs text-slate-500">Prices in {meta.data?.currency}. Add one row per billing cycle you offer.</p>
                {prices.map((p, i) => (
                    <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2">
                        <Field label="Cycle">
                            <Select value={p.cycle} onChange={(e) => setPrices(prices.map((x, n) => (n === i ? { ...x, cycle: e.target.value } : x)))}>
                                {meta.data?.cycles.map((c) => <option key={c} value={c}>{c}</option>)}
                            </Select>
                        </Field>
                        <Field label="Price"><Input type="number" min="0" step="0.01" required value={p.price} onChange={(e) => setPrices(prices.map((x, n) => (n === i ? { ...x, price: e.target.value } : x)))} /></Field>
                        <Field label="Setup fee"><Input type="number" min="0" step="0.01" value={p.setup_fee} onChange={(e) => setPrices(prices.map((x, n) => (n === i ? { ...x, setup_fee: e.target.value } : x)))} /></Field>
                        <Button type="button" variant="ghost" aria-label="Remove price" disabled={prices.length === 1} onClick={() => setPrices(prices.filter((_, n) => n !== i))}><Trash2 size={14} /></Button>
                    </div>
                ))}
                <Button type="button" variant="ghost" onClick={() => setPrices([...prices, { cycle: 'monthly', price: '', setup_fee: '0' }])}><Plus size={14} /> Add cycle</Button>
            </div>

            <div className={tab.key === 'module' ? 'space-y-4' : 'hidden'}>
                <div className="card grid gap-4 p-5 md:grid-cols-2">
                    <Field label="Module name">
                        <Select value={form.module} onChange={(e) => setForm({ ...form, module: e.target.value, server_id: '', module_package: '' })}>
                            <option value="">None (manual fulfilment)</option>
                            {meta.data?.modules.map((m) => <option key={m.code} value={m.code}>{optionLabel(m)}</option>)}
                        </Select>
                    </Field>
                    {form.module && (
                        <Field label="Server" hint={moduleServers.length ? undefined : 'No server uses this module yet. Add one under System > Servers.'}>
                            <Select value={form.server_id} onChange={(e) => setForm({ ...form, server_id: e.target.value })}>
                                <option value="">Any active server (fewest accounts first)</option>
                                {moduleServers.map((sv) => <option key={sv.id} value={sv.id}>{sv.name}{sv.is_active ? '' : ' (inactive)'}</option>)}
                            </Select>
                        </Field>
                    )}
                </div>
                {form.module && (
                    <div className="card p-5">
                        {connected && moduleServers.length > 0
                            ? <PlanPicker module={form.module} serverId={form.server_id} value={form.module_package} onChange={(v) => setForm({ ...form, module_package: v })} />
                            : <Field label="Plan" hint="Type the plan or package name exactly as it is on the server."><Input value={form.module_package} onChange={(e) => setForm({ ...form, module_package: e.target.value })} /></Field>}
                    </div>
                )}
                <div className="card divide-y divide-slate-100 p-2">
                    {setupModes.map((m) => (
                        <label key={m.value} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${form.module ? 'cursor-pointer text-slate-700 hover:bg-slate-50' : 'text-slate-400'}`}>
                            <input type="radio" name="setup_mode" value={m.value} disabled={!form.module} checked={form.setup_mode === m.value} onChange={() => setForm({ ...form, setup_mode: m.value })} /> {m.label}
                        </label>
                    ))}
                    {!form.module && <p className="px-3 py-2 text-xs text-slate-500">Pick a module to set up accounts automatically. Without one, paid orders wait for you to set them up by hand.</p>}
                    {form.module && form.setup_mode === 'order' && <p className="px-3 py-2 text-xs text-amber-700">The account is created before payment. If the first invoice stays unpaid, overdue suspension stops it.</p>}
                </div>
            </div>

            <ErrorNote error={save.error ?? remove.error} />
            <div className="flex items-center justify-end gap-3 pb-2">
                {save.isSuccess && <span role="status" className="text-xs font-semibold text-emerald-700">Product saved.</span>}
                <Button type="button" variant="ghost" onClick={() => navigate('/admin/products-pricing')}>Cancel</Button>
                <Button disabled={save.isPending}>{save.isPending ? 'Saving...' : 'Save changes'}</Button>
            </div>
        </form>
    );
}

export function ProductEditPage() {
    const { id } = useParams();
    const [params] = useSearchParams();
    const query = useQuery({ queryKey: ['product', id], queryFn: async () => (await api.get<Product>(`/products/${id}`)).data, enabled: !!id });

    if (!id) return <ProductEditor key="new" product={null} groupId={Number(params.get('group')) || null} />;

    return <QueryState query={query}>{query.data && <ProductEditor key={query.data.id} product={query.data} groupId={null} />}</QueryState>;
}

const productColumns: Column<Product>[] = [
    { header: 'Name', cell: (p) => <Link className="table-action-link font-semibold" to={`/admin/products-pricing/${p.id}`}>{p.name}</Link> },
    { header: 'Type', cell: (p) => p.type.replace('_', ' ') },
    { header: 'Automation', cell: (p) => (p.module ? `${p.module}${p.module_package ? ` / ${p.module_package}` : ''}` : 'Manual') },
    { header: 'Pricing', cell: (p) => p.prices.map((x) => `${money(x.price)} / ${x.cycle}`).join(', ') },
    { header: 'Status', cell: (p) => <Status value={p.is_active ? 'active' : 'cancelled'} /> },
    { header: '', cell: (p) => <Link className="table-action-link" to={`/admin/products-pricing/${p.id}`}>Edit</Link>, align: 'right' },
];

export function ProductsPage() {
    const query = useQuery({ queryKey: ['products'], queryFn: async () => (await api.get<Product[]>('/products')).data });
    const groups = useGroups();
    const [editingGroup, setEditingGroup] = useState<Group | 'new' | null>(null);
    const navigate = useNavigate();
    const ungrouped = query.data?.filter((p) => !groups.data?.some((g) => g.id === p.product_group_id)) ?? [];

    return (
        <>
            <div className="mb-4 flex flex-wrap justify-end gap-2">
                <Button variant="ghost" onClick={() => setEditingGroup('new')}><FolderPlus size={14} /> Add group</Button>
                <Button onClick={() => navigate('/admin/products-pricing/new')}><Plus size={14} /> Add product</Button>
            </div>
            <QueryState query={query}>
                <QueryState query={groups}>
                    <div className="space-y-4">
                        {groups.data?.length === 0 && <p className="card p-6 text-center text-sm text-slate-500">Create a group such as Shared Hosting or VPS first. Each visible group shows up in the customer menu with its products.</p>}
                        {groups.data?.map((g) => (
                            <Card
                                key={g.id}
                                title={g.name}
                                action={
                                    <div className="flex flex-wrap items-center gap-3">
                                        {!g.is_visible && <Status value="hidden" />}
                                        <Button variant="link" onClick={() => setEditingGroup(g)}>Edit group</Button>
                                        <Button variant="ghost" onClick={() => navigate(`/admin/products-pricing/new?group=${g.id}`)}><Plus size={14} /> Add product</Button>
                                    </div>
                                }
                            >
                                {g.headline && <p className="border-b border-slate-200 px-4 py-2 text-xs text-slate-500">{g.headline}</p>}
                                <Table<Product> rows={query.data?.filter((p) => p.product_group_id === g.id) ?? []} empty="No products in this group yet." columns={productColumns} />
                            </Card>
                        ))}
                        {ungrouped.length > 0 && (
                            <Card title="Not in a group">
                                <p className="border-b border-slate-200 px-4 py-2 text-xs text-slate-500">Customers cannot order these until you put them in a group.</p>
                                <Table<Product> rows={ungrouped} empty="" columns={productColumns} />
                            </Card>
                        )}
                    </div>
                </QueryState>
            </QueryState>
            {editingGroup && <GroupForm group={editingGroup === 'new' ? null : editingGroup} onClose={() => setEditingGroup(null)} />}
        </>
    );
}

type Tld = {
    id: number; tld: string; registrar: string | null; register_price: string; renew_price: string; transfer_price: string;
    is_active: boolean; is_spotlight: boolean; epp_required: boolean;
};

function TldForm({ tld, preset, onClose }: { tld: Tld | null; preset?: TldPreset; onClose: () => void }) {
    const qc = useQueryClient();
    const meta = useMeta();
    const [form, setForm] = useState({
        tld: tld?.tld ?? preset?.tld ?? '', registrar: tld?.registrar ?? preset?.registrar ?? '', register_price: tld?.register_price ?? '',
        renew_price: tld?.renew_price ?? '', transfer_price: tld?.transfer_price ?? '', is_active: tld?.is_active ?? true,
    });
    const save = useMutation({
        mutationFn: () => {
            const body = { ...form, registrar: form.registrar || null };

            return tld ? api.put(`/tlds/${tld.id}`, body) : api.post('/tlds', body);
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['tlds'] }); qc.invalidateQueries({ queryKey: ['/tlds/registrar-list'] }); onClose(); },
    });

    return (
        <Modal title={tld ? `Edit ${tld.tld}` : preset ? `Add ${preset.tld}` : 'Add TLD'} onClose={onClose}>
            <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="TLD"><Input required placeholder=".com" value={form.tld} onChange={(e) => setForm({ ...form, tld: e.target.value })} /></Field>
                    <Field label="Registrar">
                        <Select value={form.registrar} onChange={(e) => setForm({ ...form, registrar: e.target.value })}>
                            <option value="">Manual</option>
                            {meta.data?.registrars.map((r) => <option key={r.code} value={r.code}>{optionLabel(r)}</option>)}
                        </Select>
                    </Field>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                    <Field label="Register / yr"><Input type="number" min="0" step="0.01" required value={form.register_price} onChange={(e) => setForm({ ...form, register_price: e.target.value })} /></Field>
                    <Field label="Renew / yr"><Input type="number" min="0" step="0.01" required value={form.renew_price} onChange={(e) => setForm({ ...form, renew_price: e.target.value })} /></Field>
                    <Field label="Transfer"><Input type="number" min="0" step="0.01" required value={form.transfer_price} onChange={(e) => setForm({ ...form, transfer_price: e.target.value })} /></Field>
                </div>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Available for new orders</label>
                <ErrorNote error={save.error} />
                <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button disabled={save.isPending}>Save TLD</Button></div>
            </form>
        </Modal>
    );
}

type TldRow = Pick<Tld, 'id' | 'tld' | 'registrar' | 'is_active' | 'is_spotlight' | 'epp_required'>;
const SPOTLIGHT_LIMIT = 8;

type LookupSettings = { provider: string | null; premium_enabled: boolean; providers: { code: string; name: string; configured: boolean }[] };

function LookupPanels() {
    const qc = useQueryClient();
    const query = useQuery({ queryKey: ['tld-lookup'], queryFn: async () => (await api.get<LookupSettings>('/tlds/lookup')).data });
    const [changing, setChanging] = useState(false);
    const save = useMutation({
        mutationFn: async (body: { provider: string | null; premium_enabled: boolean }) => (await api.put<LookupSettings>('/tlds/lookup', body)).data,
        onSuccess: (fresh) => { qc.setQueryData(['tld-lookup'], fresh); setChanging(false); },
    });
    const d = query.data;
    const current = d?.providers.find((p) => p.code === d.provider);
    const configure = <Link className="ui-btn ui-btn-secondary flex-1 justify-center" to="/admin/settings/registrars">Configure</Link>;

    return (
        <QueryState query={query}>
            {d && (
                <>
                    <Card title="Lookup Provider">
                        <div className="space-y-3 p-4">
                            {changing ? (
                                <div className="space-y-2">
                                    {[{ code: '', name: 'None (no availability check)', configured: true }, ...d.providers].map((p) => (
                                        <button
                                            key={p.code}
                                            type="button"
                                            disabled={!p.configured || save.isPending}
                                            onClick={() => save.mutate({ provider: p.code || null, premium_enabled: d.premium_enabled })}
                                            className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-sm disabled:cursor-not-allowed disabled:opacity-50 ${(d.provider ?? '') === p.code ? 'border-[var(--accent)] bg-orange-50/60 font-semibold' : 'border-slate-200 hover:border-[var(--accent)]'}`}
                                        >
                                            {p.name}
                                            {!p.configured && <span className="text-[11px] text-slate-500">Needs API key</span>}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-3 text-center">
                                    <div className="text-lg font-bold text-slate-900">{current?.name ?? 'None'}</div>
                                    <div className="text-xs text-slate-500">{current ? 'Checks if a name is free before it can be ordered.' : 'Customers can order any name; you check it by hand.'}</div>
                                </div>
                            )}
                            <ErrorNote error={save.error} />
                            <div className="flex gap-2">
                                <Button type="button" variant="ghost" className="flex-1" onClick={() => setChanging(!changing)}>{changing ? 'Cancel' : 'Change'}</Button>
                                {configure}
                            </div>
                        </div>
                    </Card>
                    <Card title="Premium Domains">
                        <div className="space-y-3 p-4">
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={d.premium_enabled}
                                    aria-label="Premium domains"
                                    disabled={save.isPending}
                                    onClick={() => save.mutate({ provider: d.provider, premium_enabled: !d.premium_enabled })}
                                    className={`flex h-8 w-20 shrink-0 cursor-pointer items-center rounded-lg border p-0.5 transition ${d.premium_enabled ? 'border-emerald-500 bg-emerald-500 justify-start' : 'border-slate-300 bg-slate-100 justify-end'}`}
                                >
                                    <span className={`rounded-md px-2 py-1 text-[11px] font-bold ${d.premium_enabled ? 'text-white' : 'text-slate-500'}`}>{d.premium_enabled ? 'ON' : 'OFF'}</span>
                                </button>
                                {configure}
                            </div>
                            <p className="text-xs text-slate-500">
                                {d.premium_enabled ? 'Premium names are offered on request: the customer is asked to open a ticket for a price.' : 'Premium names are shown as unavailable.'}
                                {' '}They are never sold at the standard price.{!current && ' Needs a lookup provider to spot them.'}
                            </p>
                        </div>
                    </Card>
                </>
            )}
        </QueryState>
    );
}

function BulkPricing({ ids, onDone }: { ids: number[]; onDone: () => void }) {
    const qc = useQueryClient();
    const meta = useMeta();
    const [prices, setPrices] = useState({ register_price: '', transfer_price: '', renew_price: '' });
    const apply = useMutation({
        mutationFn: async () => (await api.post<Tld[]>('/tlds/pricing', { ids, ...prices })).data,
        onSuccess: (fresh) => { qc.setQueryData(['tlds'], fresh); setPrices({ register_price: '', transfer_price: '', renew_price: '' }); onDone(); },
    });
    const field = (key: keyof typeof prices, label: string) => (
        <Field label={`${label} (${meta.data?.currency ?? ''})`}>
            <Input type="number" min="0" step="0.01" placeholder="Leave as is" value={prices[key]} onChange={(e) => setPrices({ ...prices, [key]: e.target.value })} />
        </Field>
    );

    return (
        <Card title="Bulk Management">
            <form onSubmit={(e) => { e.preventDefault(); apply.mutate(); }} className="space-y-3 p-4">
                <p className="text-xs text-slate-500">One-year prices for the ticked TLDs. Longer terms are charged per year.</p>
                {field('register_price', 'Registration')}
                {field('transfer_price', 'Transfer')}
                {field('renew_price', 'Renewal')}
                <ErrorNote error={apply.error} />
                <Button className="w-full" disabled={!ids.length || apply.isPending}>{ids.length ? `Apply to ${ids.length} selected` : 'Tick TLDs to change'}</Button>
            </form>
        </Card>
    );
}

function TldTable({ data }: { data: Tld[] }) {
    const qc = useQueryClient();
    const meta = useMeta();
    const [rows, setRows] = useState<TldRow[]>(() => data.map(({ id, tld, registrar, is_active, is_spotlight, epp_required }) => ({ id, tld, registrar, is_active, is_spotlight, epp_required })));
    const [selected, setSelected] = useState<number[]>([]);
    const [pricing, setPricing] = useState<Tld | 'new' | TldPreset | null>(null);
    const byId = new Map(data.map((t) => [t.id, t]));
    const dirty = JSON.stringify(rows) !== JSON.stringify(data.map(({ id, tld, registrar, is_active, is_spotlight, epp_required }) => ({ id, tld, registrar, is_active, is_spotlight, epp_required })));
    const spotlight = rows.filter((r) => r.is_spotlight);
    const [search, setSearch] = useState('');
    const term = search.trim().toLowerCase().replace(/^\.?/, '.');
    const shown = search.trim() ? rows.filter((r) => r.tld.includes(term)) : rows;

    const patch = (id: number, change: Partial<TldRow>) => setRows(rows.map((r) => (r.id === id ? { ...r, ...change } : r)));
    const move = (i: number, by: number) => {
        const next = [...rows];
        [next[i], next[i + by]] = [next[i + by], next[i]];
        setRows(next);
    };
    const save = useMutation({
        mutationFn: async () => (await api.put<Tld[]>('/tlds', { rows: rows.map(({ tld: _tld, ...r }) => r) })).data,
        onSuccess: (fresh) => qc.setQueryData(['tlds'], fresh),
    });
    const remove = useMutation({
        mutationFn: (id: number) => api.delete(`/tlds/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['tlds'] }),
    });
    const allTicked = rows.length > 0 && selected.length === rows.length;

    return (
        <div className="space-y-4">
            <div className="card flex flex-wrap items-center gap-2 p-4">
                <span className="mr-2 text-sm font-semibold text-slate-700" title="Featured first on the customer's domain page.">Spotlight TLDs</span>
                {Array.from({ length: SPOTLIGHT_LIMIT }, (_, i) => spotlight[i]).map((r, i) => (
                    <span key={r?.id ?? `empty-${i}`} className={`flex h-9 min-w-20 items-center justify-center gap-2 rounded-xl border border-dashed px-3 text-sm ${r ? 'border-slate-300 bg-white font-medium text-slate-800' : 'border-slate-200 text-slate-300'}`}>
                        {r ? <>{r.tld}<button type="button" aria-label={`Remove ${r.tld} from spotlight`} className="cursor-pointer text-slate-400 hover:text-rose-600" onClick={() => patch(r.id, { is_spotlight: false })}><X size={12} /></button></> : 'Empty'}
                    </span>
                ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-[1fr_18rem]">
                <Card title={`Domain pricing (${rows.length})`} action={<div className="flex items-center gap-2"><input className="ui-input h-9 w-40" placeholder="Search TLD" aria-label="Search TLDs" value={search} onChange={(e) => setSearch(e.target.value)} /><Button onClick={() => setPricing('new')}><Plus size={14} /> Add TLD</Button></div>}>
                    {rows.length === 0 ? <p className="p-6 text-center text-sm text-slate-500">No TLDs yet. Add one to sell domains.</p> : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[46rem] text-left text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 text-[11px] text-slate-500 uppercase">
                                        <th className="w-8 px-3 py-3"><input type="checkbox" aria-label="Tick all" checked={allTicked} onChange={() => setSelected(allTicked ? [] : rows.map((r) => r.id))} /></th>
                                        <th className="px-3 py-3 font-semibold">TLD</th>
                                        <th className="px-3 py-3 font-semibold">Pricing / yr</th>
                                        <th className="px-3 py-3 text-center font-semibold">Spotlight</th>
                                        <th className="px-3 py-3 text-center font-semibold">EPP Code</th>
                                        <th className="px-3 py-3 font-semibold">Auto Registration</th>
                                        <th className="px-3 py-3 text-center font-semibold">Active</th>
                                        <th className="px-3 py-3" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {shown.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-sm text-slate-500">No TLD matches "{search}".</td></tr>}
                                    {shown.map((r) => {
                                        const i = rows.indexOf(r);
                                        const t = byId.get(r.id);
                                        const full = !r.is_spotlight && spotlight.length >= SPOTLIGHT_LIMIT;

                                        return (
                                            <tr key={r.id} className={`border-b border-slate-100 last:border-0 ${selected.includes(r.id) ? 'bg-sky-50/60' : 'hover:bg-slate-50/70'}`}>
                                                <td className="px-3 py-2"><input type="checkbox" aria-label={`Tick ${r.tld}`} checked={selected.includes(r.id)} onChange={(e) => setSelected(e.target.checked ? [...selected, r.id] : selected.filter((x) => x !== r.id))} /></td>
                                                <td className="px-3 py-2 font-semibold text-slate-900">{r.tld}</td>
                                                <td className="px-3 py-2">
                                                    <button type="button" className="cursor-pointer rounded-lg border border-slate-200 px-2.5 py-1 text-left text-xs text-slate-600 hover:border-[var(--accent)]" onClick={() => t && setPricing(t)}>
                                                        {t ? <>{money(t.register_price)} <span className="text-slate-400">reg</span> · {money(t.renew_price)} <span className="text-slate-400">renew</span></> : 'Pricing'}
                                                    </button>
                                                </td>
                                                <td className="px-3 py-2 text-center"><input type="checkbox" aria-label={`Spotlight ${r.tld}`} disabled={full} title={full ? `Up to ${SPOTLIGHT_LIMIT} TLDs` : undefined} checked={r.is_spotlight} onChange={(e) => patch(r.id, { is_spotlight: e.target.checked })} /></td>
                                                <td className="px-3 py-2 text-center"><input type="checkbox" aria-label={`${r.tld} transfers need the EPP code`} checked={r.epp_required} onChange={(e) => patch(r.id, { epp_required: e.target.checked })} /></td>
                                                <td className="px-3 py-2">
                                                    <Select value={r.registrar ?? ''} onChange={(e) => patch(r.id, { registrar: e.target.value || null })}>
                                                        <option value="">None (manual)</option>
                                                        {meta.data?.registrars.map((x) => <option key={x.code} value={x.code}>{optionLabel(x)}</option>)}
                                                    </Select>
                                                </td>
                                                <td className="px-3 py-2 text-center"><input type="checkbox" aria-label={`${r.tld} on sale`} checked={r.is_active} onChange={(e) => patch(r.id, { is_active: e.target.checked })} /></td>
                                                <td className="px-3 py-2">
                                                    <div className="flex items-center justify-end gap-1 text-slate-400">
                                                        <button type="button" aria-label={`Move ${r.tld} up`} disabled={i === 0 || shown !== rows} title={shown !== rows ? 'Clear the search to reorder' : undefined} className="cursor-pointer rounded p-1 hover:text-slate-700 disabled:opacity-30" onClick={() => move(i, -1)}><ArrowUp size={14} /></button>
                                                        <button type="button" aria-label={`Move ${r.tld} down`} disabled={i === rows.length - 1 || shown !== rows} title={shown !== rows ? 'Clear the search to reorder' : undefined} className="cursor-pointer rounded p-1 hover:text-slate-700 disabled:opacity-30" onClick={() => move(i, 1)}><ArrowDown size={14} /></button>
                                                        <button type="button" aria-label={`Delete ${r.tld}`} disabled={remove.isPending} className="cursor-pointer rounded p-1 hover:text-rose-600" onClick={() => ask(`Delete ${r.tld}? Customers can no longer order it.`, () => remove.mutate(r.id))}><MinusCircle size={14} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <div className="space-y-2 border-t border-slate-200 p-4">
                        <ErrorNote error={save.error ?? remove.error} />
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-xs text-slate-500">EPP Code: transfers of that TLD must give the code. Auto Registration: the registrar new orders go to.</p>
                            <div className="flex items-center gap-3">
                                {save.isSuccess && !dirty && <span role="status" className="text-xs font-semibold text-emerald-700">Saved.</span>}
                                <Button disabled={!dirty || save.isPending} onClick={() => save.mutate()}>{save.isPending ? 'Saving...' : 'Save changes'}</Button>
                            </div>
                        </div>
                    </div>
                </Card>
                <div className="space-y-4">
                    <LookupPanels />
                    <BulkPricing ids={selected} onDone={() => setSelected([])} />
                </div>
            </div>
            {meta.data && meta.data.registrars.length > 0 && (
                <RegistrarTldList registrars={meta.data.registrars} onAdd={(preset) => setPricing(preset)} onEdit={(id) => { const t = byId.get(id); if (t) setPricing(t); }} />
            )}
            {pricing && <TldForm tld={pricing === 'new' || !('id' in pricing) ? null : pricing} preset={pricing !== 'new' && !('id' in pricing) ? pricing : undefined} onClose={() => setPricing(null)} />}
        </div>
    );
}

export function TldsPage() {
    const query = useQuery({ queryKey: ['tlds'], queryFn: async () => (await api.get<Tld[]>('/tlds')).data });

    // Remounts on fresh data so the editable rows start from what was saved.
    return <QueryState query={query}>{query.data && <TldTable key={query.dataUpdatedAt} data={query.data} />}</QueryState>;
}

type NsRow = { host: string; ip: string | null };
const NS_SLOTS = [0, 1, 2, 3, 4];
const NS_LABELS = ['Primary', 'Secondary', 'Third', 'Fourth', 'Fifth'];

type ServerRow = { id: number; name: string; module: string; hostname: string; port: number | null; username: string | null; auth_type: string; verify_tls: boolean; max_accounts: number; is_active: boolean; has_credentials?: boolean; ip_address?: string | null; assigned_ips?: string | null; nameservers?: NsRow[] | null; connection_ok?: boolean | null; connection_error?: string | null; connection_checked_at?: string | null; services_count: number; this_month: Cell };

function ServerForm({ server, onClose }: { server: ServerRow | null; onClose: () => void }) {
    const qc = useQueryClient();
    const meta = useMeta();
    const [form, setForm] = useState({
        name: server?.name ?? '', module: server?.module ?? 'cpanel', hostname: server?.hostname ?? '', port: server?.port ? String(server.port) : '',
        username: server?.username ?? '', auth_type: server?.auth_type ?? 'token', credentials: '', verify_tls: server?.verify_tls ?? true, max_accounts: String(server?.max_accounts ?? 0), is_active: server?.is_active ?? true,
        ip_address: server?.ip_address ?? '', assigned_ips: server?.assigned_ips ?? '',
        nameservers: NS_SLOTS.map((i) => ({ host: server?.nameservers?.[i]?.host ?? '', ip: server?.nameservers?.[i]?.ip ?? '' })),
    });
    const setNs = (i: number, change: { host?: string; ip?: string }) => setForm((f) => ({ ...f, nameservers: f.nameservers.map((ns, j) => (j === i ? { ...ns, ...change } : ns)) }));
    const currentCost = server ? Number(server.this_month.cost).toFixed(2) : '';
    const [showSecret, setShowSecret] = useState(false);
    const secretLabel = form.module === 'webuzo' ? 'Access Hash' : form.module === 'webdock' ? 'API token' : form.auth_type === 'password' ? 'Password' : 'API token';
    const webdock = form.module === 'webdock';
    const probe = useMutation({
        mutationFn: async () => (await api.post<{ ok: boolean; message: string }>('/servers/probe', { ...form, server_id: server?.id, port: form.port || null, max_accounts: Number(form.max_accounts) })).data,
    });
    const [cost, setCost] = useState({ amount: currentCost, starts_on: thisMonth() });
    const save = useMutation({
        mutationFn: async () => {
            const body = { ...form, port: form.port || null, max_accounts: Number(form.max_accounts) };
            const saved = (server ? await api.put<ServerRow>(`/servers/${server.id}`, body) : await api.post<ServerRow>('/servers', body)).data;
            // A changed monthly bill becomes a new cost entry from the chosen month.
            if (cost.amount !== '' && Number(cost.amount).toFixed(2) !== currentCost) {
                await api.post(`/servers/${saved.id}/costs`, { amount: cost.amount, starts_on: cost.starts_on });
            }
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['servers'] });
            qc.invalidateQueries({ queryKey: ['/servers/profit'] });
            qc.invalidateQueries({ queryKey: ['/servers/costs'] });
            onClose();
        },
    });

    return (
        <Modal title={server ? `Edit ${server.name}` : 'Add server'} onClose={onClose} wide>
            <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Name"><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
                    <Field label="Panel">
                        <Select value={form.module} onChange={(e) => setForm({ ...form, module: e.target.value })}>
                            {meta.data?.modules.map((m) => <option key={m.code} value={m.code}>{m.connected ? m.name : `${m.name} (not connected yet)`}</option>)}
                        </Select>
                    </Field>
                    <Field label="Hostname" hint={webdock ? 'The Webdock account: use api.webdock.io' : undefined}><Input required placeholder={webdock ? 'api.webdock.io' : 'server1.carrothost.com'} value={form.hostname} onChange={(e) => setForm({ ...form, hostname: e.target.value })} /></Field>
                    {!webdock && <Field label="Port" hint="Blank uses the default (WHM 2087, Webuzo 2005)"><Input type="number" min="1" max="65535" value={form.port} onChange={(e) => setForm({ ...form, port: e.target.value })} /></Field>}
                    {!webdock && <Field label="API username"><Input value={form.username} autoComplete="off" onChange={(e) => setForm({ ...form, username: e.target.value })} /></Field>}
                    {form.module === 'cpanel' && (
                        <Field label="Login type">
                            <Select value={form.auth_type} onChange={(e) => setForm({ ...form, auth_type: e.target.value })}><option value="token">API token</option><option value="password">Password</option></Select>
                        </Field>
                    )}
                    <Field label={secretLabel} hint={server?.has_credentials ? `A ${secretLabel.toLowerCase()} is saved. Leave blank to keep it, or type a new one.` : webdock ? 'Webdock > Account > API & Integrations: create a token with server read, write, execute and provisioning access' : server ? `No ${secretLabel.toLowerCase()} saved yet` : 'Stored encrypted'}>
                        <div className="relative">
                            {/* A random name and no autocomplete keep the browser from filling in the panel's own login password. */}
                            <input
                                className="ui-input pr-10"
                                type={showSecret ? 'text' : 'password'}
                                name={`server-secret-${server?.id ?? 'new'}`}
                                autoComplete="new-password"
                                data-lpignore="true"
                                data-1p-ignore="true"
                                spellCheck={false}
                                placeholder={server?.has_credentials ? 'Saved (hidden)' : ''}
                                value={form.credentials}
                                onChange={(e) => { setForm({ ...form, credentials: e.target.value }); probe.reset(); }}
                            />
                            <button type="button" className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer p-1 text-slate-400 hover:text-slate-700" aria-label={showSecret ? 'Hide' : 'Show'} onClick={() => setShowSecret(!showSecret)}>
                                {showSecret ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                        </div>
                    </Field>
                    <Field label="Max accounts" hint="0 means no limit"><Input type="number" min="0" value={form.max_accounts} onChange={(e) => setForm({ ...form, max_accounts: e.target.value })} /></Field>
                </div>
                <fieldset className="space-y-3 rounded-xl border border-slate-200 p-3">
                    <legend className="px-1 text-xs font-semibold text-slate-600">IP addresses</legend>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="IP address" hint="The server's main shared IP"><Input inputMode="decimal" placeholder="172.96.191.68" value={form.ip_address} onChange={(e) => setForm({ ...form, ip_address: e.target.value.trim() })} /></Field>
                        <Field label="Assigned IP addresses" hint="Extra IPs, one per line">
                            <textarea className="ui-input min-h-[4.5rem] font-mono text-xs" rows={3} value={form.assigned_ips} onChange={(e) => setForm({ ...form, assigned_ips: e.target.value })} />
                        </Field>
                    </div>
                </fieldset>
                <fieldset className="space-y-2 rounded-xl border border-slate-200 p-3">
                    <legend className="px-1 text-xs font-semibold text-slate-600">Nameservers</legend>
                    <p className="text-xs text-slate-500">Shown to customers on their hosting service, so they know where to point their domain.</p>
                    {form.nameservers.map((ns, i) => (
                        <div key={i} className="grid gap-2 sm:grid-cols-[7rem_1fr_11rem] sm:items-center">
                            <span className="text-xs font-medium text-slate-500">{NS_LABELS[i]} nameserver</span>
                            <input className="ui-input" aria-label={`${NS_LABELS[i]} nameserver`} placeholder={i < 2 ? `ns${i + 1}.carrothost.com` : 'Optional'} value={ns.host} onChange={(e) => setNs(i, { host: e.target.value.trim() })} />
                            <input className="ui-input" aria-label={`${NS_LABELS[i]} nameserver IP`} inputMode="decimal" placeholder="IP address" value={ns.ip} onChange={(e) => setNs(i, { ip: e.target.value.trim() })} />
                        </div>
                    ))}
                </fieldset>
                <div className="grid gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-2">
                    <Field label="Monthly bill (BDT)" hint="What this server costs you each month"><Input type="number" min="0" step="0.01" placeholder="0.00" value={cost.amount} onChange={(e) => setCost({ ...cost, amount: e.target.value })} /></Field>
                    <Field label="Applies from" hint="Earlier months keep their old cost"><Input type="month" required value={cost.starts_on} onChange={(e) => setCost({ ...cost, starts_on: e.target.value })} /></Field>
                </div>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.verify_tls} onChange={(e) => setForm({ ...form, verify_tls: e.target.checked })} /> Verify the TLS certificate</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Use for new accounts</label>
                {probe.data && (
                    <p role="status" className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-xs ${probe.data.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
                        {probe.data.ok ? <CheckCircle2 size={14} className="mt-0.5 shrink-0" /> : <XCircle size={14} className="mt-0.5 shrink-0" />} {probe.data.message}
                    </p>
                )}
                <ErrorNote error={save.error ?? probe.error} />
                <div className="flex flex-wrap justify-end gap-2">
                    <Button type="button" variant="ghost" className="mr-auto" disabled={probe.isPending} onClick={() => probe.mutate()} title="Try these details without saving"><PlugZap size={14} /> {probe.isPending ? 'Testing...' : 'Test connection'}</Button>
                    <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button disabled={save.isPending}>Save server</Button>
                </div>
            </form>
        </Modal>
    );
}

type TestResult = { ok: boolean; message: string };

const testServer = async (id: number) => (await api.post<TestResult>(`/servers/${id}/test`)).data;

/** A saved result older than this is re-checked quietly when the page opens. */
const RECHECK_AFTER_MS = 10 * 60 * 1000;

function ConnectionStatus({ server, checking }: { server: ServerRow; checking: boolean }) {
    if (checking) return <Status value="checking" />;
    if (server.connection_ok === null || server.connection_ok === undefined) return <Status value="not_checked" />;

    const when = server.connection_checked_at ? `Checked ${new Date(server.connection_checked_at).toLocaleString()}` : '';
    const title = server.connection_ok ? when : [server.connection_error, when].filter(Boolean).join('\n\n');

    return <span title={title} className="cursor-help"><Status value={server.connection_ok ? 'connected' : 'not_connected'} /></span>;
}

function TestButton({ id, onDone }: { id: number; onDone: () => void }) {
    const test = useMutation({
        mutationFn: () => testServer(id),
        onSuccess: (r) => alertDialog(r.message),
        onError: (e) => alertDialog(errorMessage(e)),
        onSettled: onDone,
    });

    return <Button variant="link" disabled={test.isPending} onClick={() => test.mutate()}>{test.isPending ? 'Testing...' : 'Test'}</Button>;
}

export function ServersPage() {
    const qc = useQueryClient();
    const query = useQuery({ queryKey: ['servers'], queryFn: async () => (await api.get<ServerRow[]>('/servers')).data });
    const [editing, setEditing] = useState<ServerRow | 'new' | null>(null);
    const [costs, setCosts] = useState<ServerRow | null>(null);
    const [checking, setChecking] = useState<number[]>([]);
    const checked = useRef(new Set<number>());
    const refresh = () => qc.invalidateQueries({ queryKey: ['servers'] });

    // Check each server once per visit when it was never tested or the last test is stale.
    useEffect(() => {
        const due = (query.data ?? []).filter((s) => !checked.current.has(s.id)
            && (!s.connection_checked_at || Date.now() - new Date(s.connection_checked_at).getTime() > RECHECK_AFTER_MS));

        if (!due.length) return;
        due.forEach((s) => checked.current.add(s.id));
        setChecking((ids) => [...ids, ...due.map((s) => s.id)]);
        Promise.allSettled(due.map((s) => testServer(s.id))).finally(() => {
            setChecking((ids) => ids.filter((id) => !due.some((s) => s.id === id)));
            refresh();
        });
    }, [query.data]);

    return (
        <div className="space-y-4">
            <Card title="Servers Config" action={<Button onClick={() => setEditing('new')}><Plus size={14} /> Add server</Button>}>
                <QueryState query={query}>
                    <Table<ServerRow>
                        rows={query.data ?? []}
                        empty="No servers yet. Add a WHM server so paid orders can provision automatically."
                        columns={[
                            { header: 'Name', cell: (s) => <span className="font-medium">{s.name}</span> },
                            { header: 'Panel', cell: (s) => s.module },
                            {
                                header: 'Hostname',
                                cell: (s) => (
                                    <div>
                                        <div>{s.hostname}</div>
                                        {s.ip_address && <div className="font-mono text-[11px] text-slate-500">{s.ip_address}</div>}
                                        {s.nameservers && s.nameservers.length > 0 && <div className="text-[11px] text-slate-500" title={s.nameservers.map((n) => `${n.host}${n.ip ? ` (${n.ip})` : ''}`).join('\n')}>{s.nameservers.map((n) => n.host).join(', ')}</div>}
                                    </div>
                                ),
                            },
                            { header: 'Accounts', cell: (s) => `${s.services_count}${s.max_accounts ? ` / ${s.max_accounts}` : ''}`, align: 'right' },
                            { header: 'Monthly Cost', cell: (s) => <button type="button" className="table-action-link tabular-nums" onClick={() => setCosts(s)}>{Number(s.this_month.cost) > 0 ? money(s.this_month.cost) : 'Set cost'}</button>, align: 'right' },
                            { header: 'Sales This Month', cell: (s) => <span className="tabular-nums">{money(s.this_month.sales)}</span>, align: 'right' },
                            { header: 'Profit This Month', cell: (s) => <Profit value={s.this_month.profit} />, align: 'right' },
                            { header: 'Connection', cell: (s) => <ConnectionStatus server={s} checking={checking.includes(s.id)} /> },
                            { header: 'Status', cell: (s) => <Status value={s.is_active ? 'active' : 'cancelled'} /> },
                            { header: '', cell: (s) => <div className="flex justify-end gap-3"><TestButton id={s.id} onDone={refresh} /><Button variant="link" onClick={() => setCosts(s)}>Costs</Button><Button variant="link" onClick={() => setEditing(s)}>Edit</Button></div>, align: 'right' },
                        ]}
                    />
                </QueryState>
            </Card>
            {query.data && query.data.length > 0 && <ServerProfitReport servers={query.data} />}
            {editing && <ServerForm server={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
            {costs && <ServerCostsModal server={costs} onClose={() => setCosts(null)} />}
        </div>
    );
}
