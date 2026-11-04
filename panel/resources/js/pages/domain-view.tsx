import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, BellRing, ChevronDown, ExternalLink, FileText, Globe, KeyRound, Lock, Server, ShieldCheck, Undo2, User, Wrench } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { api, money } from '../api';
import { Button, Dropdown, ErrorNote, Modal, QueryState, Status } from '../ui';
import { day } from './client-tabs';

type Option = { code: string; name: string };

export type DomainFull = {
    id: number; client_id: number; order_id: number | null; name: string; registrar: string | null; action: string; years: number;
    auto_renew: boolean; nameservers: string[] | null; registrar_lock: boolean; dns_management: boolean; email_forwarding: boolean; id_protection: boolean;
    recurring_amount: string; first_payment_amount: string; payment_method: string | null; subscription_id: string | null;
    status: string; provision_status: string; provision_error: string | null;
    expires_at: string | null; registered_at: string | null; next_due_date: string | null;
    client: { id: number; name: string; email: string };
    order: { id: number; order_number: string | null } | null;
    has_epp_code: boolean;
    client_domains: { id: number; name: string; status: string }[];
    reminders: { id: number; type: number; recipients: string; days_before_expiry: number; sent_on: string }[];
    options: { registrars: (Option & { connected: boolean })[]; payment_methods: Option[]; statuses: string[]; default_nameservers: string[] };
};

type Form = {
    name: string; registrar: string; years: number; first_payment_amount: string; recurring_amount: string; recalculate: boolean;
    subscription_id: string; registered_at: string; expires_at: string; next_due_date: string; payment_method: string; status: string;
    nameservers: string[]; reset_nameservers: boolean; registrar_lock: boolean; dns_management: boolean; email_forwarding: boolean; id_protection: boolean; auto_renew: boolean;
};

const toForm = (d: DomainFull): Form => ({
    name: d.name,
    registrar: d.registrar ?? '',
    years: d.years,
    first_payment_amount: d.first_payment_amount,
    recurring_amount: d.recurring_amount,
    recalculate: false,
    subscription_id: d.subscription_id ?? '',
    registered_at: d.registered_at ?? '',
    expires_at: d.expires_at ?? '',
    next_due_date: d.next_due_date ?? '',
    payment_method: d.payment_method ?? '',
    status: d.status,
    nameservers: [0, 1, 2, 3, 4].map((i) => d.nameservers?.[i] ?? ''),
    reset_nameservers: false,
    registrar_lock: d.registrar_lock,
    dns_management: d.dns_management,
    email_forwarding: d.email_forwarding,
    id_protection: d.id_protection,
    auto_renew: d.auto_renew,
});

const ordinal = ['', 'First', 'Second', 'Third', 'Fourth', 'Fifth'];
const label = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/** On/off switch in the panel accent colour. */
export function Toggle({ checked, onChange, children, hint }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode; hint?: string }) {
    return (
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white/70 px-3 py-2.5 transition hover:border-slate-300">
            <span className="relative inline-flex shrink-0">
                <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
                <span className="h-5 w-9 rounded-full bg-slate-300 transition peer-checked:bg-[var(--accent)] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--accent)] peer-focus-visible:ring-offset-2" />
                <span className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition peer-checked:translate-x-4" />
            </span>
            <span className="min-w-0">
                <span className="block text-sm font-medium text-slate-800">{children}</span>
                {hint && <span className="block text-xs text-slate-500">{hint}</span>}
            </span>
        </label>
    );
}

/** Label beside its control on wide screens, above it on phones. */
export function Row({ label: text, children, htmlFor }: { label: string; children: ReactNode; htmlFor?: string }) {
    return (
        <div className="grid gap-1.5 px-4 py-2.5 sm:grid-cols-[10.5rem_1fr] sm:items-center sm:gap-4">
            <label htmlFor={htmlFor} className="text-xs font-semibold text-slate-500 sm:text-right sm:text-sm sm:font-medium">{text}</label>
            <div className="min-w-0">{children}</div>
        </div>
    );
}

