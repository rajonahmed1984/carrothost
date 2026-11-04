import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, Percent, ReceiptText, Trash2, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { api, money } from '../api';
import { Button, ErrorNote, Field, Input, Modal, QueryState } from '../ui';
import { StatCards } from './client-tabs';

/* Server running costs and the profit each server makes against its sales, month by month. */

export type Cell = { cost: string; sales: string; profit: string };
type CostEntry = { id: number; server_id: number; starts_on: string; amount: string; note: string | null };
type Report = {
    months: string[];
    servers: { id: number; name: string; is_active: boolean; months: Record<string, Cell>; totals: Cell }[];
    totals: Record<string, Cell>;
    grand: Cell;
};

export const thisMonth = () => new Date().toISOString().slice(0, 7);
export const monthLabel = (ym: string) => new Date(`${ym}-01T00:00:00`).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
export const shiftMonth = (ym: string, by: number) => {
    const d = new Date(`${ym}-01T00:00:00`);
    d.setMonth(d.getMonth() + by);

    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};
export const margin = (c: Cell) => (Number(c.sales) > 0 ? (Number(c.profit) / Number(c.sales)) * 100 : null);

export function Profit({ value, className = '' }: { value: string; className?: string }) {
    const n = Number(value);

    return <span className={`font-semibold tabular-nums ${n > 0 ? 'text-emerald-700' : n < 0 ? 'text-rose-600' : 'text-slate-500'} ${className}`}>{money(value)}</span>;
}

