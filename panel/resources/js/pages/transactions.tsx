import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, ArrowUpDown, ReceiptText, Search, Wallet, X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { api, errorMessage, money, type Page } from '../api';
import { Button, Modal, QueryState } from '../ui';
import type { TransactionRow } from './client';
import { day, StatCards, TransactionForm } from './client-tabs';
import { alertDialog, ask } from '../dialog';

type Row = TransactionRow & { invoice: { id: number; number: string; client_id: number; client: { id: number; name: string; company: string | null } | null } };
type Result = Page<Row> & { totals: { in: string; fees: string; out: string; balance: string }; gateways: { code: string; name: string }[] };
type Sort = 'date' | 'gateway' | 'amount' | 'fee';

const directions = [{ key: '', label: 'All' }, { key: 'in', label: 'Money In' }, { key: 'out', label: 'Refunds' }];

function SortHeader({ label, col, sort, dir, onSort, right }: { label: string; col: Sort; sort: Sort; dir: 'asc' | 'desc'; onSort: (c: Sort) => void; right?: boolean }) {
    const active = sort === col;

    return (
        <th className={`px-4 py-3 ${right ? 'text-right' : 'text-left'}`} aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
            <button type="button" onClick={() => onSort(col)} className={`inline-flex cursor-pointer items-center gap-1 uppercase ${active ? 'text-slate-900' : ''}`}>
                {label}
                {active ? (dir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} className="opacity-40" />}
            </button>
        </th>
    );
}

