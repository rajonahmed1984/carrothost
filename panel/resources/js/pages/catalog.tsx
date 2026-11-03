import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FolderPlus, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { api, errorMessage, money } from '../api';
import { Button, Card, ErrorNote, Field, Input, Modal, QueryState, Select, Status, Table, type Column } from '../ui';

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
                    {group ? <Button type="button" variant="link-danger" disabled={remove.isPending} onClick={() => window.confirm(`Delete the ${group.name} group?`) && remove.mutate()}>Delete group</Button> : <span />}
                    <div className="flex gap-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button disabled={save.isPending}>Save group</Button></div>
                </div>
            </form>
        </Modal>
    );
}

type Product = { id: number; product_group_id: number | null; name: string; type: string; description: string | null; module: string | null; module_package: string | null; is_active: boolean; prices: { cycle: string; price: string; setup_fee: string }[] };

function ProductForm({ product, groupId, onClose }: { product: Product | null; groupId: number | null; onClose: () => void }) {
    const qc = useQueryClient();
    const meta = useMeta();
    const groups = useGroups();
    const [form, setForm] = useState({
        name: product?.name ?? '', product_group_id: String((product ? product.product_group_id : groupId) ?? ''), type: product?.type ?? 'shared_hosting', module: product?.module ?? '',
        module_package: product?.module_package ?? '', description: product?.description ?? '', is_active: product?.is_active ?? true,
    });
    const [prices, setPrices] = useState(product?.prices.map((p) => ({ ...p })) ?? [{ cycle: 'annually', price: '', setup_fee: '0' }]);

    const save = useMutation({
        mutationFn: () => {
            const body = { ...form, product_group_id: form.product_group_id ? Number(form.product_group_id) : null, description: form.description || null, module: form.module || null, prices };

            return product ? api.put(`/products/${product.id}`, body) : api.post('/products', body);
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); qc.invalidateQueries({ queryKey: ['product-groups'] }); onClose(); },
    });

    return (
        <Modal title={product ? 'Edit product' : 'Add product'} onClose={onClose}>
            <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-3">
                <Field label="Name"><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
                <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Group" hint="Customers can only order products in a visible group.">
                        <Select value={form.product_group_id} onChange={(e) => setForm({ ...form, product_group_id: e.target.value })}>
                            <option value="">No group</option>
                            {groups.data?.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </Select>
                    </Field>
                    <Field label="Type">
                        <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                            <option value="shared_hosting">Shared hosting</option><option value="vps">VPS</option><option value="other">Other</option>
                        </Select>
                    </Field>
                </div>
                <Field label="Description" hint="Shown to customers on the order page. One feature per line works well.">
                    <textarea rows={3} className="ui-input py-2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Automation">
                        <Select value={form.module} onChange={(e) => setForm({ ...form, module: e.target.value })}>
                            <option value="">Manual fulfilment</option>
                            {meta.data?.modules.map((m) => <option key={m.code} value={m.code}>{optionLabel(m)}</option>)}
                        </Select>
                    </Field>
                    <Field label="Server package" hint="WHM package or Webuzo plan name"><Input value={form.module_package} onChange={(e) => setForm({ ...form, module_package: e.target.value })} /></Field>
                </div>
                <div className="space-y-2">
                    <span className="block text-xs font-medium text-slate-500">Pricing ({meta.data?.currency})</span>
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
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Available for new orders</label>
                <ErrorNote error={save.error} />
                <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button disabled={save.isPending}>Save product</Button></div>
            </form>
        </Modal>
    );
}

const productColumns = (edit: (p: Product) => void): Column<Product>[] => [
    { header: 'Name', cell: (p) => <span className="font-medium">{p.name}</span> },
    { header: 'Type', cell: (p) => p.type.replace('_', ' ') },
    { header: 'Automation', cell: (p) => p.module ?? 'Manual' },
    { header: 'Pricing', cell: (p) => p.prices.map((x) => `${money(x.price)} / ${x.cycle}`).join(', ') },
    { header: 'Status', cell: (p) => <Status value={p.is_active ? 'active' : 'cancelled'} /> },
    { header: '', cell: (p) => <Button variant="link" onClick={() => edit(p)}>Edit</Button>, align: 'right' },
];

