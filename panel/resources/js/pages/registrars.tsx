import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ArrowDown, ArrowUp, Check, Globe, Percent, ReceiptText, RefreshCw, Search, Trash2, TrendingUp, Wallet } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { api, errorMessage, money } from '../api';
import { Button, Card, ErrorNote, Field, Input, Modal, QueryState, SecretInput, Select, Status, Table } from '../ui';
import { StatCards } from './client-tabs';
import { monthLabel, Profit, shiftMonth, thisMonth } from './server-profit';
import { alertDialog, ask } from '../dialog';

/* Domain registrars: API settings, the money held at each registrar, and what domains really cost and earn. */

type WalletInfo = {
    code: string; currency: string; deposits: number; sent_bdt: number; fees_bdt: number; credited: number; spent: number; returned: number;
    balance: number; balance_bdt: number; unfunded: number; average_rate: number | null;
};
type Registrar = { code: string; name: string; reseller_id: string | null; has_api_key: boolean; currency: string; last_synced_at: string | null; sync_error: string | null; connection_ok: boolean | null; connection_error: string | null; connection_checked_at: string | null; wallet: WalletInfo;
    api_balance: string | null; api_balance_bdt: number | null; api_balance_at: string | null };
/** The account history as the registrar keeps it: receipt = money added, debit = charge, credit = refund. */
type RegistrarTxn = { id: string; type: 'receipt' | 'debit' | 'credit'; at: string; description: string; amount: string };
type TxnPage = { page: number; pages: number; total: number; currency: string; balance: string | null; balance_bdt: number | null; balance_at: string | null; rows: RegistrarTxn[] };
type Deposit = { id: number; paid_on: string; method: string; amount_bdt: string; fee_bdt: string; credited: string; reference: string | null; note: string | null; rate: number };
type Charge = {
    id: number; type: 'debit' | 'credit'; charged_at: string; description: string | null; amount: string; action: string; source: 'sync' | 'manual';
    domain_id: number | null; domain: { id: number; name: string; client_id: number } | null; cost_bdt: number; unfunded: boolean;
};
type Ledger = { wallet: WalletInfo; deposits: Deposit[]; charges: Charge[] };
type Cell = { sales: number; cost: number; profit: number; estimated?: number };
type DomainCost = { domain_id: number; domain: string; registrar: string; client_id: number | null; sales: number; cost: number; estimated: number; profit: number; last_paid: string; cost_source: 'actual' | 'estimated' | 'mixed' | 'none' };
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
        unmatched: { id: number; registrar_code: string; description: string | null; amount: string; action: string; charged_at: string; cost_bdt: number }[];
    };
    domains: DomainCost[];
    unpriced: { registrar: string; tld: string; action: string; reason: 'no_price' | 'no_rate' }[];
};

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
                <Field label="API key" hint={registrar.has_api_key ? 'Saved. Press the eye to see it, or type a new one to replace it.' : 'Stored encrypted'}>
                    <SecretInput value={apiKey} onChange={setApiKey} saved={!!registrar.has_api_key} reveal={async () => (await api.post<{ value: string }>(`/secrets/registrars/${registrar.code}`)).data} />
                </Field>
                <Field label="Account currency" hint="What the registrar bills and holds your balance in">
                    <Select value={currency} onChange={(e) => setCurrency(e.target.value)}><option value="BDT">BDT</option><option value="USD">USD</option></Select>
                </Field>
                {currency !== 'BDT' && <p className="text-xs text-slate-500">The BDT rate for {currency} is set in <Link className="table-action-link" to="/admin/settings?tab=currencies">Settings &gt; Currencies</Link>.</p>}
                <ErrorNote error={save.error} />
                <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button disabled={save.isPending}>Save registrar</Button></div>
            </form>
        </Modal>
    );
}

const testRegistrar = async (code: string) => (await api.post<{ ok: boolean; message: string }>(`/registrars/${code}/test`)).data;

/** A saved result older than this is re-checked quietly when the page opens. */
const RECHECK_AFTER_MS = 10 * 60 * 1000;

