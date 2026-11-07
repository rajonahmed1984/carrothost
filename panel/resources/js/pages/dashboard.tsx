import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Ban, Check, ChevronDown, ChevronUp, FileWarning, RefreshCw, ShoppingCart, Table2, X, XCircle, type LucideIcon } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Area, Bar, CartesianGrid, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api, errorMessage, money } from '../api';
import { Button, QueryState, Status } from '../ui';
import { alertDialog } from '../dialog';

type ChartRow = { label: string; new_orders: number; activated_orders: number; income: number };
type Range = 'today' | 'month' | 'year';
type Check_ = { label: string; level: 'ok' | 'warning' | 'critical'; message: string; link?: string | null; items?: { title: string; detail: string; link: string | null }[] };

export type Dashboard = {
    currency: string;
    overdue_invoices: number;
    pending_orders: number;
    suspended_services: number;
    pending_module_actions: number;
    pending_cancellations?: number;
    pending_module_actions_split?: { services: number; domains: number };
    billing: { today: string; month: string; year: string; all_time: string };
    charts: Record<Range, ChartRow[]>;
    automation: { renewal_invoices: number; suspensions: number; provisioned: number; domains_expiring: number; last_run_human: string | null };
    health: { rating: string; passed: number; total: number; warnings: number; critical: number; checks: Check_[] };
    client_activity: { active: number; last_hour: number; recent: { id: number; name: string; ip: string | null; when: string }[] };
    activity: { id: number; who: string; action: string; when: string }[];
    servers: { id: number; name: string; module: string; hostname: string; is_active: boolean; max_accounts: number; services_count: number }[];
    attention: {
        services: { id: number; domain: string | null; provision_status: string; provision_error: string | null; client: { name: string }; product: { name: string } }[];
        domains: { id: number; name: string; provision_status: string; action: string; client: { name: string } }[];
    };
};

// Validated with the dataviz palette checker against the white chart surface.
const SERIES = { new_orders: '#2f6fb0', activated_orders: '#cc4d00', income: '#1f8a4c' };

const store = {
    read<T>(key: string, fallback: T): T {
        try {
            return JSON.parse(window.localStorage.getItem(key) ?? 'null') ?? fallback;
        } catch {
            return fallback;
        }
    },
    write(key: string, value: unknown) {
        try {
            window.localStorage.setItem(key, JSON.stringify(value));
        } catch {
            // The layout just won't survive a reload.
        }
    },
};

type WidgetControls = { hidden: string[]; hide: (id: string) => void; refresh: () => void; refreshing: boolean };

function Widget({ id, title, controls, children }: { id: string; title: string; controls: WidgetControls; children: ReactNode }) {
    const [collapsed, setCollapsed] = useState(() => store.read<boolean>(`dash-collapsed-${id}`, false));

    if (controls.hidden.includes(id)) return null;

    const toggle = () => {
        setCollapsed(!collapsed);
        store.write(`dash-collapsed-${id}`, !collapsed);
    };

    return (
        <section className="card overflow-hidden" aria-label={title}>
            <header className={`flex items-center justify-between gap-3 px-4 py-3 ${collapsed ? '' : 'border-b border-slate-200'}`}>
                <h2 className="font-semibold text-slate-900">{title}</h2>
                <div className="flex items-center gap-0.5 text-slate-400">
                    <button type="button" aria-label={`Refresh ${title}`} onClick={controls.refresh} className="cursor-pointer rounded p-1 hover:text-accent"><RefreshCw size={14} className={controls.refreshing ? 'animate-spin' : ''} /></button>
                    <button type="button" aria-label={`${collapsed ? 'Expand' : 'Collapse'} ${title}`} aria-expanded={!collapsed} onClick={toggle} className="cursor-pointer rounded p-1 hover:text-accent">{collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}</button>
                    <button type="button" aria-label={`Hide ${title}`} onClick={() => controls.hide(id)} className="cursor-pointer rounded p-1 hover:text-accent"><X size={14} /></button>
                </div>
            </header>
            {!collapsed && children}
        </section>
    );
}

