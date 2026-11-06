import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRightLeft, ArrowUpCircle, Check, ChevronDown, CreditCard, ExternalLink, Eye, FileText, Gauge, LogIn, Mail, MonitorSmartphone, NotebookPen, Package, PauseCircle, RefreshCw, Send, Settings2, Terminal, Trash2, Undo2, User, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, errorMessage, money } from '../api';
import { Button, Dropdown, ErrorNote, Modal, QueryState, Status } from '../ui';
import { Row, Section, Toggle } from './domain-view';
import { SendMessage } from './sales';
import { ChangePasswordModal, TransferModal, UpgradeModal } from './service-tools';
import { alertDialog, ask } from '../dialog';
import { VpsPanel } from './vps-panel';

type Option = { code: string; name: string };

export type ServiceFull = {
    id: number; client_id: number; order_id: number | null; product_id: number; server_id: number | null; domain: string | null;
    cycle: string; quantity: number; recurring_amount: string; first_payment_amount: string; payment_method: string | null; subscription_id: string | null;
    status: string; provision_status: string; provision_error: string | null; remote_id: string | null; dedicated_ip: string | null;
    auto_suspended: boolean; override_suspend_until: string | null; terminate_end_of_cycle: boolean; terminate_reason: string | null;
    next_due_date: string | null; registered_at: string | null; termination_date: string | null; admin_notes: string | null;
    disk_usage: number | null; disk_limit: number | null; bw_usage: number | null; bw_limit: number | null; usage_updated_at: string | null;
    client: { id: number; name: string; email: string };
    product: { id: number; name: string; module: string | null; type: string };
    server: { id: number; name: string; hostname: string } | null;
    order: { id: number; order_number: string | null } | null;
    username: string | null; has_password: boolean; panel_url: string | null; has_tools: boolean; is_vps?: boolean;
    usage_metrics: { key: string; label: string; used: string; limit: string | null; percent: number | null }[] | null;
    pending_upgrade: { id: number; invoice_id: number | null; new_cycle: string; amount_due: string; new_product: { id: number; name: string } | null } | null;
    client_services: { id: number; name: string; status: string }[];
    options: {
        products: { id: number; name: string; module: string | null }[];
        servers: { id: number; name: string; module: string; max_accounts: number; services_count: number }[];
        payment_methods: Option[]; cycles: string[]; statuses: string[];
    };
};

type Form = {
    product_id: number; server_id: string; domain: string; dedicated_ip: string; remote_id: string; username: string; password: string; status: string;
    registered_at: string; quantity: number; first_payment_amount: string; recurring_amount: string; recalculate: boolean;
    next_due_date: string; termination_date: string; cycle: string; payment_method: string; subscription_id: string;
    override: boolean; override_suspend_until: string; terminate_end_of_cycle: boolean; terminate_reason: string; admin_notes: string;
};

const toForm = (s: ServiceFull): Form => ({
    product_id: s.product_id,
    server_id: s.server_id ? String(s.server_id) : '',
    domain: s.domain ?? '',
    dedicated_ip: s.dedicated_ip ?? '',
    remote_id: s.remote_id ?? '',
    username: s.username ?? '',
    password: '',
    status: s.status,
    registered_at: s.registered_at ?? '',
    quantity: s.quantity,
    first_payment_amount: s.first_payment_amount,
    recurring_amount: s.recurring_amount,
    recalculate: false,
    next_due_date: s.next_due_date ?? '',
    termination_date: s.termination_date ?? '',
    cycle: s.cycle,
    payment_method: s.payment_method ?? '',
    subscription_id: s.subscription_id ?? '',
    override: s.override_suspend_until !== null,
    override_suspend_until: s.override_suspend_until ?? '',
    terminate_end_of_cycle: s.terminate_end_of_cycle,
    terminate_reason: s.terminate_reason ?? '',
    admin_notes: s.admin_notes ?? '',
});

const label = (v: string) => v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const size = (mb: number) => (mb >= 1024 ? `${(mb / 1024).toFixed(2)} GB` : `${mb} MB`);

