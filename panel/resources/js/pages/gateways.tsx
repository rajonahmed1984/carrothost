import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Settings2 } from 'lucide-react';
import { useState } from 'react';
import { api } from '../api';
import { Button, Card, ErrorNote, Field, Input, Modal, QueryState, SecretInput, Status } from '../ui';

type GatewayField = { key: string; label: string; type?: string; required?: boolean; hint?: string; value: string; is_set: boolean };
type Gateway = {
    code: string; name: string; implemented: boolean; has_sandbox: boolean; callback_url: string | null; is_enabled: boolean; test_mode: boolean;
    fee_percent: string; fee_fixed: string; fields: GatewayField[];
};

const inputType = (type?: string) => ({ secret: 'password', url: 'url', email: 'email', number: 'number' }[type ?? ''] ?? 'text');

/** "1.7% + 5.00", or "None". Trailing zeros dropped from the percentage. */
const feeText = (g: Gateway) => {
    const pct = Number(g.fee_percent);
    const fixed = Number(g.fee_fixed);
    const parts = [pct > 0 ? `${pct}%` : '', fixed > 0 ? fixed.toFixed(2) : ''].filter(Boolean);

    return parts.length ? parts.join(' + ') : 'None';
};

/** Display name from the saved fields, when the gateway has one, else its own name. */
const displayName = (g: Gateway) => g.fields.find((f) => f.key === 'display_name')?.value || g.name;

