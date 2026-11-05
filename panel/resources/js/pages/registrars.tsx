import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ArrowDown, ArrowUp, Check, Globe, Percent, ReceiptText, RefreshCw, Search, Trash2, TrendingUp, Wallet } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { api, errorMessage, money } from '../api';
import { Button, Card, ErrorNote, Field, Input, Modal, QueryState, Select, Table } from '../ui';
import { StatCards } from './client-tabs';
import { monthLabel, Profit, shiftMonth, thisMonth } from './server-profit';
import { alertDialog, ask } from '../dialog';

/* Domain registrars: API settings, the money held at each registrar, and what domains really cost and earn. */

type WalletInfo = {
    code: string; currency: string; deposits: number; sent_bdt: number; fees_bdt: number; credited: number; spent: number; returned: number;
    balance: number; balance_bdt: number; unfunded: number; average_rate: number | null;
};
type Registrar = { code: string; name: string; reseller_id: string | null; has_api_key: boolean; currency: string; last_synced_at: string | null; sync_error: string | null; wallet: WalletInfo };
type Deposit = { id: number; paid_on: string; method: string; amount_bdt: string; fee_bdt: string; credited: string; reference: string | null; note: string | null; rate: number };
type Charge = {
    id: number; type: 'debit' | 'credit'; charged_at: string; description: string | null; amount: string; action: string; source: 'sync' | 'manual';
    domain_id: number | null; domain: { id: number; name: string; client_id: number } | null; cost_bdt: number; unfunded: boolean;
};
type Ledger = { wallet: WalletInfo; deposits: Deposit[]; charges: Charge[] };
type Cell = { sales: number; cost: number; profit: number };
type Report = {
    months: string[];
    registrars: { code: string; name: string; months: Record<string, Cell>; totals: Cell }[];
    totals: Record<string, Cell>;
    grand: Cell;
    tlds: { tld: string; sales: number; cost: number; profit: number }[];
    deposited: { sent_bdt: number; fees_bdt: number };
    wallets: WalletInfo[];
    checks: {
        tracked: string[];
        paid_not_done: { domain_id: number; domain: string; registrar: string; paid_at: string; amount: number; invoice_id: number; invoice: string; client_id: number }[];
        done_not_paid: { charge_id: number; domain_id: number; domain: string | null; registrar: string; charged_at: string; action: string; cost_bdt: number; client_id: number | null }[];
        below_cost: { charge_id: number; domain_id: number; domain: string | null; registrar: string; charged_at: string; cost_bdt: number; sale: number; loss: number; client_id: number | null }[];
        unmatched: { id: number; registrar_code: string; description: string | null; amount: string; charged_at: string; cost_bdt: number }[];
    };
};

const methods = [['bank', 'Bank'], ['card', 'Card'], ['bkash', 'bKash'], ['other', 'Other']] as const;
const actions = ['register', 'renew', 'transfer', 'other'];
const label = (v: string) => v.charAt(0).toUpperCase() + v.slice(1);
const inCurrency = (v: string | number, currency: string) => money(v, currency);
const marginOf = (c: Cell) => (c.sales > 0 ? (c.profit / c.sales) * 100 : null);
const today = () => new Date().toISOString().slice(0, 10);
const refreshKeys = (qc: ReturnType<typeof useQueryClient>, code: string) => {
    qc.invalidateQueries({ queryKey: ['registrars'] });
    qc.invalidateQueries({ queryKey: ['/registrars/profit'] });
    qc.invalidateQueries({ queryKey: ['/registrars/ledger', code] });
};

/* ---------- Settings ---------- */

function RegistrarForm({ registrar, onClose }: { registrar: Registrar; onClose: () => void }) {
    const qc = useQueryClient();
    const [resellerId, setResellerId] = useState(registrar.reseller_id ?? '');
    const [apiKey, setApiKey] = useState('');
    const [currency, setCurrency] = useState(registrar.currency);
    const save = useMutation({
        mutationFn: () => api.put(`/registrars/${registrar.code}`, { reseller_id: resellerId, api_key: apiKey, currency }),
        onSuccess: () => { refreshKeys(qc, registrar.code); onClose(); },
    });

    return (
        <Modal title={`Edit ${registrar.name}`} onClose={onClose}>
            <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-3">
                <Field label="Reseller ID"><Input required value={resellerId} onChange={(e) => setResellerId(e.target.value)} /></Field>
                <Field label="API key" hint={registrar.has_api_key ? 'Leave blank to keep the current key' : 'Stored encrypted'}><Input type="password" autoComplete="new-password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} /></Field>
                <Field label="Account currency" hint="What the registrar bills and holds your balance in">
                    <Select value={currency} onChange={(e) => setCurrency(e.target.value)}><option value="BDT">BDT</option><option value="USD">USD</option></Select>
                </Field>
                <ErrorNote error={save.error} />
                <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button disabled={save.isPending}>Save registrar</Button></div>
            </form>
        </Modal>
    );
}