export function Section({ title, icon, children, action }: { title: string; icon: ReactNode; children: ReactNode; action?: ReactNode }) {
    return (
        <section className="card overflow-hidden">
            <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
                <h3 className="flex items-center gap-2 font-semibold text-slate-900"><span className="text-[var(--accent)]">{icon}</span>{title}</h3>
                {action}
            </header>
            {children}
        </section>
    );
}

function EppModal({ id, onClose }: { id: number; onClose: () => void }) {
    const q = useQuery({ queryKey: ['/domains/epp', id], queryFn: async () => (await api.get<{ epp_code: string | null }>(`/domains/${id}/epp`)).data, gcTime: 0 });

    return (
        <Modal title="EPP code" onClose={onClose}>
            <QueryState query={q}>
                <p className="rounded-xl bg-slate-50 px-4 py-3 font-mono text-lg break-all text-slate-900">{q.data?.epp_code ?? 'No EPP code stored for this domain.'}</p>
                <p className="mt-3 text-xs text-slate-500">This is the code stored in the panel. Viewing it is recorded in the activity log.</p>
            </QueryState>
        </Modal>
    );
}

/**
 * The admin's full view of one domain: billing, dates, nameservers, registrar tools and reminders.
 * Used on its own page and inside the client profile's Domains tab.
 */
export function DomainView({ id, onSelect, onBack }: { id: number; onSelect: (id: number) => void; onBack?: () => void }) {
    const query = useQuery({ queryKey: ['/domains', String(id)], queryFn: async () => (await api.get<DomainFull>(`/domains/${id}`)).data });

    return (
        <QueryState query={query}>
            {query.data && <DomainEditor key={query.data.id} d={query.data} onSelect={onSelect} onBack={onBack} />}
        </QueryState>
    );
}