function Tile({ to, value, label, Icon, color }: { to: string; value: number; label: string; Icon: LucideIcon; color: string }) {
    return (
        <Link to={to} style={{ backgroundColor: color }} className="flex overflow-hidden rounded-xl text-white shadow-sm transition hover:opacity-95">
            <span className="grid w-16 shrink-0 place-items-center bg-black/15 sm:w-24"><Icon size={30} aria-hidden="true" /></span>
            <span className="min-w-0 px-3 py-2.5 sm:px-4">
                <span className="block text-2xl font-semibold tabular-nums sm:text-3xl">{value}</span>
                <span className="block truncate text-xs font-medium">{label}</span>
            </span>
        </Link>
    );
}

function ChartTooltip({ active, payload, label, currency }: { active?: boolean; payload?: { dataKey: string; value: number; color: string; name: string }[]; label?: string; currency: string }) {
    if (!active || !payload?.length) return null;

    return (
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
            <div className="mb-1 font-semibold text-slate-900">{label}</div>
            {payload.map((p) => (
                <div key={p.dataKey} className="flex items-center gap-2 text-slate-600">
                    <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                    {p.name}: <span className="font-semibold text-slate-900 tabular-nums">{p.dataKey === 'income' ? money(p.value, currency) : p.value}</span>
                </div>
            ))}
        </div>
    );
}

const axisProps = { tickLine: false, axisLine: false, tick: { fontSize: 11, fill: '#64748b' } };

