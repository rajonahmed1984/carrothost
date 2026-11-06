import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Activity, ArrowRightLeft, CalendarClock, CalendarDays, ChevronDown, CircleCheck, CircleX, Contact, Eye, FileText, Globe, Headset, History, Info, KeyRound,
    LayoutGrid, Lock, LockOpen, Network, Plus, RefreshCw, RotateCcw, ServerCog, ShieldCheck, Trash2, Wallet,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api, errorMessage, money } from '../api';
import { alertDialog, ask } from '../dialog';
import { Button, Dropdown, ErrorNote, Field, Input, QueryState, Select, Status, Table } from '../ui';
import { CopyButton, Fact, InfoRow, SectionCard, Stat, Tile } from './client-service';

type Detail = {
    id: number; name: string; action: string; years: number; auto_renew: boolean; recurring_amount: string; status: string; expires_at: string | null; created_at: string;
    registered_at: string | null; next_due_date: string | null; nameservers: string[]; default_nameservers: string[]; registrar_lock: boolean; id_protection: boolean;
    provision_status: string; manageable: boolean; synced_at: string | null; can_renew: boolean; renewal_invoice: { id: number; number: string; total: string; currency: string } | null;
    awaiting_transfer: boolean; has_auth_code: boolean;
    invoices: { id: number; number: string; status: string; currency: string; total: string; due_date: string }[];
    activity: { id: number; title: string; by: string; at: string | null }[];
};
type ContactForm = { name: string; company: string; email: string; address: string; city: string; state: string; country: string; zipcode: string; phone_cc: string; phone: string };
type Live = {
    available: boolean; message: string | null; status?: string | null; statuses?: string[]; expires_at?: string | null; nameservers?: string[]; locked?: boolean; privacy?: boolean; privacy_allowed?: boolean;
    contact?: { name: string | null; company: string | null; email: string | null; country: string | null } | null; contact_defaults: ContactForm;
};
type DnsRecord = { type: string; host: string; value: string; ttl: number; priority: number | null };

const tabs = [
    { key: 'overview', label: 'Overview', icon: <LayoutGrid size={15} /> },
    { key: 'nameservers', label: 'Nameservers', icon: <Network size={15} /> },
    { key: 'dns', label: 'DNS Records', icon: <ServerCog size={15} /> },
    { key: 'contacts', label: 'Contacts', icon: <Contact size={15} /> },
    { key: 'transfer', label: 'Transfer', icon: <ArrowRightLeft size={15} /> },
    { key: 'invoices', label: 'Invoices', icon: <FileText size={15} /> },
    { key: 'activity', label: 'Activity', icon: <Activity size={15} /> },
];

const statusDot: Record<string, string> = { active: 'bg-emerald-500', pending: 'bg-amber-500', grace: 'bg-amber-500', expired: 'bg-rose-500', cancelled: 'bg-slate-400', transferred_out: 'bg-slate-400' };
const calendarDay = (date: string) => new Date(`${date.slice(0, 10)}T00:00:00`);
const daysUntil = (date: string) => Math.round((calendarDay(date).getTime() - new Date(new Date().toDateString()).getTime()) / 86400000);
const shortDate = (date: string) => calendarDay(date).toLocaleDateString('en-GB').replaceAll('/', '-');
const label = (v: string) => v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const DNS_TYPES = ['A', 'AAAA', 'CNAME', 'MX', 'TXT'];
const valueHint: Record<string, string> = { A: '203.0.113.10', AAAA: '2001:db8::1', CNAME: 'example.com', MX: 'mail.example.com', TXT: 'v=spf1 include:_spf.example.com ~all' };

