import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, CircleAlert, Percent, ReceiptText, Server, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, money } from '../api';
import { QueryState, Status } from '../ui';
import { StatCards } from './client-tabs';
import { margin, monthLabel, Profit, shiftMonth, thisMonth, type Cell } from './server-profit';

type Vps = {
    id: number; name: string; status: string; product: { id: number; name: string }; client: { id: number; name: string } | null;
    monthly_cost: { amount: string; currency: string; source: 'service' | 'product' } | null; months: Record<string, Cell>; totals: Cell;
};
type Report = {
    months: string[]; vps: Vps[]; totals: Record<string, Cell>; grand: Cell; missing_cost: number;
    products: { id: number; name: string; cost_amount: string | null; cost_currency: string | null }[];
};

const ranges = [{ months: 1, label: 'This month' }, { months: 3, label: '3 months' }, { months: 6, label: '6 months' }, { months: 12, label: '12 months' }];

/** Admin > Products/Services > VPS Profit: each VPS's monthly cost against what its customer paid. */
export function VpsProfitPage() {
    const [to, setTo] = useState(thisMonth());
    // Opens on the last 12 months, so a yearly VPS shows a full year of sales against cost.
    const [span, setSpan] = useState(12);
    const [productId, setProductId] = useState('');
    const [spread, setSpread] = useState(true);
    const [month, setMonth] = useState<string | null>(null);
    const from = shiftMonth(to, -(span - 1));
    const query = useQuery({
        queryKey: ['/vps/profit', from, to, spread, productId],
        queryFn: async () => (await api.get<Report>('/vps/profit', { params: { from, to, spread: spread ? 1 : 0, product_id: productId || undefined } })).data,
        placeholderData: keepPreviousData,
    });
    const r = query.data;
    const m = r ? margin(r.grand) : null;
    // One month picked shows that month per VPS; otherwise the whole range.
    const cellOf = (v: Vps) => (month ? v.months[month] : v.totals);
    const rows = r ? [...r.vps].sort((a, b) => Number(cellOf(b).profit) - Number(cellOf(a).profit)) : [];

    return (
        <div className="space-y-4">
            <div className="card flex flex-wrap items-center gap-3 px-4 py-3">
                <h2 className="mr-auto flex items-center gap-2 font-semibold text-slate-900"><TrendingUp size={17} className="text-[var(--accent)]" /> VPS Profit</h2>
                <select aria-label="Product" className="ui-input h-9 w-full sm:w-56" value={productId} onChange={(e) => setProductId(e.target.value)}>
                    <option value="">All VPS products</option>
                    {r?.products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <div className="flex rounded-xl border border-slate-200 bg-white p-0.5" role="group" aria-label="Range">
                    {ranges.map((x) => (
                        <button key={x.months} type="button" aria-pressed={span === x.months} onClick={() => { setSpan(x.months); setMonth(null); }} className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold ${span === x.months ? 'bg-[var(--accent)] text-white' : 'text-slate-600 hover:bg-slate-50'}`}>{x.label}</button>
                    ))}
                </div>
                <label className="flex items-center gap-2 text-xs text-slate-600">Up to <input type="month" className="ui-input h-9 w-auto" value={to} max={thisMonth()} onChange={(e) => { if (e.target.value) { setTo(e.target.value); setMonth(null); } }} /></label>
                <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600" title="A yearly payment counts as 1/12 in each of its 12 months, instead of all in the month it was paid.">
                    <input type="checkbox" checked={spread} onChange={(e) => setSpread(e.target.checked)} /> Spread long-cycle payments
                </label>
            </div>

            {r && r.missing_cost > 0 && (
                <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    <CircleAlert size={16} className="mt-0.5 shrink-0" />
                    {r.missing_cost} running VPS{r.missing_cost > 1 ? 'es have' : ' has'} no cost set, so {r.missing_cost > 1 ? 'they count' : 'it counts'} as pure profit. Set a monthly cost on the product (Pricing tab) or on the VPS's service page.
                </p>
            )}

            <StatCards items={[
                { label: span === 1 ? `Sales, ${monthLabel(to)}` : `Sales, ${span} months`, value: r ? money(r.grand.sales) : '-', icon: <ArrowDown size={20} />, tone: 'bg-emerald-100 text-emerald-700' },
                { label: 'VPS Cost', value: r ? money(r.grand.cost) : '-', icon: <ReceiptText size={20} />, tone: 'bg-amber-100 text-amber-700' },
                { label: 'Profit', value: r ? <Profit value={r.grand.profit} /> : '-', icon: <ArrowUp size={20} />, tone: 'bg-[var(--accent-soft)] text-accent' },
                { label: 'Margin', value: m === null ? '-' : `${m.toFixed(1)}%`, icon: <Percent size={20} />, tone: 'bg-sky-100 text-sky-700' },
            ]} />

            <QueryState query={query}>
                {r && (
                    <div className={`grid items-start gap-4 xl:grid-cols-[22rem_1fr] ${query.isFetching ? 'opacity-60' : ''}`}>
                        <section className="card overflow-hidden">
                            <header className="border-b border-slate-200 px-4 py-3"><h3 className="font-semibold text-slate-900">By Month</h3><p className="text-xs text-slate-500">Click a month to see each VPS in it.</p></header>
                            <ul className="divide-y divide-slate-100">
                                {[...r.months].reverse().map((ym) => {
                                    const c = r.totals[ym];

                                    return (
                                        <li key={ym}>
                                            <button type="button" aria-pressed={month === ym} onClick={() => setMonth(month === ym ? null : ym)} className={`flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left text-sm hover:bg-slate-50 ${month === ym ? 'bg-[var(--accent-soft)]' : ''}`}>
                                                <span>
                                                    <span className="block font-medium text-slate-900">{monthLabel(ym)}{ym === thisMonth() && <span className="ml-2 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700">So far</span>}</span>
                                                    <span className="block text-xs text-slate-500">Sales {money(c.sales)} · Cost {money(c.cost)}</span>
                                                </span>
                                                <Profit value={c.profit} />
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </section>

                        <section className="card overflow-hidden">
                            <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
                                <h3 className="font-semibold text-slate-900">By VPS, {month ? monthLabel(month) : span === 1 ? monthLabel(to) : `${monthLabel(from)} to ${monthLabel(to)}`}</h3>
                                {month && <button type="button" className="table-action-link text-xs" onClick={() => setMonth(null)}>Show the whole range</button>}
                            </header>
                            {rows.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">No VPS in this period. Products of type VPS show here.</p> : (
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[46rem] text-sm">
                                        <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase">
                                            <tr><th className="px-4 py-2.5">VPS</th><th className="px-4 py-2.5">Monthly cost</th><th className="px-4 py-2.5 text-right">Sales</th><th className="px-4 py-2.5 text-right">Cost</th><th className="px-4 py-2.5 text-right">Profit</th><th className="px-4 py-2.5 text-right">Margin</th></tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {rows.map((v) => {
                                                const c = cellOf(v);
                                                const mm = margin(c);

                                                return (
                                                    <tr key={v.id} className="hover:bg-slate-50/60">
                                                        <td className="px-4 py-2.5">
                                                            <Link to={`/admin/products-services/${v.id}`} className="flex items-center gap-2 font-medium text-slate-900 hover:text-accent"><Server size={14} className="text-slate-400" /> {v.name}</Link>
                                                            <div className="mt-0.5 flex flex-wrap items-center gap-2 pl-6 text-xs text-slate-500">
                                                                <span>{v.product.name}</span>
                                                                {v.client && <Link to={`/admin/clients/${v.client.id}`} className="table-action-link">{v.client.name}</Link>}
                                                                {v.status !== 'active' && <Status value={v.status} />}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2.5 text-xs">
                                                            {v.monthly_cost
                                                                ? <><span className="tabular-nums">{v.monthly_cost.currency} {v.monthly_cost.amount}</span><span className="block text-slate-400">{v.monthly_cost.source === 'service' ? 'this VPS' : 'from product'}</span></>
                                                                : <Link to={`/admin/products-services/${v.id}`} className="font-semibold text-amber-700 hover:underline">Not set</Link>}
                                                        </td>
                                                        <td className="px-4 py-2.5 text-right tabular-nums">{money(c.sales)}</td>
                                                        <td className="px-4 py-2.5 text-right text-slate-600 tabular-nums">{money(c.cost)}</td>
                                                        <td className="px-4 py-2.5 text-right"><Profit value={c.profit} /></td>
                                                        <td className="px-4 py-2.5 text-right text-slate-600 tabular-nums">{mm === null ? '-' : `${mm.toFixed(1)}%`}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            <p className="border-t border-slate-200 px-4 py-2 text-xs text-slate-500">Sales are paid invoices for each VPS; cost is its monthly cost for each month it ran. Amounts in BDT; USD costs use the rate in Settings &gt; Currencies.</p>
                        </section>
                    </div>
                )}
            </QueryState>
        </div>
    );
}