const confirmText: Record<string, string> = {
    create: 'Create this account on the server now?',
    suspend: 'Suspend this account? The customer site goes offline.',
    unsuspend: 'Unsuspend this account?',
    terminate: 'Terminate this account? This permanently deletes the customer files, email and databases from the server.',
};

function UsageBar({ title, used, limit }: { title: string; used: number; limit: number }) {
    const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
    const tone = pct >= 90 ? 'bg-rose-500' : pct >= 70 ? 'bg-amber-500' : 'bg-[var(--accent)]';

    return (
        <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="font-semibold text-slate-800">{title}</span>
                <span className="text-xs text-slate-500 tabular-nums">{size(used)} of {limit > 0 ? size(limit) : 'Unlimited'}{limit > 0 && ` · ${pct}%`}</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label={`${title} used`} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                <div className={`h-full rounded-full ${tone}`} style={{ width: `${limit > 0 ? Math.max(pct, 2) : 0}%` }} />
            </div>
        </div>
    );
}

function LoginDetails({ id, onClose }: { id: number; onClose: () => void }) {
    const q = useQuery({ queryKey: ['/services/credentials', id], queryFn: async () => (await api.post<{ username?: string; password?: string }>(`/services/${id}/credentials`)).data, gcTime: 0 });

    return (
        <Modal title="Account login" onClose={onClose}>
            <QueryState query={q}>
                <dl className="space-y-3">
                    <div><dt className="text-xs text-slate-500">Username</dt><dd className="font-mono text-slate-900">{q.data?.username ?? '-'}</dd></div>
                    <div><dt className="text-xs text-slate-500">Password</dt><dd className="font-mono break-all text-slate-900">{q.data?.password ?? 'Not stored'}</dd></div>
                </dl>
                <p className="mt-3 text-xs text-slate-500">This view is recorded in the activity log.</p>
            </QueryState>
        </Modal>
    );
}

/**
 * The admin's full view of one product/service: account, billing, module commands, usage and notes.
 * Used on its own page and inside the client profile's Services tab.
 */
export function ServiceView({ id, onSelect, onBack }: { id: number; onSelect: (id: number) => void; onBack?: () => void }) {
    const query = useQuery({ queryKey: ['/services', String(id)], queryFn: async () => (await api.get<ServiceFull>(`/services/${id}`)).data });

    return (
        <QueryState query={query}>
            {query.data && <ServiceEditor key={query.data.id} s={query.data} onSelect={onSelect} onBack={onBack} />}
        </QueryState>
    );
}