function Switch({ on, busy, disabled, onChange, name }: { on: boolean; busy?: boolean; disabled?: boolean; onChange: (on: boolean) => void; name: string }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={on}
            aria-label={name}
            disabled={busy || disabled}
            onClick={() => onChange(!on)}
            className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition disabled:cursor-not-allowed disabled:opacity-50 ${on ? 'bg-emerald-500' : 'bg-slate-300'}`}
        >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
        </button>
    );
}

function ToggleRow({ icon, name, hint, children }: { icon: ReactNode; name: string; hint: string; children: ReactNode }) {
    return (
        <div className="flex items-center gap-3 py-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">{icon}</span>
            <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-slate-800">{name}</div>
                <div className="text-xs text-slate-500">{hint}</div>
            </div>
            {children}
        </div>
    );
}

export function ClientDomainPage({ canManage }: { canManage: boolean }) {
    const { id } = useParams();
    const query = useQuery({ queryKey: ['client-domain', id], queryFn: async () => (await api.get<Detail>(`/client/domains/${id}`)).data });

    return <QueryState query={query}>{query.data && <DomainDetail key={query.data.id} d={query.data} canManage={canManage} />}</QueryState>;
}

function DomainDetail({ d, canManage }: { d: Detail; canManage: boolean }) {
    const qc = useQueryClient();
    const [params, setParams] = useSearchParams();
    const tab = tabs.find((t) => t.key === params.get('tab'))?.key ?? 'overview';
    const go = (key: string) => setParams(key === 'overview' ? {} : { tab: key }, { replace: true });
    const [notice, setNotice] = useState<ReactNode>(null);
    const base = `/client/domains/${d.id}`;
    const live = useQuery({ queryKey: ['client-domain-live', d.id], queryFn: async () => (await api.get<Live>(`${base}/registrar`)).data, enabled: canManage, staleTime: 60000 });
    const fresh = (data: Detail) => {
        qc.setQueryData(['client-domain', String(d.id)], data);
        qc.invalidateQueries({ queryKey: ['client-domain-live', d.id] });
        qc.invalidateQueries({ queryKey: ['client-domains'] });
    };
    const fail = (e: unknown) => alertDialog(errorMessage(e));

    const autoRenew = useMutation({ mutationFn: async (on: boolean) => (await api.put<Detail>(base, { auto_renew: on })).data, onSuccess: fresh, onError: fail });
    const lock = useMutation({ mutationFn: async (on: boolean) => (await api.post<Detail>(`${base}/lock`, { on })).data, onSuccess: (data) => { fresh(data); setNotice(`Registrar lock turned ${data.registrar_lock ? 'on' : 'off'}.`); }, onError: fail });
    const privacy = useMutation({ mutationFn: async (on: boolean) => (await api.post<Detail>(`${base}/privacy`, { on })).data, onSuccess: (data) => { fresh(data); setNotice(`ID protection turned ${data.id_protection ? 'on' : 'off'}.`); }, onError: fail });
    const renew = useMutation({
        mutationFn: async () => (await api.post<{ invoice_id: number; message: string }>(`${base}/renew`)).data,
        onSuccess: (r) => {
            setNotice(<>{r.message} <Link className="font-semibold underline" to={`/invoices/${r.invoice_id}`}>Pay invoice</Link></>);
            qc.invalidateQueries({ queryKey: ['client-domain', String(d.id)] });
            qc.invalidateQueries({ queryKey: ['client-overview'] });
        },
        onError: fail,
    });

    const info = live.data?.available ? live.data : null;
    const locked = info?.locked ?? d.registrar_lock;
    const privacyOn = info?.privacy ?? d.id_protection;
    const days = d.expires_at ? daysUntil(d.expires_at) : null;
    const tools = canManage && d.manageable;
    const nameservers = info?.nameservers?.length ? info.nameservers : d.nameservers;
    const menuItem = 'flex w-full cursor-pointer items-center gap-2.5 px-4 py-2 text-left text-slate-700 hover:bg-slate-50';
    const support = `/tickets/new?subject=${encodeURIComponent(`Domain: ${d.name}`)}`;

    return (
        <div className="space-y-5">
            {notice && (
                <p role="status" className="flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-900">
                    <span className="flex items-center gap-2"><CircleCheck size={15} /> {notice}</span>
                    <button type="button" aria-label="Dismiss" className="cursor-pointer text-emerald-700" onClick={() => setNotice(null)}><CircleX size={14} /></button>
                </p>
            )}
            {days !== null && days <= 30 && ['active', 'grace', 'expired'].includes(d.status) && (
                <p className={`rounded-xl border px-4 py-3 text-sm ${days < 0 ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
                    {days < 0 ? `${d.name} expired ${-days} days ago. Renew it now, before it is lost.` : `${d.name} expires ${days === 0 ? 'today' : `in ${days} days`}. Renew it to keep your website and email working.`}
                </p>
            )}
            {d.awaiting_transfer && (
                <p className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
                    This transfer is in progress. {d.has_auth_code ? 'We have your auth code.' : 'We still need the auth (EPP) code from your current registrar.'} <button type="button" className="font-semibold underline" onClick={() => go('transfer')}>Transfer details</button>
                </p>
            )}

            {/* Summary */}
            <section className="card overflow-hidden">
                <div className="grid divide-y divide-slate-200 lg:grid-cols-[1.6fr_1fr_1fr_1fr] lg:divide-x lg:divide-y-0">
                    <div className="flex min-w-0 items-center gap-4 p-5">
                        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 sm:h-20 sm:w-20"><Globe size={32} /></span>
                        <div className="min-w-0">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700 capitalize"><span className={`h-1.5 w-1.5 rounded-full ${statusDot[d.status] ?? 'bg-slate-400'}`} />{label(d.status)}</span>
                            <h1 className="mt-1.5 text-xl font-bold break-all text-slate-900">{d.name}</h1>
                            <p className="text-sm text-slate-500">{d.action === 'transfer' ? 'Transferred to us' : 'Registered with us'}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 divide-y divide-slate-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0 lg:contents">
                        <Stat
                            icon={<CalendarClock size={13} />}
                            name="Expiry Date"
                            value={d.expires_at ? shortDate(d.expires_at) : '-'}
                            note={days === null ? null : <span className={days < 0 ? 'text-rose-600' : days <= 30 ? 'text-amber-700' : 'text-emerald-700'}>{days < 0 ? `${-days} days ago` : days === 0 ? 'Today' : `${days} days left`}</span>}
                        />
                        <Stat icon={<Wallet size={13} />} name="Renewal Price" value={money(d.recurring_amount)} note={<span className="text-slate-500">{d.years > 1 ? `Every ${d.years} years` : 'Yearly'}</span>} />
                        <Stat icon={<CalendarDays size={13} />} name="Registration Date" value={d.registered_at ? shortDate(d.registered_at) : shortDate(d.created_at)} />
                    </div>
                </div>
                <div className="grid border-t border-slate-200 sm:grid-cols-2 xl:grid-cols-4">
                    <Fact icon={locked ? <Lock size={18} /> : <LockOpen size={18} />} name="Registrar Lock">{locked ? 'Locked' : 'Unlocked'}</Fact>
                    <Fact icon={<ShieldCheck size={18} />} name="ID Protection">{privacyOn ? 'On' : 'Off'}</Fact>
                    <Fact icon={<RefreshCw size={18} />} name="Auto Renew">{d.auto_renew ? 'On' : 'Off'}</Fact>
                    <Fact icon={<Network size={18} />} name="Nameservers">{nameservers.length ? nameservers.slice(0, 2).map((ns) => <div key={ns}>{ns}</div>) : 'Not set'}</Fact>
                </div>
                <div className="flex flex-col-reverse gap-2 border-t border-slate-200 px-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="-mb-px flex min-w-0 gap-1 overflow-x-auto">
                        {tabs.filter((t) => tools || !['dns', 'contacts'].includes(t.key)).map((t) => (
                            <button key={t.key} type="button" onClick={() => go(t.key)} className={`flex cursor-pointer items-center gap-2 border-b-2 px-3 py-3.5 text-sm font-semibold whitespace-nowrap ${tab === t.key ? 'border-[var(--accent)] text-accent' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                                {t.icon} {t.label}
                            </button>
                        ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-3 lg:shrink-0 lg:justify-end lg:py-2">
                        {d.renewal_invoice
                            ? <Link to={`/invoices/${d.renewal_invoice.id}`} className="ui-btn ui-btn-primary"><Wallet size={15} /> Pay renewal ({money(d.renewal_invoice.total, d.renewal_invoice.currency)})</Link>
                            : canManage && d.can_renew && <button type="button" disabled={renew.isPending} onClick={() => ask(`Create a renewal invoice of ${money(d.recurring_amount)} for ${d.name} (${d.years} year${d.years > 1 ? 's' : ''})?`, () => renew.mutate())} className="ui-btn ui-btn-primary"><RotateCcw size={15} /> {renew.isPending ? 'Creating...' : 'Renew Now'}</button>}
                        <Dropdown label="Manage domain" buttonClassName="ui-btn ui-btn-secondary" button={<>Manage Domain <ChevronDown size={14} /></>} menuClassName="w-56 py-1 text-sm">
                            <button type="button" role="menuitem" className={menuItem} onClick={() => go('nameservers')}><Network size={14} className="text-slate-400" /> Nameservers</button>
                            {tools && <button type="button" role="menuitem" className={menuItem} onClick={() => go('dns')}><ServerCog size={14} className="text-slate-400" /> DNS Records</button>}
                            {tools && <button type="button" role="menuitem" className={menuItem} onClick={() => go('contacts')}><Contact size={14} className="text-slate-400" /> Contact Details</button>}
                            <button type="button" role="menuitem" className={menuItem} onClick={() => go('transfer')}><ArrowRightLeft size={14} className="text-slate-400" /> Transfer / EPP Code</button>
                            <button type="button" role="menuitem" className={menuItem} onClick={() => go('invoices')}><FileText size={14} className="text-slate-400" /> View Invoices</button>
                            <div className="my-1 border-t border-slate-100" />
                            <Link role="menuitem" className={menuItem} to={support}><Headset size={14} className="text-slate-400" /> Get Support</Link>
                        </Dropdown>
                    </div>
                </div>
            </section>

            {tab === 'overview' && (
                <>
                    <div className="grid items-start gap-5 xl:grid-cols-2">
                        <SectionCard icon={<ShieldCheck size={18} />} title="Domain Settings" subtitle="Changes here go straight to the registrar.">
                            <div className="divide-y divide-slate-100">
                                <ToggleRow icon={<RefreshCw size={15} />} name="Auto renew" hint={d.auto_renew ? 'A renewal invoice is raised before the domain expires.' : 'No renewal invoice will be raised. The domain lapses at expiry.'}>
                                    <Switch name={`Auto renew ${d.name}`} on={d.auto_renew} busy={autoRenew.isPending} disabled={!canManage || d.status !== 'active'} onChange={(on) => autoRenew.mutate(on)} />
                                </ToggleRow>
                                <ToggleRow icon={locked ? <Lock size={15} /> : <LockOpen size={15} />} name="Registrar lock" hint="Stops anyone moving the domain to another registrar. Turn it off only to transfer out.">
                                    <Switch name="Registrar lock" on={locked} busy={lock.isPending} disabled={!tools} onChange={(on) => on ? lock.mutate(true) : ask(`Unlock ${d.name}? It can then be transferred to another registrar with its EPP code.`, () => lock.mutate(false))} />
                                </ToggleRow>
                                <ToggleRow icon={<ShieldCheck size={15} />} name="ID protection" hint={info && info.privacy_allowed === false ? 'This extension does not allow ID protection.' : 'Hides your name, email and address from the public WHOIS.'}>
                                    <Switch name="ID protection" on={privacyOn} busy={privacy.isPending} disabled={!tools || info?.privacy_allowed === false} onChange={(on) => privacy.mutate(on)} />
                                </ToggleRow>
                            </div>
                            {!d.manageable && <p className="mt-3 flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-600"><Info size={14} className="mt-0.5 shrink-0" /> Registrar settings can be changed once the domain is active.</p>}
                        </SectionCard>

                        <SectionCard
                            icon={<Globe size={18} />}
                            title="Registrar Status"
                            subtitle="What the registry holds for this domain right now."
                            action={canManage ? <button type="button" disabled={live.isFetching} onClick={() => live.refetch()} className="icon-btn h-8 w-8" aria-label="Refresh registrar status" title="Refresh"><RefreshCw size={14} className={live.isFetching ? 'animate-spin' : ''} /></button> : undefined}
                        >
                            {!canManage ? <p className="text-sm text-slate-500">You do not have permission to manage this domain.</p>
                                : live.isLoading ? <p className="text-sm text-slate-500">Checking with the registrar...</p>
                                : !info ? <p className="rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-600">{live.data?.message ?? (live.error ? errorMessage(live.error) : 'Not available.')}</p>
                                : (
                                    <div className="divide-y divide-slate-100">
                                        <InfoRow icon={<CircleCheck size={15} />} name="Status"><Status value={info.status ?? 'unknown'} /></InfoRow>
                                        <InfoRow icon={<CalendarClock size={15} />} name="Registry expiry">{info.expires_at ? shortDate(info.expires_at) : '-'}</InfoRow>
                                        <InfoRow icon={<Lock size={15} />} name="Registry flags">{info.statuses?.length ? info.statuses.map((s) => <span key={s} className="mr-1 mb-1 inline-block rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{s}</span>) : '-'}</InfoRow>
                                        {info.contact && <InfoRow icon={<Contact size={15} />} name="Registrant">{info.contact.name}{info.contact.email ? ` · ${info.contact.email}` : ''}</InfoRow>}
                                    </div>
                                )}
                        </SectionCard>
                    </div>

                    <SectionCard icon={<LayoutGrid size={18} />} title="Quick Actions">
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
                            {canManage && d.can_renew && <Tile icon={<RotateCcw size={18} />} tone="bg-emerald-100 text-emerald-700" name="Renew Domain" disabled={renew.isPending} onClick={() => ask(`Create a renewal invoice of ${money(d.recurring_amount)} for ${d.name}?`, () => renew.mutate())} />}
                            {d.renewal_invoice && <Tile icon={<Wallet size={18} />} tone="bg-emerald-100 text-emerald-700" name="Pay Renewal" to={`/invoices/${d.renewal_invoice.id}`} />}
                            <Tile icon={<Network size={18} />} tone="bg-sky-100 text-sky-700" name="Nameservers" onClick={() => go('nameservers')} />
                            {tools && <Tile icon={<ServerCog size={18} />} tone="bg-indigo-100 text-indigo-700" name="DNS Records" onClick={() => go('dns')} />}
                            {tools && <Tile icon={locked ? <LockOpen size={18} /> : <Lock size={18} />} tone="bg-amber-100 text-amber-700" name={locked ? 'Unlock Domain' : 'Lock Domain'} disabled={lock.isPending} onClick={() => locked ? ask(`Unlock ${d.name}?`, () => lock.mutate(false)) : lock.mutate(true)} />}
                            <Tile icon={<KeyRound size={18} />} tone="bg-violet-100 text-violet-700" name="Transfer / EPP" onClick={() => go('transfer')} />
                            {tools && <Tile icon={<Contact size={18} />} tone="bg-teal-100 text-teal-700" name="Contacts" onClick={() => go('contacts')} />}
                            <Tile icon={<Headset size={18} />} tone="bg-cyan-100 text-cyan-700" name="Get Support" to={support} />
                        </div>
                    </SectionCard>
                </>
            )}

            {tab === 'nameservers' && <NameserversTab d={d} canManage={canManage} current={nameservers} onSaved={(data) => { fresh(data); setNotice('Nameservers updated. Changes can take up to 24-48 hours to reach everyone.'); }} />}
            {tab === 'dns' && tools && <DnsTab base={base} />}
            {tab === 'contacts' && tools && <ContactsTab key={live.data ? 'ready' : 'loading'} base={base} live={live.data} onSaved={(m) => { setNotice(m); live.refetch(); }} />}
            {tab === 'transfer' && <TransferTab d={d} base={base} canManage={canManage} locked={locked} onSaved={fresh} onUnlock={() => lock.mutate(false)} unlocking={lock.isPending} />}

            {tab === 'invoices' && (
                <section className="card overflow-hidden">
                    <Table rows={d.invoices} empty="No invoices for this domain yet." columns={[
                        { header: 'Invoice', cell: (i) => <Link className="table-action-link font-semibold" to={`/invoices/${i.id}`}>#{i.number}</Link> },
                        { header: 'Due Date', cell: (i) => shortDate(i.due_date) },
                        { header: 'Total', cell: (i) => money(i.total, i.currency), align: 'right' },
                        { header: 'Status', cell: (i) => <Status value={i.status} /> },
                    ]} />
                </section>
            )}

            {tab === 'activity' && (
                <SectionCard icon={<Activity size={18} />} title="Activity" subtitle="Recent changes on this domain.">
                    {d.activity.length === 0 ? <p className="py-6 text-center text-sm text-slate-500">No activity yet.</p> : (
                        <ul className="divide-y divide-slate-100">
                            {d.activity.map((a) => (
                                <li key={a.id} className="flex items-center gap-3 py-3">
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600"><History size={15} /></span>
                                    <div className="min-w-0 flex-1"><div className="text-sm font-medium text-slate-900">{a.title}</div><div className="text-xs text-slate-500">{a.by}</div></div>
                                    <span className="shrink-0 text-xs text-slate-500">{a.at ? new Date(a.at).toLocaleString('en-GB') : ''}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </SectionCard>
            )}
        </div>
    );
}

function NameserversTab({ d, canManage, current, onSaved }: { d: Detail; canManage: boolean; current: string[]; onSaved: (d: Detail) => void }) {
    const pad = (list: string[]) => [...list, '', '', '', '', ''].slice(0, 5);
    const [list, setList] = useState(() => pad(current));
    const editable = canManage && (d.manageable || d.status === 'pending');
    const save = useMutation({
        mutationFn: async (reset: boolean) => (await api.put<Detail>(`/client/domains/${d.id}/nameservers`, reset ? { reset: true } : { nameservers: list.filter(Boolean) })).data,
        onSuccess: (data) => { setList(pad(data.nameservers)); onSaved(data); },
    });

    return (
        <SectionCard icon={<Network size={18} />} title="Nameservers" subtitle="Where your domain's DNS is hosted. Point it at your hosting, or at another DNS provider.">
            <form onSubmit={(e) => { e.preventDefault(); save.mutate(false); }} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                    {list.map((ns, i) => (
                        <Field key={i} label={`Nameserver ${i + 1}${i < 2 ? '' : ' (optional)'}`}>
                            <Input value={ns} disabled={!editable} required={i < 2} placeholder={i < 2 ? `ns${i + 1}.example.com` : ''} onChange={(e) => setList(list.map((v, j) => (j === i ? e.target.value.trim() : v)))} />
                        </Field>
                    ))}
                </div>
                <ErrorNote error={save.error} />
                {editable ? (
                    <div className="flex flex-wrap items-center justify-end gap-2">
                        {d.default_nameservers.length >= 2 && <Button type="button" variant="ghost" disabled={save.isPending} onClick={() => ask(`Point ${d.name} at our default nameservers (${d.default_nameservers.join(', ')})?`, () => save.mutate(true))}><RotateCcw size={14} /> Use our nameservers</Button>}
                        <Button disabled={save.isPending}>{save.isPending ? 'Saving...' : 'Save Nameservers'}</Button>
                    </div>
                ) : <p className="text-xs text-slate-500">{canManage ? 'Nameservers can be changed once the domain is active.' : 'You do not have permission to change this domain.'}</p>}
            </form>
            {d.default_nameservers.length > 0 && (
                <p className="mt-4 flex items-start gap-2 rounded-xl bg-sky-50 px-3 py-2.5 text-xs text-sky-900"><Info size={14} className="mt-0.5 shrink-0" /> Our hosting nameservers: {d.default_nameservers.join(', ')}.</p>
            )}
        </SectionCard>
    );
}

function DnsTab({ base }: { base: string }) {
    const qc = useQueryClient();
    const key = ['client-domain-dns', base];
    const records = useQuery({ queryKey: key, queryFn: async () => (await api.get<{ records: DnsRecord[] }>(`${base}/dns`)).data.records, retry: false });
    const blank = { type: 'A', host: '', value: '', ttl: '14400', priority: '10' };
    const [form, setForm] = useState(blank);
    const add = useMutation({
        mutationFn: async () => (await api.post<{ records: DnsRecord[] }>(`${base}/dns`, { ...form, ttl: Number(form.ttl), priority: form.type === 'MX' ? Number(form.priority) : undefined })).data.records,
        onSuccess: (rows) => { qc.setQueryData(key, rows); setForm({ ...blank, type: form.type }); },
    });
    const remove = useMutation({
        mutationFn: async (r: DnsRecord) => (await api.post<{ records: DnsRecord[] }>(`${base}/dns/delete`, { type: r.type, host: r.host, value: r.value })).data.records,
        onSuccess: (rows) => qc.setQueryData(key, rows),
        onError: (e) => alertDialog(errorMessage(e)),
    });

    return (
        <div className="space-y-5">
            <SectionCard icon={<Plus size={18} />} title="Add a DNS Record">
                <form onSubmit={(e) => { e.preventDefault(); add.mutate(); }} className="grid gap-3 md:grid-cols-[8rem_1fr_2fr_7rem_auto] md:items-end">
                    <Field label="Type"><Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{DNS_TYPES.map((t) => <option key={t}>{t}</option>)}</Select></Field>
                    <Field label="Host"><Input placeholder="@ or www" value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} /></Field>
                    <Field label={form.type === 'MX' ? 'Mail server' : 'Value'}>
                        <div className="flex gap-2">
                            {form.type === 'MX' && <input className="ui-input w-20" type="number" min="0" max="65535" aria-label="Priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} />}
                            <Input required placeholder={valueHint[form.type]} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
                        </div>
                    </Field>
                    <Field label="TTL"><Select value={form.ttl} onChange={(e) => setForm({ ...form, ttl: e.target.value })}>{[['300', '5 min'], ['3600', '1 hour'], ['14400', '4 hours'], ['86400', '1 day']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></Field>
                    <Button disabled={add.isPending}><Plus size={14} /> {add.isPending ? 'Adding...' : 'Add'}</Button>
                </form>
                <div className="mt-3"><ErrorNote error={add.error} /></div>
            </SectionCard>

            <SectionCard
                icon={<ServerCog size={18} />}
                title="DNS Records"
                subtitle="Records in the registrar's DNS."
                action={<button type="button" disabled={records.isFetching} onClick={() => records.refetch()} className="icon-btn h-8 w-8" aria-label="Refresh records"><RefreshCw size={14} className={records.isFetching ? 'animate-spin' : ''} /></button>}
            >
                <QueryState query={records}>
                    {records.data && (records.data.length === 0 ? <p className="py-6 text-center text-sm text-slate-500">No records yet.</p> : (
                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                            <table className="w-full min-w-[36rem] text-sm">
                                <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500"><tr><th className="px-4 py-2">Type</th><th className="px-4 py-2">Host</th><th className="px-4 py-2">Value</th><th className="px-4 py-2">TTL</th><th className="px-4 py-2" /></tr></thead>
                                <tbody className="divide-y divide-slate-100">
                                    {records.data.map((r) => (
                                        <tr key={`${r.type}-${r.host}-${r.value}`}>
                                            <td className="px-4 py-2"><span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">{r.type}</span></td>
                                            <td className="px-4 py-2 font-mono text-xs">{r.host || '@'}</td>
                                            <td className="max-w-md px-4 py-2 font-mono text-xs break-all">{r.priority !== null && <span className="mr-1 text-slate-400">{r.priority}</span>}{r.value}</td>
                                            <td className="px-4 py-2 text-xs text-slate-500 tabular-nums">{r.ttl}</td>
                                            <td className="px-4 py-2 text-right">
                                                <button type="button" aria-label={`Delete ${r.type} record ${r.host || '@'}`} disabled={remove.isPending} className="icon-btn h-8 w-8 text-rose-600" onClick={() => ask(`Delete the ${r.type} record ${r.host || '@'} → ${r.value}?`, () => remove.mutate(r))}><Trash2 size={14} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </QueryState>
                <p className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
                    <Info size={14} className="mt-0.5 shrink-0" /> These records only take effect while the domain uses the registrar's DNS nameservers. If it points at our hosting, manage DNS in your control panel (cPanel Zone Editor or Webuzo DNS) instead.
                </p>
            </SectionCard>
        </div>
    );
}

function ContactsTab({ base, live, onSaved }: { base: string; live?: Live; onSaved: (message: string) => void }) {
    const [form, setForm] = useState<ContactForm | null>(live?.contact_defaults ?? null);
    const save = useMutation({ mutationFn: async () => (await api.put<{ message: string }>(`${base}/contacts`, { contact: form })).data, onSuccess: (r) => onSaved(r.message) });
    if (!form) return <SectionCard title="Contact Details"><p className="text-sm text-slate-500">Loading...</p></SectionCard>;
    const field = (key: keyof ContactForm, name: string, props: Record<string, unknown> = {}) => (
        <Field label={name}><Input {...props} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} /></Field>
    );

    return (
        <SectionCard icon={<Contact size={18} />} title="Contact Details" subtitle="The registrant, admin, technical and billing contact at the registrar. Prefilled from your profile.">
            {live?.contact && <p className="mb-4 rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-600">Now on record: <strong className="text-slate-900">{live.contact.name}</strong>{live.contact.email ? ` · ${live.contact.email}` : ''}{live.contact.country ? ` · ${live.contact.country}` : ''}</p>}
            <form onSubmit={(e) => { e.preventDefault(); ask('Update the contact details at the registrar?', () => save.mutate()); }} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                    {field('name', 'Full name', { required: true })}
                    {field('company', 'Company (optional)')}
                    {field('email', 'Email', { type: 'email', required: true })}
                    <div className="grid grid-cols-[6rem_1fr] gap-2">
                        {field('phone_cc', 'Code', { required: true, inputMode: 'numeric', placeholder: '880' })}
                        {field('phone', 'Phone', { required: true, inputMode: 'tel', placeholder: '1711000000' })}
                    </div>
                    {field('address', 'Address', { required: true, maxLength: 64 })}
                    {field('city', 'City', { required: true })}
                    {field('state', 'State / Division', { required: true })}
                    <div className="grid grid-cols-2 gap-2">
                        {field('zipcode', 'Postcode', { required: true })}
                        {field('country', 'Country code', { required: true, maxLength: 2, placeholder: 'BD' })}
                    </div>
                </div>
                <ErrorNote error={save.error} />
                <div className="flex justify-end"><Button disabled={save.isPending}>{save.isPending ? 'Saving...' : 'Update Contacts'}</Button></div>
            </form>
        </SectionCard>
    );
}

function TransferTab({ d, base, canManage, locked, onSaved, onUnlock, unlocking }: { d: Detail; base: string; canManage: boolean; locked: boolean; onSaved: (d: Detail) => void; onUnlock: () => void; unlocking: boolean }) {
    const [code, setCode] = useState('');
    const [show, setShow] = useState(false);
    const epp = useMutation({ mutationFn: async () => (await api.post<{ epp_code: string }>(`${base}/epp`)).data.epp_code, onSuccess: () => setShow(true) });
    const auth = useMutation({ mutationFn: async () => (await api.put<Detail>(`${base}/auth-code`, { auth_code: code })).data, onSuccess: (data) => { setCode(''); onSaved(data); } });

    if (d.awaiting_transfer) {
        return (
            <SectionCard icon={<ArrowRightLeft size={18} />} title="Incoming Transfer" subtitle="Moving this domain to us from your current registrar.">
                <ol className="mb-5 space-y-2 text-sm text-slate-600">
                    {['Unlock the domain at your current registrar.', 'Get its auth (EPP) code there and enter it below.', 'Approve the transfer email the registry may send you. It usually completes in 5-7 days.'].map((t, i) => (
                        <li key={t} className="flex items-start gap-2"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[11px] font-bold text-accent">{i + 1}</span> {t}</li>
                    ))}
                </ol>
                {canManage && (
                    <form onSubmit={(e) => { e.preventDefault(); auth.mutate(); }} className="flex flex-wrap items-end gap-2">
                        <div className="min-w-0 flex-1"><Field label={d.has_auth_code ? 'Replace the auth code' : 'Auth (EPP) code'}><Input required minLength={4} maxLength={255} autoComplete="off" value={code} onChange={(e) => setCode(e.target.value)} /></Field></div>
                        <Button disabled={auth.isPending}>{auth.isPending ? 'Saving...' : 'Save Code'}</Button>
                    </form>
                )}
                <div className="mt-3"><ErrorNote error={auth.error} /></div>
                {d.has_auth_code && <p className="mt-3 text-xs text-emerald-700">We have an auth code on file for this transfer.</p>}
            </SectionCard>
        );
    }

    return (
        <div className="grid items-start gap-5 xl:grid-cols-2">
            <SectionCard icon={<KeyRound size={18} />} title="Transfer Out" subtitle="Move this domain to another registrar.">
                <ol className="mb-5 space-y-2 text-sm text-slate-600">
                    {['Turn off the registrar lock.', 'Get the EPP code below.', 'Start the transfer at the new registrar with that code.'].map((t, i) => (
                        <li key={t} className="flex items-start gap-2"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[11px] font-bold text-accent">{i + 1}</span> {t}</li>
                    ))}
                </ol>
                {!canManage || !d.manageable ? <p className="text-sm text-slate-500">{canManage ? 'Transfer tools are available once the domain is active.' : 'You do not have permission to manage this domain.'}</p> : (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm">
                            <span className="flex items-center gap-2">{locked ? <Lock size={15} className="text-emerald-600" /> : <LockOpen size={15} className="text-amber-600" />} {locked ? 'Locked: transfers are blocked.' : 'Unlocked: ready to transfer.'}</span>
                            {locked && <Button type="button" variant="ghost" disabled={unlocking} onClick={() => ask(`Unlock ${d.name} for transfer?`, onUnlock)}><LockOpen size={14} /> Unlock</Button>}
                        </div>
                        <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm">
                            <span className="min-w-0 font-mono break-all">{show && epp.data ? epp.data : 'EPP code: ••••••••••'}</span>
                            <span className="flex shrink-0 items-center gap-1">
                                {show && <CopyButton value={epp.data} what="EPP code" />}
                                <Button type="button" variant="ghost" disabled={epp.isPending} onClick={() => (epp.data ? setShow(!show) : epp.mutate())}><Eye size={14} /> {epp.isPending ? 'Fetching...' : show ? 'Hide' : 'Show EPP Code'}</Button>
                            </span>
                        </div>
                        <ErrorNote error={epp.error} />
                        <p className="text-xs text-slate-500">Viewing the EPP code is recorded in the domain's activity. Keep it private: anyone with it can move your domain once unlocked.</p>
                    </div>
                )}
            </SectionCard>

            <SectionCard icon={<ArrowRightLeft size={18} />} title="Transfer Another Domain to Us" subtitle="Bring a domain from another registrar. A transfer adds a year to its expiry.">
                <p className="mb-4 text-sm text-slate-600">You need the domain unlocked at its current registrar and its auth (EPP) code.</p>
                <Link to="/order-domain?action=transfer" className="ui-btn ui-btn-primary"><ArrowRightLeft size={14} /> Start a Transfer</Link>
            </SectionCard>
        </div>
    );
}