export function ProductsPage() {
    const query = useQuery({ queryKey: ['products'], queryFn: async () => (await api.get<Product[]>('/products')).data });
    const groups = useGroups();
    const [editing, setEditing] = useState<{ product: Product | null; groupId: number | null } | null>(null);
    const [editingGroup, setEditingGroup] = useState<Group | 'new' | null>(null);
    const columns = productColumns((product) => setEditing({ product, groupId: product.product_group_id }));
    const ungrouped = query.data?.filter((p) => !groups.data?.some((g) => g.id === p.product_group_id)) ?? [];

    return (
        <>
            <div className="mb-4 flex flex-wrap justify-end gap-2">
                <Button variant="ghost" onClick={() => setEditingGroup('new')}><FolderPlus size={14} /> Add group</Button>
                <Button onClick={() => setEditing({ product: null, groupId: null })}><Plus size={14} /> Add product</Button>
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
                                        <Button variant="ghost" onClick={() => setEditing({ product: null, groupId: g.id })}><Plus size={14} /> Add product</Button>
                                    </div>
                                }
                            >
                                {g.headline && <p className="border-b border-slate-200 px-4 py-2 text-xs text-slate-500">{g.headline}</p>}
                                <Table<Product> rows={query.data?.filter((p) => p.product_group_id === g.id) ?? []} empty="No products in this group yet." columns={columns} />
                            </Card>
                        ))}
                        {ungrouped.length > 0 && (
                            <Card title="Not in a group">
                                <p className="border-b border-slate-200 px-4 py-2 text-xs text-slate-500">Customers cannot order these until you put them in a group.</p>
                                <Table<Product> rows={ungrouped} empty="" columns={columns} />
                            </Card>
                        )}
                    </div>
                </QueryState>
            </QueryState>
            {editing && <ProductForm product={editing.product} groupId={editing.groupId} onClose={() => setEditing(null)} />}
            {editingGroup && <GroupForm group={editingGroup === 'new' ? null : editingGroup} onClose={() => setEditingGroup(null)} />}
        </>
    );
}

type Tld = { id: number; tld: string; registrar: string | null; register_price: string; renew_price: string; transfer_price: string; is_active: boolean };

function TldForm({ tld, onClose }: { tld: Tld | null; onClose: () => void }) {
    const qc = useQueryClient();
    const meta = useMeta();
    const [form, setForm] = useState({
        tld: tld?.tld ?? '', registrar: tld?.registrar ?? '', register_price: tld?.register_price ?? '',
        renew_price: tld?.renew_price ?? '', transfer_price: tld?.transfer_price ?? '', is_active: tld?.is_active ?? true,
    });
    const save = useMutation({
        mutationFn: () => {
            const body = { ...form, registrar: form.registrar || null };

            return tld ? api.put(`/tlds/${tld.id}`, body) : api.post('/tlds', body);
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['tlds'] }); onClose(); },
    });

    return (
        <Modal title={tld ? `Edit ${tld.tld}` : 'Add TLD'} onClose={onClose}>
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

export function TldsPage() {
    const query = useQuery({ queryKey: ['tlds'], queryFn: async () => (await api.get<Tld[]>('/tlds')).data });
    const [editing, setEditing] = useState<Tld | 'new' | null>(null);

    return (
        <>
            <Card title="Domain pricing" action={<Button onClick={() => setEditing('new')}><Plus size={14} /> Add TLD</Button>}>
                <QueryState query={query}>
                    <Table<Tld>
                        rows={query.data ?? []}
                        empty="No TLDs yet. Add one to sell domains."
                        columns={[
                            { header: 'TLD', cell: (t) => <span className="font-medium">{t.tld}</span> },
                            { header: 'Registrar', cell: (t) => t.registrar ?? 'Manual' },
                            { header: 'Register', cell: (t) => money(t.register_price), align: 'right' },
                            { header: 'Renew', cell: (t) => money(t.renew_price), align: 'right' },
                            { header: 'Transfer', cell: (t) => money(t.transfer_price), align: 'right' },
                            { header: 'Status', cell: (t) => <Status value={t.is_active ? 'active' : 'cancelled'} /> },
                            { header: '', cell: (t) => <Button variant="link" onClick={() => setEditing(t)}>Edit</Button>, align: 'right' },
                        ]}
                    />
                </QueryState>
            </Card>
            {editing && <TldForm tld={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
        </>
    );
}

type ServerRow = { id: number; name: string; module: string; hostname: string; port: number | null; username: string | null; auth_type: string; verify_tls: boolean; max_accounts: number; is_active: boolean; services_count: number };

function ServerForm({ server, onClose }: { server: ServerRow | null; onClose: () => void }) {
    const qc = useQueryClient();
    const meta = useMeta();
    const [form, setForm] = useState({
        name: server?.name ?? '', module: server?.module ?? 'cpanel', hostname: server?.hostname ?? '', port: server?.port ? String(server.port) : '',
        username: server?.username ?? '', auth_type: server?.auth_type ?? 'token', credentials: '', verify_tls: server?.verify_tls ?? true, max_accounts: String(server?.max_accounts ?? 0), is_active: server?.is_active ?? true,
    });
    const save = useMutation({
        mutationFn: () => {
            const body = { ...form, port: form.port || null, max_accounts: Number(form.max_accounts) };

            return server ? api.put(`/servers/${server.id}`, body) : api.post('/servers', body);
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['servers'] }); onClose(); },
    });

    return (
        <Modal title={server ? `Edit ${server.name}` : 'Add server'} onClose={onClose}>
            <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Name"><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
                    <Field label="Panel">
                        <Select value={form.module} onChange={(e) => setForm({ ...form, module: e.target.value })}>
                            {meta.data?.modules.map((m) => <option key={m.code} value={m.code}>{m.connected ? m.name : `${m.name} (not connected yet)`}</option>)}
                        </Select>
                    </Field>
                    <Field label="Hostname"><Input required placeholder="server1.carrothost.com" value={form.hostname} onChange={(e) => setForm({ ...form, hostname: e.target.value })} /></Field>
                    <Field label="Port" hint="Blank uses the default (WHM 2087, Webuzo 2005)"><Input type="number" min="1" max="65535" value={form.port} onChange={(e) => setForm({ ...form, port: e.target.value })} /></Field>
                    <Field label="API username"><Input value={form.username} autoComplete="off" onChange={(e) => setForm({ ...form, username: e.target.value })} /></Field>
                    {form.module === 'cpanel' && (
                        <Field label="Login type">
                            <Select value={form.auth_type} onChange={(e) => setForm({ ...form, auth_type: e.target.value })}><option value="token">API token</option><option value="password">Password</option></Select>
                        </Field>
                    )}
                    <Field label={form.module === 'webuzo' ? 'Access Hash' : form.auth_type === 'password' ? 'Password' : 'API token'} hint={server ? 'Leave blank to keep the current value' : 'Stored encrypted'}><Input type="password" autoComplete="new-password" value={form.credentials} onChange={(e) => setForm({ ...form, credentials: e.target.value })} /></Field>
                    <Field label="Max accounts" hint="0 means no limit"><Input type="number" min="0" value={form.max_accounts} onChange={(e) => setForm({ ...form, max_accounts: e.target.value })} /></Field>
                </div>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.verify_tls} onChange={(e) => setForm({ ...form, verify_tls: e.target.checked })} /> Verify the TLS certificate</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Use for new accounts</label>
                <ErrorNote error={save.error} />
                <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button disabled={save.isPending}>Save server</Button></div>
            </form>
        </Modal>
    );
}