function GatewayForm({ gateway, onClose }: { gateway: Gateway; onClose: () => void }) {
    const qc = useQueryClient();
    const [enabled, setEnabled] = useState(gateway.is_enabled);
    const [sandbox, setSandbox] = useState(gateway.test_mode);
    const [fee, setFee] = useState({ percent: Number(gateway.fee_percent) ? String(Number(gateway.fee_percent)) : '', fixed: Number(gateway.fee_fixed) ? gateway.fee_fixed : '' });
    const [config, setConfig] = useState<Record<string, string>>(() => Object.fromEntries(gateway.fields.map((f) => [f.key, f.value])));
    const test = useMutation({ mutationFn: async () => (await api.post<{ message: string }>(`/gateways/${gateway.code}/test`)).data });
    const save = useMutation({
        mutationFn: () => api.put(`/gateways/${gateway.code}`, { is_enabled: enabled, test_mode: sandbox, config, fee_percent: fee.percent || 0, fee_fixed: fee.fixed || 0 }),
        onSuccess: () => {
            setConfig((current) => Object.fromEntries(Object.entries(current).map(([key, value]) => [key, gateway.fields.find((f) => f.key === key)?.type === 'secret' ? '' : value])));
            qc.invalidateQueries({ queryKey: ['gateways'] });
        },
    });
    const example = (1000 * Number(fee.percent || 0)) / 100 + Number(fee.fixed || 0);

    return (
        <Modal wide title={`${gateway.name} settings`} onClose={onClose}>
            <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-4">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} /> Show on order form</label>
                <div className="grid gap-3 md:grid-cols-2">
                    {gateway.fields.map((field) => (
                        <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                            <Field label={`${field.label}${field.required ? ' *' : ''}`} hint={field.type === 'secret' && field.is_set ? 'Saved. Press the eye to see it, or type a new one to replace it.' : field.hint}>
                                {field.type === 'secret' ? (
                                    <SecretInput
                                        value={config[field.key] ?? ''}
                                        onChange={(v) => setConfig({ ...config, [field.key]: v })}
                                        saved={!!field.is_set}
                                        reveal={async () => (await api.post<{ value: string }>(`/secrets/gateways/${gateway.code}`, { field: field.key })).data}
                                    />
                                ) : field.type === 'textarea' ? (
                                    <textarea rows={3} className="ui-input py-2" value={config[field.key] ?? ''} onChange={(e) => setConfig({ ...config, [field.key]: e.target.value })} />
                                ) : (
                                    <Input type={inputType(field.type)} step={field.type === 'number' ? 'any' : undefined} autoComplete={field.type === 'secret' ? 'new-password' : 'off'} value={config[field.key] ?? ''} onChange={(e) => setConfig({ ...config, [field.key]: e.target.value })} />
                                )}
                            </Field>
                        </div>
                    ))}
                </div>

                <fieldset className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <legend className="px-1 text-xs font-semibold text-slate-700">Transaction fee</legend>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Percentage (%)" hint="What the gateway keeps of each payment, e.g. 1.7 for bKash.">
                            <Input type="number" min="0" max="100" step="0.001" placeholder="0" value={fee.percent} onChange={(e) => setFee({ ...fee, percent: e.target.value })} />
                        </Field>
                        <Field label="Fixed amount" hint="Charged on every payment as well, in the payment's currency.">
                            <Input type="number" min="0" step="0.01" placeholder="0.00" value={fee.fixed} onChange={(e) => setFee({ ...fee, fixed: e.target.value })} />
                        </Field>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                        Recorded as the fee on each payment through this gateway, so Transactions show what you actually receive.
                        {example > 0 && <> A 1,000.00 payment records a fee of <strong>{example.toFixed(2)}</strong>.</>}
                    </p>
                </fieldset>

                {gateway.has_sandbox && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={sandbox} onChange={(e) => setSandbox(e.target.checked)} /> Sandbox mode (uncheck for live)</label>}
                {gateway.callback_url && <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs break-all text-slate-600">Turn on Instant Payment Notification in your PayPal account and set the URL to <strong>{gateway.callback_url}</strong></p>}
                <ErrorNote error={save.error} />
                {save.isSuccess && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">Saved.</p>}
                <div className="flex flex-wrap items-center gap-2">
                    <Button disabled={save.isPending}>{save.isPending ? 'Saving...' : 'Save changes'}</Button>
                    {/* Checks the saved credentials with the gateway; nothing is charged. */}
                    <Button type="button" variant="ghost" disabled={test.isPending} onClick={() => test.mutate()}>{test.isPending ? 'Testing...' : 'Test connection'}</Button>
                    <span className="text-xs text-slate-500">Save first, then test.</span>
                </div>
                {test.data && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">{test.data.message}</p>}
                <ErrorNote error={test.error} />
            </form>
        </Modal>
    );
}

export function GatewaysPage() {
    const query = useQuery({ queryKey: ['gateways'], queryFn: async () => (await api.get<Gateway[]>('/gateways')).data });
    const [editing, setEditing] = useState<string | null>(null);
    const gateways = query.data?.filter((g) => g.implemented) ?? [];
    const pending = query.data?.filter((g) => !g.implemented) ?? [];
    const current = gateways.find((g) => g.code === editing);

    return (
        <QueryState query={query}>
            <div className="space-y-4">
                <Card title={`Payment Gateways (${gateways.length})`}>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[40rem] text-sm">
                            <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase">
                                <tr>
                                    <th className="px-4 py-3">Gateway</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Mode</th>
                                    <th className="px-4 py-3">Transaction fee</th>
                                    <th className="px-4 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {gateways.map((g) => (
                                    <tr key={g.code} className="hover:bg-slate-50/60">
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-slate-900">{g.name}</div>
                                            {displayName(g) !== g.name && <div className="text-xs text-slate-500">Shown as "{displayName(g)}"</div>}
                                        </td>
                                        <td className="px-4 py-3"><Status value={g.is_enabled ? 'active' : 'inactive'} /></td>
                                        <td className="px-4 py-3 text-xs">
                                            {g.has_sandbox ? (g.test_mode ? <span className="font-semibold text-amber-700">Sandbox</span> : <span className="font-semibold text-emerald-700">Live</span>) : <span className="text-slate-400">-</span>}
                                        </td>
                                        <td className="px-4 py-3 tabular-nums">{feeText(g) === 'None' ? <span className="text-slate-400">None</span> : feeText(g)}</td>
                                        <td className="px-4 py-3 text-right">
                                            <Button variant="ghost" className="h-8 px-3" onClick={() => setEditing(g.code)}><Settings2 size={14} /> Configure</Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
                {pending.length > 0 && <p className="text-center text-xs text-slate-500">Not connected yet: {pending.map((g) => g.name).join(', ')}</p>}
            </div>
            {/* Keyed so reopening starts from what is saved. */}
            {current && <GatewayForm key={current.code} gateway={current} onClose={() => setEditing(null)} />}
        </QueryState>
    );
}