function SystemOverview({ data }: { data: Dashboard }) {
    const [range, setRange] = useState<Range>('month');
    const [asTable, setAsTable] = useState(false);
    const rows = data.charts[range];
    const tabs: [Range, string][] = [['today', 'Today'], ['month', 'Last 30 Days'], ['year', 'Last 1 Year']];

    return (
        <div className="p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: SERIES.new_orders }} /> New Orders</span>
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: SERIES.activated_orders }} /> Activated Orders</span>
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: SERIES.income }} /> Income</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="hide-scrollbar flex gap-1.5 overflow-x-auto">
                        {tabs.map(([key, label]) => <button key={key} type="button" aria-pressed={range === key} onClick={() => setRange(key)} className={`filter-tab ${range === key ? 'filter-tab-active' : ''}`}>{label}</button>)}
                    </div>
                    <button type="button" aria-pressed={asTable} aria-label="Show as table" onClick={() => setAsTable(!asTable)} className={`icon-btn ${asTable ? 'text-accent' : ''}`}><Table2 size={16} /></button>
                </div>
            </div>

            {asTable ? (
                <div className="max-h-96 overflow-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="sticky top-0 bg-white"><tr className="border-b border-slate-200 text-slate-500 uppercase"><th className="px-2 py-2">Period</th><th className="px-2 py-2 text-right">New</th><th className="px-2 py-2 text-right">Activated</th><th className="px-2 py-2 text-right">Income</th></tr></thead>
                        <tbody>
                            {rows.map((r) => <tr key={r.label} className="border-b border-slate-100"><td className="px-2 py-1.5">{r.label}</td><td className="px-2 py-1.5 text-right tabular-nums">{r.new_orders}</td><td className="px-2 py-1.5 text-right tabular-nums">{r.activated_orders}</td><td className="px-2 py-1.5 text-right tabular-nums">{money(r.income, data.currency)}</td></tr>)}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div>
                    <h3 className="mb-2 text-xs font-semibold text-slate-600">Orders & Income ({data.currency})</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={rows} barGap={3} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="label" {...axisProps} minTickGap={24} />
                                <YAxis yAxisId="orders" {...axisProps} allowDecimals={false} />
                                <YAxis yAxisId="income" orientation="right" {...axisProps} tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000}k` : String(v))} />
                                <Tooltip cursor={{ fill: 'rgba(148,163,184,0.12)' }} content={<ChartTooltip currency={data.currency} />} />
                                <Area yAxisId="income" type="monotone" dataKey="income" name="Income" stroke={SERIES.income} strokeWidth={2} fill={SERIES.income} fillOpacity={0.15} dot={false} activeDot={{ r: 4, stroke: '#fff', strokeWidth: 2 }} isAnimationActive={false} />
                                <Bar yAxisId="orders" dataKey="new_orders" name="New Orders" fill={SERIES.new_orders} radius={[4, 4, 0, 0]} maxBarSize={14} isAnimationActive={false} />
                                <Bar yAxisId="orders" dataKey="activated_orders" name="Activated Orders" fill={SERIES.activated_orders} radius={[4, 4, 0, 0]} maxBarSize={14} isAnimationActive={false} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
}

function Billing({ data }: { data: Dashboard }) {
    const cells: [string, string, string][] = [
        ['Today', data.billing.today, 'text-brand-green'],
        ['This Month', data.billing.month, 'text-accent'],
        ['This Year', data.billing.year, 'text-slate-900'],
        ['All Time', data.billing.all_time, 'text-slate-900'],
    ];

    return (
        <div className="grid grid-cols-1 divide-y divide-slate-200 sm:grid-cols-2 sm:divide-x sm:[&>*:nth-child(-n+2)]:border-b sm:[&>*:nth-child(-n+2)]:border-slate-200">
            {cells.map(([label, value, tone]) => (
                <div key={label} className="!border-t-0 p-4">
                    <div className={`text-xl font-semibold tabular-nums ${tone}`}>{money(value, data.currency)}</div>
                    <div className="mt-0.5 text-xs text-slate-500">{label}</div>
                </div>
            ))}
        </div>
    );
}

function Health({ data }: { data: Dashboard }) {
    const [open, setOpen] = useState(false);
    const h = data.health;
    const tone = h.critical ? 'text-rose-700' : h.warnings ? 'text-amber-700' : 'text-brand-green';
    const bar = h.critical ? '#e11d48' : h.warnings ? '#b45309' : '#1f8a4c';

    return (
        <div className="space-y-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div><div className="text-xs text-slate-500">Overall Rating</div><div className={`text-xl font-semibold ${tone}`}>{h.rating}</div></div>
                <Button variant="ghost" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'Hide Issues' : 'View Issues'}</Button>
            </div>
            <div role="progressbar" aria-valuenow={h.passed} aria-valuemin={0} aria-valuemax={h.total} aria-label={`${h.passed} of ${h.total} checks passed`} className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full" style={{ width: `${(h.passed / h.total) * 100}%`, background: bar }} />
            </div>
            <div className="flex flex-wrap justify-around gap-2 text-xs text-slate-700">
                <span className="flex items-center gap-1.5"><AlertTriangle size={14} className="text-amber-700" /> {h.warnings} Warnings</span>
                <span className="flex items-center gap-1.5"><XCircle size={14} className="text-rose-700" /> {h.critical} Needing Attention</span>
            </div>
            {open && (
                <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 text-xs">
                    {h.checks.map((c) => (
                        <li key={c.label} className="flex items-start gap-2 p-2.5">
                            {c.level === 'ok' ? <Check size={14} className="mt-0.5 shrink-0 text-brand-green" /> : c.level === 'warning' ? <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-700" /> : <XCircle size={14} className="mt-0.5 shrink-0 text-rose-700" />}
                            <span className="min-w-0 flex-1">
                                <span className="font-semibold text-slate-800">{c.label}:</span> <span className="text-slate-600">{c.message}</span>
                                {c.link && <Link to={c.link} className="ml-2 font-semibold text-accent hover:underline">View all</Link>}
                                {!!c.items?.length && (
                                    <ul className="mt-2 space-y-1.5">
                                        {c.items.map((it, i) => (
                                            <li key={i} className="rounded-lg border border-rose-100 bg-rose-50/60 px-2.5 py-2">
                                                {it.link ? <Link to={it.link} className="font-semibold text-slate-900 hover:text-accent hover:underline">{it.title}</Link> : <span className="font-semibold text-slate-900">{it.title}</span>}
                                                <span className="mt-0.5 block break-words text-rose-800">{it.detail}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function Automation({ data }: { data: Dashboard }) {
    const a = data.automation;
    const metrics: [string, number][] = [
        ['Renewal Invoices Created', a.renewal_invoices],
        ['Overdue Suspensions', a.suspensions],
        ['Accounts Provisioned', a.provisioned],
        ['Domains Expiring in 30 Days', a.domains_expiring],
    ];

    return (
        <div className="p-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-5 text-center">
                {metrics.map(([label, value]) => (
                    <div key={label} className="border-t-2 border-slate-200 pt-2">
                        <div className="text-xs text-slate-500">{label}</div>
                        <div className="mt-1 text-2xl font-semibold text-slate-900 tabular-nums">{value}</div>
                    </div>
                ))}
            </div>
            <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
                {a.last_run_human ? <><Check size={14} className="text-brand-green" /> Today&apos;s counts. Last run: {a.last_run_human}</> : <><AlertTriangle size={14} className="text-amber-700" /> Automation has not run yet</>}
            </p>
        </div>
    );
}

function ServerTest({ id }: { id: number }) {
    const test = useMutation({
        mutationFn: async () => (await api.post<{ message: string }>(`/servers/${id}/test`)).data,
        onSuccess: (r) => alertDialog(r.message),
        onError: (e) => alertDialog(errorMessage(e)),
    });

    return <Button variant="link" disabled={test.isPending} onClick={() => test.mutate()}>{test.isPending ? 'Testing...' : 'Test'}</Button>;
}

function Servers({ data }: { data: Dashboard }) {
    if (!data.servers.length) return <p className="p-6 text-center text-sm text-slate-500">No servers yet. <Link className="table-action-link" to="/admin/settings/servers-config">Add a server</Link></p>;

    return (
        <ul className="divide-y divide-slate-100">
            {data.servers.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                    <div className="min-w-0"><div className="truncate font-medium text-slate-800">{s.name}</div><div className="truncate text-xs text-slate-500">{s.hostname}</div></div>
                    <div className="flex items-center gap-3 text-xs">
                        <span className="tabular-nums text-slate-600">{s.services_count}{s.max_accounts ? ` / ${s.max_accounts}` : ''} accounts</span>
                        <Status value={s.is_active ? 'active' : 'inactive'} />
                        <ServerTest id={s.id} />
                    </div>
                </li>
            ))}
        </ul>
    );
}

function Attention({ data }: { data: Dashboard }) {
    const { services, domains } = data.attention;

    if (!services.length && !domains.length) return <p className="p-6 text-center text-sm text-slate-500">Nothing is waiting on you.</p>;

    return (
        <ul className="max-h-64 divide-y divide-slate-100 overflow-y-auto">
            {services.map((s) => (
                <li key={`s${s.id}`} className="flex items-start justify-between gap-2 px-4 py-2.5">
                    <span className="min-w-0 text-xs"><Link className="table-action-link font-semibold" to={`/admin/products-services/${s.id}`}>{s.product.name}{s.domain ? ` - ${s.domain}` : ''}</Link><span className="block text-slate-500">{s.client.name}</span>{s.provision_error && <span className="block break-words text-slate-500">{s.provision_error}</span>}</span>
                    <Status value={s.provision_status} />
                </li>
            ))}
            {domains.map((d) => (
                <li key={`d${d.id}`} className="flex items-start justify-between gap-2 px-4 py-2.5">
                    <span className="min-w-0 text-xs"><Link className="table-action-link font-semibold" to={`/admin/domain-registrations/${d.id}`}>{d.name}</Link><span className="block text-slate-500">{d.action}, {d.client.name}</span></span>
                    <Status value={d.provision_status} />
                </li>
            ))}
        </ul>
    );
}

function ClientActivity({ data }: { data: Dashboard }) {
    const c = data.client_activity;

    return (
        <>
            <div className="grid grid-cols-2 gap-3 p-4">
                <div><div className="text-xs text-slate-500">Active Clients</div><div className="text-xl font-semibold text-accent tabular-nums">{c.active}</div></div>
                <div><div className="text-xs text-slate-500">Logged In, Last Hour</div><div className="text-xl font-semibold text-brand-green tabular-nums">{c.last_hour}</div></div>
            </div>
            {c.recent.length === 0 ? <p className="border-t border-slate-100 p-4 text-center text-xs text-slate-500">No client has logged in yet.</p> : (
                <ul className="max-h-52 divide-y divide-slate-100 overflow-y-auto border-t border-slate-100">
                    {c.recent.map((r) => (
                        <li key={r.id} className="flex items-start justify-between gap-2 px-4 py-2 text-xs">
                            <span className="min-w-0"><Link className="block truncate font-medium text-slate-800 hover:text-accent" to={`/admin/clients/${r.id}`}>{r.name}</Link><span className="text-slate-500">{r.ip}</span></span>
                            <span className="shrink-0 text-slate-500">{r.when}</span>
                        </li>
                    ))}
                </ul>
            )}
        </>
    );
}

function ActivityFeed({ data }: { data: Dashboard }) {
    if (!data.activity.length) return <p className="p-6 text-center text-sm text-slate-500">No activity yet.</p>;

    return (
        <>
            <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
                {data.activity.map((a) => (
                    <li key={a.id} className="px-4 py-2.5 text-xs">
                        <div className="flex justify-between gap-2"><span className="font-semibold text-slate-800">{a.who}</span><span className="shrink-0 text-slate-500">{a.when}</span></div>
                        <div className="mt-0.5 break-words text-slate-600">{a.action.replaceAll('.', ' ').replaceAll('_', ' ')}</div>
                    </li>
                ))}
            </ul>
            <div className="border-t border-slate-100 px-4 py-2 text-center"><Link className="table-action-link" to="/admin/activity">View all activity</Link></div>
        </>
    );
}

export function DashboardPage() {
    const qc = useQueryClient();
    const query = useQuery({ queryKey: ['dashboard'], queryFn: async () => (await api.get<Dashboard>('/dashboard')).data });
    const [hidden, setHidden] = useState<string[]>(() => store.read<string[]>('dash-hidden', []));
    const d = query.data;

    const updateHidden = (next: string[]) => {
        setHidden(next);
        store.write('dash-hidden', next);
    };

    const controls: WidgetControls = {
        hidden,
        hide: (id) => updateHidden([...hidden, id]),
        refresh: () => qc.invalidateQueries({ queryKey: ['dashboard'] }),
        refreshing: query.isFetching,
    };

    return (
        <QueryState query={query}>
            {d && (
                <div className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <Tile to="/admin/pending-orders" value={d.pending_orders} label="Pending Orders" Icon={ShoppingCart} color="#17733f" />
                        <Tile to="/admin/overdue-invoices" value={d.overdue_invoices} label="Overdue Invoices" Icon={FileWarning} color="#be123c" />
                        <Tile to="/admin/products-services?status=suspended" value={d.suspended_services} label="Suspended Services" Icon={Ban} color="#b34400" />
                        {/* Services marked to terminate at the end of their cycle: cancellation requests. */}
                        <Tile to="/admin/products-services?status=pending_cancellation" value={d.pending_cancellations ?? 0} label="Pending Cancellations" Icon={XCircle} color="#0f2233" />
                    </div>

                    <div className="grid items-start gap-4 xl:grid-cols-3">
                        <div className="min-w-0 space-y-4 xl:col-span-2">
                            <Widget id="overview" title="System Overview" controls={controls}><SystemOverview data={d} /></Widget>
                            <div className="grid items-start gap-4 lg:grid-cols-2">
                                <div className="min-w-0 space-y-4">
                                    <Widget id="billing" title="Billing" controls={controls}><Billing data={d} /></Widget>
                                    <Widget id="health" title="System Health" controls={controls}><Health data={d} /></Widget>
                                </div>
                                <div className="min-w-0 space-y-4">
                                    <Widget id="automation" title="Automation Overview" controls={controls}><Automation data={d} /></Widget>
                                    <Widget id="servers" title="Server Status" controls={controls}><Servers data={d} /></Widget>
                                </div>
                            </div>
                        </div>
                        <div className="min-w-0 space-y-4">
                            <Widget id="attention" title="Needs Attention" controls={controls}><Attention data={d} /></Widget>
                            <Widget id="clients" title="Client Activity" controls={controls}><ClientActivity data={d} /></Widget>
                            <Widget id="activity" title="Activity" controls={controls}><ActivityFeed data={d} /></Widget>
                        </div>
                    </div>

                    {hidden.length > 0 && <div className="text-center"><Button variant="link" onClick={() => updateHidden([])}>Show {hidden.length} hidden widget{hidden.length > 1 ? 's' : ''}</Button></div>}
                </div>
            )}
        </QueryState>
    );
}