function ServiceEditor({ s, onSelect, onBack }: { s: ServiceFull; onSelect: (id: number) => void; onBack?: () => void }) {
    const qc = useQueryClient();
    const [form, setForm] = useState<Form>(() => toForm(s));
    const [login, setLogin] = useState(false);
    const [dialog, setDialog] = useState<'upgrade' | 'transfer' | 'message' | 'password' | null>(null);
    const [notice, setNotice] = useState<ReactNode>(null);
    const navigate = useNavigate();
    const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));
    const dirty = JSON.stringify(form) !== JSON.stringify(toForm(s));
    const refresh = () => {
        qc.invalidateQueries({ queryKey: ['/services', String(s.id)] });
        qc.invalidateQueries({ queryKey: ['/clients', String(s.client_id)] });
    };

    const save = useMutation({
        mutationFn: async () => {
            const { override, password, server_id, ...rest } = form;
            const body: Record<string, unknown> = {
                ...rest,
                server_id: server_id ? Number(server_id) : null,
                domain: rest.domain || null,
                dedicated_ip: rest.dedicated_ip || null,
                remote_id: rest.remote_id.trim() || null,
                username: rest.username || null,
                registered_at: rest.registered_at || null,
                next_due_date: rest.next_due_date || null,
                termination_date: rest.termination_date || null,
                payment_method: rest.payment_method || null,
                subscription_id: rest.subscription_id || null,
                override_suspend_until: override && rest.override_suspend_until ? rest.override_suspend_until : null,
                terminate_reason: rest.terminate_reason || null,
                admin_notes: rest.admin_notes || null,
            };
            if (password) body.password = password;

            return (await api.put<ServiceFull>(`/services/${s.id}`, body)).data;
        },
        onSuccess: (fresh) => {
            qc.setQueryData(['/services', String(s.id)], fresh);
            qc.invalidateQueries({ queryKey: ['/clients', String(s.client_id)] });
            setForm(toForm(fresh));
        },
    });

    const act = useMutation({
        mutationFn: (action: string) => api.post(`/services/${s.id}/action`, { action }),
        onSettled: refresh,
        onError: (e) => alertDialog(errorMessage(e)),
    });
    const run = (action: string) => {
        if (action === 'password') return setDialog('password');
        if (action === 'package') return ask(`Move ${s.remote_id} to the "${s.product.name}" product's server package?`, () => changePackage.mutate());

        return ask(confirmText[action], () => act.mutate(action));
    };
    const fresh = (data: ServiceFull) => {
        qc.setQueryData(['/services', String(s.id)], data);
        qc.invalidateQueries({ queryKey: ['/clients'] });
    };
    const changePackage = useMutation({
        mutationFn: async () => (await api.post<ServiceFull>(`/services/${s.id}/package`)).data,
        onSuccess: (data) => { fresh(data); setNotice('Package changed on the server.'); },
        onError: (e) => alertDialog(errorMessage(e)),
    });
    const usage = useMutation({
        mutationFn: async () => (await api.post<ServiceFull>(`/services/${s.id}/usage`)).data,
        onSuccess: fresh,
    });
    const sso = useMutation({ mutationFn: async () => (await api.post<{ url: string }>(`/services/${s.id}/sso`)).data.url });
    // Open the tab first, while the click still counts as the user's, then point it at the one-time link.
    const loginToPanel = () => {
        const tab = window.open('about:blank', '_blank');
        sso.mutate(undefined, {
            onSuccess: (url) => { if (tab) tab.location.href = url; else window.location.href = url; },
            onError: (e) => { tab?.close(); alertDialog(errorMessage(e)); },
        });
    };
    const welcome = useMutation({
        mutationFn: async () => (await api.post<{ message: string }>(`/services/${s.id}/welcome`)).data,
        onSuccess: (data) => setNotice(data.message),
        onError: (e) => alertDialog(errorMessage(e)),
    });
    const remove = useMutation({
        mutationFn: () => api.delete(`/services/${s.id}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['/clients'] });
            if (onBack) onBack(); else navigate(`/admin/clients/${s.client.id}?tab=services`);
        },
        onError: (e) => alertDialog(errorMessage(e)),
    });
    const busy = act.isPending || ['queued', 'running'].includes(s.provision_status);
    const hasModule = !!s.product.module;
    const noModule = hasModule ? `The ${s.product.module} module cannot do this. Do it in the server's control panel.` : 'This product has no server module.';
    const commands: { key: string; label: string; enabled: boolean; why: string; danger?: boolean }[] = [
        { key: 'create', label: s.provision_status === 'failed' ? 'Retry Create' : 'Create', enabled: hasModule && s.status === 'active' && !s.remote_id, why: !hasModule ? noModule : s.remote_id ? 'The account already exists.' : 'Only an active (paid) service can be created.' },
        { key: 'suspend', label: 'Suspend', enabled: !!s.remote_id && s.status === 'active', why: s.remote_id ? 'Only an active service can be suspended.' : 'No account on a server yet.' },
        { key: 'unsuspend', label: 'Unsuspend', enabled: !!s.remote_id && s.status === 'suspended', why: s.remote_id ? 'The service is not suspended.' : 'No account on a server yet.' },
        { key: 'terminate', label: 'Terminate', enabled: !!s.remote_id && s.status !== 'terminated', why: 'No account on a server to terminate.', danger: true },
        { key: 'package', label: 'Change Package', enabled: s.has_tools, why: s.remote_id ? noModule : 'No account on a server yet.' },
        { key: 'password', label: 'Change Password', enabled: s.has_tools, why: s.remote_id ? noModule : 'No account on a server yet.' },
    ];
    const hasUsage = s.disk_limit !== null || s.bw_limit !== null;

    return (
        <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-4 pb-20">
            {/* Header */}
            <section className="card flex flex-wrap items-center gap-3 px-4 py-3">
                {onBack && <button type="button" onClick={onBack} className="icon-btn h-9 w-9" aria-label="Back to services"><ArrowLeft size={16} /></button>}
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]"><Package size={18} /></span>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-lg font-semibold text-slate-900">{s.product.name}</h2>
                        <Status value={s.status} />
                        {s.provision_status !== 'done' && s.provision_status !== 'none' && <Status value={s.provision_status} />}
                        {s.terminate_end_of_cycle && <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700">Terminates end of cycle</span>}
                    </div>
                    <div className="text-xs text-slate-500">
                        {s.domain ? <a className="table-action-link" href={`https://${s.domain}`} target="_blank" rel="noreferrer">{s.domain}</a> : 'No domain'} · <Link className="table-action-link" to={`/admin/clients/${s.client.id}`}>{s.client.name}</Link> · {money(s.recurring_amount)} / {s.cycle}
                    </div>
                </div>
                <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                    <label className="sr-only" htmlFor={`svc-switch-${s.id}`}>Switch service</label>
                    <select id={`svc-switch-${s.id}`} className="ui-input h-9 min-w-0 flex-1 sm:w-64 sm:flex-none" value={s.id} onChange={(e) => onSelect(Number(e.target.value))}>
                        {s.client_services.map((o) => <option key={o.id} value={o.id}>{o.name}{o.status !== 'active' ? ` (${label(o.status)})` : ''}</option>)}
                    </select>
                    {s.has_tools
                        ? <button type="button" onClick={loginToPanel} disabled={sso.isPending} className="ui-btn ui-btn-primary h-9"><LogIn size={14} /> {sso.isPending ? 'Signing in...' : 'Login to Control Panel'}</button>
                        : s.panel_url && <a href={s.panel_url} target="_blank" rel="noreferrer" className="ui-btn ui-btn-primary h-9"><LogIn size={14} /> Control Panel</a>}
                    <Dropdown label="More actions" buttonClassName="ui-btn ui-btn-secondary h-9" button={<>More <ChevronDown size={14} /></>} menuClassName="w-60 py-1 text-sm">
                        <Link role="menuitem" to={`/admin/clients/${s.client.id}?tab=invoices`} className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left text-slate-700 hover:bg-slate-50"><FileText size={14} className="text-slate-400" /> View Invoices</Link>
                        <button type="button" role="menuitem" onClick={() => setDialog('upgrade')} className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left text-slate-700 hover:bg-slate-50"><ArrowUpCircle size={14} className="text-slate-400" /> Upgrade/Downgrade</button>
                        <button type="button" role="menuitem" onClick={() => setDialog('transfer')} className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left text-slate-700 hover:bg-slate-50"><ArrowRightLeft size={14} className="text-slate-400" /> Transfer Ownership</button>
                        <div className="my-1 border-t border-slate-100" />
                        <button type="button" role="menuitem" onClick={() => setDialog('message')} className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left text-slate-700 hover:bg-slate-50"><Mail size={14} className="text-slate-400" /> Send Message</button>
                        <button type="button" role="menuitem" disabled={welcome.isPending} onClick={() => ask(`Email the welcome message to ${s.client.email}?`, () => welcome.mutate())} className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left text-slate-700 hover:bg-slate-50"><Send size={14} className="text-slate-400" /> Resend Welcome Email</button>
                        <button type="button" role="menuitem" onClick={() => setLogin(true)} className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left text-slate-700 hover:bg-slate-50"><Eye size={14} className="text-slate-400" /> Show Login Details</button>
                        <div className="my-1 border-t border-slate-100" />
                        <Link role="menuitem" to={`/admin/clients/${s.client.id}`} className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left text-slate-700 hover:bg-slate-50"><User size={14} className="text-slate-400" /> Client Profile</Link>
                        {s.order && <Link role="menuitem" to={`/admin/orders/${s.order.id}`} className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left text-slate-700 hover:bg-slate-50"><CreditCard size={14} className="text-slate-400" /> View Order</Link>}
                        {onBack && <Link role="menuitem" to={`/admin/products-services/${s.id}`} className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left text-slate-700 hover:bg-slate-50"><ExternalLink size={14} className="text-slate-400" /> Open Full Page</Link>}
                        <div className="my-1 border-t border-slate-100" />
                        <button
                            type="button"
                            role="menuitem"
                            disabled={remove.isPending}
                            onClick={() => ask(`Delete this service record?${s.remote_id && s.status !== 'terminated' ? ` The account ${s.remote_id} stays on the server. Terminate it first to remove it there.` : ''}`, () => remove.mutate())}
                            className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left text-rose-600 hover:bg-rose-50"
                        >
                            <Trash2 size={14} /> Delete
                        </button>
                    </Dropdown>
                </div>
            </section>

            {notice && (
                <p role="status" className="flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-900">
                    <span className="flex items-center gap-2"><Check size={15} /> {notice}</span>
                    <button type="button" aria-label="Dismiss" className="cursor-pointer text-emerald-700" onClick={() => setNotice(null)}><X size={14} /></button>
                </p>
            )}
            {s.pending_upgrade && (
                <p className="flex flex-wrap items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-sky-900">
                    <ArrowUpCircle size={15} /> Change to <strong>{s.pending_upgrade.new_product?.name}</strong> ({s.pending_upgrade.new_cycle}) is waiting on payment of {money(s.pending_upgrade.amount_due)}.
                    {s.pending_upgrade.invoice_id && <Link className="table-action-link font-semibold" to={`/admin/clients/${s.client.id}?tab=invoices&view=${s.pending_upgrade.invoice_id}`}>Open invoice</Link>}
                </p>
            )}

            {hasUsage && (
                <section className="card px-4 py-3">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <span className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Gauge size={16} className="text-[var(--accent)]" /> Usage</span>
                        <UsageBar title="Disk" used={s.disk_usage ?? 0} limit={s.disk_limit ?? 0} />
                        <UsageBar title="Bandwidth" used={s.bw_usage ?? 0} limit={s.bw_limit ?? 0} />
                    </div>
                    <p className="mt-2 text-xs text-slate-400">Last updated {s.usage_updated_at ? new Date(s.usage_updated_at).toLocaleString() : 'never'}</p>
                </section>
            )}

            <div className="grid items-start gap-4 xl:grid-cols-2">
                <Section title="Service Details" icon={<Settings2 size={16} />}>
                    <div className="divide-y divide-slate-100 py-1">
                        <Row label="Order #">
                            {s.order ? <span className="text-sm text-slate-800">{s.order.id} - <Link className="table-action-link" to={`/admin/orders/${s.order.id}`}>View Order</Link></span> : <span className="text-sm text-slate-400">No order</span>}
                        </Row>
                        <Row label="Product/Service" htmlFor="sv-product">
                            <select id="sv-product" className="ui-input" value={form.product_id} onChange={(e) => set('product_id', Number(e.target.value))}>
                                {s.options.products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </Row>
                        <Row label="Server" htmlFor="sv-server">
                            <select id="sv-server" className="ui-input" value={form.server_id} onChange={(e) => set('server_id', e.target.value)}>
                                <option value="">None</option>
                                {s.options.servers.map((sv) => <option key={sv.id} value={sv.id}>{sv.name} ({sv.services_count}/{sv.max_accounts || '∞'} Accounts)</option>)}
                            </select>
                        </Row>
                        <Row label="Domain" htmlFor="sv-domain"><input id="sv-domain" className="ui-input" value={form.domain} onChange={(e) => set('domain', e.target.value)} /></Row>
                        <Row label="Dedicated IP" htmlFor="sv-ip"><input id="sv-ip" className="ui-input" placeholder="None" value={form.dedicated_ip} onChange={(e) => set('dedicated_ip', e.target.value)} /></Row>
                        <Row label={s.product.module === 'webdock' ? 'Webdock server slug' : 'Account ID'} htmlFor="sv-remote">
                            <input id="sv-remote" className="ui-input font-mono" autoComplete="off" placeholder={s.product.module === 'webdock' ? 'e.g. acnabin (from the Webdock URL)' : 'The account username on the server'} value={form.remote_id} onChange={(e) => set('remote_id', e.target.value)} />
                        </Row>
                        <Row label="Username" htmlFor="sv-user"><input id="sv-user" className="ui-input font-mono" autoComplete="off" value={form.username} onChange={(e) => set('username', e.target.value)} /></Row>
                        <Row label="Password" htmlFor="sv-pass">
                            <div className="flex gap-2">
                                <input id="sv-pass" className="ui-input font-mono" autoComplete="new-password" placeholder={s.has_password ? '•••••••• (stored, type to replace)' : 'Not stored'} value={form.password} onChange={(e) => set('password', e.target.value)} />
                                {s.has_password && <Button type="button" variant="ghost" className="h-auto shrink-0 px-3" onClick={() => setLogin(true)} aria-label="Show stored password"><Eye size={14} /></Button>}
                            </div>
                        </Row>
                        <Row label="Status" htmlFor="sv-status">
                            <select id="sv-status" className="ui-input" value={form.status} onChange={(e) => set('status', e.target.value)}>
                                {s.options.statuses.map((v) => <option key={v} value={v}>{label(v)}</option>)}
                            </select>
                        </Row>
                    </div>
                </Section>

                <Section title="Billing" icon={<CreditCard size={16} />}>
                    <div className="divide-y divide-slate-100 py-1">
                        <Row label="Registration Date" htmlFor="sv-reg"><input id="sv-reg" type="date" className="ui-input max-w-52" value={form.registered_at} onChange={(e) => set('registered_at', e.target.value)} /></Row>
                        <Row label="Quantity" htmlFor="sv-qty"><input id="sv-qty" type="number" min="1" className="ui-input max-w-28" value={form.quantity} onChange={(e) => set('quantity', Number(e.target.value))} /></Row>
                        <Row label="First Payment Amount" htmlFor="sv-first"><input id="sv-first" type="number" step="0.01" min="0" className="ui-input max-w-40" value={form.first_payment_amount} onChange={(e) => set('first_payment_amount', e.target.value)} /></Row>
                        <Row label="Recurring Amount" htmlFor="sv-rec">
                            <div className="flex flex-wrap items-center gap-3">
                                <input id="sv-rec" type="number" step="0.01" min="0" disabled={form.recalculate} className="ui-input max-w-40 disabled:opacity-60" value={form.recurring_amount} onChange={(e) => set('recurring_amount', e.target.value)} />
                                <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={form.recalculate} onChange={(e) => set('recalculate', e.target.checked)} /> Recalculate on save</label>
                            </div>
                        </Row>
                        <Row label="Next Due Date" htmlFor="sv-due"><input id="sv-due" type="date" className="ui-input max-w-52" value={form.next_due_date} onChange={(e) => set('next_due_date', e.target.value)} /></Row>
                        <Row label="Termination Date" htmlFor="sv-term"><input id="sv-term" type="date" className="ui-input max-w-52" value={form.termination_date} onChange={(e) => set('termination_date', e.target.value)} /></Row>
                        <Row label="Billing Cycle" htmlFor="sv-cycle">
                            <select id="sv-cycle" className="ui-input" value={form.cycle} onChange={(e) => set('cycle', e.target.value)}>
                                {s.options.cycles.map((c) => <option key={c} value={c}>{label(c)}</option>)}
                            </select>
                        </Row>
                        <Row label="Payment Method" htmlFor="sv-pay">
                            <select id="sv-pay" className="ui-input" value={form.payment_method} onChange={(e) => set('payment_method', e.target.value)}>
                                <option value="">Not set</option>
                                {s.options.payment_methods.map((m) => <option key={m.code} value={m.code}>{m.name}</option>)}
                            </select>
                        </Row>
                        <Row label="Subscription ID" htmlFor="sv-sub"><input id="sv-sub" className="ui-input" placeholder="None" value={form.subscription_id} onChange={(e) => set('subscription_id', e.target.value)} /></Row>
                    </div>
                </Section>
            </div>

            <div className="grid items-start gap-4 xl:grid-cols-2">
                <Section title="Module Commands" icon={<Terminal size={16} />} action={s.product.module ? <span className="text-xs text-slate-500 capitalize">{s.product.module}{s.server ? ` · ${s.server.name}` : ''}</span> : undefined}>
                    <div className="space-y-3 p-4">
                        <div className="flex flex-wrap gap-2">
                            {commands.map((c) => (
                                <button
                                    key={c.key}
                                    type="button"
                                    disabled={!c.enabled || busy}
                                    title={c.enabled ? undefined : c.why}
                                    onClick={() => run(c.key)}
                                    className={`ui-btn h-8 px-3 text-xs disabled:cursor-not-allowed disabled:opacity-50 ${c.danger ? 'ui-btn-danger' : 'ui-btn-secondary'}`}
                                >
                                    {c.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                            <span className="text-xs font-semibold text-slate-500">Account:</span>
                            {s.remote_id ? <span className="font-mono">{s.remote_id}</span> : <span>Not provisioned</span>}
                            <Status value={s.provision_status} />
                        </div>
                        {s.provision_error && <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">{s.provision_error}</p>}
                    </div>
                </Section>

                <Section title="Suspension & Termination" icon={<PauseCircle size={16} />}>
                    <div className="space-y-3 p-4">
                        <Toggle checked={form.override} onChange={(v) => set('override', v)} hint="Skips overdue auto-suspension until the date">Override Auto-Suspend</Toggle>
                        {form.override && (
                            <label className="block pl-1">
                                <span className="mb-1 block text-xs font-semibold text-slate-600">Do not suspend until</span>
                                <input type="date" required className="ui-input max-w-52" value={form.override_suspend_until} onChange={(e) => set('override_suspend_until', e.target.value)} />
                            </label>
                        )}
                        <Toggle checked={form.terminate_end_of_cycle} onChange={(v) => set('terminate_end_of_cycle', v)} hint="Marks it for termination at the next due date. Terminate it with the module command then.">Auto-Terminate End of Cycle</Toggle>
                        {form.terminate_end_of_cycle && (
                            <label className="block pl-1">
                                <span className="mb-1 block text-xs font-semibold text-slate-600">Reason</span>
                                <input className="ui-input" maxLength={255} value={form.terminate_reason} onChange={(e) => set('terminate_reason', e.target.value)} />
                            </label>
                        )}
                    </div>
                </Section>
            </div>

            {s.is_vps && <VpsPanel base={`/services/${s.id}`} admin />}

            {s.has_tools && !s.is_vps && (
                <Section
                    title="Control Panel"
                    icon={<MonitorSmartphone size={16} />}
                >
                    {/* cPanel and Webuzo refuse to load inside another site's frame, so the login opens in its own tab. */}
                    <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
                        <p className="max-w-md text-sm text-slate-500">Open {s.remote_id}'s control panel in a new tab, already signed in. Every opening creates a new one-time login.</p>
                        <ErrorNote error={sso.error} />
                        <Button type="button" disabled={sso.isPending} onClick={loginToPanel}><ExternalLink size={14} /> {sso.isPending ? 'Signing in...' : 'Open Control Panel'}</Button>
                    </div>
                </Section>
            )}

            {(s.has_tools || (s.usage_metrics?.length ?? 0) > 0) && (
                <Section
                    title="Metric Statistics"
                    icon={<Gauge size={16} />}
                    action={(
                        <span className="flex items-center gap-3">
                            <span className="text-xs text-slate-400">{s.usage_updated_at ? `Updated ${new Date(s.usage_updated_at).toLocaleString()}` : 'Never updated'}</span>
                            {s.has_tools && <button type="button" disabled={usage.isPending} onClick={() => usage.mutate()} className="ui-btn ui-btn-secondary h-8 px-3 text-xs"><RefreshCw size={13} className={usage.isPending ? 'animate-spin' : ''} /> {usage.isPending ? 'Refreshing...' : 'Refresh Now'}</button>}
                        </span>
                    )}
                >
                    {usage.error && <div className="px-4 pt-3"><ErrorNote error={usage.error} /></div>}
                    {s.usage_metrics?.length ? (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[34rem] text-sm">
                                <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
                                    <tr><th className="px-4 py-2">Metric</th><th className="px-4 py-2">Current Usage</th><th className="px-4 py-2">Limit</th><th className="w-48 px-4 py-2">Used</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {s.usage_metrics.map((m) => {
                                        const pct = m.percent ?? 0;
                                        const tone = pct >= 90 ? 'bg-rose-500' : pct >= 70 ? 'bg-amber-500' : 'bg-[var(--accent)]';

                                        return (
                                            <tr key={m.key} className="hover:bg-slate-50/60">
                                                <td className="px-4 py-2 font-medium text-slate-800">{m.label}</td>
                                                <td className="px-4 py-2 tabular-nums">{m.used}</td>
                                                <td className="px-4 py-2 text-slate-500 tabular-nums">{m.limit ?? 'Unlimited'}</td>
                                                <td className="px-4 py-2">
                                                    {m.limit ? (
                                                        <span className="flex items-center gap-2">
                                                            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100"><span className={`block h-full rounded-full ${tone}`} style={{ width: `${Math.min(100, Math.max(pct, pct > 0 ? 2 : 0))}%` }} /></span>
                                                            <span className="w-12 text-right text-xs text-slate-500 tabular-nums">{pct.toFixed(pct < 10 ? 1 : 0)}%</span>
                                                        </span>
                                                    ) : <span className="text-xs text-slate-400">-</span>}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : <p className="px-4 py-6 text-center text-sm text-slate-500">No statistics yet. Press Refresh Now to read them from the server.</p>}
                </Section>
            )}

            <Section title="Admin Notes" icon={<NotebookPen size={16} />}>
                <div className="p-4">
                    <textarea rows={4} aria-label="Admin notes" className="ui-input py-2" placeholder="Only staff see these notes." value={form.admin_notes} onChange={(e) => set('admin_notes', e.target.value)} />
                </div>
            </Section>

            {/* Save bar */}
            <div className="sticky bottom-3 z-10">
                <div className="card flex flex-wrap items-center justify-end gap-3 px-4 py-3 shadow-lg">
                    <div className="mr-auto min-w-0 text-sm">
                        {save.error ? <ErrorNote error={save.error} /> : save.isSuccess && !dirty ? <span role="status" className="font-semibold text-emerald-700">Changes saved.</span> : <span className="text-slate-500">{dirty ? 'You have unsaved changes.' : 'No changes.'}</span>}
                    </div>
                    <Button type="button" variant="ghost" disabled={!dirty || save.isPending} onClick={() => { setForm(toForm(s)); save.reset(); }}><Undo2 size={14} /> Discard</Button>
                    <Button disabled={!dirty || save.isPending}>{save.isPending ? 'Saving...' : 'Save Changes'}</Button>
                </div>
            </div>

            {login && <LoginDetails id={s.id} onClose={() => setLogin(false)} />}
            {dialog === 'upgrade' && (
                <UpgradeModal
                    service={s}
                    onClose={() => setDialog(null)}
                    onDone={(r) => {
                        setDialog(null);
                        setNotice(<>{r.message} {r.invoice_id && <Link className="font-semibold underline" to={`/admin/clients/${s.client.id}?tab=invoices&view=${r.invoice_id}`}>Open invoice</Link>}</>);
                        qc.invalidateQueries({ queryKey: ['/services', String(s.id)] });
                        qc.invalidateQueries({ queryKey: ['/clients'] });
                    }}
                />
            )}
            {dialog === 'transfer' && (
                <TransferModal<ServiceFull>
                    serviceId={s.id}
                    currentClientId={s.client.id}
                    onClose={() => setDialog(null)}
                    onDone={(data) => {
                        setDialog(null);
                        fresh(data);
                        navigate(`/admin/clients/${data.client.id}?tab=services&view=${data.id}`);
                    }}
                />
            )}
            {dialog === 'message' && <SendMessage clientIds={[s.client.id]} onClose={() => setDialog(null)} onSent={(m) => { setDialog(null); setNotice(m); }} />}
            {dialog === 'password' && (
                <ChangePasswordModal<ServiceFull>
                    serviceId={s.id}
                    username={s.username ?? s.remote_id}
                    onClose={() => setDialog(null)}
                    onDone={(data) => { setDialog(null); fresh(data); setNotice('Password changed on the server.'); }}
                />
            )}
        </form>
    );
}