/** The server's monthly bill over time: each entry applies from its month until a later one. */
export function ServerCostsModal({ server, onClose }: { server: { id: number; name: string }; onClose: () => void }) {
    const qc = useQueryClient();
    const key = ['/servers/costs', server.id];
    const costs = useQuery({ queryKey: key, queryFn: async () => (await api.get<CostEntry[]>(`/servers/${server.id}/costs`)).data });
    const [form, setForm] = useState({ starts_on: thisMonth(), amount: '', note: '' });
    const done = (data: CostEntry[]) => {
        qc.setQueryData(key, data);
        qc.invalidateQueries({ queryKey: ['servers'] });
        qc.invalidateQueries({ queryKey: ['/servers/profit'] });
    };
    const save = useMutation({ mutationFn: async () => (await api.post<CostEntry[]>(`/servers/${server.id}/costs`, form)).data, onSuccess: (d) => { done(d); setForm({ ...form, amount: '', note: '' }); } });
    const remove = useMutation({ mutationFn: async (id: number) => (await api.delete<CostEntry[]>(`/servers/${server.id}/costs/${id}`)).data, onSuccess: done });

    return (
        <Modal wide title={`Monthly cost: ${server.name}`} onClose={onClose}>
            <div className="space-y-4">
                <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="grid items-end gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-[9rem_10rem_1fr_auto]">
                    <Field label="From month"><Input type="month" required value={form.starts_on} onChange={(e) => setForm({ ...form, starts_on: e.target.value })} /></Field>
                    <Field label="Monthly bill (BDT)"><Input type="number" required min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></Field>
                    <Field label="Note"><Input maxLength={255} placeholder="e.g. Renewed at new price" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field>
                    <Button disabled={save.isPending}>{save.isPending ? 'Saving...' : 'Set Cost'}</Button>
                </form>
                <p className="text-xs text-slate-500">A cost applies from its month until a later entry changes it. Set 0 from the month you stop paying for the server. Setting a month again replaces it.</p>
                <ErrorNote error={save.error ?? remove.error} />
                <QueryState query={costs}>
                    {costs.data?.length === 0 ? <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">No cost set yet.</p> : (
                        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                            {costs.data?.map((c, i) => (
                                <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                                    <span className="min-w-0">
                                        <span className="font-medium text-slate-900">{monthLabel(c.starts_on)}</span>
                                        <span className="text-slate-500"> {i === 0 ? 'onwards' : `to ${monthLabel(shiftMonth(costs.data![i - 1].starts_on, -1))}`}</span>
                                        {c.note && <span className="block truncate text-xs text-slate-500">{c.note}</span>}
                                    </span>
                                    <span className="flex items-center gap-3">
                                        <span className="font-semibold tabular-nums">{money(c.amount)}<span className="text-xs font-normal text-slate-500"> / month</span></span>
                                        <button type="button" aria-label={`Delete cost from ${monthLabel(c.starts_on)}`} disabled={remove.isPending} onClick={() => window.confirm(`Delete the cost from ${monthLabel(c.starts_on)}?`) && remove.mutate(c.id)} className="icon-btn h-8 w-8 text-rose-600"><Trash2 size={14} /></button>
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </QueryState>
            </div>
        </Modal>
    );
}

const ranges = [{ months: 6, label: '6 months' }, { months: 12, label: '12 months' }, { months: 24, label: '24 months' }];

/** Cost, sales and profit for each month of a range, for all servers or one. */
export function ServerProfitReport({ servers }: { servers: { id: number; name: string }[] }) {
    const [to, setTo] = useState(thisMonth());
    const [span, setSpan] = useState(12);
    const [serverId, setServerId] = useState('');
    const [spread, setSpread] = useState(true);
    const [open, setOpen] = useState<string | null>(null);
    const from = shiftMonth(to, -(span - 1));
    const query = useQuery({
        queryKey: ['/servers/profit', from, to, spread, serverId],
        queryFn: async () => (await api.get<Report>('/servers/profit', { params: { from, to, spread: spread ? 1 : 0, server_id: serverId || undefined } })).data,
        placeholderData: keepPreviousData,
    });
    const r = query.data;
    const m = r ? margin(r.grand) : null;

    return (
        <section className="space-y-4">
            <div className="card flex flex-wrap items-center gap-3 px-4 py-3">
                <h2 className="mr-auto flex items-center gap-2 font-semibold text-slate-900"><TrendingUp size={17} className="text-[var(--accent)]" /> Profit by Month</h2>
                <label className="sr-only" htmlFor="profit-server">Server</label>
                <select id="profit-server" className="ui-input h-9 w-full sm:w-52" value={serverId} onChange={(e) => setServerId(e.target.value)}>
                    <option value="">All servers</option>
                    {servers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <div className="flex rounded-xl border border-slate-200 bg-white p-0.5" role="group" aria-label="Range">
                    {ranges.map((x) => (
                        <button key={x.months} type="button" aria-pressed={span === x.months} onClick={() => setSpan(x.months)} className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold ${span === x.months ? 'bg-[var(--accent)] text-white' : 'text-slate-600 hover:bg-slate-50'}`}>{x.label}</button>
                    ))}
                </div>
                <label className="flex items-center gap-2 text-xs text-slate-600">Up to <input type="month" className="ui-input h-9 w-auto" value={to} max={thisMonth()} onChange={(e) => e.target.value && setTo(e.target.value)} /></label>
                <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600" title="A yearly payment counts as 1/12 in each of its 12 months, instead of all in the month it was paid.">
                    <input type="checkbox" checked={spread} onChange={(e) => setSpread(e.target.checked)} /> Spread long-cycle payments
                </label>
            </div>

            <StatCards items={[
                { label: `Sales, ${span} months`, value: r ? money(r.grand.sales) : '-', icon: <ArrowDown size={20} />, tone: 'bg-emerald-100 text-emerald-700' },
                { label: 'Server Cost', value: r ? money(r.grand.cost) : '-', icon: <ReceiptText size={20} />, tone: 'bg-amber-100 text-amber-700' },
                { label: 'Profit', value: r ? <Profit value={r.grand.profit} /> : '-', icon: <ArrowUp size={20} />, tone: 'bg-[var(--accent-soft)] text-accent' },
                { label: 'Margin', value: m === null ? '-' : `${m.toFixed(1)}%`, icon: <Percent size={20} />, tone: 'bg-sky-100 text-sky-700' },
            ]} />

            <section className="card overflow-hidden">
                <QueryState query={query}>
                    {r && (
                        <div className={`overflow-x-auto ${query.isFetching ? 'opacity-60' : ''}`}>
                            <table className="w-full min-w-[40rem] text-sm">
                                <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase">
                                    <tr><th className="px-4 py-3">Month</th><th className="px-4 py-3 text-right">Sales</th><th className="px-4 py-3 text-right">Cost</th><th className="px-4 py-3 text-right">Profit</th><th className="px-4 py-3 text-right">Margin</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {[...r.months].reverse().map((month) => {
                                        const c = r.totals[month];
                                        const mm = margin(c);
                                        const expanded = open === month && r.servers.length > 1;

                                        return [
                                            <tr key={month} className={`hover:bg-slate-50/60 ${r.servers.length > 1 ? 'cursor-pointer' : ''}`} onClick={() => setOpen(open === month ? null : month)}>
                                                <td className="px-4 py-3 font-medium text-slate-900">
                                                    {r.servers.length > 1 ? <button type="button" aria-expanded={expanded} className="cursor-pointer text-left">{monthLabel(month)}</button> : monthLabel(month)}
                                                    {month === thisMonth() && <span className="ml-2 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700">So far</span>}
                                                </td>
                                                <td className="px-4 py-3 text-right tabular-nums">{money(c.sales)}</td>
                                                <td className="px-4 py-3 text-right text-slate-600 tabular-nums">{money(c.cost)}</td>
                                                <td className="px-4 py-3 text-right"><Profit value={c.profit} /></td>
                                                <td className="px-4 py-3 text-right text-slate-600 tabular-nums">{mm === null ? '-' : `${mm.toFixed(1)}%`}</td>
                                            </tr>,
                                            ...(expanded ? r.servers.map((s) => (
                                                <tr key={`${month}-${s.id}`} className="bg-slate-50/70 text-xs">
                                                    <td className="py-2 pr-4 pl-8 text-slate-600">{s.name}</td>
                                                    <td className="px-4 py-2 text-right tabular-nums">{money(s.months[month].sales)}</td>
                                                    <td className="px-4 py-2 text-right text-slate-600 tabular-nums">{money(s.months[month].cost)}</td>
                                                    <td className="px-4 py-2 text-right"><Profit value={s.months[month].profit} /></td>
                                                    <td className="px-4 py-2 text-right text-slate-500 tabular-nums">{margin(s.months[month])?.toFixed(1) ?? '-'}{margin(s.months[month]) !== null && '%'}</td>
                                                </tr>
                                            )) : []),
                                        ];
                                    })}
                                </tbody>
                                <tfoot className="border-t-2 border-slate-200 bg-slate-50/60 font-semibold">
                                    <tr><td className="px-4 py-3">Total</td><td className="px-4 py-3 text-right tabular-nums">{money(r.grand.sales)}</td><td className="px-4 py-3 text-right tabular-nums">{money(r.grand.cost)}</td><td className="px-4 py-3 text-right"><Profit value={r.grand.profit} /></td><td className="px-4 py-3 text-right tabular-nums">{m === null ? '-' : `${m.toFixed(1)}%`}</td></tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </QueryState>
                {r && r.servers.length > 1 && <p className="border-t border-slate-200 px-4 py-2 text-xs text-slate-500">Click a month to see each server. Sales are paid invoice lines for services on each server.</p>}
            </section>

            {r && r.servers.length > 1 && (
                <section className="card overflow-hidden">
                    <header className="border-b border-slate-200 px-4 py-3"><h3 className="font-semibold text-slate-900">By Server, {monthLabel(from)} to {monthLabel(to)}</h3></header>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[40rem] text-sm">
                            <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase"><tr><th className="px-4 py-2.5">Server</th><th className="px-4 py-2.5 text-right">Sales</th><th className="px-4 py-2.5 text-right">Cost</th><th className="px-4 py-2.5 text-right">Profit</th><th className="px-4 py-2.5 text-right">Margin</th></tr></thead>
                            <tbody className="divide-y divide-slate-100">
                                {r.servers.map((s) => (
                                    <tr key={s.id}>
                                        <td className="px-4 py-2.5 font-medium text-slate-900">{s.name}{!s.is_active && <span className="ml-2 text-xs font-normal text-slate-400">(inactive)</span>}</td>
                                        <td className="px-4 py-2.5 text-right tabular-nums">{money(s.totals.sales)}</td>
                                        <td className="px-4 py-2.5 text-right text-slate-600 tabular-nums">{money(s.totals.cost)}</td>
                                        <td className="px-4 py-2.5 text-right"><Profit value={s.totals.profit} /></td>
                                        <td className="px-4 py-2.5 text-right text-slate-600 tabular-nums">{margin(s.totals)?.toFixed(1) ?? '-'}{margin(s.totals) !== null && '%'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}
        </section>
    );
}
