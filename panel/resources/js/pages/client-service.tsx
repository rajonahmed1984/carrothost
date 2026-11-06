import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Activity, ArrowUpDown, CalendarClock, CalendarDays, ChevronDown, CircleCheck, CircleX, Copy, Cpu, Database, ExternalLink, Eye, EyeOff, FileText, FolderOpen,
    Gauge, Globe, HardDrive, Headset, History, Info, KeyRound, LayoutGrid, Link2, LogIn, Mail, MonitorSmartphone, Network, Pencil, RefreshCw, Server, ShieldCheck, Wallet,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api, errorMessage, money } from '../api';
import { alertDialog } from '../dialog';
import { PanelLogo, panelName } from '../panel-logo';
import { Button, Dropdown, ErrorNote, Field, Modal, QueryState, Status, Table } from '../ui';
import { UpgradeModal } from './service-tools';
import { VpsPanel } from './vps-panel';

type Metric = { key: string; label: string; used: string; limit: string | null; percent: number | null };
type Detail = {
    id: number; domain: string | null; cycle: string; recurring_amount: string; status: string; next_due_date: string | null; created_at: string; registered_at: string | null;
    product_id: number; product: { name: string; type: string; module: string | null; group: string | null }; description: string | null;
    username: string | null; panel_url: string | null; has_password: boolean; is_vps?: boolean; vps_actions?: string[] | null; has_tools: boolean; panel_apps: string[];
    can_upgrade: boolean; pending_upgrade: { invoice_id: number | null; new_product: string | null; new_cycle: string; amount_due: string } | null;
    server: { hostname: string; ip: string | null } | null; nameservers: string[]; server_ip: string | null;
    usage: { disk_used: number | null; disk_limit: number | null; bw_used: number | null; bw_limit: number | null; metrics: Metric[]; updated_at: string | null };
    invoices: { id: number; number: string; status: string; currency: string; total: string; due_date: string }[];
    activity: { id: number; title: string; by: string; at: string | null }[];
};

const tabs = [
    { key: 'overview', label: 'Overview', icon: <LayoutGrid size={15} /> },
    { key: 'usage', label: 'Resource Usage', icon: <Gauge size={15} /> },
    { key: 'invoices', label: 'Invoices', icon: <FileText size={15} /> },
    { key: 'activity', label: 'Activity', icon: <Activity size={15} /> },
];

const statusDot: Record<string, string> = { active: 'bg-emerald-500', pending: 'bg-amber-500', suspended: 'bg-rose-500', terminated: 'bg-slate-400', cancelled: 'bg-slate-400' };
const calendarDay = (date: string) => new Date(`${date.slice(0, 10)}T00:00:00`);
const daysUntil = (date: string) => Math.round((calendarDay(date).getTime() - new Date(new Date().toDateString()).getTime()) / 86400000);
const shortDate = (date: string) => calendarDay(date).toLocaleDateString('en-GB').replaceAll('/', '-');
const label = (v: string) => v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const size = (mb: number) => (mb >= 1024 ? `${(mb / 1024).toFixed(mb >= 10240 ? 1 : 2)} GB` : `${mb} MB`);
const pct = (used: number | null, limit: number | null) => (used !== null && limit ? Math.min(100, Math.round((used / limit) * 100)) : null);
const tone = (p: number) => (p >= 90 ? 'bg-rose-500' : p >= 70 ? 'bg-amber-500' : 'bg-emerald-500');

/** A password cPanel and Webuzo both accept: mixed case, digits, no lookalike characters. */
const generatePassword = () => {
    const sets = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnpqrstuvwxyz', '23456789', '@#%+=_'];
    const all = sets.join('');
    const random = (n: number) => crypto.getRandomValues(new Uint32Array(1))[0] % n;
    const chars = [...sets.map((set) => set[random(set.length)]), ...Array.from({ length: 12 }, () => all[random(all.length)])];
    for (let i = chars.length - 1; i > 0; i--) {
        const j = random(i + 1);
        [chars[i], chars[j]] = [chars[j], chars[i]];
    }

    return chars.join('');
};

/** Opens the tab first, while the click still counts as the user's, then points it at the one-time login. */
function usePanelLogin(id: number) {
    const sso = useMutation({ mutationFn: async (app?: string) => (await api.post<{ url: string }>(`/client/services/${id}/sso`, { app })).data.url });

    return {
        pending: sso.isPending,
        open: (app?: string) => {
            const tab = window.open('about:blank', '_blank');
            sso.mutate(app, {
                onSuccess: (url) => { if (tab) tab.location.href = url; else window.location.href = url; },
                onError: (e) => { tab?.close(); alertDialog(errorMessage(e)); },
            });
        },
    };
}