function ConnectionStatus({ registrar, checking }: { registrar: Registrar; checking: boolean }) {
    if (checking) return <Status value="checking" />;
    if (!registrar.has_api_key) return <span title="Save the reseller ID and API key first."><Status value="not_connected" /></span>;
    if (registrar.connection_ok === null) return <Status value="not_checked" />;

    const when = registrar.connection_checked_at ? `Checked ${new Date(registrar.connection_checked_at).toLocaleString()}` : '';
    const title = registrar.connection_ok ? when : [registrar.connection_error, when].filter(Boolean).join('\n\n');

    return <span title={title} className="cursor-help"><Status value={registrar.connection_ok ? 'connected' : 'not_connected'} /></span>;
}

function TestButton({ code }: { code: string }) {
    const qc = useQueryClient();
    const test = useMutation({
        mutationFn: () => testRegistrar(code),
        onSuccess: (r) => alertDialog(r.message),
        onError: (e) => alertDialog(errorMessage(e)),
        onSettled: () => qc.invalidateQueries({ queryKey: ['registrars'] }),
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

/* ---------- Cost of each domain ---------- */

const SOURCE: Record<DomainCost['cost_source'], [string, string]> = {
    actual: ['Charged', 'bg-emerald-50 text-emerald-700'],
    estimated: ['TLD price', 'bg-sky-50 text-sky-700'],
    mixed: ['Charged + TLD price', 'bg-sky-50 text-sky-700'],
    none: ['No cost', 'bg-slate-100 text-slate-600'],
};

function DomainCosts({ rows, nameOf, domainUrl }: { rows: DomainCost[]; nameOf: (code: string) => string; domainUrl: (clientId: number | null, id: number) => string }) {
    const [search, setSearch] = useState('');
    const [limit, setLimit] = useState(25);
    const q = search.trim().toLowerCase();
    const shown = q ? rows.filter((d) => d.domain.toLowerCase().includes(q)) : rows;

    return (
        <section className="card overflow-hidden">
            <header className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-4 py-3">
                <h3 className="mr-auto flex items-center gap-2 font-semibold text-slate-900"><Globe size={16} className="text-[var(--accent)]" /> Cost of Each Domain</h3>
                <label className="relative w-full sm:w-56">
                    <span className="sr-only">Search domains</span>
                    <Search size={14} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
                    <input className="ui-input h-9 w-full pl-8" placeholder="Search domain" value={search} onChange={(e) => setSearch(e.target.value)} />
                </label>
            </header>
            {shown.length === 0 ? <p className="px-4 py-6 text-center text-sm text-slate-500">No domains in this range.</p> : (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[44rem] text-sm">
                        <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase">
                            <tr><th className="px-4 py-2">Domain</th><th className="px-4 py-2">Registrar</th><th className="px-4 py-2">Last paid</th><th className="px-4 py-2 text-right">Sales</th><th className="px-4 py-2 text-right">Cost</th><th className="px-4 py-2 text-right">Profit</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {shown.slice(0, limit).map((d) => (
                                <tr key={d.domain_id} className="hover:bg-slate-50/60">
                                    <td className="px-4 py-2"><Link className="table-action-link font-medium" to={domainUrl(d.client_id, d.domain_id)}>{d.domain}</Link></td>
                                    <td className="px-4 py-2 text-slate-600">{nameOf(d.registrar)}</td>
                                    <td className="px-4 py-2 text-slate-500 tabular-nums">{d.last_paid || '-'}</td>
                                    <td className="px-4 py-2 text-right tabular-nums">{money(d.sales)}</td>
                                    <td className="px-4 py-2 text-right tabular-nums">
                                        {money(d.cost)}
                                        <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold ${SOURCE[d.cost_source][1]}`}>{SOURCE[d.cost_source][0]}</span>
                                    </td>
                                    <td className="px-4 py-2 text-right"><Profit value={String(d.profit)} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {shown.length > limit && (
                <div className="border-t border-slate-200 px-4 py-2 text-center">
                    <Button variant="link" onClick={() => setLimit(limit + 50)}>Show more ({shown.length - limit} left)</Button>
                </div>
            )}
        </section>
    );
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

/** Links a charge the sync could not match to its domain, from the profit report's check list. */
function MatchCharge({ code, chargeId, action }: { code: string; chargeId: number; action: string }) {
    const qc = useQueryClient();
    const [open, setOpen] = useState(false);
    const save = useMutation({
        mutationFn: async (d: { id: number; name: string }) => (await api.put(`/registrars/${code}/charges/${chargeId}`, { domain_id: d.id, action })).data,
        onSuccess: () => { setOpen(false); refreshKeys(qc, code); },
        onError: (e) => alertDialog(errorMessage(e)),
    });

    if (!open) return <Button variant="link" onClick={() => setOpen(true)}>Match domain</Button>;

    return <div className="w-56"><DomainPicker value={null} onChange={(d) => d && save.mutate(d)} /></div>;
}

const txnStyle: Record<RegistrarTxn['type'], [string, string, string]> = {
    receipt: ['Payment', 'bg-emerald-50 text-emerald-700', 'text-emerald-700'],
    debit: ['Charge', 'bg-rose-50 text-rose-700', 'text-slate-900'],
    credit: ['Refund', 'bg-sky-50 text-sky-700', 'text-sky-700'],
};

/** Payments into the account, charges and refunds, read live from the registrar, newest first. */
function RegistrarHistory({ registrar }: { registrar: Registrar }) {
    const qc = useQueryClient();
    const [page, setPage] = useState(1);
    const history = useQuery({
        queryKey: ['/registrars/transactions', registrar.code, page],
        queryFn: async () => (await api.get<TxnPage>(`/registrars/${registrar.code}/transactions`, { params: { page } })).data,
        placeholderData: keepPreviousData,
        retry: false,
    });
    // Opening the history also re-reads the balance, so the list behind the modal catches up.
    useEffect(() => { if (history.data) qc.invalidateQueries({ queryKey: ['registrars'] }); }, [history.data?.balance]);
    const cur = registrar.currency;

    if (history.isError) return <ErrorNote error={history.error} />;
    if (!history.data) return <p className="py-8 text-center text-sm text-slate-500">Reading the history from {registrar.name}...</p>;
    const d = history.data;

    return (
        <div className="space-y-3">
            {d.rows.length === 0 ? <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">The registrar has no transactions on this account yet.</p> : (
                <div className="overflow-hidden rounded-xl border border-slate-200">
                    <ul className="divide-y divide-slate-100 md:hidden">
                        {d.rows.map((t) => (
                            <li key={t.id} className="flex items-start justify-between gap-3 px-3 py-2.5 text-sm">
                                <div className="min-w-0">
                                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase ${txnStyle[t.type][1]}`}>{txnStyle[t.type][0]}</span>
                                    <div className="mt-1 text-slate-700">{t.description || '-'}</div>
                                    <div className="text-[11px] text-slate-500">{new Date(t.at).toLocaleString()}</div>
                                </div>
                                <span className={`shrink-0 font-semibold tabular-nums ${txnStyle[t.type][2]}`}>{t.type === 'debit' ? '-' : '+'}{inCurrency(t.amount, cur)}</span>
                            </li>
                        ))}
                    </ul>
                    <table className="hidden w-full text-sm md:table">
                        <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500"><tr><th className="px-3 py-2">Date</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">Description</th><th className="px-3 py-2 text-right">Amount</th></tr></thead>
                        <tbody className="divide-y divide-slate-100">
                            {d.rows.map((t) => (
                                <tr key={t.id}>
                                    <td className="px-3 py-2 whitespace-nowrap tabular-nums">{new Date(t.at).toLocaleDateString('en-GB')}<span className="block text-[11px] text-slate-500">{new Date(t.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></td>
                                    <td className="px-3 py-2"><span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${txnStyle[t.type][1]}`}>{txnStyle[t.type][0]}</span></td>
                                    <td className="px-3 py-2 text-slate-700">{t.description || '-'}</td>
                                    <td className={`px-3 py-2 text-right font-semibold whitespace-nowrap tabular-nums ${txnStyle[t.type][2]}`}>{t.type === 'debit' ? '-' : '+'}{inCurrency(t.amount, cur)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <span>{d.total} transaction(s) at {registrar.name}{history.isFetching ? ' · loading...' : ''}</span>
                {d.pages > 1 && (
                    <span className="flex items-center gap-2">
                        <Button type="button" variant="ghost" disabled={page <= 1 || history.isFetching} onClick={() => setPage(page - 1)}>Newer</Button>
                        <span>Page {d.page} of {d.pages}</span>
                        <Button type="button" variant="ghost" disabled={page >= d.pages || history.isFetching} onClick={() => setPage(page + 1)}>Older</Button>
                    </span>
                )}
            </div>
        </div>
    );
}

export function WalletModal({ registrar, onClose }: { registrar: Registrar; onClose: () => void }) {
    const qc = useQueryClient();
    const fresh = qc.getQueryData<Registrar[]>(['registrars'])?.find((r) => r.code === registrar.code) ?? registrar;
    const cur = registrar.currency;

    return (
        <Modal wide title={`${registrar.name} wallet`} onClose={onClose}>
            <div className="space-y-4">
                <div className="grid gap-2 sm:grid-cols-2">
                    <div className="rounded-xl bg-emerald-50 px-3 py-2.5 ring-1 ring-emerald-100">
                        <div className="text-xs text-emerald-800">Available balance</div>
                        <div className="text-lg font-bold text-emerald-900 tabular-nums">{fresh.api_balance === null ? '-' : inCurrency(fresh.api_balance, cur)}</div>
                        <div className="text-[11px] text-emerald-800/80">{fresh.api_balance_bdt !== null && cur !== 'BDT' ? `worth ${money(fresh.api_balance_bdt)} · ` : ''}{fresh.api_balance_at ? `read ${new Date(fresh.api_balance_at).toLocaleString()}` : 'not read yet'}</div>
                    </div>
                    <div className="rounded-xl bg-slate-50 px-3 py-2.5"><div className="text-xs text-slate-500">Spent on domains</div><div className="font-semibold text-slate-900 tabular-nums">{inCurrency(fresh.wallet.spent, cur)}</div><div className="text-[11px] text-slate-500">{fresh.last_synced_at ? `synced charges · last sync ${new Date(fresh.last_synced_at).toLocaleDateString('en-GB')}` : 'not synced yet'}</div></div>
                </div>

                <h3 className="border-b border-slate-200 pb-2 text-sm font-semibold text-slate-800">Transactions</h3>
                <RegistrarHistory registrar={registrar} />
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
    const estimated = r?.grand.estimated ?? 0;
    const nameOf = (c: string) => registrars.find((x) => x.code === c)?.name ?? c;
    const noRate = r ? [...new Set(r.unpriced.filter((u) => u.reason === 'no_rate').map((u) => nameOf(u.registrar)))] : [];
    const noPrice = r ? [...new Set(r.unpriced.filter((u) => u.reason === 'no_price').map((u) => `${u.tld} at ${nameOf(u.registrar)}`))] : [];

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

            {estimated > 0 && (
                <p className="flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-sky-900">
                    <ReceiptText size={16} className="mt-0.5 shrink-0" />
                    <span>{money(estimated)} of the cost comes from the registrars' TLD cost prices (register, renew or transfer, times years){untracked.length > 0 && <>, as no charges are recorded yet for {untracked.map((x) => x.name).join(' and ')}</>}. A synced or entered charge replaces the estimate for that domain.</span>
                </p>
            )}
            {(noRate.length > 0 || noPrice.length > 0) && (
                <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    <span>
                        Some sales have no cost yet.
                        {noRate.length > 0 && <> {noRate.join(' and ')}: set BDT per 1 USD in <Link className="font-semibold underline" to="/admin/settings?tab=currencies">Settings &gt; Currencies</Link>.</>}
                        {noPrice.length > 0 && <> No TLD cost price for {noPrice.join(', ')}: press Sync to fetch the prices.</>}
                    </span>
                </p>
            )}

            <StatCards items={[
                { label: `Domain sales, ${span} months`, value: r ? money(r.grand.sales) : '-', icon: <ArrowDown size={20} />, tone: 'bg-emerald-100 text-emerald-700' },
                { label: estimated > 0 ? 'Registrar cost (incl. TLD price)' : 'Registrar cost', value: r ? money(r.grand.cost) : '-', icon: <ReceiptText size={20} />, tone: 'bg-amber-100 text-amber-700' },
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
                    {r && <p className="border-t border-slate-200 px-4 py-2 text-xs text-slate-500">Cost is what registrations and renewals took from your registrar balance, at what that money cost you in BDT; where no charge is recorded, the TLD cost price times years. Deposited in this range: {money(r.deposited.sent_bdt)} + {money(r.deposited.fees_bdt)} fees (money moved, not cost).</p>}
                </section>

                <section className="card overflow-hidden">
                    <header className="border-b border-slate-200 px-4 py-3"><h3 className="font-semibold text-slate-900">By TLD</h3></header>
                    {r && (r.tlds.length === 0 ? <p className="px-4 py-6 text-center text-sm text-slate-500">No domain sales in this range.</p> : (
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500"><tr><th className="px-4 py-2">TLD</th><th className="px-4 py-2 text-right">Sales</th><th className="px-4 py-2 text-right">Cost</th><th className="px-4 py-2 text-right">Profit</th></tr></thead>
                            <tbody className="divide-y divide-slate-100">
                                {r.tlds.map((t) => (
                                    <tr key={t.tld}><td className="px-4 py-2 font-medium text-slate-900">{t.tld}</td><td className="px-4 py-2 text-right tabular-nums">{money(t.sales)}</td><td className="px-4 py-2 text-right text-slate-600 tabular-nums">{money(t.cost)}</td><td className="px-4 py-2 text-right"><Profit value={String(t.profit)} /></td></tr>
                                ))}
                            </tbody>
                        </table>
                    ))}
                </section>
            </div>

            {r && <DomainCosts rows={r.domains} nameOf={nameOf} domainUrl={domainUrl} />}

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
                            hint="Match each to its domain so its cost counts against that domain."
                            render={(x) => <><span className="min-w-0 truncate text-slate-700">{x.description || 'Charge'}</span><span className="text-xs text-slate-500">{registrars.find((y) => y.code === x.registrar_code)?.name} · {x.charged_at} · {money(x.cost_bdt)}</span><MatchCharge code={x.registrar_code} chargeId={x.id} action={x.action} /></>}
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
    const qc = useQueryClient();
    const [checking, setChecking] = useState<string[]>([]);
    const checked = useRef(new Set<string>());

    // Check each registrar once per visit when it was never tested or the last test is stale.
    useEffect(() => {
        const due = (query.data ?? []).filter((r) => r.has_api_key && !checked.current.has(r.code)
            && (!r.connection_checked_at || Date.now() - new Date(r.connection_checked_at).getTime() > RECHECK_AFTER_MS));

        if (!due.length) return;
        due.forEach((r) => checked.current.add(r.code));
        setChecking((codes) => [...codes, ...due.map((r) => r.code)]);
        Promise.allSettled(due.map((r) => testRegistrar(r.code))).finally(() => {
            setChecking((codes) => codes.filter((c) => !due.some((r) => r.code === c)));
            qc.invalidateQueries({ queryKey: ['registrars'] });
        });
    }, [query.data]);

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
                            { header: 'Connection', cell: (r) => <ConnectionStatus registrar={r} checking={checking.includes(r.code)} /> },
                            { header: 'Wallet Balance', cell: (r) => (
                                <button type="button" className="table-action-link text-right tabular-nums" onClick={() => setWallet(r)} title={r.api_balance_at ? `Available at the registrar, read ${new Date(r.api_balance_at).toLocaleString()}` : 'Not read from the registrar yet: sync to read it'}>
                                    {r.api_balance === null ? '-' : inCurrency(r.api_balance, r.currency)}
                                    <span className="block text-[11px] text-slate-500">{r.api_balance === null ? 'Sync to read the balance' : r.currency !== 'BDT' && r.api_balance_bdt !== null ? `worth ${money(r.api_balance_bdt)}` : 'available'}</span>
                                </button>
                            ), align: 'right' },
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
