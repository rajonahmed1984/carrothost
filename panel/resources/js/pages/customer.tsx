import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    ArrowLeft, ArrowRight, ArrowRightLeft, ArrowUpDown, Bell, Building2, CalendarDays, ChevronDown, ChevronRight, CircleCheck, CircleX, Clock, CreditCard, Download, ExternalLink, Eye, FileText, Filter, Globe, HardDrive, Headset, History, Info,
    LayoutList, LockKeyhole, LogOut, Menu, MessageSquareText, MoreVertical, Package, Plus, Printer, Search, Server, ShieldCheck, ShoppingCart, User, X, Contact, KeyRound, Mail, MonitorSmartphone, Power,
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api, basePath, money } from '../api';
import { Button, Card, Dropdown, ErrorNote, Field, Input, LogoIcon, QueryState, Select, Status, Table, useBranding } from '../ui';
import { ContactsPage, EmailPage, EmailsPage, MyDetailsPage, SessionsPage, SupportPinPage } from './account';
import { AddFundsPage, CreditHistoryPage } from './credits';
import { clientCan, ClientPasswordPage, ClientSecurityPage, type ClientProfile } from './security';
import { ClientChatPage, ClientNewTicketPage, ClientTicketPage, ClientTicketsPage } from './support';
import { PanelLogo, panelName } from '../panel-logo';
import { ClientServicePage } from './client-service';
import { ClientDomainPage } from './client-domain';
import { DomainOrderPage } from './domain-order';

type Overview = {
    services: { id: number; domain: string | null; cycle: string; recurring_amount: string; status: string; next_due_date: string | null; product: { name: string } }[];
    domains: { id: number; name: string; status: string; expires_at: string | null; recurring_amount: string }[];
    invoices: { id: number; number: string; status: string; currency: string; total: string; due_date: string }[];
    open_tickets: number;
    renewals: { type: 'service' | 'domain'; id: number; name: string; detail: string | null; due: string; amount: string }[];
    activity: { type: 'ticket' | 'invoice' | 'service'; title: string; detail: string | null; link: string; at: string }[];
};

const useOverview = () => useQuery({ queryKey: ['client-overview'], queryFn: async () => (await api.get<Overview>('/client/overview')).data });

const ago = (iso: string) => {
    const seconds = (new Date(iso).getTime() - Date.now()) / 1000;
    const units: [Intl.RelativeTimeFormatUnit, number][] = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]];
    const [unit, size] = units.find(([, n]) => Math.abs(seconds) >= n) ?? ['second', 1];

    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(Math.round(seconds / size), unit);
};

// Date-only fields may arrive as "2026-11-01" or as "2026-11-01T00:00:00.000000Z"; read the calendar day either way.
const calendarDay = (date: string) => new Date(`${date.slice(0, 10)}T00:00:00`);
const daysUntil = (date: string) => Math.round((calendarDay(date).getTime() - new Date(new Date().toDateString()).getTime()) / 86400000);

function IconBox({ children, small }: { children: ReactNode; small?: boolean }) {
    return <span className={`flex shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-accent ${small ? 'h-10 w-10' : 'h-14 w-14'}`}>{children}</span>;
}

function StatCard({ icon, value, label, badge, to, action }: { icon: ReactNode; value: number; label: string; badge?: ReactNode; to: string; action: string }) {
    return (
        <section className="card flex flex-col">
            <div className="flex items-center gap-4 p-5">
                <IconBox>{icon}</IconBox>
                <div className="min-w-0">
                    <div className="text-2xl font-bold text-slate-900 tabular-nums">{value}</div>
                    <div className="text-sm text-slate-600">{label}</div>
                    {badge}
                </div>
            </div>
            <Link to={to} className="mt-auto flex items-center justify-end gap-1.5 border-t border-slate-200 px-5 py-3 text-xs font-semibold text-accent hover:underline">{action} <ArrowRight size={14} /></Link>
        </section>
    );
}