function DomainEditor({ d, onSelect, onBack }: { d: DomainFull; onSelect: (id: number) => void; onBack?: () => void }) {
    const qc = useQueryClient();
    const [form, setForm] = useState<Form>(() => toForm(d));
    const [epp, setEpp] = useState(false);
    const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));
    const dirty = JSON.stringify(form) !== JSON.stringify(toForm(d));

    const save = useMutation({
        mutationFn: async () => (await api.put<DomainFull>(`/domains/${d.id}`, {
            ...form,
            registrar: form.registrar || null,
            payment_method: form.payment_method || null,
            subscription_id: form.subscription_id || null,
            registered_at: form.registered_at || null,
            expires_at: form.expires_at || null,
            next_due_date: form.next_due_date || null,
        })).data,
        onSuccess: (fresh) => {
            qc.setQueryData(['/domains', String(d.id)], fresh);
            setForm(toForm(fresh));
            qc.invalidateQueries({ queryKey: ['/clients', String(d.client_id)] });
        },
    });

    const registrar = d.options.registrars.find((r) => r.code === (form.registrar || d.registrar));
    const notConnected = registrar ? `Needs the ${registrar.name} registrar module, which is not connected yet.` : 'Choose a registrar first.';
    const commands: { label: string; onClick?: () => void; icon?: ReactNode }[] = [
        { label: 'Register' }, { label: 'Transfer' }, { label: 'Renew' }, { label: 'Modify Contact Details' },
        { label: 'Get EPP Code', onClick: () => setEpp(true), icon: <KeyRound size={14} /> },
        { label: 'Request Delete' }, { label: 'Release Domain' }, { label: 'Enable ID Protection' },
    ];

    return (
        <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-4 pb-20">
            {/* Header */}
            <section className="card flex flex-wrap items-center gap-3 px-4 py-3">
                {onBack && <button type="button" onClick={onBack} className="icon-btn h-9 w-9" aria-label="Back to domains"><ArrowLeft size={16} /></button>}
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]"><Globe size={18} /></span>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-lg font-semibold text-slate-900">{d.name}</h2>
                        <Status value={d.status} />
                        {d.provision_status !== 'done' && <Status value={d.provision_status} />}
                        {form.registrar_lock && <span title="Registrar lock on" className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700"><Lock size={11} /> Locked</span>}
                    </div>
                    <div className="text-xs text-slate-500">
                        <Link className="table-action-link" to={`/admin/clients/${d.client.id}`}>{d.client.name}</Link> · Expires {day(d.expires_at)} · {money(d.recurring_amount)} / {d.years} yr
                    </div>
                </div>
                <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                    <label className="sr-only" htmlFor={`switch-${d.id}`}>Switch domain</label>
                    <select id={`switch-${d.id}`} className="ui-input h-9 min-w-0 flex-1 sm:w-56 sm:flex-none" value={d.id} onChange={(e) => onSelect(Number(e.target.value))}>
                        {d.client_domains.map((o) => <option key={o.id} value={o.id}>{o.name}{o.status !== 'active' ? ` (${label(o.status)})` : ''}</option>)}
                    </select>
                    <Link to={`/admin/clients/${d.client.id}?tab=invoices`} className="ui-btn ui-btn-secondary h-9"><FileText size={14} /> View Invoices</Link>
                    <Dropdown label="More actions" buttonClassName="ui-btn ui-btn-secondary h-9" button={<>More <ChevronDown size={14} /></>} menuClassName="w-52 py-1 text-sm">
                        <Link role="menuitem" to={`/admin/clients/${d.client.id}`} className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50"><User size={14} className="text-slate-400" /> Client Profile</Link>
                        {d.order && <Link role="menuitem" to={`/admin/orders/${d.order.id}`} className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50"><FileText size={14} className="text-slate-400" /> View Order</Link>}
                        {onBack && <Link role="menuitem" to={`/admin/domain-registrations/${d.id}`} className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50"><ExternalLink size={14} className="text-slate-400" /> Open Full Page</Link>}
                        <button type="button" role="menuitem" onClick={() => setEpp(true)} className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left text-slate-700 hover:bg-slate-50"><KeyRound size={14} className="text-slate-400" /> Show EPP Code</button>
                    </Dropdown>
                </div>
            </section>

            <div className="grid items-start gap-4 xl:grid-cols-2">
                <Section title="Domain & Billing" icon={<Globe size={16} />}>
                    <div className="divide-y divide-slate-100 py-1">
                        <Row label="Order #">
                            {d.order ? <span className="text-sm text-slate-800">{d.order.id} - <Link className="table-action-link" to={`/admin/orders/${d.order.id}`}>View Order</Link></span> : <span className="text-sm text-slate-400">No order</span>}
                        </Row>
                        <Row label="Order Type"><span className="text-sm text-slate-800 capitalize">{d.action}</span></Row>
                        <Row label="Domain" htmlFor="dv-name"><input id="dv-name" className="ui-input" value={form.name} onChange={(e) => set('name', e.target.value)} /></Row>
                        <Row label="Registrar" htmlFor="dv-registrar">
                            <select id="dv-registrar" className="ui-input" value={form.registrar} onChange={(e) => set('registrar', e.target.value)}>
                                <option value="">None (manual)</option>
                                {d.options.registrars.map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}
                            </select>
                        </Row>
                        <Row label="First Payment Amount" htmlFor="dv-first"><input id="dv-first" type="number" step="0.01" min="0" className="ui-input" value={form.first_payment_amount} onChange={(e) => set('first_payment_amount', e.target.value)} /></Row>
                        <Row label="Recurring Amount" htmlFor="dv-recurring">
                            <div className="flex flex-wrap items-center gap-3">
                                <input id="dv-recurring" type="number" step="0.01" min="0" disabled={form.recalculate} className="ui-input max-w-40 disabled:opacity-60" value={form.recurring_amount} onChange={(e) => set('recurring_amount', e.target.value)} />
                                <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-slate-600">
                                    <input type="checkbox" checked={form.recalculate} onChange={(e) => set('recalculate', e.target.checked)} /> Recalculate on save
                                </label>
                            </div>
                        </Row>
                        <Row label="Subscription ID" htmlFor="dv-sub"><input id="dv-sub" className="ui-input" placeholder="None" value={form.subscription_id} onChange={(e) => set('subscription_id', e.target.value)} /></Row>
                    </div>
                </Section>

                <Section title="Dates & Status" icon={<BellRing size={16} />}>
                    <div className="divide-y divide-slate-100 py-1">
                        <Row label="Registration Period" htmlFor="dv-years">
                            <div className="flex max-w-40 items-stretch">
                                <input id="dv-years" type="number" min="1" max="10" className="ui-input rounded-r-none" value={form.years} onChange={(e) => set('years', Number(e.target.value))} />
                                <span className="flex items-center rounded-r-xl border border-l-0 border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">Years</span>
                            </div>
                        </Row>
                        <Row label="Registration Date" htmlFor="dv-reg"><input id="dv-reg" type="date" className="ui-input max-w-52" value={form.registered_at} onChange={(e) => set('registered_at', e.target.value)} /></Row>
                        <Row label="Expiry Date" htmlFor="dv-exp"><input id="dv-exp" type="date" className="ui-input max-w-52" value={form.expires_at} onChange={(e) => set('expires_at', e.target.value)} /></Row>
                        <Row label="Next Due Date" htmlFor="dv-due"><input id="dv-due" type="date" className="ui-input max-w-52" value={form.next_due_date} onChange={(e) => set('next_due_date', e.target.value)} /></Row>
                        <Row label="Payment Method" htmlFor="dv-pay">
                            <select id="dv-pay" className="ui-input" value={form.payment_method} onChange={(e) => set('payment_method', e.target.value)}>
                                <option value="">Not set</option>
                                {d.options.payment_methods.map((m) => <option key={m.code} value={m.code}>{m.name}</option>)}
                            </select>
                        </Row>
                        <Row label="Status" htmlFor="dv-status">
                            <select id="dv-status" className="ui-input" value={form.status} onChange={(e) => set('status', e.target.value)}>
                                {d.options.statuses.map((s) => <option key={s} value={s}>{label(s)}</option>)}
                            </select>
                        </Row>
                    </div>
                </Section>
            </div>

            <div className="grid items-start gap-4 xl:grid-cols-2">
                <Section title="Nameservers" icon={<Server size={16} />}>
                    <div className="space-y-3 p-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                            {form.nameservers.map((ns, i) => (
                                <label key={i} className="block">
                                    <span className="mb-1 block text-xs font-semibold text-slate-600">Nameserver {i + 1}</span>
                                    <input className="ui-input disabled:opacity-60" disabled={form.reset_nameservers} value={form.reset_nameservers ? (d.options.default_nameservers[i] ?? '') : ns} placeholder={i < 2 ? 'Required to resolve' : 'Optional'} onChange={(e) => set('nameservers', form.nameservers.map((v, j) => (j === i ? e.target.value : v)))} />
                                </label>
                            ))}
                        </div>
                        <Toggle checked={form.reset_nameservers} onChange={(v) => set('reset_nameservers', v)} hint={d.options.default_nameservers.length ? d.options.default_nameservers.join(', ') : 'No defaults set in Settings > Domains'}>
                            Reset to default nameservers
                        </Toggle>
                        <p className="text-xs text-slate-500">Saved in the panel. Change them at the registrar too until the registrar module is connected.</p>
                    </div>
                </Section>

                <Section title="Registrar & Management" icon={<Wrench size={16} />}>
                    <div className="space-y-4 p-4">
                        <Toggle checked={form.registrar_lock} onChange={(v) => set('registrar_lock', v)} hint="Blocks transfers away while on">Registrar Lock</Toggle>
                        <div>
                            <div className="mb-2 text-xs font-semibold text-slate-600">Registrar Commands</div>
                            <div className="flex flex-wrap gap-2">
                                {commands.map((c) => (
                                    <button key={c.label} type="button" disabled={!c.onClick} title={c.onClick ? undefined : notConnected} onClick={c.onClick} className="ui-btn ui-btn-secondary h-8 px-3 text-xs disabled:cursor-not-allowed disabled:opacity-50">
                                        {c.icon}{c.label}
                                    </button>
                                ))}
                            </div>
                            {!registrar?.connected && <p className="mt-2 text-xs text-slate-500">{notConnected} Do registrar work in its own control panel for now.</p>}
                        </div>
                        <div>
                            <div className="mb-2 text-xs font-semibold text-slate-600">Management Tools</div>
                            <div className="grid gap-2 sm:grid-cols-2">
                                <Toggle checked={form.dns_management} onChange={(v) => set('dns_management', v)}>DNS Management</Toggle>
                                <Toggle checked={form.email_forwarding} onChange={(v) => set('email_forwarding', v)}>Email Forwarding</Toggle>
                                <Toggle checked={form.id_protection} onChange={(v) => set('id_protection', v)}><span className="inline-flex items-center gap-1"><ShieldCheck size={13} /> ID Protection</span></Toggle>
                                <Toggle checked={!form.auto_renew} onChange={(v) => set('auto_renew', !v)} hint="No renewal invoices">Disable Auto Renew</Toggle>
                            </div>
                        </div>
                    </div>
                </Section>
            </div>

            <Section title="Domain Reminder History" icon={<BellRing size={16} />} action={<span className="text-xs text-slate-500">{d.reminders.length} sent</span>}>
                {d.reminders.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-slate-500">No expiry reminders have been sent for this domain.</p>
                ) : (
                    <div className="max-h-72 overflow-auto">
                        <table className="w-full min-w-[36rem] text-sm">
                            <thead className="sticky top-0 bg-slate-50 text-left text-xs font-semibold text-slate-500">
                                <tr><th className="px-4 py-2">Date</th><th className="px-4 py-2">Reminder</th><th className="px-4 py-2">Sent To</th><th className="px-4 py-2 text-right">Timing</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {d.reminders.map((r) => (
                                    <tr key={r.id} className="hover:bg-slate-50/60">
                                        <td className="px-4 py-2 tabular-nums">{day(r.sent_on)}</td>
                                        <td className="px-4 py-2">{ordinal[r.type] ?? `#${r.type}`} Reminder</td>
                                        <td className="px-4 py-2 break-all text-slate-600">{r.recipients}</td>
                                        <td className="px-4 py-2 text-right text-slate-600">{r.days_before_expiry > 0 ? `${r.days_before_expiry} days before expiry` : r.days_before_expiry < 0 ? `${-r.days_before_expiry} days after expiry` : 'On expiry'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Section>

            {/* Save bar */}
            <div className="sticky bottom-3 z-10">
                <div className="card flex flex-wrap items-center justify-end gap-3 px-4 py-3 shadow-lg">
                    <div className="mr-auto min-w-0 text-sm">
                        {save.error ? <ErrorNote error={save.error} /> : save.isSuccess && !dirty ? <span role="status" className="font-semibold text-emerald-700">Changes saved.</span> : <span className="text-slate-500">{dirty ? 'You have unsaved changes.' : 'No changes.'}</span>}
                    </div>
                    <Button type="button" variant="ghost" disabled={!dirty || save.isPending} onClick={() => { setForm(toForm(d)); save.reset(); }}><Undo2 size={14} /> Discard</Button>
                    <Button disabled={!dirty || save.isPending}>{save.isPending ? 'Saving...' : 'Save Changes'}</Button>
                </div>
            </div>

            {epp && <EppModal id={d.id} onClose={() => setEpp(false)} />}
        </form>
    );
}

