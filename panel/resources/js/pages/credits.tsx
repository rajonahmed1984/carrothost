import { useMutation, useQuery } from '@tanstack/react-query';
import { Info, Search, Wallet } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, money } from '../api';
import { Button, ErrorNote, Field, Input, QueryState, Select } from '../ui';

type Credits = {
    balance: string;
    currency: string;
    limits: { min_deposit: string; max_deposit: string; max_balance: string };
    gateways: { code: string; name: string }[];
    bank_transfer: boolean;
    history: { id: number; description: string; amount: string; created_at: string; invoice: { id: number; number: string } | null }[];
};

const useCredits = () => useQuery({ queryKey: ['client-credits'], queryFn: async () => (await api.get<Credits>('/client/credits')).data });

function Balance({ data }: { data: Credits }) {
    return (
        <span className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            <Wallet size={15} /> Available Credits: {money(data.balance, data.currency)}
        </span>
    );
}

export function AddFundsPage() {
    const navigate = useNavigate();
    const query = useCredits();
    const [amount, setAmount] = useState('');
    const [picked, setPicked] = useState('');
    const add = useMutation({
        mutationFn: async (gateway: string) => (await api.post<{ invoice_id: number; redirect_url: string | null }>('/client/credits', { amount, gateway })).data,
        // Online gateways go straight to payment; bank transfer opens the invoice with its instructions.
        onSuccess: ({ invoice_id, redirect_url }) => (redirect_url ? window.location.assign(redirect_url) : navigate(`/invoices/${invoice_id}`)),
    });
    const data = query.data;
    const methods = data ? [...data.gateways, ...(data.bank_transfer ? [{ code: 'manual', name: 'Bank Transfer' }] : [])] : [];
    const method = methods.find((m) => m.code === picked) ?? methods[0];
    const limit = (value: string) => money(value, data?.currency);

    return (
        <div className="mx-auto max-w-4xl space-y-4">
            <QueryState query={query}>
                {data && (
                    <>
                        <section className="card overflow-hidden">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
                                <h3 className="text-base font-semibold text-slate-900">Deposit Details</h3>
                                <Balance data={data} />
                            </div>
                            <dl className="divide-y divide-slate-100 text-sm">
                                {[['Minimum Deposit', data.limits.min_deposit], ['Maximum Deposit', data.limits.max_deposit], ['Maximum Balance', data.limits.max_balance]].map(([label, value]) => (
                                    <div key={label} className="grid grid-cols-2 gap-4 px-5 py-3 even:bg-slate-50/70">
                                        <dt className="font-semibold text-slate-700">{label}</dt>
                                        <dd className="text-slate-700 tabular-nums">{limit(value)}</dd>
                                    </div>
                                ))}
                            </dl>
                        </section>

                        <section className="card overflow-hidden">
                            <h3 className="border-b border-slate-200 px-5 py-4 text-base font-semibold text-slate-900">Add Funds</h3>
                            {methods.length === 0 ? (
                                <p className="p-5 text-sm text-slate-600">No payment method is available right now. Please contact support.</p>
                            ) : (
                                <form onSubmit={(e: FormEvent) => { e.preventDefault(); if (method) add.mutate(method.code); }} className="space-y-4 p-5">
                                    <Field label="Amount to Add">
                                        <Input type="number" required min={data.limits.min_deposit} max={data.limits.max_deposit} step="0.01" inputMode="decimal" placeholder={data.limits.min_deposit} value={amount} onChange={(e) => setAmount(e.target.value)} />
                                    </Field>
                                    <Field label="Payment Method">
                                        <Select value={method?.code ?? ''} onChange={(e) => setPicked(e.target.value)}>{methods.map((m) => <option key={m.code} value={m.code}>{m.name}</option>)}</Select>
                                    </Field>
                                    <ErrorNote error={add.error} />
                                    <Button disabled={add.isPending}>{add.isPending ? 'Please wait...' : 'Add Funds'}</Button>
                                </form>
                            )}
                            <ul className="space-y-1 border-t border-amber-200 bg-amber-50 px-5 py-3 text-xs text-amber-900">
                                <li className="flex gap-2"><Info size={14} className="mt-px shrink-0" /> All deposits are non-refundable.</li>
                                <li className="flex gap-2"><Info size={14} className="mt-px shrink-0" /> Credit pays your unpaid invoices automatically, the one due first first.</li>
                                <li className="flex gap-2"><Info size={14} className="mt-px shrink-0" /> Bank transfers are credited once we receive the money. For instant credit, pay online.</li>
                            </ul>
                        </section>
                    </>
                )}
            </QueryState>
        </div>
    );
}

export function CreditHistoryPage() {
    const query = useCredits();
    const [search, setSearch] = useState('');
    const [perPage, setPerPage] = useState(10);
    const [page, setPage] = useState(1);
    const data = query.data;
    const rows = (data?.history ?? []).filter((r) => `${r.id} ${r.description} ${r.amount}`.toLowerCase().includes(search.trim().toLowerCase()));
    const pages = Math.max(1, Math.ceil(rows.length / perPage));
    const current = Math.min(page, pages);
    const shown = rows.slice((current - 1) * perPage, current * perPage);

    return (
        <QueryState query={query}>
            {data && (
                <section className="card overflow-hidden">
                    <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
                        <h3 className="text-base font-semibold text-slate-900">Credit History</h3>
                        <div className="flex flex-wrap items-center gap-2">
                            <Balance data={data} />
                            <Link to="/add-funds" className="inline-flex items-center rounded-xl border border-[var(--accent)] bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]">Add Funds</Link>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                            Show
                            <span className="w-20"><Select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}>{[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}</Select></span>
                            entries
                        </label>
                        <div className="relative w-60">
                            <Input type="search" aria-label="Search credit history" placeholder="Search..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
                            <Search size={15} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-slate-400" />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[40rem] text-left text-sm">
                            <thead className="border-y border-slate-200 bg-slate-50 text-xs text-slate-600">
                                <tr>{['Id #', 'Description', 'Date', 'Amount'].map((h) => <th key={h} className={`px-5 py-3 font-semibold ${h === 'Amount' ? 'text-right' : ''}`}>{h}</th>)}</tr>
                            </thead>
                            <tbody>
                                {shown.length === 0 && <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-500">{data.history.length ? 'Nothing matches your search.' : 'No credit history yet.'}</td></tr>}
                                {shown.map((r) => (
                                    <tr key={r.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70">
                                        <td className="px-5 py-3.5 text-slate-700">{r.id}</td>
                                        <td className="px-5 py-3.5 text-slate-700">{r.invoice ? <Link to={`/invoices/${r.invoice.id}`} className="hover:text-accent hover:underline">{r.description}</Link> : r.description}</td>
                                        <td className="px-5 py-3.5 whitespace-nowrap text-slate-700">{new Date(r.created_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                                        <td className={`px-5 py-3.5 text-right font-semibold whitespace-nowrap tabular-nums ${Number(r.amount) < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>{money(r.amount, data.currency)}</td>
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
            )}
        </QueryState>
    );
}