export function TransactionsPage() {
    const qc = useQueryClient();
    const [search, setSearch] = useState('');
    const [term, setTerm] = useState('');
    const [gateway, setGateway] = useState('');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [direction, setDirection] = useState('');
    const [sort, setSort] = useState<Sort>('date');
    const [dir, setDir] = useState<'asc' | 'desc'>('desc');
    const [perPage, setPerPage] = useState(25);
    const [page, setPage] = useState(1);
    const [editing, setEditing] = useState<Row | null>(null);
    const params = { q: term || undefined, gateway: gateway || undefined, from: from || undefined, to: to || undefined, direction: direction || undefined, sort, dir, per_page: perPage };

    useEffect(() => {
        const timer = window.setTimeout(() => setTerm(search.trim()), 300);

        return () => window.clearTimeout(timer);
    }, [search]);
    useEffect(() => setPage(1), [term, gateway, from, to, direction, sort, dir, perPage]);

    const query = useQuery({
        queryKey: ['/transactions', params, page],
        queryFn: async () => (await api.get<Result>('/transactions', { params: { ...params, page } })).data,
        placeholderData: keepPreviousData,
    });
    const refresh = () => {
        qc.invalidateQueries({ queryKey: ['/transactions'] });
        qc.invalidateQueries({ queryKey: ['/clients'] });
        qc.invalidateQueries({ queryKey: ['/invoices'] });
    };
    const remove = useMutation({ mutationFn: (id: number) => api.delete(`/transactions/${id}`), onSuccess: refresh, onError: (e) => alertDialog(errorMessage(e)) });
    const onSort = (col: Sort) => {
        if (col === sort) setDir(dir === 'asc' ? 'desc' : 'asc');
        else { setSort(col); setDir(col === 'gateway' ? 'asc' : 'desc'); }
    };
    const filtered = !!(term || gateway || from || to || direction);
    const clear = () => { setSearch(''); setTerm(''); setGateway(''); setFrom(''); setTo(''); setDirection(''); };
    const t = query.data?.totals;
    const clientUrl = (r: Row, tab: string, id: number) => `/admin/clients/${r.invoice.client_id}?tab=${tab}&view=${id}`;
    const cell = (children: ReactNode, className = '') => <td className={`px-4 py-3 ${className}`}>{children}</td>;

    return (
        <div className="space-y-4">
            <StatCards items={[
                { label: filtered ? 'Total In (filtered)' : 'Total In', value: t ? money(t.in) : '-', icon: <ArrowDown size={20} />, tone: 'bg-emerald-100 text-emerald-700' },
                { label: 'Total Fees', value: t ? money(t.fees) : '-', icon: <ReceiptText size={20} />, tone: 'bg-amber-100 text-amber-700' },
                { label: 'Total Out', value: t ? money(t.out) : '-', icon: <ArrowUp size={20} />, tone: 'bg-rose-100 text-rose-600' },
                { label: 'Balance', value: t ? money(t.balance) : '-', icon: <Wallet size={20} />, tone: 'bg-[var(--accent-soft)] text-accent' },
            ]} />

            <section className="card overflow-hidden">
                <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-4 py-3">
                    <div className="relative w-full sm:w-72">
                        <input type="search" aria-label="Search transactions" className="ui-input pr-9" placeholder="Client, transaction ID or invoice" value={search} onChange={(e) => setSearch(e.target.value)} />
                        <Search size={15} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-slate-400" />
                    </div>
                    <label className="sr-only" htmlFor="tx-gateway">Payment method</label>
                    <select id="tx-gateway" className="ui-input h-10 w-full sm:w-44" value={gateway} onChange={(e) => setGateway(e.target.value)}>
                        <option value="">All methods</option>
                        {query.data?.gateways.map((g) => <option key={g.code} value={g.code}>{g.name}</option>)}
                    </select>
                    <div className="flex w-full items-center gap-2 sm:w-auto">
                        <label className="sr-only" htmlFor="tx-from">From date</label>
                        <input id="tx-from" type="date" className="ui-input h-10 min-w-0 flex-1 sm:w-40" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
                        <span className="text-xs text-slate-400">to</span>
                        <label className="sr-only" htmlFor="tx-to">To date</label>
                        <input id="tx-to" type="date" className="ui-input h-10 min-w-0 flex-1 sm:w-40" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
                    </div>
                    <div className="flex rounded-xl border border-slate-200 bg-white p-0.5" role="group" aria-label="Direction">
                        {directions.map((d) => (
                            <button key={d.key} type="button" aria-pressed={direction === d.key} onClick={() => setDirection(d.key)} className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition ${direction === d.key ? 'bg-[var(--accent)] text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                                {d.label}
                            </button>
                        ))}
                    </div>
                    {filtered && <Button variant="link" onClick={clear}><X size={13} /> Clear</Button>}
                    <span className="ml-auto text-xs text-slate-500">{query.data ? `Total transactions: ${query.data.total}` : ''}</span>
                </div>

                <QueryState query={query}>
                    {query.data && (query.data.data.length === 0 ? (
                        <p className="px-4 py-10 text-center text-sm text-slate-500">{filtered ? 'No transactions match these filters.' : 'No transactions yet.'}</p>
                    ) : (
                        <>
                            {/* Table on wide screens */}
                            <div className={`hidden overflow-x-auto md:block ${query.isFetching ? 'opacity-60' : ''}`}>
                                <table className="w-full text-sm">
                                    <thead className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                                        <tr>
                                            <SortHeader label="Date" col="date" sort={sort} dir={dir} onSort={onSort} />
                                            <th className="px-4 py-3 text-left uppercase">Client</th>
                                            <SortHeader label="Payment Method" col="gateway" sort={sort} dir={dir} onSort={onSort} />
                                            <th className="px-4 py-3 text-left uppercase">Description</th>
                                            <SortHeader label="Amount In" col="amount" sort={sort} dir={dir} onSort={onSort} right />
                                            <SortHeader label="Fees" col="fee" sort={sort} dir={dir} onSort={onSort} right />
                                            <th className="px-4 py-3 text-right uppercase">Amount Out</th>
                                            <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {query.data.data.map((r) => {
                                            const amount = Number(r.amount);

                                            return (
                                                <tr key={r.id} className="hover:bg-slate-50/60">
                                                    {cell(<Link className="table-action-link tabular-nums" to={clientUrl(r, 'transactions', r.id)}>{day(r.created_at)}</Link>, 'whitespace-nowrap')}
                                                    {cell(r.invoice.client ? <Link className="table-action-link font-medium" to={`/admin/clients/${r.invoice.client.id}`}>{r.invoice.client.name}</Link> : '-', 'max-w-48 truncate')}
                                                    {cell(r.gateway_name)}
                                                    {cell(<>{amount < 0 ? 'Refund for' : 'Invoice Payment'} <Link className="table-action-link" to={clientUrl(r, 'invoices', r.invoice.id)}>#{r.invoice.number}</Link><span className="block font-mono text-[11px] break-all text-slate-400">{r.transaction_id}</span></>)}
                                                    {cell(amount > 0 ? <span className="font-semibold text-emerald-700">{money(r.amount, r.currency)}</span> : '-', 'text-right whitespace-nowrap tabular-nums')}
                                                    {cell(Number(r.fee) > 0 ? money(r.fee, r.currency) : '-', 'text-right whitespace-nowrap tabular-nums')}
                                                    {cell(amount < 0 ? <span className="font-semibold text-rose-600">{money(-amount, r.currency)}</span> : '-', 'text-right whitespace-nowrap tabular-nums')}
                                                    {cell(
                                                        <span className="inline-flex items-center gap-3">
                                                            <Link to={clientUrl(r, 'transactions', r.id)} className="table-action-link">View</Link>
                                                            <Button variant="link" onClick={() => setEditing(r)}>Edit</Button>
                                                            <Button variant="link-danger" disabled={remove.isPending} onClick={() => ask(`Delete this ${money(r.amount, r.currency)} transaction? Invoice #${r.invoice.number} goes back to unpaid if it is no longer covered.`, () => remove.mutate(r.id))}>Delete</Button>
                                                        </span>,
                                                        'text-right whitespace-nowrap',
                                                    )}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Cards on phones */}
                            <ul className="divide-y divide-slate-100 md:hidden">
                                {query.data.data.map((r) => {
                                    const amount = Number(r.amount);

                                    return (
                                        <li key={r.id} className="space-y-1.5 px-4 py-3 text-sm">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <Link className="table-action-link font-medium" to={clientUrl(r, 'transactions', r.id)}>{r.invoice.client?.name ?? 'Transaction'}</Link>
                                                    <div className="text-xs text-slate-500">{day(r.created_at)} · {r.gateway_name} · <Link className="table-action-link" to={clientUrl(r, 'invoices', r.invoice.id)}>#{r.invoice.number}</Link></div>
                                                </div>
                                                <span className={`font-semibold whitespace-nowrap tabular-nums ${amount < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>{money(r.amount, r.currency)}</span>
                                            </div>
                                            <div className="font-mono text-[11px] break-all text-slate-400">{r.transaction_id}</div>
                                            <div className="flex items-center justify-between gap-3">
                                                <span className="text-xs text-slate-500">{Number(r.fee) > 0 ? `Fees ${money(r.fee, r.currency)}` : ''}</span>
                                                <span className="inline-flex gap-3">
                                                    <Button variant="link" onClick={() => setEditing(r)}>Edit</Button>
                                                    <Button variant="link-danger" disabled={remove.isPending} onClick={() => ask(`Delete this ${money(r.amount, r.currency)} transaction?`, () => remove.mutate(r.id))}>Delete</Button>
                                                </span>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>

                            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
                                <span className="flex items-center gap-2">
                                    {query.data.from ?? 0}-{query.data.to ?? 0} of {query.data.total}
                                    <label className="sr-only" htmlFor="tx-per-page">Rows per page</label>
                                    <select id="tx-per-page" className="ui-input h-8 w-auto py-0 text-xs" value={perPage} onChange={(e) => setPerPage(Number(e.target.value))}>
                                        {[25, 50, 100].map((n) => <option key={n} value={n}>{n} per page</option>)}
                                    </select>
                                </span>
                                {query.data.last_page > 1 && (
                                    <span className="flex items-center gap-2">
                                        <span>Page {query.data.current_page} of {query.data.last_page}</span>
                                        <Button variant="ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
                                        <Button variant="ghost" disabled={page >= query.data.last_page} onClick={() => setPage(page + 1)}>Next</Button>
                                    </span>
                                )}
                            </footer>
                        </>
                    ))}
                </QueryState>
            </section>

            {editing && (
                <Modal title={`Edit transaction for invoice #${editing.invoice.number}`} onClose={() => setEditing(null)}>
                    <p className="mb-1 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">{editing.invoice.client?.name} · {editing.gateway_name}: <strong className="text-slate-900">{money(editing.amount, editing.currency)}</strong></p>
                    <div className="-mx-4"><TransactionForm row={editing} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); refresh(); }} /></div>
                </Modal>
            )}
        </div>
    );
}

