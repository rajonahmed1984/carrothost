import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Layers, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, errorMessage, money } from '../api';
import { Button, Card, QueryState } from '../ui';
import { alertDialog } from '../dialog';

type Ours = { id: number; registrar: string | null; register_price: string; renew_price: string; transfer_price: string; is_active: boolean };
type Row = { tld: string; currency: string; register_cost: string | null; renew_cost: string | null; transfer_cost: string | null; ours: Ours | null };
type List = { registrar: { code: string; name: string; configured: boolean; currency: string; synced_at: string | null }; rows: Row[] };
export type TldPreset = { tld: string; registrar: string };

const PAGE = 100;

/**
 * What each registrar sells and what it costs us, beside our own price.
 * Syncing only reads from the registrar; adding a TLD opens the normal pricing form.
 */
export function RegistrarTldList({ registrars, onAdd, onBulkAdd, onEdit }: {
    registrars: { code: string; name: string }[];
    onAdd: (preset: TldPreset) => void;
    /** Ticked TLDs not yet in your pricing, to add together. */
    onBulkAdd: (tlds: string[], registrar: string) => void;
    onEdit: (id: number) => void;
}) {
    const qc = useQueryClient();
    const [code, setCode] = useState(registrars[0]?.code ?? '');
    const [ticked, setTicked] = useState<string[]>([]);
    const [search, setSearch] = useState('');
    const [show, setShow] = useState<'all' | 'missing' | 'ours'>('all');
    const [limit, setLimit] = useState(PAGE);
    const list = useQuery({
        queryKey: ['/tlds/registrar-list', code],
        queryFn: async () => (await api.get<List>('/tlds/registrar-list', { params: { registrar: code } })).data,
        enabled: code !== '',
    });
    const sync = useMutation({
        mutationFn: async () => (await api.post<{ message: string }>(`/tlds/registrar-sync/${code}`)).data,
        onSuccess: (r) => { qc.invalidateQueries({ queryKey: ['/tlds/registrar-list', code] }); qc.invalidateQueries({ queryKey: ['registrars'] }); void alertDialog(r.message); },
        onError: (e) => alertDialog(errorMessage(e)),
    });

    const term = search.trim().toLowerCase().replace(/^\.?/, '.');
    const rows = (list.data?.rows ?? [])
        .filter((r) => (show === 'missing' ? !r.ours : show === 'ours' ? Boolean(r.ours) : true))
        .filter((r) => !search.trim() || r.tld.includes(term));
    const info = list.data?.registrar;
    const cost = (value: string | null, currency: string) => (value === null ? <span className="text-slate-300">-</span> : money(value, currency));
    // Only TLDs not yet in your pricing can be ticked; the shown ones, for "tick all".
    const tickable = rows.slice(0, limit).filter((r) => !r.ours).map((r) => r.tld);
    const allTicked = tickable.length > 0 && tickable.every((t) => ticked.includes(t));

    return (
        <Card
            title="Registrar TLD list"
            action={
                <div className="flex flex-wrap items-center gap-2">
                    {info?.synced_at && <span className="text-xs text-slate-500">Synced {new Date(info.synced_at).toLocaleString()}</span>}
                    <Button type="button" disabled={!info?.configured || sync.isPending} title={info && !info.configured ? 'Save the API key first' : 'Fetch the TLD list and our cost prices'} onClick={() => sync.mutate()}>
                        <RefreshCw size={14} className={sync.isPending ? 'animate-spin' : ''} /> {sync.isPending ? 'Syncing...' : `Sync ${info?.name ?? ''}`}
                    </Button>
                </div>
            }
        >
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-3">
                <div className="flex rounded-xl border border-slate-200 p-0.5" role="tablist" aria-label="Registrar">
                    {registrars.map((r) => (
                        <button key={r.code} type="button" role="tab" aria-selected={code === r.code} onClick={() => { setCode(r.code); setLimit(PAGE); setTicked([]); }} className={`cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium ${code === r.code ? 'bg-[var(--accent)] text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                            {r.name}
                        </button>
                    ))}
                </div>
                <select className="ui-input h-9 w-auto" aria-label="Show" value={show} onChange={(e) => { setShow(e.target.value as typeof show); setLimit(PAGE); }}>
                    <option value="all">All TLDs</option>
                    <option value="missing">Not in my pricing</option>
                    <option value="ours">In my pricing</option>
                </select>
                <input className="ui-input h-9 w-40" placeholder="Search TLD" aria-label="Search registrar TLDs" value={search} onChange={(e) => { setSearch(e.target.value); setLimit(PAGE); }} />
                {list.data && <span className="ml-auto text-xs text-slate-500">{rows.length} of {list.data.rows.length}</span>}
                {ticked.length > 0 && (
                    <>
                        <Button type="button" onClick={() => { onBulkAdd(ticked, code); setTicked([]); }}><Layers size={14} /> Add {ticked.length} selected</Button>
                        <Button type="button" variant="ghost" onClick={() => setTicked([])}>Clear</Button>
                    </>
                )}
            </div>
            <QueryState query={list}>
                {info && !info.configured && (
                    <p className="p-6 text-center text-sm text-slate-500">Save the {info.name} reseller ID and API key in <Link className="table-action-link" to="/admin/settings/registrars">Domain Registrars</Link> first.</p>
                )}
                {info?.configured && list.data?.rows.length === 0 && (
                    <p className="p-6 text-center text-sm text-slate-500">Not synced yet. Click <b>Sync {info.name}</b> to fetch the TLDs it sells and what they cost you.</p>
                )}
                {list.data && list.data.rows.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[52rem] text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 text-[11px] text-slate-500 uppercase">
                                    <th className="w-8 px-3 py-3">
                                        <input type="checkbox" aria-label="Tick all shown TLDs not in your pricing" disabled={tickable.length === 0} checked={allTicked}
                                            onChange={() => setTicked(allTicked ? ticked.filter((t) => !tickable.includes(t)) : [...new Set([...ticked, ...tickable])])} />
                                    </th>
                                    <th className="px-3 py-3 font-semibold">TLD</th>
                                    <th className="px-3 py-3 text-right font-semibold">Cost: register</th>
                                    <th className="px-3 py-3 text-right font-semibold">Renew</th>
                                    <th className="px-3 py-3 text-right font-semibold">Transfer</th>
                                    <th className="px-3 py-3 text-right font-semibold">Your price: register</th>
                                    <th className="px-3 py-3 text-right font-semibold">Renew</th>
                                    <th className="px-3 py-3 text-right font-semibold">Margin</th>
                                    <th className="px-3 py-3" />
                                </tr>
                            </thead>
                            <tbody>
                                {rows.slice(0, limit).map((r) => {
                                    // Margin only compares like with like; a USD cost against a BDT price needs the rate.
                                    const margin = r.ours && r.currency === 'BDT' && r.renew_cost !== null ? Number(r.ours.renew_price) - Number(r.renew_cost) : null;

                                    return (
                                        <tr key={r.tld} className={`border-b border-slate-100 last:border-0 ${ticked.includes(r.tld) ? 'bg-sky-50/60' : 'hover:bg-slate-50/70'}`}>
                                            <td className="px-3 py-2">
                                                {!r.ours && <input type="checkbox" aria-label={`Tick ${r.tld}`} checked={ticked.includes(r.tld)} onChange={(e) => setTicked(e.target.checked ? [...ticked, r.tld] : ticked.filter((t) => t !== r.tld))} />}
                                            </td>
                                            <td className="px-3 py-2 font-semibold text-slate-900">{r.tld}</td>
                                            <td className="px-3 py-2 text-right tabular-nums">{cost(r.register_cost, r.currency)}</td>
                                            <td className="px-3 py-2 text-right tabular-nums">{cost(r.renew_cost, r.currency)}</td>
                                            <td className="px-3 py-2 text-right tabular-nums">{cost(r.transfer_cost, r.currency)}</td>
                                            <td className="px-3 py-2 text-right tabular-nums">{r.ours ? money(r.ours.register_price) : <span className="text-slate-300">-</span>}</td>
                                            <td className="px-3 py-2 text-right tabular-nums">{r.ours ? money(r.ours.renew_price) : <span className="text-slate-300">-</span>}</td>
                                            <td className={`px-3 py-2 text-right tabular-nums ${margin === null ? 'text-slate-300' : margin < 0 ? 'font-semibold text-rose-600' : 'text-emerald-700'}`} title={margin !== null && margin < 0 ? 'Renewal sells below cost' : undefined}>
                                                {margin === null ? '-' : money(margin)}
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                {r.ours
                                                    ? <Button type="button" variant="link" onClick={() => onEdit(r.ours!.id)}>Edit price</Button>
                                                    : <Button type="button" variant="link" onClick={() => onAdd({ tld: r.tld, registrar: code })}>Add</Button>}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {rows.length > limit && (
                            <div className="border-t border-slate-200 p-3 text-center"><Button type="button" variant="ghost" onClick={() => setLimit(limit + PAGE * 2)}>Show more ({rows.length - limit} left)</Button></div>
                        )}
                        {rows.length === 0 && <p className="p-6 text-center text-sm text-slate-500">No TLD matches.</p>}
                    </div>
                )}
            </QueryState>
            {info && info.currency !== 'BDT' && list.data && list.data.rows.length > 0 && (
                <p className="border-t border-slate-200 px-4 py-2.5 text-xs text-slate-500">Costs are in {info.currency}, the {info.name} account currency. Margin is shown only for BDT accounts.</p>
            )}
        </Card>
    );
}