function TestButton({ id }: { id: number }) {
    const test = useMutation({
        mutationFn: async () => (await api.post<{ ok: boolean; message: string }>(`/servers/${id}/test`)).data,
        onSuccess: (r) => window.alert(r.message),
        onError: (e) => window.alert(errorMessage(e)),
    });

    return <Button variant="link" disabled={test.isPending} onClick={() => test.mutate()}>{test.isPending ? 'Testing...' : 'Test'}</Button>;
}

export function ServersPage() {
    const query = useQuery({ queryKey: ['servers'], queryFn: async () => (await api.get<ServerRow[]>('/servers')).data });
    const [editing, setEditing] = useState<ServerRow | 'new' | null>(null);

    return (
        <>
            <Card title="Servers" action={<Button onClick={() => setEditing('new')}><Plus size={14} /> Add server</Button>}>
                <QueryState query={query}>
                    <Table<ServerRow>
                        rows={query.data ?? []}
                        empty="No servers yet. Add a WHM server so paid orders can provision automatically."
                        columns={[
                            { header: 'Name', cell: (s) => <span className="font-medium">{s.name}</span> },
                            { header: 'Panel', cell: (s) => s.module },
                            { header: 'Hostname', cell: (s) => s.hostname },
                            { header: 'Accounts', cell: (s) => `${s.services_count}${s.max_accounts ? ` / ${s.max_accounts}` : ''}`, align: 'right' },
                            { header: 'Status', cell: (s) => <Status value={s.is_active ? 'active' : 'cancelled'} /> },
                            { header: '', cell: (s) => <div className="flex justify-end gap-3"><TestButton id={s.id} /><Button variant="link" onClick={() => setEditing(s)}>Edit</Button></div>, align: 'right' },
                        ]}
                    />
                </QueryState>
            </Card>
            {editing && <ServerForm server={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
        </>
    );
}