/** Signs straight into the control panel in a new tab, like the service page's button. */
export function PanelLoginButton({ serviceId, label, className }: { serviceId: number; label: string; className: string }) {
    const panel = usePanelLogin(serviceId);

    return (
        <button type="button" disabled={panel.pending} onClick={() => panel.open()} className={`${className} cursor-pointer disabled:cursor-wait disabled:opacity-60`}>
            <ExternalLink size={13} /> {panel.pending ? 'Signing in...' : label}
        </button>
    );
}

export function CopyButton({ value, what }: { value: string | null | undefined; what: string }) {
    const [copied, setCopied] = useState(false);
    if (!value) return null;

    return (
        <button
            type="button"
            aria-label={`Copy ${what}`}
            title={copied ? 'Copied' : `Copy ${what}`}
            onClick={() => navigator.clipboard?.writeText(value).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); })}
            className={`icon-btn h-8 w-8 shrink-0 ${copied ? 'text-emerald-600' : ''}`}
        >
            {copied ? <CircleCheck size={14} /> : <Copy size={14} />}
        </button>
    );
}

export function SectionCard({ icon, title, subtitle, action, children }: { icon?: ReactNode; title: string; subtitle?: string; action?: ReactNode; children: ReactNode }) {
    return (
        <section className="card overflow-hidden">
            <header className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5">
                <div className="flex min-w-0 items-start gap-3">
                    {icon && <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-accent">{icon}</span>}
                    <div className="min-w-0">
                        <h2 className="font-semibold text-slate-900">{title}</h2>
                        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
                    </div>
                </div>
                {action}
            </header>
            <div className="p-5 pt-4">{children}</div>
        </section>
    );
}

export function InfoRow({ icon, name, children, actions }: { icon: ReactNode; name: string; children: ReactNode; actions?: ReactNode }) {
    return (
        <div className="flex items-center gap-3 py-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">{icon}</span>
            <div className="grid min-w-0 flex-1 gap-0.5 sm:grid-cols-[9rem_1fr] sm:items-center sm:gap-3">
                <span className="text-xs font-semibold text-slate-600 sm:text-sm">{name}</span>
                <div className="min-w-0 text-sm break-words text-slate-800">{children}</div>
            </div>
            {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
        </div>
    );
}

export function Stat({ icon, name, value, note }: { icon: ReactNode; name: string; value: ReactNode; note?: ReactNode }) {
    return (
        <div className="min-w-0 px-5 py-4">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">{icon} {name}</div>
            <div className="mt-1 text-base font-bold text-slate-900 tabular-nums">{value}</div>
            {note && <div className="text-xs">{note}</div>}
        </div>
    );
}

export function Fact({ icon, name, children }: { icon: ReactNode; name: string; children: ReactNode }) {
    return (
        <div className="flex min-w-0 items-center gap-3 px-5 py-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-accent">{icon}</span>
            <div className="min-w-0">
                <div className="text-xs text-slate-500">{name}</div>
                <div className="text-sm font-semibold break-words text-slate-900">{children}</div>
            </div>
        </div>
    );
}

function Ring({ percent }: { percent: number | null }) {
    const r = 52;
    const c = 2 * Math.PI * r;
    const p = percent ?? 0;
    const stroke = p >= 90 ? '#f43f5e' : p >= 70 ? '#f59e0b' : '#10b981';

    return (
        <div className="relative h-36 w-36 shrink-0">
            <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
                <circle cx="60" cy="60" r={r} fill="none" stroke="#f1f5f9" strokeWidth="11" />
                <circle cx="60" cy="60" r={r} fill="none" stroke={stroke} strokeWidth="11" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (c * p) / 100} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-slate-900 tabular-nums">{percent === null ? '-' : `${percent}%`}</span>
                <span className="text-xs text-slate-500">Disk used</span>
            </div>
        </div>
    );
}

function Meter({ icon, name, used, percent }: { icon: ReactNode; name: string; used: string; percent: number | null }) {
    return (
        <div>
            <div className="flex items-center gap-2 text-sm">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">{icon}</span>
                <span className="min-w-0 flex-1 truncate font-medium text-slate-800">{name}</span>
                <span className="text-xs text-slate-500 tabular-nums">{used}</span>
                {percent !== null && <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-700 tabular-nums">{percent}%</span>}
            </div>
            <div className="mt-1.5 ml-9 h-1.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label={`${name} used`} aria-valuenow={percent ?? 0} aria-valuemin={0} aria-valuemax={100}>
                {percent !== null && <div className={`h-full rounded-full ${tone(percent)}`} style={{ width: `${Math.max(percent, percent > 0 ? 2 : 0)}%` }} />}
            </div>
        </div>
    );
}

const metricIcon = (key: string) => {
    const k = key.toLowerCase();
    if (k.includes('disk') || k.includes('inode')) return <HardDrive size={14} />;
    if (k.includes('band') || k.includes('bw')) return <ArrowUpDown size={14} />;
    if (k.includes('mail') || k.includes('pop')) return <Mail size={14} />;
    if (k.includes('sql') || k.includes('db')) return <Database size={14} />;
    if (k.includes('ftp')) return <FolderOpen size={14} />;
    if (k.includes('domain')) return <Globe size={14} />;
    if (k.includes('cpu') || k.includes('ram') || k.includes('mem') || k.includes('proc')) return <Cpu size={14} />;

    return <Gauge size={14} />;
};

export function Tile({ icon, tone: color, name, onClick, to, disabled }: { icon: ReactNode; tone: string; name: string; onClick?: () => void; to?: string; disabled?: boolean }) {
    const body = (
        <>
            <span className={`flex h-11 w-11 items-center justify-center rounded-full ${color}`}>{icon}</span>
            <span className="text-xs font-semibold text-slate-800">{name}</span>
        </>
    );
    const cls = 'flex flex-col items-center justify-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-5 text-center transition hover:border-[var(--accent)] hover:bg-white disabled:cursor-wait disabled:opacity-60';

    return to ? <Link to={to} className={cls}>{body}</Link> : <button type="button" className={`${cls} cursor-pointer`} disabled={disabled} onClick={onClick}>{body}</button>;
}

function PasswordModal({ s, onClose, onDone }: { s: Detail; onClose: () => void; onDone: (fresh: Detail) => void }) {
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [show, setShow] = useState(false);
    const change = useMutation({
        mutationFn: async () => (await api.post<Detail>(`/client/services/${s.id}/change-password`, { password, password_confirmation: confirm })).data,
        onSuccess: onDone,
    });

    return (
        <Modal title="Change Password" onClose={onClose}>
            <form onSubmit={(e) => { e.preventDefault(); change.mutate(); }} className="space-y-4">
                <p className="text-sm text-slate-600">
                    Sets a new password for <strong className="font-mono text-slate-900">{s.username ?? 'your account'}</strong> on {panelName(s.product.module)}. It is used for the control panel, FTP and SSH.
                </p>
                <Field label="New password" hint="At least 10 characters, with upper and lower case letters and a digit.">
                    <div className="flex gap-2">
                        <input type={show ? 'text' : 'password'} className="ui-input font-mono" required minLength={10} maxLength={64} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
                        <button type="button" className="icon-btn h-10 w-10 shrink-0" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow(!show)}>{show ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                    </div>
                </Field>
                <Field label="Confirm new password">
                    <input type={show ? 'text' : 'password'} className="ui-input font-mono" required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                </Field>
                <Button type="button" variant="link" onClick={() => { const p = generatePassword(); setPassword(p); setConfirm(p); setShow(true); }}><RefreshCw size={13} /> Generate a strong password</Button>
                <ErrorNote error={change.error} />
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button disabled={change.isPending || !password || password !== confirm}><KeyRound size={14} /> {change.isPending ? 'Changing...' : 'Change Password'}</Button>
                </div>
            </form>
        </Modal>
    );
}

/** The customer's page for one service. cPanel and Webuzo accounts get the full control panel tools. */
export function ClientServicePage({ canManage }: { canManage: boolean }) {
    const { id } = useParams();
    const query = useQuery({ queryKey: ['client-service', id], queryFn: async () => (await api.get<Detail>(`/client/services/${id}`)).data });

    return <QueryState query={query}>{query.data && <ServiceDetail key={query.data.id} s={query.data} canManage={canManage} />}</QueryState>;
}

function ServiceDetail({ s, canManage }: { s: Detail; canManage: boolean }) {
    const qc = useQueryClient();
    const [params, setParams] = useSearchParams();
    const tab = tabs.find((t) => t.key === params.get('tab'))?.key ?? 'overview';
    const [dialog, setDialog] = useState<'password' | 'upgrade' | null>(null);
    const [notice, setNotice] = useState<ReactNode>(null);
    const panel = usePanelLogin(s.id);
    const reveal = useMutation({ mutationFn: async () => (await api.post<{ password: string | null }>(`/client/services/${s.id}/password`)).data });
    const [showPassword, setShowPassword] = useState(false);
    const fresh = (data: Detail) => qc.setQueryData(['client-service', String(s.id)], data);
    const usage = useMutation({ mutationFn: async () => (await api.post<Detail>(`/client/services/${s.id}/usage`)).data, onSuccess: fresh });

    const hosting = s.product.module === 'cpanel' || s.product.module === 'webuzo';
    const tools = canManage && s.has_tools;
    // A VPS signs in through its web console, and only when the product lets customers use it.
    const canLogin = tools && (!s.is_vps || !!s.vps_actions?.includes('console'));
    const active = s.status === 'active';
    const panelLabel = panelName(s.product.module);
    const days = s.next_due_date ? daysUntil(s.next_due_date) : null;
    const host = s.server?.hostname ?? null;
    const subjectFor = (what: string) => `/tickets/new?service=${s.id}&subject=${encodeURIComponent(`${what}: ${s.product.name}${s.domain ? ` - ${s.domain}` : ''}`)}`;
    const app = (key: string) => s.panel_apps.includes(key) && tools;
    const diskPct = pct(s.usage.disk_used, s.usage.disk_limit);
    const bwPct = pct(s.usage.bw_used, s.usage.bw_limit);
    const extraMetrics = s.usage.metrics.filter((m) => !/disk|band/i.test(`${m.key} ${m.label}`));
    const hasUsage = s.usage.disk_limit !== null || s.usage.bw_limit !== null || s.usage.disk_used !== null || s.usage.metrics.length > 0;

    const revealPassword = () => {
        if (reveal.data) return setShowPassword(!showPassword);
        reveal.mutate(undefined, { onSuccess: () => setShowPassword(true), onError: (e) => alertDialog(errorMessage(e)) });
    };

    const menuItem = 'flex w-full cursor-pointer items-center gap-2.5 px-4 py-2 text-left text-slate-700 hover:bg-slate-50';

    return (
        <div className="space-y-5">
            {notice && (
                <p role="status" className="flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-900">
                    <span className="flex items-center gap-2"><CircleCheck size={15} /> {notice}</span>
                    <button type="button" aria-label="Dismiss" className="cursor-pointer text-emerald-700" onClick={() => setNotice(null)}><CircleX size={14} /></button>
                </p>
            )}
            {s.status === 'suspended' && <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">This service is suspended. Pay any overdue invoice below to bring it back, or open a ticket if you think this is a mistake.</p>}
            {s.status === 'pending' && <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">This service is being set up. Its login details appear here, and are emailed to you, once it is ready.</p>}
            {s.pending_upgrade && (
                <p className="flex flex-wrap items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
                    <ArrowUpDown size={15} /> Change to <strong>{s.pending_upgrade.new_product}</strong> ({label(s.pending_upgrade.new_cycle)}) is waiting on payment of {money(s.pending_upgrade.amount_due)}.
                    {s.pending_upgrade.invoice_id && <Link className="table-action-link font-semibold" to={`/invoices/${s.pending_upgrade.invoice_id}`}>Pay invoice</Link>}
                </p>
            )}

            {/* Summary */}
            <section className="card overflow-hidden">
                <div className="grid divide-y divide-slate-200 lg:grid-cols-[1.6fr_1fr_1fr_1fr] lg:divide-x lg:divide-y-0">
                    <div className="flex min-w-0 items-center gap-4 p-5">
                        <PanelLogo module={s.product.module} type={s.product.type} size="lg" />
                        <div className="min-w-0">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700 capitalize"><span className={`h-1.5 w-1.5 rounded-full ${statusDot[s.status] ?? 'bg-slate-400'}`} />{s.status}</span>
                            <h1 className="mt-1.5 text-xl font-bold text-slate-900">{s.product.name}</h1>
                            <p className="text-sm text-slate-500">{s.product.group ?? label(s.product.type)}{hosting ? ` · ${panelLabel}` : ''}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 divide-y divide-slate-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0 lg:contents">
                        <Stat
                            icon={<CalendarClock size={13} />}
                            name="Next Due Date"
                            value={s.next_due_date ? shortDate(s.next_due_date) : '-'}
                            note={days === null ? null : <span className={days < 0 ? 'text-rose-600' : days <= 14 ? 'text-amber-700' : 'text-emerald-700'}>{days < 0 ? `${-days} days overdue` : days === 0 ? 'Due today' : `${days} days left`}</span>}
                        />
                        <Stat icon={<Wallet size={13} />} name="Recurring Amount" value={money(s.recurring_amount)} note={<span className="text-slate-500">{label(s.cycle)}</span>} />
                        <Stat icon={<CalendarDays size={13} />} name="Registration Date" value={s.registered_at ? shortDate(s.registered_at) : '-'} />
                    </div>
                </div>
                <div className="grid border-t border-slate-200 sm:grid-cols-2 xl:grid-cols-4">
                    <Fact icon={<Globe size={18} />} name="Primary Domain">
                        {s.domain ? <a href={`https://${s.domain}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-accent">{s.domain} <ExternalLink size={12} /></a> : 'No domain'}
                    </Fact>
                    <Fact icon={<Network size={18} />} name="Name Servers">
                        {s.nameservers.length ? s.nameservers.slice(0, 2).map((ns) => <div key={ns}>{ns}</div>) : '-'}
                    </Fact>
                    <Fact icon={<Server size={18} />} name="Server Name">{host ?? '-'}</Fact>
                    <Fact icon={<MonitorSmartphone size={18} />} name="Server IP">{s.server_ip ?? '-'}</Fact>
                </div>
                <div className="flex flex-col-reverse gap-2 border-t border-slate-200 px-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="-mb-px flex min-w-0 gap-1 overflow-x-auto">
                        {tabs.map((t) => (
                            <button
                                key={t.key}
                                type="button"
                                onClick={() => setParams(t.key === 'overview' ? {} : { tab: t.key }, { replace: true })}
                                className={`flex cursor-pointer items-center gap-2 border-b-2 px-3 py-3.5 text-sm font-semibold whitespace-nowrap ${tab === t.key ? 'border-[var(--accent)] text-accent' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                            >
                                {t.icon} {t.label}
                            </button>
                        ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-3 lg:shrink-0 lg:justify-end lg:py-2">
                        {canLogin && active && (
                            <button type="button" disabled={panel.pending} onClick={() => panel.open()} className="ui-btn ui-btn-primary">
                                <LogIn size={15} /> {panel.pending ? 'Opening...' : s.is_vps ? 'Open Console' : `Login to ${panelLabel}`}
                            </button>
                        )}
                        {!tools && s.panel_url && active && <a href={s.panel_url} target="_blank" rel="noreferrer" className="ui-btn ui-btn-primary"><ExternalLink size={15} /> Login to {panelLabel}</a>}
                        <Dropdown label="Manage service" buttonClassName="ui-btn ui-btn-secondary" button={<>Manage Service <ChevronDown size={14} /></>} menuClassName="w-56 py-1 text-sm">
                            {canManage && s.can_upgrade && <button type="button" role="menuitem" className={menuItem} onClick={() => setDialog('upgrade')}><ArrowUpDown size={14} className="text-slate-400" /> {s.is_vps ? 'Upgrade Plan' : 'Upgrade / Downgrade'}</button>}
                            {tools && hosting && <button type="button" role="menuitem" className={menuItem} onClick={() => setDialog('password')}><KeyRound size={14} className="text-slate-400" /> Change Password</button>}
                            <button type="button" role="menuitem" className={menuItem} onClick={() => setParams({ tab: 'invoices' }, { replace: true })}><FileText size={14} className="text-slate-400" /> View Invoices</button>
                            <Link role="menuitem" className={menuItem} to={`/tickets/new?service=${s.id}`}><Headset size={14} className="text-slate-400" /> Get Support</Link>
                            {!['cancelled', 'terminated'].includes(s.status) && (
                                <>
                                    <div className="my-1 border-t border-slate-100" />
                                    <Link role="menuitem" className={`${menuItem} text-rose-600 hover:bg-rose-50`} to={subjectFor('Cancellation request')}><CircleX size={14} /> Request Cancellation</Link>
                                </>
                            )}
                        </Dropdown>
                    </div>
                </div>
            </section>

            {tab === 'overview' && (
                <>
                    {s.is_vps && <VpsPanel base={`/client/services/${s.id}`} />}

                    <div className="grid items-start gap-5 xl:grid-cols-2">
                        <SectionCard icon={<ShieldCheck size={18} />} title="Service Overview" subtitle="A summary of your plan and its current state.">
                            <div className="divide-y divide-slate-100">
                                <InfoRow icon={<Globe size={15} />} name="Primary Domain" actions={canManage && hosting && active ? <Link to={subjectFor('Change primary domain')} className="icon-btn h-8 w-8" aria-label="Ask to change the primary domain" title="Ask to change the primary domain"><Pencil size={14} /></Link> : undefined}>
                                    {s.domain ?? 'No domain'}
                                </InfoRow>
                                <InfoRow icon={<CircleCheck size={15} />} name="Status"><Status value={s.status} /></InfoRow>
                                <InfoRow icon={<HardDrive size={15} />} name={hosting ? 'Hosting Package' : 'Plan'}>{s.product.name}</InfoRow>
                                {hosting && <InfoRow icon={<LayoutGrid size={15} />} name="Control Panel"><span className="inline-flex items-center gap-2"><PanelLogo module={s.product.module} /> {panelLabel}</span></InfoRow>}
                                <InfoRow icon={<CalendarDays size={15} />} name="Created On">{shortDate(s.created_at)}</InfoRow>
                            </div>
                            {s.description && <p className="mt-3 border-t border-slate-100 pt-3 text-xs whitespace-pre-line text-slate-500">{s.description}</p>}
                        </SectionCard>

                        {hosting && (
                            <SectionCard icon={<Link2 size={18} />} title="Connection Details" subtitle="Use these to reach your account by control panel or FTP.">
                                <div className="divide-y divide-slate-100">
                                    <InfoRow icon={<LayoutGrid size={15} />} name={`${panelLabel} URL`} actions={<CopyButton value={s.panel_url} what="login URL" />}>
                                        {s.panel_url ? <a href={s.panel_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 break-all text-accent hover:underline">{s.panel_url} <ExternalLink size={12} /></a> : '-'}
                                    </InfoRow>
                                    {s.product.module === 'cpanel' && host && (
                                        <InfoRow icon={<Mail size={15} />} name="Webmail" actions={<CopyButton value={`https://${host}:2096`} what="webmail URL" />}>
                                            <a href={`https://${host}:2096`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 break-all text-accent hover:underline">https://{host}:2096 <ExternalLink size={12} /></a>
                                        </InfoRow>
                                    )}
                                    <InfoRow icon={<KeyRound size={15} />} name="Username" actions={<CopyButton value={s.username} what="username" />}>
                                        {s.username ? <span className="font-mono">{s.username}</span> : '-'}
                                    </InfoRow>
                                    {(s.has_password || tools) && (
                                        <InfoRow
                                            icon={<ShieldCheck size={15} />}
                                            name="Password"
                                            actions={(
                                                <>
                                                    {s.has_password && canManage && <button type="button" className="icon-btn h-8 w-8" disabled={reveal.isPending} aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={revealPassword}>{showPassword ? <EyeOff size={14} /> : <Eye size={14} />}</button>}
                                                    {tools && <button type="button" className="icon-btn h-8 w-8" aria-label="Change password" title="Change password" onClick={() => setDialog('password')}><Pencil size={14} /></button>}
                                                    {showPassword && <CopyButton value={reveal.data?.password} what="password" />}
                                                </>
                                            )}
                                        >
                                            <span className="font-mono">{showPassword && reveal.data ? (reveal.data.password ?? 'Not stored') : s.has_password ? '••••••••••••' : 'Not stored'}</span>
                                        </InfoRow>
                                    )}
                                    <InfoRow icon={<FolderOpen size={15} />} name="FTP Host" actions={<CopyButton value={host} what="FTP host" />}>{host ? <><span>{host}</span> <span className="text-xs text-slate-500">· port 21</span></> : '-'}</InfoRow>
                                </div>
                                <p className="mt-3 flex items-start gap-2 rounded-xl bg-sky-50 px-3 py-2.5 text-xs text-sky-900"><Info size={14} className="mt-0.5 shrink-0" /> Use the same username and password for {panelLabel}{s.product.module === 'cpanel' ? ', FTP and webmail' : ' and FTP'}. Never share them.</p>
                            </SectionCard>
                        )}
                    </div>

                    {hosting && (
                        <div className="grid items-start gap-5 xl:grid-cols-2">
                            <SectionCard
                                icon={<Gauge size={18} />}
                                title="Usage Summary"
                                action={tools ? <button type="button" disabled={usage.isPending} onClick={() => usage.mutate()} className="icon-btn h-8 w-8" aria-label="Refresh usage" title="Refresh usage"><RefreshCw size={14} className={usage.isPending ? 'animate-spin' : ''} /></button> : undefined}
                            >
                                {hasUsage ? (
                                    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                                        <Ring percent={diskPct} />
                                        <div className="w-full min-w-0 flex-1 space-y-4">
                                            <Meter icon={<HardDrive size={14} />} name="Disk Space" used={`${size(s.usage.disk_used ?? 0)} / ${s.usage.disk_limit ? size(s.usage.disk_limit) : 'Unlimited'}`} percent={diskPct} />
                                            <Meter icon={<ArrowUpDown size={14} />} name="Bandwidth" used={`${size(s.usage.bw_used ?? 0)} / ${s.usage.bw_limit ? size(s.usage.bw_limit) : 'Unlimited'}`} percent={bwPct} />
                                            {extraMetrics.slice(0, 4).map((m) => (
                                                <Meter key={m.key} icon={metricIcon(`${m.key} ${m.label}`)} name={m.label} used={`${m.used} / ${m.limit ?? 'Unlimited'}`} percent={m.limit && m.percent !== null ? Math.round(m.percent) : null} />
                                            ))}
                                        </div>
                                    </div>
                                ) : <p className="py-6 text-center text-sm text-slate-500">{tools ? 'No usage read yet. Press refresh to read it from the server.' : 'Usage appears here once the account is set up.'}</p>}
                                <ErrorNote error={usage.error} />
                                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                                    <span>Last updated: {s.usage.updated_at ? new Date(s.usage.updated_at).toLocaleString('en-GB') : 'never'}</span>
                                    {extraMetrics.length > 4 && <button type="button" className="table-action-link" onClick={() => setParams({ tab: 'usage' }, { replace: true })}>All statistics</button>}
                                </div>
                            </SectionCard>

                            <SectionCard icon={<LayoutGrid size={18} />} title="Quick Actions">
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                    {tools && active && <Tile icon={<PanelLogo module={s.product.module} />} tone="" name={`Login to ${panelLabel}`} disabled={panel.pending} onClick={() => panel.open()} />}
                                    {tools && <Tile icon={<KeyRound size={18} />} tone="bg-emerald-100 text-emerald-700" name="Change Password" onClick={() => setDialog('password')} />}
                                    {canManage && s.can_upgrade && <Tile icon={<ArrowUpDown size={18} />} tone="bg-sky-100 text-sky-700" name="Upgrade / Downgrade" onClick={() => setDialog('upgrade')} />}
                                    {app('email') && active && <Tile icon={<Mail size={18} />} tone="bg-indigo-100 text-indigo-700" name="Email Accounts" disabled={panel.pending} onClick={() => panel.open('email')} />}
                                    {app('databases') && active && <Tile icon={<Database size={18} />} tone="bg-amber-100 text-amber-700" name="Manage Databases" disabled={panel.pending} onClick={() => panel.open('databases')} />}
                                    {app('files') && active && <Tile icon={<FolderOpen size={18} />} tone="bg-teal-100 text-teal-700" name="File Manager" disabled={panel.pending} onClick={() => panel.open('files')} />}
                                    {app('backups') && active && <Tile icon={<History size={18} />} tone="bg-violet-100 text-violet-700" name="Backups" disabled={panel.pending} onClick={() => panel.open('backups')} />}
                                    {canManage && active && <Tile icon={<Globe size={18} />} tone="bg-purple-100 text-purple-700" name="Change Domain" to={subjectFor('Change primary domain')} />}
                                    <Tile icon={<Headset size={18} />} tone="bg-cyan-100 text-cyan-700" name="Open Support Ticket" to={`/tickets/new?service=${s.id}`} />
                                    {!['cancelled', 'terminated'].includes(s.status) && <Tile icon={<CircleX size={18} />} tone="bg-rose-100 text-rose-600" name="Request Cancellation" to={subjectFor('Cancellation request')} />}
                                </div>
                            </SectionCard>
                        </div>
                    )}

                    <div className="grid items-start gap-5 xl:grid-cols-2">
                        <SectionCard icon={<Info size={18} />} title="Important Information">
                            <ul className="space-y-2.5 text-sm text-slate-600">
                                {['Keep your account login details secure.', 'Take regular backups of your website and email.', hosting ? 'Resource usage is refreshed from the server every day.' : 'Contact support if anything about this service looks wrong.'].map((t) => (
                                    <li key={t} className="flex items-start gap-2"><CircleCheck size={16} className="mt-0.5 shrink-0 text-emerald-600" /> {t}</li>
                                ))}
                            </ul>
                            {canManage && s.can_upgrade && (
                                <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl border border-sky-200 bg-sky-50/70 p-4">
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-600 text-white"><Info size={16} /></span>
                                    <div className="min-w-0 flex-1">
                                        <div className="font-semibold text-slate-900">Need more power?</div>
                                        <div className="text-sm text-slate-600">Move to a bigger plan for more resources. You only pay the difference.</div>
                                    </div>
                                    <Button type="button" variant="ghost" onClick={() => setDialog('upgrade')}>Upgrade Now</Button>
                                </div>
                            )}
                        </SectionCard>

                        {(host || s.nameservers.length > 0 || s.server_ip) && (
                            <SectionCard icon={<Server size={18} />} title="Server Information">
                                <div className="divide-y divide-slate-100">
                                    {host && <InfoRow icon={<Server size={15} />} name="Server Name" actions={<CopyButton value={host} what="server name" />}>{host}</InfoRow>}
                                    {s.server_ip && <InfoRow icon={<MonitorSmartphone size={15} />} name="Server IP" actions={<CopyButton value={s.server_ip} what="server IP" />}><span className="font-mono">{s.server_ip}</span></InfoRow>}
                                    {s.nameservers.map((ns, i) => <InfoRow key={ns} icon={<Network size={15} />} name={`Nameserver ${i + 1}`} actions={<CopyButton value={ns} what={`nameserver ${i + 1}`} />}>{ns}</InfoRow>)}
                                </div>
                                <p className="mt-3 flex items-start gap-2 rounded-xl bg-sky-50 px-3 py-2.5 text-xs text-sky-900"><Info size={14} className="mt-0.5 shrink-0" /> Point your domain to these nameservers, or add an A record to the server IP.</p>
                            </SectionCard>
                        )}
                    </div>
                </>
            )}

            {tab === 'usage' && (
                <SectionCard
                    icon={<Gauge size={18} />}
                    title="Resource Usage"
                    subtitle={`Last updated: ${s.usage.updated_at ? new Date(s.usage.updated_at).toLocaleString('en-GB') : 'never'}`}
                    action={tools ? <Button type="button" variant="ghost" disabled={usage.isPending} onClick={() => usage.mutate()}><RefreshCw size={14} className={usage.isPending ? 'animate-spin' : ''} /> {usage.isPending ? 'Refreshing...' : 'Refresh Now'}</Button> : undefined}
                >
                    <ErrorNote error={usage.error} />
                    {hasUsage ? (
                        <div className="grid gap-x-8 gap-y-5 md:grid-cols-2">
                            <Meter icon={<HardDrive size={14} />} name="Disk Space" used={`${size(s.usage.disk_used ?? 0)} / ${s.usage.disk_limit ? size(s.usage.disk_limit) : 'Unlimited'}`} percent={diskPct} />
                            <Meter icon={<ArrowUpDown size={14} />} name="Bandwidth" used={`${size(s.usage.bw_used ?? 0)} / ${s.usage.bw_limit ? size(s.usage.bw_limit) : 'Unlimited'}`} percent={bwPct} />
                            {extraMetrics.map((m) => (
                                <Meter key={m.key} icon={metricIcon(`${m.key} ${m.label}`)} name={m.label} used={`${m.used} / ${m.limit ?? 'Unlimited'}`} percent={m.limit && m.percent !== null ? Math.round(m.percent) : null} />
                            ))}
                        </div>
                    ) : <p className="py-8 text-center text-sm text-slate-500">No usage statistics for this service yet.</p>}
                </SectionCard>
            )}

            {tab === 'invoices' && (
                <section className="card overflow-hidden">
                    <Table rows={s.invoices} empty="No invoices for this service yet." columns={[
                        { header: 'Invoice', cell: (i) => <Link className="table-action-link font-semibold" to={`/invoices/${i.id}`}>#{i.number}</Link> },
                        { header: 'Due Date', cell: (i) => shortDate(i.due_date) },
                        { header: 'Total', cell: (i) => money(i.total, i.currency), align: 'right' },
                        { header: 'Status', cell: (i) => <Status value={i.status} /> },
                    ]} />
                </section>
            )}

            {tab === 'activity' && (
                <SectionCard icon={<Activity size={18} />} title="Activity" subtitle="Recent changes and sign-ins on this service.">
                    {s.activity.length === 0 ? <p className="py-6 text-center text-sm text-slate-500">No activity yet.</p> : (
                        <ul className="divide-y divide-slate-100">
                            {s.activity.map((a) => (
                                <li key={a.id} className="flex items-center gap-3 py-3">
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600"><History size={15} /></span>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm font-medium text-slate-900">{a.title}</div>
                                        <div className="text-xs text-slate-500">{a.by}</div>
                                    </div>
                                    <span className="shrink-0 text-xs text-slate-500">{a.at ? new Date(a.at).toLocaleString('en-GB') : ''}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </SectionCard>
            )}

            {dialog === 'password' && (
                <PasswordModal s={s} onClose={() => setDialog(null)} onDone={(data) => { setDialog(null); fresh(data); reveal.reset(); setShowPassword(false); setNotice(`Your ${panelLabel} password has been changed.`); }} />
            )}
            {dialog === 'upgrade' && (
                <UpgradeModal
                    service={s}
                    base={`/client/services/${s.id}`}
                    onClose={() => setDialog(null)}
                    onDone={(r) => {
                        setDialog(null);
                        setNotice(<>{r.message} {r.invoice_id && <Link className="font-semibold underline" to={`/invoices/${r.invoice_id}`}>Pay invoice</Link>}</>);
                        qc.invalidateQueries({ queryKey: ['client-service', String(s.id)] });
                        qc.invalidateQueries({ queryKey: ['client-services'] });
                        qc.invalidateQueries({ queryKey: ['client-overview'] });
                    }}
                />
            )}
        </div>
    );
}