function QuickAction({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
    return (
        <Link to={to} className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-4 text-center text-xs font-semibold text-slate-800 transition hover:border-[var(--accent)] hover:bg-white">
            <IconBox small>{icon}</IconBox>
            {label}
        </Link>
    );
}

function Home({ profile, firstStore }: { profile: ClientProfile; firstStore: string | null }) {
    const query = useOverview();
    const d = query.data;
    const unpaid = d?.invoices.filter((i) => i.status === 'unpaid') ?? [];
    const activityIcon = { ticket: <MessageSquareText size={16} />, invoice: <FileText size={16} />, service: <Server size={16} /> };
    const can = (permission: string) => clientCan(profile, permission);

    return (
        <QueryState query={query}>
            {d && (
                <div className="space-y-5">

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {can('products') && <StatCard icon={<Server size={24} />} value={d.services.filter((x) => x.status === 'active').length} label="Services" to="/services" action="Manage Services" />}
                        {can('domains') && <StatCard icon={<Globe size={24} />} value={d.domains.filter((x) => x.status === 'active').length} label="Domains" to="/domains" action="Manage Domains" />}
                        {can('tickets') && <StatCard icon={<MessageSquareText size={24} />} value={d.open_tickets} label="Open Tickets" to="/tickets" action="View Tickets" />}
                        {can('invoices') && <StatCard
                            icon={<FileText size={24} />}
                            value={unpaid.length}
                            label="Unpaid Invoices"
                            badge={<span className={`mt-1 inline-block rounded-md px-2 py-0.5 text-[11px] font-bold ${unpaid.length ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700'}`}>{unpaid.length ? `${money(unpaid.reduce((sum, i) => sum + Number(i.total), 0), unpaid[0].currency)} due` : 'All paid'}</span>}
                            to="/invoices"
                            action="View Invoices"
                        />}
                    </div>

                    <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
                        <Card title="Upcoming Renewals" action={<Link to="/services" className="flex items-center gap-1 text-sm font-semibold text-accent">View All <ArrowRight size={14} /></Link>}>
                            {d.renewals.length === 0 ? <p className="p-10 text-center text-sm text-slate-500">Nothing is due for renewal in the next 90 days.</p> : (
                                <ul className="divide-y divide-slate-100">
                                    {d.renewals.map((r) => {
                                        const days = daysUntil(r.due);

                                        return (
                                            <li key={`${r.type}-${r.id}`} className="flex items-center gap-3 px-4 py-3">
                                                <IconBox small>{r.type === 'domain' ? <Globe size={16} /> : <Server size={16} />}</IconBox>
                                                <div className="min-w-0 flex-1">
                                                    <div className="truncate text-sm font-semibold text-slate-900">{r.name}</div>
                                                    {r.detail && <div className="truncate text-xs text-slate-500">{r.detail}</div>}
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-semibold text-slate-900 tabular-nums">{money(r.amount)}</div>
                                                    <div className={`text-xs ${days < 0 ? 'text-rose-600' : days <= 14 ? 'text-amber-700' : 'text-slate-500'}`}>{days < 0 ? `${-days} days overdue` : days === 0 ? 'Due today' : `Due in ${days} days`}</div>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </Card>

                        <Card title="Quick Actions">
                            <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3">
                                {can('orders') && <QuickAction to={firstStore ?? '/order-domain'} icon={<ShoppingCart size={18} />} label="Order New Service" />}
                                {can('orders') && <QuickAction to="/order-domain" icon={<Globe size={18} />} label="Register Domain" />}
                                {can('orders') && <QuickAction to="/order-domain?action=transfer" icon={<ArrowRightLeft size={18} />} label="Transfer Domain" />}
                                {can('products') && <QuickAction to="/services" icon={<Server size={18} />} label="Manage Services" />}
                                {can('invoices') && <QuickAction to="/invoices" icon={<FileText size={18} />} label="View Invoices" />}
                                {can('tickets') && <QuickAction to="/tickets/new" icon={<Headset size={18} />} label="Open Support Ticket" />}
                            </div>
                        </Card>
                    </div>

                    <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
                        <section className="card p-4">
                            <div className="flex h-full flex-col items-center gap-5 rounded-2xl bg-slate-50 p-6 sm:flex-row">
                                <span className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full ${profile.otp_enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-[var(--accent-soft)] text-accent'}`}><ShieldCheck size={30} /></span>
                                <div className="flex-1 text-center sm:text-left">
                                    <h3 className="text-lg font-bold text-slate-900">{profile.otp_enabled ? 'Your account is protected' : 'Keep your account secure'}</h3>
                                    <p className="mt-1 text-sm text-slate-600">
                                        {profile.otp_enabled ? 'Two-step sign-in is on: we email you a code each time you log in.' : 'Turn on two-step sign-in and keep your account safe from unauthorised access.'}
                                    </p>
                                    {!profile.impersonating && can('owner') && (
                                        <Link to="/security" className={`mt-4 inline-block rounded-xl border-2 px-5 py-2 text-sm font-semibold ${profile.otp_enabled ? 'border-slate-300 text-slate-700' : 'border-[var(--accent)] text-accent hover:bg-[var(--accent-soft)]'}`}>
                                            {profile.otp_enabled ? 'Security settings' : 'Enable 2FA'}
                                        </Link>
                                    )}
                                </div>
                                <LockKeyhole size={88} strokeWidth={1.2} className="hidden shrink-0 text-slate-300 md:block" />
                            </div>
                        </section>

                        <Card title="Recent Activity">
                            {d.activity.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">No activity yet.</p> : (
                                <ul className="divide-y divide-slate-100">
                                    {d.activity.map((a, i) => (
                                        <li key={i}>
                                            <Link to={a.link} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50">
                                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">{activityIcon[a.type]}</span>
                                                <div className="min-w-0 flex-1">
                                                    <div className="truncate text-sm font-semibold text-slate-900">{a.title}</div>
                                                    {a.detail && <div className="truncate text-xs text-slate-500">{a.detail}</div>}
                                                </div>
                                                <span className="shrink-0 text-xs text-slate-500">{ago(a.at)}</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Card>
                    </div>
                </div>
            )}
        </QueryState>
    );
}

type ClientService = {
    id: number; domain: string | null; cycle: string; recurring_amount: string; status: string; next_due_date: string | null; created_at: string;
    product: { name: string; type: string; module: string | null; group: string | null }; username: string | null; panel_url: string | null;
};

const typeTabs = [
    { key: 'all', label: 'All Services', icon: <LayoutList size={15} /> },
    { key: 'shared_hosting', label: 'Hosting', icon: <HardDrive size={15} /> },
    { key: 'vps', label: 'VPS', icon: <Server size={15} /> },
    { key: 'other', label: 'Other', icon: <Package size={15} /> },
];
const statusDot: Record<string, string> = { active: 'bg-emerald-500', pending: 'bg-amber-500', suspended: 'bg-rose-500', terminated: 'bg-slate-400', cancelled: 'bg-slate-400' };

function DueDate({ date }: { date: string | null }) {
    if (!date) return <span className="text-slate-400">-</span>;
    const days = daysUntil(date);

    return (
        <>
            <div className="font-semibold text-slate-900">{calendarDay(date).toLocaleDateString('en-GB').replaceAll('/', '-')}</div>
            <div className={`text-xs ${days < 0 ? 'text-rose-600' : days <= 14 ? 'text-amber-700' : 'text-slate-500'}`}>({days < 0 ? `${-days} days overdue` : days === 0 ? 'due today' : `${days} days left`})</div>
        </>
    );
}

function SummaryCard({ icon, tone, label, value, note }: { icon: ReactNode; tone: string; label: string; value: number; note: ReactNode }) {
    return (
        <section className="card flex items-center gap-4 p-5">
            <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${tone}`}>{icon}</span>
            <div className="min-w-0">
                <div className="text-sm text-slate-600">{label}</div>
                <div className="text-2xl font-bold text-slate-900 tabular-nums">{value}</div>
                <div className="text-xs">{note}</div>
            </div>
        </section>
    );
}

function RowMenu({ service }: { service: ClientService }) {
    return (
        <Dropdown label={`More actions for ${service.product.name}`} buttonClassName="icon-btn" button={<MoreVertical size={16} />} menuClassName="w-48 py-1 text-sm">
            <Link to={`/services/${service.id}`} role="menuitem" className="block px-4 py-2 text-slate-700 hover:bg-slate-50">View details</Link>
            <Link to={`/tickets/new?service=${service.id}`} role="menuitem" className="block px-4 py-2 text-slate-700 hover:bg-slate-50">Get support</Link>
            <Link to="/invoices" role="menuitem" className="block px-4 py-2 text-slate-700 hover:bg-slate-50">View invoices</Link>
        </Dropdown>
    );
}

type SortKey = 'name' | 'group' | 'price' | 'due' | 'status';

function MyServices({ orderTo }: { orderTo: string }) {
    const query = useQuery({ queryKey: ['client-services'], queryFn: async () => (await api.get<ClientService[]>('/client/services')).data });
    const [tab, setTab] = useState('all');
    const [status, setStatus] = useState('');
    const [group, setGroup] = useState('');
    const [search, setSearch] = useState('');
    const [perPage, setPerPage] = useState(25);
    const [page, setPage] = useState(1);
    const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'due', dir: 1 });
    const all = query.data ?? [];
    const groups = [...new Set(all.map((x) => x.product.group).filter(Boolean))] as string[];
    const sortValue = (x: ClientService): string | number => ({ name: x.product.name, group: x.product.group ?? '', price: Number(x.recurring_amount), due: x.next_due_date ?? '9999', status: x.status })[sort.key];
    const rows = all
        .filter((x) => tab === 'all' || x.product.type === tab)
        .filter((x) => !status || x.status === status)
        .filter((x) => !group || x.product.group === group)
        .filter((x) => !search || `${x.product.name} ${x.domain ?? ''}`.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => (sortValue(a) > sortValue(b) ? 1 : sortValue(a) < sortValue(b) ? -1 : 0) * sort.dir);
    const pages = Math.max(1, Math.ceil(rows.length / perPage));
    const current = Math.min(page, pages);
    const shown = rows.slice((current - 1) * perPage, current * perPage);
    const count = (s: string) => all.filter((x) => x.status === s).length;

    const header = (key: SortKey | null, label: string) => (
        <th className="px-5 py-3 font-semibold whitespace-nowrap">
            {key ? (
                <button type="button" className="inline-flex cursor-pointer items-center gap-1.5 hover:text-slate-900" onClick={() => setSort({ key, dir: sort.key === key ? (-sort.dir as 1 | -1) : 1 })}>
                    {label} <ArrowUpDown size={12} className={sort.key === key ? 'text-accent' : 'text-slate-400'} />
                </button>
            ) : label}
        </th>
    );

    const exportCsv = () => {
        const cell = (v: string) => `"${v.replaceAll('"', '""')}"`;
        const csv = [['Product', 'Domain', 'Category', 'Price', 'Cycle', 'Next due', 'Status'], ...rows.map((x) => [x.product.name, x.domain ?? '', x.product.group ?? '', x.recurring_amount, x.cycle, x.next_due_date ?? '', x.status])]
            .map((r) => r.map(cell).join(','))
            .join('\n');
        const link = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: 'my-services.csv' });
        link.click();
        URL.revokeObjectURL(link.href);
    };

    return (
        <div className="space-y-5">
            <QueryState query={query}>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <SummaryCard icon={<Package size={26} />} tone="bg-emerald-100 text-emerald-700" label="Total Services" value={all.length} note={<span className="text-slate-500">All services in your account</span>} />
                    <SummaryCard icon={<CircleCheck size={26} />} tone="bg-sky-100 text-sky-700" label="Active Services" value={count('active')} note={<span className="text-emerald-700">Currently active</span>} />
                    <SummaryCard icon={<Clock size={26} />} tone="bg-amber-100 text-amber-700" label="Pending Services" value={count('pending')} note={<span className="text-amber-700">Awaiting setup</span>} />
                    <SummaryCard icon={<LockKeyhole size={26} />} tone="bg-violet-100 text-violet-700" label="Suspended Services" value={count('suspended')} note={<span className="text-rose-600">Require attention</span>} />
                </div>

                <section className="card overflow-hidden">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5">
                        <div className="-mb-px flex gap-1 overflow-x-auto">
                            {typeTabs.map((t) => (
                                <button
                                    key={t.key}
                                    type="button"
                                    onClick={() => { setTab(t.key); setPage(1); }}
                                    className={`flex cursor-pointer items-center gap-2 border-b-2 px-3 py-4 text-sm font-semibold whitespace-nowrap ${tab === t.key ? 'border-[var(--accent)] text-accent' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                                >
                                    {t.icon} {t.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-2 py-2">
                            <Button type="button" variant="ghost" disabled={!rows.length} onClick={exportCsv}><Download size={14} /> Export List</Button>
                            <Link to={orderTo} className="ui-btn ui-btn-primary"><Plus size={14} /> Order New Service</Link>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                            Show
                            <span className="w-20"><Select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}>{[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}</Select></span>
                            entries
                        </label>
                        <div className="flex flex-wrap gap-2">
                            <span className="w-36"><Select aria-label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
                                <option value="">All Status</option>
                                {['active', 'pending', 'suspended', 'terminated', 'cancelled'].map((x) => <option key={x} value={x}>{x[0].toUpperCase() + x.slice(1)}</option>)}
                            </Select></span>
                            <span className="w-40"><Select aria-label="Category" value={group} onChange={(e) => { setGroup(e.target.value); setPage(1); }}>
                                <option value="">All Categories</option>
                                {groups.map((g) => <option key={g} value={g}>{g}</option>)}
                            </Select></span>
                            <div className="relative w-56">
                                <Input type="search" aria-label="Search services" placeholder="Search service..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
                                <Search size={15} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-slate-400" />
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[60rem] text-left text-sm">
                            <thead className="border-y border-slate-200 bg-slate-50 text-xs text-slate-600">
                                <tr>{header('name', 'Product / Service')}{header('group', 'Category')}{header('price', 'Pricing')}{header('due', 'Next Due Date')}{header('status', 'Status')}{header(null, 'Quick Action')}{header(null, 'Action')}</tr>
                            </thead>
                            <tbody>
                                {shown.length === 0 && <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-500">{all.length ? 'No services match these filters.' : 'You have no services yet.'}</td></tr>}
                                {shown.map((x) => (
                                    <tr key={x.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70">
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <PanelLogo module={x.product.module} type={x.product.type} />
                                                <div className="min-w-0"><div className="font-semibold text-slate-900">{x.product.name}</div><div className="truncate text-xs text-slate-500">{x.domain ?? 'No domain'}</div></div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3">{x.product.group ? <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">{x.product.group}</span> : '-'}</td>
                                        <td className="px-5 py-3"><div className="font-semibold text-slate-900 tabular-nums">{money(x.recurring_amount)}</div><div className="text-xs text-slate-500 capitalize">{x.cycle}</div></td>
                                        <td className="px-5 py-3"><DueDate date={x.next_due_date} /></td>
                                        <td className="px-5 py-3"><span className="inline-flex items-center gap-2 capitalize"><span className={`h-2 w-2 rounded-full ${statusDot[x.status] ?? 'bg-slate-400'}`} />{x.status}</span></td>
                                        <td className="px-5 py-3">
                                            {x.panel_url && x.status === 'active'
                                                ? <a href={x.panel_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"><ExternalLink size={13} /> Login to {panelName(x.product.module)}</a>
                                                : <span className="text-xs text-slate-400">-</span>}
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-1">
                                                <Link to={`/services/${x.id}`} className="rounded-lg border-2 border-[var(--accent)] px-3 py-1 text-xs font-semibold text-accent hover:bg-[var(--accent-soft)]">Manage</Link>
                                                <RowMenu service={x} />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-3 text-sm text-slate-600">
                        <span>Showing {rows.length ? (current - 1) * perPage + 1 : 0} to {Math.min(current * perPage, rows.length)} of {rows.length} entries</span>
                        {pages > 1 && (
                            <span className="flex gap-2">
                                <Button type="button" variant="ghost" disabled={current <= 1} onClick={() => setPage(current - 1)}>Previous</Button>
                                <Button type="button" variant="ghost" disabled={current >= pages} onClick={() => setPage(current + 1)}>Next</Button>
                            </span>
                        )}
                    </div>
                </section>

                <section className="flex flex-wrap items-center gap-4 rounded-2xl border border-sky-200 bg-sky-50/70 p-5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-600 text-white"><Info size={18} /></span>
                    <div className="min-w-0 flex-1">
                        <div className="font-semibold text-slate-900">Need to add a new service?</div>
                        <div className="text-sm text-slate-600">Browse our products and order the perfect hosting solution for your needs.</div>
                    </div>
                    <Link to={orderTo} className="ui-btn ui-btn-primary"><ShoppingCart size={14} /> Order New Service</Link>
                </section>
            </QueryState>
        </div>
    );
}

type ClientDomain = { id: number; name: string; action: string; years: number; auto_renew: boolean; recurring_amount: string; status: string; expires_at: string | null; created_at: string };
type DomainDetailData = ClientDomain & { nameservers: string[]; invoices: Overview['invoices'] };

const domainTabs = [
    { key: 'mine', label: 'My Domains', icon: <Globe size={15} />, empty: 'No domain found in your account.' },
    { key: 'transfer', label: 'Domain Transfer', icon: <ArrowRightLeft size={15} />, empty: 'You have not transferred any domain to us.' },
    { key: 'history', label: 'History', icon: <History size={15} />, empty: 'No expired or cancelled domains.' },
];
const domainDot: Record<string, string> = { active: 'bg-emerald-500', pending: 'bg-amber-500', expired: 'bg-rose-500', cancelled: 'bg-slate-400', transferred_out: 'bg-slate-400' };
const isPast = (status: string) => ['expired', 'cancelled', 'transferred_out'].includes(status);
const formatDate = (date: string) => new Date(date.length === 10 ? `${date}T00:00:00` : date).toLocaleDateString('en-GB').replaceAll('/', '-');

function DomainStatus({ status }: { status: string }) {
    return <span className="inline-flex items-center gap-2 capitalize"><span className={`h-2 w-2 rounded-full ${domainDot[status] ?? 'bg-slate-400'}`} />{status.replace('_', ' ')}</span>;
}

function AutoRenewSwitch({ domain }: { domain: ClientDomain }) {
    const qc = useQueryClient();
    const toggle = useMutation({
        mutationFn: async () => (await api.put<DomainDetailData>(`/client/domains/${domain.id}`, { auto_renew: !domain.auto_renew })).data,
        onSuccess: (fresh) => {
            qc.setQueryData(['client-domain', String(domain.id)], fresh);
            qc.invalidateQueries({ queryKey: ['client-domains'] });
            qc.invalidateQueries({ queryKey: ['client-overview'] });
        },
    });

    return (
        <button
            type="button"
            role="switch"
            aria-checked={domain.auto_renew}
            aria-label={`Auto renew ${domain.name}`}
            disabled={toggle.isPending || domain.status !== 'active'}
            onClick={() => toggle.mutate()}
            className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition disabled:cursor-not-allowed disabled:opacity-50 ${domain.auto_renew ? 'bg-emerald-500' : 'bg-slate-300'}`}
        >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${domain.auto_renew ? 'left-[22px]' : 'left-0.5'}`} />
        </button>
    );
}

function MyDomains() {
    const query = useQuery({ queryKey: ['client-domains'], queryFn: async () => (await api.get<ClientDomain[]>('/client/domains')).data });
    const [tab, setTab] = useState('mine');
    const [search, setSearch] = useState('');
    const all = query.data ?? [];
    const soon = all.filter((d) => d.status === 'active' && d.expires_at && daysUntil(d.expires_at) <= 30);
    const active = domainTabs.find((t) => t.key === tab) ?? domainTabs[0];
    const rows = all
        .filter((d) => (tab === 'history' ? isPast(d.status) : tab === 'transfer' ? d.action === 'transfer' : !isPast(d.status)))
        .filter((d) => !search || d.name.includes(search.toLowerCase().trim()))
        .sort((a, b) => (a.expires_at ?? '9999').localeCompare(b.expires_at ?? '9999'));

    const exportCsv = () => {
        const csv = [['Domain', 'Type', 'Registered', 'Expires', 'Auto renew', 'Renewal price', 'Status'], ...rows.map((d) => [d.name, d.action, d.created_at.slice(0, 10), d.expires_at ?? '', d.auto_renew ? 'yes' : 'no', d.recurring_amount, d.status])]
            .map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(','))
            .join('\n');
        const link = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: 'my-domains.csv' });
        link.click();
        URL.revokeObjectURL(link.href);
    };

    return (
        <div className="space-y-5">
            <QueryState query={query}>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <SummaryCard icon={<Globe size={26} />} tone="bg-emerald-100 text-emerald-700" label="Total Domains" value={all.length} note={<span className="text-slate-500">All domains in your account</span>} />
                    <SummaryCard icon={<CircleCheck size={26} />} tone="bg-sky-100 text-sky-700" label="Active Domains" value={all.filter((d) => d.status === 'active').length} note={<span className="text-emerald-700">Currently active domains</span>} />
                    <SummaryCard icon={<Clock size={26} />} tone="bg-amber-100 text-amber-700" label="Expiring Soon" value={soon.length} note={<span className="text-amber-700">Within 30 days</span>} />
                    <SummaryCard icon={<LockKeyhole size={26} />} tone="bg-violet-100 text-violet-700" label="Expired Domains" value={all.filter((d) => d.status === 'expired').length} note={<span className="text-rose-600">Require attention</span>} />
                </div>

                <section className="card overflow-hidden">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5">
                        <div className="-mb-px flex gap-1 overflow-x-auto">
                            {domainTabs.map((t) => (
                                <button
                                    key={t.key}
                                    type="button"
                                    onClick={() => setTab(t.key)}
                                    className={`flex cursor-pointer items-center gap-2 border-b-2 px-3 py-4 text-sm font-semibold whitespace-nowrap ${tab === t.key ? 'border-[var(--accent)] text-accent' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                                >
                                    {t.icon} {t.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex flex-wrap gap-2 py-2">
                            {all.length > 5 && (
                                <div className="relative w-52">
                                    <Input type="search" aria-label="Search domains" placeholder="Search domain..." value={search} onChange={(e) => setSearch(e.target.value)} />
                                    <Search size={15} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-slate-400" />
                                </div>
                            )}
                            <Button type="button" variant="ghost" disabled={!rows.length} onClick={exportCsv}><Download size={14} /> Export List</Button>
                            <Link to={tab === 'transfer' ? '/order-domain?action=transfer' : '/order-domain'} className="ui-btn ui-btn-primary"><Plus size={14} /> {tab === 'transfer' ? 'Transfer a Domain' : 'Order New Domain'}</Link>
                        </div>
                    </div>

                    {rows.length === 0 ? (
                        <div className="flex flex-col items-center gap-4 px-5 py-12 text-center">
                            <p className="text-sm text-slate-600">{search ? 'No domains match your search.' : active.empty}</p>
                            {!search && tab !== 'history' && (
                                <Link to={tab === 'transfer' ? '/order-domain?action=transfer' : '/order-domain'} className="ui-btn ui-btn-primary"><Plus size={14} /> {tab === 'transfer' ? 'Transfer a Domain' : 'Order New Domain'}</Link>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[52rem] text-left text-sm">
                                <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-600">
                                    <tr>{['Domain', 'Registered', 'Expiry Date', 'Renewal', 'Auto Renew', 'Status', 'Action'].map((h) => <th key={h} className="px-5 py-3 font-semibold whitespace-nowrap">{h}</th>)}</tr>
                                </thead>
                                <tbody>
                                    {rows.map((d) => (
                                        <tr key={d.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70">
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-3">
                                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><Globe size={18} /></span>
                                                    <div><div className="font-semibold text-slate-900">{d.name}</div><div className="text-xs text-slate-500">{d.action === 'transfer' ? 'Transferred' : 'Registered'}{d.years > 1 ? `, ${d.years} years` : ''}</div></div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 text-slate-700">{formatDate(d.created_at)}</td>
                                            <td className="px-5 py-3">{isPast(d.status) ? (d.expires_at ? formatDate(d.expires_at) : '-') : <DueDate date={d.expires_at} />}</td>
                                            <td className="px-5 py-3"><div className="font-semibold text-slate-900 tabular-nums">{money(d.recurring_amount)}</div><div className="text-xs text-slate-500">per {d.years > 1 ? `${d.years} years` : 'year'}</div></td>
                                            <td className="px-5 py-3"><AutoRenewSwitch domain={d} /></td>
                                            <td className="px-5 py-3"><DomainStatus status={d.status} /></td>
                                            <td className="px-5 py-3"><Link to={`/domains/${d.id}`} className="rounded-lg border-2 border-[var(--accent)] px-3 py-1 text-xs font-semibold text-accent hover:bg-[var(--accent-soft)]">Manage</Link></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {rows.length > 0 && <div className="border-t border-slate-200 px-5 py-3 text-sm text-slate-600">Showing {rows.length} of {all.length} domains</div>}
                </section>
            </QueryState>
        </div>
    );
}

type ClientInvoice = { id: number; number: string; status: string; currency: string; total: string; due_date: string; paid_at: string | null; created_at: string };
type InvoiceSort = 'number' | 'created' | 'due' | 'amount' | 'status';

const invoicePill: Record<string, string> = {
    paid: 'bg-emerald-50 text-emerald-700',
    unpaid: 'bg-amber-50 text-amber-800',
    refunded: 'bg-sky-50 text-sky-700',
    cancelled: 'bg-slate-500 text-white',
};
const longDate = (date: string) => new Date(date.length === 10 ? `${date}T00:00:00` : date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

function InvoicePill({ invoice }: { invoice: ClientInvoice }) {
    const overdue = invoice.status === 'unpaid' && daysUntil(invoice.due_date) < 0;

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold capitalize ${overdue ? 'bg-rose-50 text-rose-700' : invoicePill[invoice.status] ?? 'bg-slate-100 text-slate-600'}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" />{overdue ? 'Overdue' : invoice.status}
        </span>
    );
}

function MyInvoices() {
    const query = useQuery({ queryKey: ['client-invoices'], queryFn: async () => (await api.get<ClientInvoice[]>('/client/invoices')).data });
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [perPage, setPerPage] = useState(10);
    const [page, setPage] = useState(1);
    const [sort, setSort] = useState<{ key: InvoiceSort; dir: 1 | -1 }>({ key: 'created', dir: -1 });
    const all = query.data ?? [];
    const sum = (list: ClientInvoice[]) => list.reduce((total, i) => total + Number(i.total), 0);
    const byStatus = (s: string) => all.filter((i) => i.status === s);
    const value = (i: ClientInvoice): string | number => ({ number: Number(i.number) || i.number, created: i.created_at, due: i.due_date, amount: Number(i.total), status: i.status })[sort.key];
    const rows = all
        .filter((i) => !status || (status === 'overdue' ? i.status === 'unpaid' && daysUntil(i.due_date) < 0 : i.status === status))
        .filter((i) => !search || i.number.toLowerCase().includes(search.toLowerCase().replace('#', '').trim()))
        .sort((a, b) => (value(a) > value(b) ? 1 : value(a) < value(b) ? -1 : 0) * sort.dir);
    const pages = Math.max(1, Math.ceil(rows.length / perPage));
    const current = Math.min(page, pages);
    const shown = rows.slice((current - 1) * perPage, current * perPage);

    const header = (key: InvoiceSort | null, label: string) => (
        <th className="px-5 py-3 font-semibold whitespace-nowrap">
            {key ? (
                <button type="button" className="inline-flex cursor-pointer items-center gap-1.5 hover:text-slate-900" onClick={() => setSort({ key, dir: sort.key === key ? (-sort.dir as 1 | -1) : 1 })}>
                    {label} <ArrowUpDown size={12} className={sort.key === key ? 'text-accent' : 'text-slate-400'} />
                </button>
            ) : label}
        </th>
    );

    const downloadAll = () => {
        const csv = [['Invoice', 'Invoice date', 'Due date', 'Amount', 'Currency', 'Status', 'Paid on'], ...rows.map((i) => [`#${i.number}`, i.created_at.slice(0, 10), i.due_date, i.total, i.currency, i.status, i.paid_at?.slice(0, 10) ?? ''])]
            .map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(','))
            .join('\n');
        const link = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: 'my-invoices.csv' });
        link.click();
        URL.revokeObjectURL(link.href);
    };

    const stat = (icon: ReactNode, tone: string, label: string, count: number, note: ReactNode) => (
        <div className="flex items-center gap-4 p-5">
            <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${tone}`}>{icon}</span>
            <div className="min-w-0">
                <div className="text-sm text-slate-600">{label}</div>
                <div className="text-2xl font-bold text-slate-900 tabular-nums">{count}</div>
                <div className="text-xs">{note}</div>
            </div>
        </div>
    );

    return (
        <div className="space-y-5">
            <QueryState query={query}>
                <section className="card grid divide-y divide-slate-200 sm:grid-cols-2 sm:divide-y-0 xl:grid-cols-4 xl:divide-x">
                    {stat(<FileText size={26} />, 'bg-sky-100 text-sky-700', 'Total Invoices', all.length, <span className="text-slate-500">All invoices in your account</span>)}
                    {stat(<CircleCheck size={26} />, 'bg-emerald-100 text-emerald-700', 'Paid Invoices', byStatus('paid').length, <span className="text-emerald-700">Total {money(sum(byStatus('paid')))}</span>)}
                    {stat(<Clock size={26} />, 'bg-amber-100 text-amber-700', 'Unpaid Invoices', byStatus('unpaid').length, <span className="text-amber-700">Total {money(sum(byStatus('unpaid')))}</span>)}
                    {stat(<CircleX size={26} />, 'bg-rose-100 text-rose-600', 'Cancelled Invoices', byStatus('cancelled').length, <span className="text-rose-600">Total {money(sum(byStatus('cancelled')))}</span>)}
                </section>

                <section className="card overflow-hidden">
                    <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
                        <h3 className="text-base font-bold text-slate-900">Invoices</h3>
                        <div className="flex gap-2">
                            <Button type="button" variant="ghost" disabled={!rows.length} onClick={downloadAll}><Download size={14} /> Download All</Button>
                            <Button type="button" variant="ghost" aria-expanded={filtersOpen} onClick={() => setFiltersOpen(!filtersOpen)}><Filter size={14} /> Filters{status && ' (1)'}</Button>
                        </div>
                    </div>
                    {filtersOpen && (
                        <div className="mx-5 mt-4 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                            {['', 'unpaid', 'overdue', 'paid', 'refunded', 'cancelled'].map((s) => (
                                <button
                                    key={s || 'all'}
                                    type="button"
                                    onClick={() => { setStatus(s); setPage(1); }}
                                    className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold capitalize ${status === s ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-[var(--accent)]'}`}
                                >
                                    {s || 'All'}
                                </button>
                            ))}
                        </div>
                    )}
                    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                            Show
                            <span className="w-20"><Select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}>{[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}</Select></span>
                            entries
                        </label>
                        <div className="relative w-60">
                            <Input type="search" aria-label="Search invoices" placeholder="Search invoice..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
                            <Search size={15} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-slate-400" />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[46rem] text-left text-sm">
                            <thead className="border-y border-slate-200 bg-slate-50 text-xs text-slate-600">
                                <tr>{header('number', 'Invoice ID')}{header('created', 'Invoice Date')}{header('due', 'Due Date')}{header('amount', 'Amount')}{header('status', 'Status')}{header(null, 'Action')}</tr>
                            </thead>
                            <tbody>
                                {shown.length === 0 && <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500">{all.length ? 'No invoices match these filters.' : 'You have no invoices yet.'}</td></tr>}
                                {shown.map((i) => (
                                    <tr key={i.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70">
                                        <td className="px-5 py-3.5 font-bold text-slate-900">#{i.number}</td>
                                        <td className="px-5 py-3.5 text-slate-700">{longDate(i.created_at)}</td>
                                        <td className="px-5 py-3.5 text-slate-700">{longDate(i.due_date)}</td>
                                        <td className="px-5 py-3.5 font-bold text-slate-900 tabular-nums">{money(i.total, i.currency)}</td>
                                        <td className="px-5 py-3.5"><InvoicePill invoice={i} /></td>
                                        <td className="px-5 py-3.5">
                                            <Link to={`/invoices/${i.id}`} className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold ${i.status === 'unpaid' ? 'border-[var(--accent)] bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]' : 'border-slate-200 text-slate-700 hover:border-[var(--accent)] hover:text-accent'}`}>
                                                {i.status === 'unpaid' ? <><CreditCard size={13} /> Pay now</> : <><Eye size={13} /> View</>}
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-3 text-sm text-slate-600">
                        <span>Showing {rows.length ? (current - 1) * perPage + 1 : 0} to {Math.min(current * perPage, rows.length)} of {rows.length} entries</span>
                        {pages > 1 && (
                            <span className="flex gap-2">
                                <Button type="button" variant="ghost" disabled={current <= 1} onClick={() => setPage(current - 1)}>Previous</Button>
                                <Button type="button" variant="ghost" disabled={current >= pages} onClick={() => setPage(current + 1)}>Next</Button>
                            </span>
                        )}
                    </div>
                </section>
            </QueryState>
        </div>
    );
}

function Notifications({ chat, tickets, invoices }: { chat: number; tickets: number; invoices: number }) {
    const total = chat + tickets + invoices;
    const items = [
        { n: tickets, to: '/tickets', text: `${tickets} ticket${tickets === 1 ? '' : 's'} answered by support` },
        { n: chat, to: '/chat', text: `${chat} unread chat message${chat === 1 ? '' : 's'}` },
        { n: invoices, to: '/invoices', text: `${invoices} unpaid invoice${invoices === 1 ? '' : 's'}` },
    ].filter((i) => i.n > 0);

    return (
        <Dropdown
            label={`Notifications (${total})`}
            buttonClassName="icon-btn relative"
            menuClassName="w-72 rounded-2xl"
            button={<><Bell size={20} />{total > 0 && <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">{total}</span>}</>}
        >
            <div className="border-b border-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-900">Notifications</div>
            {items.length === 0 ? <p className="px-4 py-6 text-center text-xs text-slate-500">You're all caught up.</p> : items.map((i) => (
                <Link key={i.to} to={i.to} role="menuitem" className="block border-b border-slate-100 px-4 py-3 text-sm text-slate-700 last:border-0 hover:bg-slate-50">{i.text}</Link>
            ))}
        </Dropdown>
    );
}

function AccountMenu({ profile, onLogout, busy }: { profile: ClientProfile; onLogout: () => void; busy: boolean }) {
    // A user of the account sees their own name; the account is still the client's.
    const who = profile.user ?? profile;
    const initials = who.name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');
    const can = (permission: string) => clientCan(profile, permission);
    // Security and password belong to the customer, so an admin viewing the account does not get them.
    const groups: [string, ReactNode, string, boolean][][] = [
        [['/account/details', <User key="i" size={17} />, 'My Details', true], ['/account/contacts', <Contact key="i" size={17} />, 'Contacts', can('contacts')], ['/account/emails', <Mail key="i" size={17} />, 'My Emails', can('emails')]],
        [['/account/password', <KeyRound key="i" size={17} />, 'Change Password', !profile.impersonating], ['/security', <ShieldCheck key="i" size={17} />, 'Security', !profile.impersonating && can('owner')], ['/account/support-token', <FileText key="i" size={17} />, 'Support Tokens', true], ['/account/sessions', <MonitorSmartphone key="i" size={17} />, 'Activity Sessions', can('owner')]],
    ];

    return (
        <Dropdown
            label="Account menu"
            buttonClassName="flex cursor-pointer items-center gap-2.5 rounded-xl px-1.5 py-1 hover:bg-slate-100"
            menuClassName="w-72 rounded-2xl"
            button={(
                <>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-bold text-white">{initials}</span>
                    <span className="hidden min-w-0 text-left sm:block">
                        <span className="block max-w-40 truncate text-sm font-semibold text-slate-900">{who.name}</span>
                        <span className="block max-w-40 truncate text-[11px] text-slate-500">{profile.user ? `User of ${profile.name}` : 'Account Owner'}</span>
                    </span>
                    <ChevronDown size={14} className="text-slate-400" />
                </>
            )}
        >
            <div className="flex items-center gap-3 bg-[var(--accent)] px-4 py-4 text-white">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-white/80 bg-white/20 text-base font-bold">{initials}</span>
                <div className="min-w-0"><div className="truncate font-semibold">{who.name}</div><div className="truncate text-xs text-white/85">{who.email}</div></div>
            </div>
            {groups.map((group, i) => (
                <div key={i} className="border-b border-slate-100 py-1.5">
                    {group.filter(([, , , show]) => show).map(([to, icon, label]) => (
                        <Link key={to} to={to} role="menuitem" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900"><span className="text-slate-500">{icon}</span>{label}</Link>
                    ))}
                </div>
            ))}
            <div className="py-1.5">
                <button type="button" role="menuitem" disabled={busy} onClick={onLogout} className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-50"><Power size={17} /> Logout</button>
            </div>
        </Dropdown>
    );
}

type InvoiceDetail = Overview['invoices'][number] & {
    paid_at: string | null;
    created_at: string;
    items: { id: number; description: string; amount: string; kind: string; service_id: number | null; domain_id: number | null }[];
    payments: { id: number; gateway: string; gateway_name: string; transaction_id: string; amount: string; created_at: string }[];
    payment_instructions: string | null;
    pay_to: string | null;
    company: { name: string; email: string | null };
    client: { name: string; company: string | null; email: string; phone: string | null; address: string | null; city: string | null; country: string };
    balance: string;
    gateways: { code: string; name: string; button: string | null }[];
};

const paymentNotices: Record<string, [string, string]> = {
    success: ['border-emerald-200 bg-emerald-50 text-emerald-800', 'Payment received. Thank you.'],
    processing: ['border-amber-200 bg-amber-50 text-amber-900', 'We are waiting for confirmation from the payment provider. This page updates once it arrives.'],
    failed: ['border-red-200 bg-red-50 text-red-700', 'The payment did not go through. You have not been credited. Please try again or use another method.'],
    cancelled: ['border-slate-200 bg-slate-50 text-slate-700', 'Payment cancelled.'],
};

// Status heading shown top right, as on a printed invoice.
const invoiceHeading: Record<string, string> = { paid: 'text-emerald-600', unpaid: 'text-rose-600', refunded: 'text-sky-600', cancelled: 'text-slate-500' };
const ordinalDate = (date: string) => {
    const d = date.length > 10 ? new Date(date) : calendarDay(date); // a timestamp, or a plain Y-m-d day
    const n = d.getDate();
    const suffix = n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th';

    return `${n}${suffix} ${d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`;
};
const countryName = (code: string) => {
    try {
        return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) ?? code;
    } catch {
        return code;
    }
};
// Credit and tax lines come as separate items; keep them out of the line list and show them in the totals.
const isCredit = (item: InvoiceDetail['items'][number]) => item.kind === 'other' && /^credit applied$/i.test(item.description);
const isTax = (item: InvoiceDetail['items'][number]) => item.kind === 'other' && /^tax$/i.test(item.description);

function Invoice() {
    const { id } = useParams();
    const [params] = useSearchParams();
    const brand = useBranding();
    const notice = paymentNotices[params.get('payment') ?? ''];
    const pay = useMutation({
        mutationFn: async (gateway: string) => (await api.post<{ redirect_url: string }>(`/client/invoices/${id}/pay`, { gateway })).data,
        onSuccess: ({ redirect_url }) => window.location.assign(redirect_url),
    });
    const query = useQuery({ queryKey: ['client-invoice', id], queryFn: async () => (await api.get<InvoiceDetail>(`/client/invoices/${id}`)).data });
    const inv = query.data;
    const [picked, setMethod] = useState('');

    useEffect(() => {
        if (!inv) return;
        const before = document.title;
        document.title = `Invoice #${inv.number}`; // also the suggested file name when saving as PDF
        return () => { document.title = before; };
    }, [inv]);

    if (!inv) return <QueryState query={query}>{null}</QueryState>;

    const lines = inv.items.filter((i) => !isCredit(i) && !isTax(i));
    const sum = (list: InvoiceDetail['items']) => list.reduce((total, i) => total + Number(i.amount), 0);
    const subTotal = sum(lines);
    const tax = sum(inv.items.filter(isTax));
    const credit = -sum(inv.items.filter(isCredit)) || 0;
    // Online gateways first; bank transfer is offered when the Manual gateway has instructions.
    const methods = [...inv.gateways.map((g) => ({ code: g.code, name: g.name, button: g.button })), ...(inv.payment_instructions ? [{ code: 'manual', name: 'Bank Transfer', button: null }] : [])];
    const method = methods.find((m) => m.code === picked) ?? methods[0];
    const canPay = inv.status === 'unpaid' && methods.length > 0;
    const overdue = inv.status === 'unpaid' && daysUntil(inv.due_date) < 0;
    const c = inv.client;
    const amount = (value: number | string) => money(value, inv.currency);
    const totalRow = (label: string, value: string, strong = false) => (
        <tr className="border-t border-slate-200 bg-slate-50">
            <td className={`px-3 py-2.5 text-right ${strong ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>{label}</td>
            <td className={`px-3 py-2.5 text-right whitespace-nowrap tabular-nums ${strong ? 'font-bold text-slate-900' : 'text-slate-700'}`}>{value}</td>
        </tr>
    );

    return (
        <div className="mx-auto max-w-4xl space-y-4 print:max-w-none">
            {notice && <p role="status" className={`rounded-xl border p-3 text-sm print:hidden ${notice[0]}`}>{notice[1]}</p>}

            <article className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm sm:p-10 print:rounded-none print:border-0 print:p-0 print:shadow-none">
                <header className="flex flex-wrap items-start justify-between gap-6">
                    <div>
                        <img src={brand.logo_url} alt={brand.name} className="h-14 w-auto max-w-72 object-contain" />
                        <h2 className="mt-5 text-3xl font-light text-slate-800">Invoice #{inv.number}</h2>
                    </div>
                    <div className="text-center sm:min-w-56">
                        <div className={`text-3xl font-bold tracking-wide uppercase ${overdue ? 'text-rose-600' : invoiceHeading[inv.status] ?? 'text-slate-500'}`}>{overdue ? 'Overdue' : inv.status}</div>
                        {inv.status === 'paid' && inv.paid_at
                            ? <div className="mt-1 text-xs text-slate-600">Paid on {ordinalDate(inv.paid_at)}</div>
                            : <div className="mt-1 text-xs text-slate-600">Due Date: {ordinalDate(inv.due_date)}</div>}
                        <div className="text-xs text-slate-600">Invoice Date: {ordinalDate(inv.created_at)}</div>
                        {canPay && method && method.code !== 'manual' && (
                            <Button className="mt-3 print:hidden" disabled={pay.isPending} onClick={() => pay.mutate(method.code)}>
                                {pay.isPending ? 'Redirecting...' : method.button || `Pay with ${method.name}`}
                            </Button>
                        )}
                        <div className="mt-2 text-left print:hidden"><ErrorNote error={pay.error} /></div>
                    </div>
                </header>

                <hr className="my-7 border-slate-200" />

                <div className="grid gap-6 sm:grid-cols-2">
                    <div className="leading-relaxed">
                        <div className="mb-1 font-bold text-slate-900">Invoiced To</div>
                        {c.company && <div>{c.company}</div>}
                        <div>{c.name}</div>
                        {c.address && <div>{c.address}</div>}
                        {c.city && <div>{c.city}</div>}
                        <div>{countryName(c.country)}</div>
                    </div>
                    <div className="leading-relaxed sm:text-right">
                        <div className="mb-1 font-bold text-slate-900">Pay To</div>
                        <div>{inv.company.name}</div>
                        {inv.pay_to && <div className="whitespace-pre-line">{inv.pay_to}</div>}
                        {inv.company.email && <div>Email: {inv.company.email}</div>}
                    </div>
                    {canPay && (
                        <label className="block sm:col-start-2 sm:text-right print:hidden">
                            <span className="mb-1 block font-bold text-slate-900">Payment Method</span>
                            <span className="ml-auto block sm:max-w-72">
                                <Select value={method?.code ?? ''} onChange={(e) => setMethod(e.target.value)}>
                                    {methods.map((m) => <option key={m.code} value={m.code}>{m.name}</option>)}
                                </Select>
                            </span>
                        </label>
                    )}
                </div>

                {canPay && method?.code === 'manual' && inv.payment_instructions && (
                    <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950">
                        <div className="mb-1 font-bold">Bank transfer</div>
                        <p className="whitespace-pre-line">{inv.payment_instructions}</p>
                        <p className="mt-2 text-xs text-amber-800">Write invoice #{inv.number} as the reference. We mark it paid once the money arrives.</p>
                    </div>
                )}

                <section className="mt-8 overflow-hidden rounded-lg border border-slate-200">
                    <h3 className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-base font-semibold text-slate-900">Invoice Items</h3>
                    <div className="overflow-x-auto p-4">
                        <table className="w-full min-w-[28rem]">
                            <thead>
                                <tr className="border-b border-slate-200 text-slate-900">
                                    <th className="px-3 py-2 text-left font-bold">Description</th>
                                    <th className="w-36 px-3 py-2 text-center font-bold">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lines.map((item) => (
                                    <tr key={item.id} className="border-t border-slate-200 first:border-t-0">
                                        <td className="px-3 py-2.5">{item.description}</td>
                                        <td className="px-3 py-2.5 text-right whitespace-nowrap tabular-nums">{amount(item.amount)}</td>
                                    </tr>
                                ))}
                                {totalRow('Sub Total', amount(subTotal))}
                                {tax !== 0 && totalRow('Tax', amount(tax))}
                                {totalRow('Credit', amount(credit))}
                                {totalRow('Total', amount(inv.total), true)}
                            </tbody>
                        </table>
                    </div>
                </section>

                <div className="mt-8 overflow-x-auto">
                    <table className="w-full min-w-[28rem]">
                        <thead>
                            <tr className="border-b border-slate-200 text-slate-900">
                                {['Transaction Date', 'Gateway', 'Transaction ID', 'Amount'].map((h) => <th key={h} className="px-3 py-2 text-center font-bold">{h}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {inv.payments.length === 0 && <tr className="border-b border-slate-200"><td colSpan={4} className="px-3 py-2.5 text-center">No Related Transactions Found</td></tr>}
                            {inv.payments.map((p) => (
                                <tr key={p.id} className="border-b border-slate-200 text-center">
                                    <td className="px-3 py-2.5">{ordinalDate(p.created_at)}</td>
                                    <td className="px-3 py-2.5">{p.gateway_name}</td>
                                    <td className="px-3 py-2.5 font-mono text-xs break-all">{p.transaction_id}</td>
                                    <td className={`px-3 py-2.5 whitespace-nowrap tabular-nums ${Number(p.amount) < 0 ? 'text-rose-600' : ''}`}>{amount(p.amount)}</td>
                                </tr>
                            ))}
                            <tr>
                                <td colSpan={3} className="px-3 py-2.5 text-right font-bold text-slate-900">Balance</td>
                                <td className="px-3 py-2.5 text-center font-semibold whitespace-nowrap tabular-nums">{amount(inv.balance)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 print:hidden">
                    <Link to="/invoices" className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-accent"><ArrowLeft size={14} /> Back to invoices</Link>
                    <div className="inline-flex overflow-hidden rounded-lg border border-slate-300 text-xs font-semibold text-slate-700">
                        <button type="button" onClick={() => window.print()} className="flex cursor-pointer items-center gap-1.5 px-3 py-2 hover:bg-slate-50"><Printer size={14} /> Print</button>
                        <button type="button" title="Opens the print dialog: choose “Save as PDF”" onClick={() => window.print()} className="flex cursor-pointer items-center gap-1.5 border-l border-slate-300 px-3 py-2 hover:bg-slate-50"><Download size={14} /> Download</button>
                    </div>
                </footer>
            </article>
        </div>
    );
}

type StoreProduct = { id: number; name: string; type: string; description: string | null; prices: { cycle: string; price: string; setup_fee: string }[] };
type StoreGroup = { id: number; name: string; slug: string; headline: string | null; products: StoreProduct[] };

const useStore = (enabled = true) => useQuery({ queryKey: ['client-store'], queryFn: async () => (await api.get<StoreGroup[]>('/client/store')).data, enabled });

type Tld = { tld: string; register_price: string; renew_price: string; transfer_price: string; is_spotlight: boolean; epp_required: boolean };
type DomainOptions = { register: boolean; transfer: boolean; own: boolean; nameservers: string[]; tlds: Tld[]; lookup: boolean; premium: boolean };

type DomainAction = 'register' | 'transfer' | 'own';

const useDomainOptions = (enabled = true) => useQuery({ queryKey: ['client-domain-options'], queryFn: async () => (await api.get<DomainOptions>('/client/store/domains')).data, enabled });

const actionLabels: Record<DomainAction, string> = { register: 'Register a new domain', transfer: 'Transfer my domain to you', own: 'I already own this domain' };

// Longest suffix first, as the server matches it, so example.com.bd prices as .com.bd.
function tldFor(domain: string, tlds: Tld[]) {
    const parts = domain.toLowerCase().split('.');
    for (let i = 1; i < parts.length; i++) {
        const match = tlds.find((t) => t.tld === `.${parts.slice(i).join('.')}`);
        if (match) return match;
    }
    return undefined;
}

function DomainPrice({ domain, action, years, tlds }: { domain: string; action: DomainAction; years: number; tlds: Tld[] }) {
    if (action === 'own' || !domain.includes('.')) return null;
    const tld = tldFor(domain, tlds);
    if (!tld) return <p className="text-xs text-rose-600">We do not offer this extension. Available: {tlds.map((t) => t.tld).join(', ') || 'none'}.</p>;
    const unit = action === 'transfer' ? tld.transfer_price : tld.register_price;

    return <p className="text-xs text-slate-600">{action === 'transfer' ? 'Transfer' : 'Registration'}: <strong>{money(Number(unit) * years)}</strong> for {years} yr, then {money(tld.renew_price)} / yr.</p>;
}

function Nameservers({ list }: { list: string[] }) {
    if (!list.length) return null;

    return <p className="text-xs text-slate-600">Point the domain to our nameservers: <span className="font-mono">{list.join(', ')}</span></p>;
}

function ProductCard({ product }: { product: StoreProduct }) {
    const navigate = useNavigate();
    const [cycle, setCycle] = useState(product.prices[0]?.cycle ?? '');
    const [domain, setDomain] = useState('');
    const [epp, setEpp] = useState('');
    const options = useDomainOptions().data;
    const allowed = (['register', 'transfer', 'own'] as const).filter((a) => options?.[a]);
    const [picked, setAction] = useState<DomainAction | null>(null);
    const action = picked && allowed.includes(picked) ? picked : (allowed[0] ?? 'own');
    const price = product.prices.find((p) => p.cycle === cycle);
    const order = useMutation({
        mutationFn: async () => (await api.post<{ invoice_id: number }>('/client/orders', { product_id: product.id, cycle, domain: domain || null, domain_action: domain ? action : null, epp_code: action === 'transfer' ? epp || null : null })).data,
        onSuccess: ({ invoice_id }) => navigate(`/invoices/${invoice_id}`),
    });

    return (
        <section className="card flex flex-col p-4">
            <h2 className="font-semibold text-slate-900">{product.name}</h2>
            {price && (
                <p className="mt-2">
                    <span className="text-2xl font-bold text-slate-900 tabular-nums">{money(price.price)}</span>
                    <span className="text-xs text-slate-500"> / {cycle}</span>
                    {Number(price.setup_fee) > 0 && <span className="block text-xs text-slate-500">+ {money(price.setup_fee)} setup fee</span>}
                </p>
            )}
            {product.description && <p className="mt-3 text-xs whitespace-pre-line text-slate-600">{product.description}</p>}
            <form onSubmit={(e) => { e.preventDefault(); order.mutate(); }} className="mt-auto space-y-3 pt-4">
                {product.prices.length > 1 && (
                    <Field label="Billing cycle">
                        <Select value={cycle} onChange={(e) => setCycle(e.target.value)}>
                            {product.prices.map((p) => <option key={p.cycle} value={p.cycle}>{p.cycle} - {money(p.price)}</option>)}
                        </Select>
                    </Field>
                )}
                {product.type !== 'vps' && (
                    <>
                        {allowed.length > 1 && (
                            <Field label="Domain">
                                <Select value={action} onChange={(e) => setAction(e.target.value as DomainAction)}>
                                    {allowed.map((a) => <option key={a} value={a}>{actionLabels[a]}</option>)}
                                </Select>
                            </Field>
                        )}
                        <Field label={product.type === 'shared_hosting' ? 'Domain name' : 'Domain name (optional)'}>
                            <Input required={product.type === 'shared_hosting'} placeholder="example.com" value={domain} onChange={(e) => setDomain(e.target.value.trim())} />
                        </Field>
                        {options && <DomainPrice domain={domain} action={action} years={1} tlds={options.tlds} />}
                        {options && action === 'transfer' && domain && (
                            <Field label="EPP code"><Input required={tldFor(domain, options.tlds)?.epp_required ?? true} autoComplete="off" value={epp} onChange={(e) => setEpp(e.target.value)} /></Field>
                        )}
                        {options && action === 'own' && domain && <Nameservers list={options.nameservers} />}
                    </>
                )}
                <ErrorNote error={order.error} />
                <Button className="w-full" disabled={order.isPending || !price}>{order.isPending ? 'Placing order...' : 'Order now'}</Button>
            </form>
        </section>
    );
}

function Store() {
    const { slug } = useParams();
    const query = useStore();
    const group = query.data?.find((g) => g.slug === slug);

    return (
        <QueryState query={query}>
            {query.data && !group && <Navigate to="/" replace />}
            {group && (
                <div className="space-y-4">
                    {group.headline && <p className="text-sm text-slate-600">{group.headline}</p>}
                    {group.products.length === 0 && <p className="card p-6 text-center text-sm text-slate-500">Nothing to order here yet.</p>}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {group.products.map((p) => <ProductCard key={p.id} product={p} />)}
                    </div>
                </div>
            )}
        </QueryState>
    );
}

export function CustomerArea({ profile }: { profile: ClientProfile }) {
    const client = useQueryClient();
    const logout = useMutation({
        mutationFn: () => api.post('/client/logout'),
        onSuccess: () => client.clear(),
        onSettled: () => window.location.assign(`${basePath}/login`),
    });
    const stopImpersonating = useMutation({
        mutationFn: async () => (await api.post<{ client_id: number }>('/client/impersonate/stop')).data,
        onSuccess: ({ client_id }) => window.location.assign(`${basePath}/admin/clients/${client_id}`),
        onError: () => window.location.assign(`${basePath}/admin/login`),
    });

    const can = (permission: string) => clientCan(profile, permission);
    const store = useStore(can('orders'));
    const domainOptions = useDomainOptions(can('orders'));
    const sellsDomains = !!(domainOptions.data?.register || domainOptions.data?.transfer);
    const brand = useBranding().name;
    const badges = useQuery({ queryKey: ['client-badges'], queryFn: async () => (await api.get<{ unread_chat: number; answered_tickets: number }>('/client/badges')).data, refetchInterval: 30000 });
    const count = (n = 0) => (n > 0 ? <span className="ml-auto rounded-full bg-accent px-1.5 py-0.5 text-[10px] leading-none font-bold text-white">{n}</span> : null);
    const { pathname } = useLocation();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const navClass = ({ isActive }: { isActive: boolean }) => `nav-link ${isActive ? 'nav-link-active' : ''}`;
    const dot = <span className="h-2 w-2 shrink-0 rounded-full bg-current" />;
    const overview = useOverview();
    const unpaidCount = overview.data?.invoices.filter((i) => i.status === 'unpaid').length ?? 0;
    const titles: Record<string, string> = { '/': 'Dashboard', '/services': 'My Services', '/domains': 'My Domains', '/invoices': 'My Invoices', '/add-funds': 'Add Funds', '/credits': 'Credit History', '/security': 'Security', '/tickets': 'My Tickets', '/tickets/new': 'Open Ticket', '/chat': 'Chat', '/order-domain': 'Order a Domain',
        '/account/details': 'My Details', '/account/contacts': 'Contacts', '/account/emails': 'My Emails', '/account/password': 'Change Password',
        '/account/support-token': 'Support Tokens', '/account/sessions': 'Activity Sessions' };
    // A detail page sits under its list: [list path, list title, page title].
    const parents: [string, string, string][] = [['/services/', 'My Services', 'Service Details'], ['/domains/', 'My Domains', 'Domain Details'], ['/invoices/', 'My Invoices', 'View Invoice'], ['/tickets/', 'My Tickets', 'Ticket Details'], ['/account/emails/', 'My Emails', 'View Email']];
    const parent = titles[pathname] ? undefined : parents.find(([prefix]) => pathname.startsWith(prefix));
    const storeGroup = store.data?.find((g) => pathname === `/store/${g.slug}`);
    const title = titles[pathname] ?? parent?.[2] ?? storeGroup?.name ?? 'My Account';
    const crumbs: [string, string | null][] = [
        ...(pathname === '/tickets/new' ? [['My Tickets', '/tickets'] as [string, string]] : []),
        ...(parent ? [[parent[1], parent[0].slice(0, -1)] as [string, string]] : []),
        ...(storeGroup ? [['Order New Services', null] as [string, null]] : []),
        [title, null],
    ];

    useEffect(() => {
        document.title = `${title} | ${brand}`;
        setDrawerOpen(false);
    }, [pathname, title, brand]);

    return (
        <div className="bg-dashboard print:bg-white">
            <div className="flex min-h-screen flex-col md:flex-row">
                <div onClick={() => setDrawerOpen(false)} className={`fixed inset-0 z-[45] bg-slate-900/60 transition-opacity duration-200 md:hidden ${drawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`} />

                <aside className={`sidebar print:hidden fixed inset-y-0 left-0 z-50 flex max-h-screen w-72 max-w-[90vw] shrink-0 transform flex-col overflow-y-auto px-6 py-7 transition-transform duration-200 md:sticky md:top-0 md:h-screen md:w-64 md:max-w-none md:translate-x-0 ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <Link to="/" className="flex items-center gap-3">
                        <LogoIcon className="h-11 w-11 shrink-0 rounded-2xl bg-white p-1" />
                        <div className="min-w-0">
                            <div className="text-xs tracking-[0.35em] text-slate-400 uppercase">Client</div>
                            <div className="truncate text-lg font-semibold text-white">{brand}</div>
                        </div>
                    </Link>
                    <button type="button" aria-label="Close menu" onClick={() => setDrawerOpen(false)} className="absolute top-4 right-4 cursor-pointer rounded-full border border-white/10 bg-white/10 p-2 text-slate-200 md:hidden"><X size={16} /></button>

                    <nav className="mt-8 flex-1 space-y-4 text-sm">
                        <NavLink to="/" end className={navClass}>{dot} Dashboard</NavLink>
                        <div className="space-y-2">
                            <div className="nav-section">My Account</div>
                            {can('products') && <NavLink to="/services" className={({ isActive }) => navClass({ isActive: isActive || pathname.startsWith('/services/') })}>{dot} My Services</NavLink>}
                            {can('domains') && <NavLink to="/domains" className={({ isActive }) => navClass({ isActive: isActive || pathname.startsWith('/domains/') })}>{dot} My Domains</NavLink>}
                            {can('invoices') && (
                                <>
                                    <NavLink to="/invoices" className={({ isActive }) => navClass({ isActive: isActive || pathname.startsWith('/invoices/') })}>{dot} My Invoices{count(unpaidCount)}</NavLink>
                                    <NavLink to="/add-funds" className={navClass}>{dot} Add Funds</NavLink>
                                    <NavLink to="/credits" className={navClass}>{dot} Credit History</NavLink>
                                </>
                            )}
                            {!profile.impersonating && can('owner') && <NavLink to="/security" className={navClass}>{dot} Security</NavLink>}
                        </div>
                        {can('tickets') && (
                            <div className="space-y-2">
                                <div className="nav-section">Support & Chat</div>
                                <NavLink to="/tickets" end className={({ isActive }) => navClass({ isActive: isActive || (pathname.startsWith('/tickets/') && pathname !== '/tickets/new') })}>{dot} Support Tickets{count(badges.data?.answered_tickets)}</NavLink>
                                <NavLink to="/tickets/new" className={navClass}>{dot} Open Ticket</NavLink>
                                <NavLink to="/chat" className={navClass}>{dot} Chat{count(badges.data?.unread_chat)}</NavLink>
                            </div>
                        )}
                        {can('orders') && (!!store.data?.length || sellsDomains) && (
                            <div className="space-y-2">
                                <div className="nav-section">Order New Services</div>
                                {store.data?.map((g) => <NavLink key={g.id} to={`/store/${g.slug}`} className={navClass}>{dot} <span className="truncate">{g.name}</span></NavLink>)}
                                {sellsDomains && <NavLink to="/order-domain" className={navClass}>{dot} Domain Names</NavLink>}
                            </div>
                        )}
                    </nav>
                </aside>

                <div className="flex w-full min-w-0 flex-1 flex-col">
                    {profile.impersonating && (
                        <div role="status" className="flex flex-wrap items-center justify-center gap-3 bg-amber-100 px-4 py-2 text-xs font-semibold text-amber-900 print:hidden">
                            You are logged in as {profile.name}.
                            <Button variant="ghost" disabled={stopImpersonating.isPending} onClick={() => stopImpersonating.mutate()}>Back to admin</Button>
                        </div>
                    )}
                    <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b print:hidden border-slate-300/70 bg-white/80 px-3 py-2 backdrop-blur md:px-6 md:py-3">
                        <div className="flex min-w-0 items-center gap-3">
                            <button type="button" aria-label="Open menu" className="icon-btn md:hidden" onClick={() => setDrawerOpen(true)}><Menu size={20} /></button>
                            <div className="min-w-0">
                                <h1 className="truncate text-base font-semibold text-slate-900 md:text-lg">{pathname === '/' ? <>Welcome back, {profile.name}! <span aria-hidden>👋</span></> : title}</h1>
                                <nav aria-label="Breadcrumb" className="hidden items-center gap-1.5 text-xs text-slate-500 sm:flex">
                                    <Link to="/" className="text-accent hover:underline">Home</Link>
                                    {crumbs.map(([label, to]) => (
                                        <span key={label} className="flex min-w-0 items-center gap-1.5">
                                            <ChevronRight size={12} className="shrink-0" />
                                            {to ? <Link to={to} className="text-accent hover:underline">{label}</Link> : <span className="truncate">{label}</span>}
                                        </span>
                                    ))}
                                </nav>
                            </div>
                        </div>
                        <div className="flex min-w-0 items-center gap-2">
                            <Notifications chat={badges.data?.unread_chat ?? 0} tickets={badges.data?.answered_tickets ?? 0} invoices={unpaidCount} />
                            <span className="h-8 w-px bg-slate-200" />
                            <AccountMenu profile={profile} busy={logout.isPending} onLogout={() => logout.mutate()} />
                        </div>
                    </header>
                    <main key={pathname} className="fade-in w-full print:p-0 px-3 py-4 sm:px-4 md:px-6 md:py-6">
                        <Routes>
                            <Route path="/" element={<Home profile={profile} firstStore={store.data?.[0] ? `/store/${store.data[0].slug}` : null} />} />
                            {/* A page the signed-in user may not use falls through to the dashboard. */}
                            {can('products') && <Route path="/services" element={<MyServices orderTo={store.data?.[0] ? `/store/${store.data[0].slug}` : '/order-domain'} />} />}
                            {can('products') && <Route path="/services/:id" element={<ClientServicePage canManage={can('manageproducts')} />} />}
                            {can('domains') && <Route path="/domains" element={<MyDomains />} />}
                            {can('domains') && <Route path="/domains/:id" element={<ClientDomainPage canManage={can('managedomains')} />} />}
                            {can('invoices') && <Route path="/invoices" element={<MyInvoices />} />}
                            {can('invoices') && <Route path="/invoices/:id" element={<Invoice />} />}
                            {can('invoices') && <Route path="/add-funds" element={<AddFundsPage />} />}
                            {can('invoices') && <Route path="/credits" element={<CreditHistoryPage />} />}
                            {can('orders') && <Route path="/store/:slug" element={<Store />} />}
                            {can('orders') && <Route path="/order-domain" element={<DomainOrderPage />} />}
                            {can('tickets') && <Route path="/tickets" element={<ClientTicketsPage />} />}
                            {can('tickets') && <Route path="/tickets/new" element={<ClientNewTicketPage />} />}
                            {can('tickets') && <Route path="/tickets/:id" element={<ClientTicketPage />} />}
                            {can('tickets') && <Route path="/chat" element={<ClientChatPage />} />}
                            {can('owner') && <Route path="/security" element={<ClientSecurityPage profile={profile} />} />}
                            {can('owner') && <Route path="/account/security" element={<ClientSecurityPage profile={profile} />} />}
                            <Route path="/account/details" element={<MyDetailsPage />} />
                            {can('contacts') && <Route path="/account/contacts" element={<ContactsPage />} />}
                            {can('emails') && <Route path="/account/emails" element={<EmailsPage />} />}
                            {can('emails') && <Route path="/account/emails/:id" element={<EmailPage />} />}
                            <Route path="/account/password" element={<ClientPasswordPage profile={profile} />} />
                            <Route path="/account/support-token" element={<SupportPinPage />} />
                            {can('owner') && <Route path="/account/sessions" element={<SessionsPage profile={profile} />} />}
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </main>
                </div>
            </div>
        </div>
    );
}