function TestButton({ code }: { code: string }) {
    const test = useMutation({
        mutationFn: async () => (await api.post<{ message: string }>(`/registrars/${code}/test`)).data,
        onSuccess: (r) => alertDialog(r.message),
        onError: (e) => alertDialog(errorMessage(e)),
    });

    return <Button variant="link" disabled={test.isPending} onClick={() => test.mutate()}>{test.isPending ? 'Testing...' : 'Test'}</Button>;
}

function SyncButton({ code }: { code: string }) {
    const qc = useQueryClient();
    const sync = useMutation({
        mutationFn: async () => (await api.post<{ message: string }>(`/registrars/${code}/sync`)).data,
        onSuccess: (r) => { refreshKeys(qc, code); alertDialog(r.message); },
        onError: (e) => { refreshKeys(qc, code); alertDialog(errorMessage(e)); },
    });

    return <Button variant="link" disabled={sync.isPending} onClick={() => sync.mutate()}><RefreshCw size={12} className={sync.isPending ? 'animate-spin' : ''} /> {sync.isPending ? 'Syncing...' : 'Sync'}</Button>;
}

/* ---------- Wallet ---------- */

type DomainHit = { id: number; name: string; client?: { name: string } };

/** Search the panel's domains by name and pick one. */
function DomainPicker({ value, onChange }: { value: { id: number; name: string } | null; onChange: (d: { id: number; name: string } | null) => void }) {
    const [search, setSearch] = useState('');
    const [term, setTerm] = useState('');
    const hits = useQuery({
        queryKey: ['/domains-picker', term],
        queryFn: async () => (await api.get<{ data: DomainHit[] }>('/domains', { params: { q: term } })).data.data.slice(0, 8),
        enabled: term.length > 1,
        placeholderData: keepPreviousData,
    });

    useEffect(() => {
        const timer = window.setTimeout(() => setTerm(search.trim()), 250);

        return () => window.clearTimeout(timer);
    }, [search]);

    if (value) {
        return (
            <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                <span className="flex items-center gap-2 font-medium text-slate-900"><Globe size={14} className="text-slate-400" /> {value.name}</span>
                <Button type="button" variant="link" onClick={() => onChange(null)}>Change</Button>
            </div>
        );
    }

    return (
        <div className="relative">
            <Search size={14} className="pointer-events-none absolute top-3 left-3 text-slate-400" />
            <input className="ui-input pl-8" placeholder="Type a domain name" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search domains" />
            {term.length > 1 && hits.data && (
                <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 text-sm shadow-lg">
                    {hits.data.length === 0 && <li className="px-3 py-2 text-slate-500">No domains found.</li>}
                    {hits.data.map((d) => (
                        <li key={d.id}><button type="button" className="flex w-full cursor-pointer justify-between gap-2 px-3 py-2 text-left hover:bg-slate-50" onClick={() => { onChange({ id: d.id, name: d.name }); setSearch(''); }}>
                            <span className="font-medium text-slate-900">{d.name}</span><span className="truncate text-xs text-slate-500">{d.client?.name}</span>
                        </button></li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function DepositForm({ registrar, onSaved }: { registrar: Registrar; onSaved: (l: Ledger) => void }) {
    const [form, setForm] = useState({ paid_on: today(), method: 'bank', amount_bdt: '', fee_bdt: '', credited: '', reference: '', note: '' });
    const bdt = registrar.currency === 'BDT';
    const rate = Number(form.credited) > 0 ? (Number(form.amount_bdt) + Number(form.fee_bdt || 0)) / Number(form.credited) : null;
    const save = useMutation({
        mutationFn: async () => (await api.post<Ledger>(`/registrars/${registrar.code}/deposits`, form)).data,
        onSuccess: (l) => { onSaved(l); setForm({ ...form, amount_bdt: '', fee_bdt: '', credited: '', reference: '', note: '' }); },
    });

    return (
        <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-3 rounded-xl border border-slate-200 p-3">
            <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Date"><Input type="date" required max={today()} value={form.paid_on} onChange={(e) => setForm({ ...form, paid_on: e.target.value })} /></Field>
                <Field label="Paid by"><Select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>{methods.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></Field>
                <Field label="Reference"><Input maxLength={255} placeholder="Bank ref, TrxID..." value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} /></Field>
                <Field label="Amount sent (BDT)"><Input type="number" required min="0.01" step="0.01" value={form.amount_bdt} onChange={(e) => setForm({ ...form, amount_bdt: e.target.value, ...(bdt && !form.credited ? { credited: e.target.value } : {}) })} /></Field>
                <Field label="Fee (BDT)" hint="Bank, card or bKash charge"><Input type="number" min="0" step="0.01" placeholder="0.00" value={form.fee_bdt} onChange={(e) => setForm({ ...form, fee_bdt: e.target.value })} /></Field>
                <Field label={`Credited to account (${registrar.currency})`} hint="What the registrar added to your balance"><Input type="number" required min="0.01" step="0.01" value={form.credited} onChange={(e) => setForm({ ...form, credited: e.target.value })} /></Field>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-slate-600">
                    {rate !== null ? <>Effective cost: <strong className="text-slate-900">{bdt ? `৳${rate.toFixed(4)} per ৳1 of balance` : `৳${rate.toFixed(2)} per $1`}</strong> (fee included)</> : 'Fill in the amounts to see the effective rate.'}
                </span>
                <Button disabled={save.isPending}>{save.isPending ? 'Saving...' : 'Add Deposit'}</Button>
            </div>
            <ErrorNote error={save.error} />
        </form>
    );
}

function ChargeForm({ registrar, onSaved }: { registrar: Registrar; onSaved: (l: Ledger) => void }) {
    const [form, setForm] = useState({ charged_at: today(), type: 'debit', action: 'renew', amount: '', description: '' });
    const [domain, setDomain] = useState<{ id: number; name: string } | null>(null);
    const save = useMutation({
        mutationFn: async () => (await api.post<Ledger>(`/registrars/${registrar.code}/charges`, { ...form, domain_id: domain?.id ?? null })).data,
        onSuccess: (l) => { onSaved(l); setForm({ ...form, amount: '', description: '' }); setDomain(null); },
    });

    return (
        <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-3 rounded-xl border border-slate-200 p-3">
            <div className="grid gap-3 sm:grid-cols-4">
                <Field label="Date"><Input type="date" required max={today()} value={form.charged_at} onChange={(e) => setForm({ ...form, charged_at: e.target.value })} /></Field>
                <Field label="Type"><Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="debit">Charge</option><option value="credit">Refund from registrar</option></Select></Field>
                <Field label="For"><Select value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })}>{actions.map((a) => <option key={a} value={a}>{label(a)}</option>)}</Select></Field>
                <Field label={`Amount (${registrar.currency})`}><Input type="number" required min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
                <div><span className="mb-1 block text-xs font-semibold text-slate-600">Domain</span><DomainPicker value={domain} onChange={setDomain} /></div>
                <Field label="Description"><Input maxLength={255} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
            </div>
            <ErrorNote error={save.error} />
            <div className="flex justify-end"><Button disabled={save.isPending}>{save.isPending ? 'Saving...' : 'Add Charge'}</Button></div>
        </form>
    );
}

/** Link a synced or manual charge to the right domain. */
function MatchCharge({ registrar, charge, onSaved }: { registrar: Registrar; charge: Charge; onSaved: (l: Ledger) => void }) {
    const [open, setOpen] = useState(false);
    const save = useMutation({
        mutationFn: async (d: { id: number; name: string } | null) => (await api.put<Ledger>(`/registrars/${registrar.code}/charges/${charge.id}`, { domain_id: d?.id ?? null, action: charge.action })).data,
        onSuccess: (l) => { setOpen(false); onSaved(l); },
        onError: (e) => alertDialog(errorMessage(e)),
    });

    if (!open) return <Button variant="link" onClick={() => setOpen(true)}>{charge.domain ? charge.domain.name : 'Match domain'}</Button>;

    return <div className="w-56"><DomainPicker value={null} onChange={(d) => d && save.mutate(d)} /></div>;
}

export function WalletModal({ registrar, onClose }: { registrar: Registrar; onClose: () => void }) {
    const qc = useQueryClient();
    const key = ['/registrars/ledger', registrar.code];
    const ledger = useQuery({ queryKey: key, queryFn: async () => (await api.get<Ledger>(`/registrars/${registrar.code}/ledger`)).data });
    const [tab, setTab] = useState<'deposits' | 'charges'>('deposits');
    const saved = (l: Ledger) => { qc.setQueryData(key, l); refreshKeys(qc, registrar.code); };
    const removeDeposit = useMutation({ mutationFn: async (id: number) => (await api.delete<Ledger>(`/registrars/${registrar.code}/deposits/${id}`)).data, onSuccess: saved, onError: (e) => alertDialog(errorMessage(e)) });
    const removeCharge = useMutation({ mutationFn: async (id: number) => (await api.delete<Ledger>(`/registrars/${registrar.code}/charges/${id}`)).data, onSuccess: saved, onError: (e) => alertDialog(errorMessage(e)) });
    const w = ledger.data?.wallet ?? registrar.wallet;
    const cur = registrar.currency;

    return (
        <Modal wide title={`${registrar.name} wallet`} onClose={onClose}>
            <div className="space-y-4">
                <div className="grid gap-2 sm:grid-cols-4">
                    {([
                        ['Balance', inCurrency(w.balance, cur), `worth ${money(w.balance_bdt)}`],
                        ['Deposited', inCurrency(w.credited, cur), `${money(w.sent_bdt)} + ${money(w.fees_bdt)} fees`],
                        ['Spent on domains', inCurrency(w.spent, cur), w.returned ? `${inCurrency(w.returned, cur)} refunded` : `${w.deposits} deposit(s)`],
                        ['Average cost', w.average_rate === null ? '-' : cur === 'BDT' ? `৳${w.average_rate.toFixed(4)} / ৳1` : `৳${w.average_rate.toFixed(2)} / $1`, 'fees included'],
                    ] as [string, string, string][]).map(([k, v, h]) => (
                        <div key={k} className="rounded-xl bg-slate-50 px-3 py-2.5"><div className="text-xs text-slate-500">{k}</div><div className="font-semibold text-slate-900 tabular-nums">{v}</div><div className="text-[11px] text-slate-500">{h}</div></div>
                    ))}
                </div>
                {w.unfunded > 0 && <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"><AlertTriangle size={14} className="mt-0.5 shrink-0" /> Charges of {inCurrency(w.unfunded, cur)} are more than the deposits recorded, so they are costed at the last known rate. Add the deposits (or an opening balance) that paid for them.</p>}

                <nav className="flex gap-1 border-b border-slate-200">
                    {(['deposits', 'charges'] as const).map((t) => (
                        <button key={t} type="button" onClick={() => setTab(t)} className={`-mb-px cursor-pointer border-b-2 px-3 py-2 text-sm font-medium ${tab === t ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                            {t === 'deposits' ? `Deposits (${ledger.data?.deposits.length ?? 0})` : `Charges (${ledger.data?.charges.length ?? 0})`}
                        </button>
                    ))}
                </nav>

                <QueryState query={ledger}>
                    {ledger.data && tab === 'deposits' && (
                        <div className="space-y-3">
                            <DepositForm registrar={registrar} onSaved={saved} />
                            <p className="text-xs text-slate-500">Starting now with money already in the account? Add it once as a deposit dated before your first tracked charge, at the rate you paid for it.</p>
                            {ledger.data.deposits.length === 0 ? <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">No deposits recorded yet.</p> : (
                                <div className="overflow-x-auto rounded-xl border border-slate-200">
                                    <table className="w-full min-w-[40rem] text-sm">
                                        <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500"><tr><th className="px-3 py-2">Date</th><th className="px-3 py-2">Paid by</th><th className="px-3 py-2 text-right">Sent</th><th className="px-3 py-2 text-right">Fee</th><th className="px-3 py-2 text-right">Credited</th><th className="px-3 py-2 text-right">Rate</th><th className="px-3 py-2" /></tr></thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {ledger.data.deposits.map((d) => (
                                                <tr key={d.id}>
                                                    <td className="px-3 py-2 tabular-nums">{d.paid_on}{(d.reference || d.note) && <span className="block text-[11px] text-slate-500">{[d.reference, d.note].filter(Boolean).join(' · ')}</span>}</td>
                                                    <td className="px-3 py-2">{methods.find(([v]) => v === d.method)?.[1] ?? d.method}</td>
                                                    <td className="px-3 py-2 text-right tabular-nums">{money(d.amount_bdt)}</td>
                                                    <td className="px-3 py-2 text-right text-slate-600 tabular-nums">{money(d.fee_bdt)}</td>
                                                    <td className="px-3 py-2 text-right font-semibold tabular-nums">{inCurrency(d.credited, cur)}</td>
                                                    <td className="px-3 py-2 text-right text-slate-600 tabular-nums">{cur === 'BDT' ? d.rate.toFixed(4) : `৳${d.rate.toFixed(2)}`}</td>
                                                    <td className="px-3 py-2 text-right"><button type="button" aria-label="Delete deposit" className="icon-btn h-8 w-8 text-rose-600" disabled={removeDeposit.isPending} onClick={() => ask('Delete this deposit? Domain costs are recalculated.', () => removeDeposit.mutate(d.id))}><Trash2 size={14} /></button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                    {ledger.data && tab === 'charges' && (
                        <div className="space-y-3">
                            <ChargeForm registrar={registrar} onSaved={saved} />
                            <p className="text-xs text-slate-500">Synced charges arrive daily. Add charges by hand only while sync is not working, so nothing is counted twice.</p>
                            {ledger.data.charges.length === 0 ? <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">No charges yet. Sync, or add them by hand.</p> : (
                                <div className="overflow-x-auto rounded-xl border border-slate-200">
                                    <table className="w-full min-w-[46rem] text-sm">
                                        <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500"><tr><th className="px-3 py-2">Date</th><th className="px-3 py-2">Description</th><th className="px-3 py-2">Domain</th><th className="px-3 py-2 text-right">Amount</th><th className="px-3 py-2 text-right">Cost (BDT)</th><th className="px-3 py-2" /></tr></thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {ledger.data.charges.map((c) => (
                                                <tr key={c.id}>
                                                    <td className="px-3 py-2 whitespace-nowrap tabular-nums">{c.charged_at.slice(0, 10)}</td>
                                                    <td className="px-3 py-2 text-slate-700">
                                                        {c.description || label(c.action)}
                                                        <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 uppercase">{c.source}</span>
                                                        {c.type === 'credit' && <span className="ml-1 rounded-full bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700">Refund</span>}
                                                    </td>
                                                    <td className="px-3 py-2"><MatchCharge registrar={registrar} charge={c} onSaved={saved} /></td>
                                                    <td className={`px-3 py-2 text-right tabular-nums ${c.type === 'credit' ? 'text-sky-700' : ''}`}>{c.type === 'credit' ? '-' : ''}{inCurrency(c.amount, cur)}</td>
                                                    <td className="px-3 py-2 text-right font-semibold tabular-nums">{money(c.cost_bdt)}{c.unfunded && <span title="More than the deposits recorded: costed at the last known rate" className="ml-1 text-amber-600">*</span>}</td>
                                                    <td className="px-3 py-2 text-right">{c.source === 'manual' && <button type="button" aria-label="Delete charge" className="icon-btn h-8 w-8 text-rose-600" disabled={removeCharge.isPending} onClick={() => ask('Delete this charge?', () => removeCharge.mutate(c.id))}><Trash2 size={14} /></button>}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </QueryState>
            </div>
        </Modal>
    );
}

/* ---------- Report ---------- */

function CheckList<T>({ title, tone, rows, empty, render, hint }: { title: string; tone: string; rows: T[]; empty: string; render: (row: T) => ReactNode; hint: string }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="rounded-xl border border-slate-200">
            <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} disabled={rows.length === 0} className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left disabled:cursor-default">
                <span className="min-w-0"><span className="block text-sm font-semibold text-slate-900">{title}</span><span className="block text-xs text-slate-500">{rows.length ? hint : empty}</span></span>
                <span className={`flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-bold ${rows.length ? tone : 'bg-emerald-50 text-emerald-700'}`}>{rows.length ? rows.length : <Check size={14} />}</span>
            </button>
            {open && rows.length > 0 && <ul className="max-h-72 divide-y divide-slate-100 overflow-y-auto border-t border-slate-200 text-sm">{rows.map((r, i) => <li key={i} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2">{render(r)}</li>)}</ul>}
        </div>
    );
}

const ranges = [6, 12, 24];

function DomainProfitReport({ registrars }: { registrars: Registrar[] }) {
    const [to, setTo] = useState(thisMonth());
    const [span, setSpan] = useState(12);
    const [code, setCode] = useState('');
    const [open, setOpen] = useState<string | null>(null);
    const from = shiftMonth(to, -(span - 1));
    const query = useQuery({
        queryKey: ['/registrars/profit', from, to, code],
        queryFn: async () => (await api.get<Report>('/registrars/profit', { params: { from, to, registrar: code || undefined } })).data,
        placeholderData: keepPreviousData,
    });
    const r = query.data;
    const m = r ? marginOf(r.grand) : null;
    const domainUrl = (clientId: number | null, id: number) => (clientId ? `/admin/clients/${clientId}?tab=domains&view=${id}` : `/admin/domain-registrations/${id}`);
    const untracked = r ? registrars.filter((x) => (!code || x.code === code) && !r.checks.tracked.includes(x.code)) : [];

    return (
        <section className="space-y-4">
            <div className="card flex flex-wrap items-center gap-3 px-4 py-3">
                <h2 className="mr-auto flex items-center gap-2 font-semibold text-slate-900"><TrendingUp size={17} className="text-[var(--accent)]" /> Domain Profit by Month</h2>
                <label className="sr-only" htmlFor="dp-registrar">Registrar</label>
                <select id="dp-registrar" className="ui-input h-9 w-full sm:w-48" value={code} onChange={(e) => setCode(e.target.value)}>
                    <option value="">All registrars</option>
                    {registrars.map((x) => <option key={x.code} value={x.code}>{x.name}</option>)}
                </select>
                <div className="flex rounded-xl border border-slate-200 bg-white p-0.5" role="group" aria-label="Range">
                    {ranges.map((n) => <button key={n} type="button" aria-pressed={span === n} onClick={() => setSpan(n)} className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold ${span === n ? 'bg-[var(--accent)] text-white' : 'text-slate-600 hover:bg-slate-50'}`}>{n} months</button>)}
                </div>
                <label className="flex items-center gap-2 text-xs text-slate-600">Up to <input type="month" className="ui-input h-9 w-auto" value={to} max={thisMonth()} onChange={(e) => e.target.value && setTo(e.target.value)} /></label>
            </div>

            {untracked.length > 0 && (
                <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    <span>No registrar charges recorded yet for {untracked.map((x) => x.name).join(' and ')}, so its cost shows as 0 and profit equals sales. Sync it, or add charges and deposits in its wallet.</span>
                </p>
            )}

            <StatCards items={[
                { label: `Domain sales, ${span} months`, value: r ? money(r.grand.sales) : '-', icon: <ArrowDown size={20} />, tone: 'bg-emerald-100 text-emerald-700' },
                { label: 'Registrar cost', value: r ? money(r.grand.cost) : '-', icon: <ReceiptText size={20} />, tone: 'bg-amber-100 text-amber-700' },
                { label: 'Profit', value: r ? <Profit value={String(r.grand.profit)} /> : '-', icon: <ArrowUp size={20} />, tone: 'bg-[var(--accent-soft)] text-accent' },
                { label: 'Margin', value: m === null ? '-' : `${m.toFixed(1)}%`, icon: <Percent size={20} />, tone: 'bg-sky-100 text-sky-700' },
            ]} />

            <div className="grid items-start gap-4 xl:grid-cols-3">
                <section className="card overflow-hidden xl:col-span-2">
                    <QueryState query={query}>
                        {r && (
                            <div className={`overflow-x-auto ${query.isFetching ? 'opacity-60' : ''}`}>
                                <table className="w-full min-w-[36rem] text-sm">
                                    <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase">
                                        <tr><th className="px-4 py-3">Month</th><th className="px-4 py-3 text-right">Sales</th><th className="px-4 py-3 text-right">Cost</th><th className="px-4 py-3 text-right">Profit</th><th className="px-4 py-3 text-right">Margin</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {[...r.months].reverse().flatMap((month) => {
                                            const c = r.totals[month];
                                            const mm = marginOf(c);
                                            const many = r.registrars.length > 1;
                                            const expanded = many && open === month;

                                            return [
                                                <tr key={month} className={`hover:bg-slate-50/60 ${many ? 'cursor-pointer' : ''}`} onClick={() => many && setOpen(expanded ? null : month)}>
                                                    <td className="px-4 py-3 font-medium text-slate-900">{monthLabel(month)}{month === thisMonth() && <span className="ml-2 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700">So far</span>}</td>
                                                    <td className="px-4 py-3 text-right tabular-nums">{money(c.sales)}</td>
                                                    <td className="px-4 py-3 text-right text-slate-600 tabular-nums">{money(c.cost)}</td>
                                                    <td className="px-4 py-3 text-right"><Profit value={String(c.profit)} /></td>
                                                    <td className="px-4 py-3 text-right text-slate-600 tabular-nums">{mm === null ? '-' : `${mm.toFixed(1)}%`}</td>
                                                </tr>,
                                                ...(expanded ? r.registrars.map((x) => (
                                                    <tr key={`${month}-${x.code}`} className="bg-slate-50/70 text-xs">
                                                        <td className="py-2 pr-4 pl-8 text-slate-600">{x.name}</td>
                                                        <td className="px-4 py-2 text-right tabular-nums">{money(x.months[month].sales)}</td>
                                                        <td className="px-4 py-2 text-right text-slate-600 tabular-nums">{money(x.months[month].cost)}</td>
                                                        <td className="px-4 py-2 text-right"><Profit value={String(x.months[month].profit)} /></td>
                                                        <td className="px-4 py-2 text-right text-slate-500 tabular-nums">{marginOf(x.months[month])?.toFixed(1) ?? '-'}{marginOf(x.months[month]) !== null && '%'}</td>
                                                    </tr>
                                                )) : []),
                                            ];
                                        })}
                                    </tbody>
                                    <tfoot className="border-t-2 border-slate-200 bg-slate-50/60 font-semibold">
                                        <tr><td className="px-4 py-3">Total</td><td className="px-4 py-3 text-right tabular-nums">{money(r.grand.sales)}</td><td className="px-4 py-3 text-right tabular-nums">{money(r.grand.cost)}</td><td className="px-4 py-3 text-right"><Profit value={String(r.grand.profit)} /></td><td className="px-4 py-3 text-right tabular-nums">{m === null ? '-' : `${m.toFixed(1)}%`}</td></tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </QueryState>
                    {r && <p className="border-t border-slate-200 px-4 py-2 text-xs text-slate-500">Cost is what registrations and renewals took from your registrar balance, at what that money cost you in BDT. Deposited in this range: {money(r.deposited.sent_bdt)} + {money(r.deposited.fees_bdt)} fees (money moved, not cost).</p>}
                </section>

                <section className="card overflow-hidden">
                    <header className="border-b border-slate-200 px-4 py-3"><h3 className="font-semibold text-slate-900">By TLD</h3></header>
                    {r && (r.tlds.length === 0 ? <p className="px-4 py-6 text-center text-sm text-slate-500">No domain sales in this range.</p> : (
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500"><tr><th className="px-4 py-2">TLD</th><th className="px-4 py-2 text-right">Sales</th><th className="px-4 py-2 text-right">Profit</th></tr></thead>
                            <tbody className="divide-y divide-slate-100">
                                {r.tlds.map((t) => (
                                    <tr key={t.tld}><td className="px-4 py-2 font-medium text-slate-900">{t.tld}</td><td className="px-4 py-2 text-right tabular-nums">{money(t.sales)}</td><td className="px-4 py-2 text-right"><Profit value={String(t.profit)} /></td></tr>
                                ))}
                            </tbody>
                        </table>
                    ))}
                </section>
            </div>

            {r && (
                <section className="card space-y-3 p-4">
                    <h3 className="flex items-center gap-2 font-semibold text-slate-900"><AlertTriangle size={16} className="text-[var(--accent)]" /> Checks, last 12 months</h3>
                    <div className="grid gap-3 lg:grid-cols-2">
                        <CheckList
                            title="Paid by client, not done at registrar"
                            tone="bg-rose-100 text-rose-700"
                            rows={r.checks.paid_not_done}
                            empty={r.checks.tracked.length ? 'Every paid domain has a registrar charge.' : 'Needs registrar charges to check.'}
                            hint="No registrar charge within 60 days of payment. Renew it, or match its charge."
                            render={(x) => <><Link className="table-action-link font-medium" to={domainUrl(x.client_id, x.domain_id)}>{x.domain}</Link><span className="text-xs text-slate-500">Paid {x.paid_at} · {money(x.amount)} · <Link className="table-action-link" to={`/admin/clients/${x.client_id}?tab=invoices&view=${x.invoice_id}`}>#{x.invoice}</Link></span></>}
                        />
                        <CheckList
                            title="Done at registrar, not paid by client"
                            tone="bg-amber-100 text-amber-800"
                            rows={r.checks.done_not_paid}
                            empty="Every registrar charge has a paid invoice."
                            hint="A charge with no paid invoice within 60 days. Invoice the client, or it is a loss."
                            render={(x) => <><Link className="table-action-link font-medium" to={domainUrl(x.client_id, x.domain_id)}>{x.domain}</Link><span className="text-xs text-slate-500">{label(x.action)} {x.charged_at} · cost {money(x.cost_bdt)}</span></>}
                        />
                        <CheckList
                            title="Sold below cost"
                            tone="bg-rose-100 text-rose-700"
                            rows={r.checks.below_cost}
                            empty="No domain sold for less than it cost."
                            hint="Raise the TLD price, or check the charge."
                            render={(x) => <><Link className="table-action-link font-medium" to={domainUrl(x.client_id, x.domain_id)}>{x.domain}</Link><span className="text-xs text-slate-500">Sold {money(x.sale)} · cost {money(x.cost_bdt)} · <span className="font-semibold text-rose-600">loss {money(x.loss)}</span></span></>}
                        />
                        <CheckList
                            title="Charges with no domain"
                            tone="bg-slate-200 text-slate-700"
                            rows={r.checks.unmatched}
                            empty="Every charge is linked to a domain."
                            hint="Open the wallet's Charges tab and match each to its domain."
                            render={(x) => <><span className="min-w-0 truncate text-slate-700">{x.description || 'Charge'}</span><span className="text-xs text-slate-500">{registrars.find((y) => y.code === x.registrar_code)?.name} · {x.charged_at} · {money(x.cost_bdt)}</span></>}
                        />
                    </div>
                </section>
            )}
        </section>
    );
}

/* ---------- Page ---------- */

export function RegistrarsPage() {
    const query = useQuery({ queryKey: ['registrars'], queryFn: async () => (await api.get<Registrar[]>('/registrars')).data });
    const [editing, setEditing] = useState<Registrar | null>(null);
    const [wallet, setWallet] = useState<Registrar | null>(null);

    return (
        <div className="space-y-4">
            <Card title="Domain registrars">
                <QueryState query={query}>
                    <Table<Registrar>
                        rows={query.data ?? []}
                        empty="No registrars."
                        columns={[
                            { header: 'Registrar', cell: (r) => <span className="font-medium">{r.name}</span> },
                            { header: 'Reseller ID', cell: (r) => r.reseller_id ?? '-' },
                            { header: 'Currency', cell: (r) => r.currency },
                            { header: 'Wallet Balance', cell: (r) => <button type="button" className="table-action-link text-right tabular-nums" onClick={() => setWallet(r)}>{inCurrency(r.wallet.balance, r.currency)}<span className="block text-[11px] text-slate-500">worth {money(r.wallet.balance_bdt)}</span></button>, align: 'right' },
                            {
                                header: 'Last Sync',
                                cell: (r) => r.sync_error
                                    ? <span title={r.sync_error} className="inline-flex max-w-56 items-center gap-1 truncate text-xs text-rose-600"><AlertTriangle size={12} className="shrink-0" /> {r.sync_error}</span>
                                    : <span className="text-xs text-slate-500">{r.last_synced_at ? new Date(r.last_synced_at).toLocaleString() : 'Never'}</span>,
                            },
                            { header: '', cell: (r) => <div className="flex justify-end gap-3"><SyncButton code={r.code} /><Button variant="link" onClick={() => setWallet(r)}><Wallet size={12} /> Wallet</Button><TestButton code={r.code} /><Button variant="link" onClick={() => setEditing(r)}>Edit</Button></div>, align: 'right' },
                        ]}
                    />
                </QueryState>
            </Card>
            {query.data && <DomainProfitReport registrars={query.data} />}
            {editing && <RegistrarForm registrar={editing} onClose={() => setEditing(null)} />}
            {wallet && <WalletModal registrar={wallet} onClose={() => setWallet(null)} />}
        </div>
    );
}
