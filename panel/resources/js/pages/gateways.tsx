import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../api';
import { Button, Card, ErrorNote, Field, Input, QueryState, SecretInput, Status } from '../ui';

type GatewayField = { key: string; label: string; type?: string; required?: boolean; hint?: string; value: string; is_set: boolean };
type Gateway = { code: string; name: string; implemented: boolean; has_sandbox: boolean; callback_url: string | null; is_enabled: boolean; test_mode: boolean; fields: GatewayField[] };

const inputType = (type?: string) => ({ secret: 'password', url: 'url', email: 'email', number: 'number' }[type ?? ''] ?? 'text');

function GatewayCard({ gateway }: { gateway: Gateway }) {
    const qc = useQueryClient();
    const [enabled, setEnabled] = useState(gateway.is_enabled);
    const [sandbox, setSandbox] = useState(gateway.test_mode);
    const [config, setConfig] = useState<Record<string, string>>(() => Object.fromEntries(gateway.fields.map((f) => [f.key, f.value])));
    const test = useMutation({ mutationFn: async () => (await api.post<{ message: string }>(`/gateways/${gateway.code}/test`)).data });
    const save = useMutation({
        mutationFn: () => api.put(`/gateways/${gateway.code}`, { is_enabled: enabled, test_mode: sandbox, config }),
        onSuccess: () => {
            setConfig((current) => Object.fromEntries(Object.entries(current).map(([key, value]) => [key, gateway.fields.find((f) => f.key === key)?.type === 'secret' ? '' : value])));
            qc.invalidateQueries({ queryKey: ['gateways'] });
        },
    });

    return (
        <Card title={gateway.name} action={<Status value={gateway.is_enabled ? 'active' : 'inactive'} />}>
            <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-3 p-4">
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
                {gateway.has_sandbox && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={sandbox} onChange={(e) => setSandbox(e.target.checked)} /> Sandbox mode (uncheck for live)</label>}
                {gateway.callback_url && <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs break-all text-slate-600">Turn on Instant Payment Notification in your PayPal account and set the URL to <strong>{gateway.callback_url}</strong></p>}
                <ErrorNote error={save.error} />
                <div className="flex flex-wrap items-center gap-2">
                    <Button disabled={save.isPending}>{save.isPending ? 'Saving...' : 'Save changes'}</Button>
                    {/* Checks the saved credentials with the gateway; nothing is charged. */}
                    <Button type="button" variant="ghost" disabled={test.isPending} onClick={() => test.mutate()}>{test.isPending ? 'Testing...' : 'Test connection'}</Button>
                    <span className="text-xs text-slate-500">Save first, then test.</span>
                </div>
                {test.data && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">{test.data.message}</p>}
                <ErrorNote error={test.error} />
            </form>
        </Card>
    );
}

export function GatewaysPage() {
    const query = useQuery({ queryKey: ['gateways'], queryFn: async () => (await api.get<Gateway[]>('/gateways')).data });
    const pending = query.data?.filter((g) => !g.implemented) ?? [];

    return (
        <QueryState query={query}>
            <div className="space-y-4">
                {query.data?.filter((g) => g.implemented).map((g) => <GatewayCard key={g.code} gateway={g} />)}
                {pending.length > 0 && <p className="text-center text-xs text-slate-500">Not connected yet: {pending.map((g) => g.name).join(', ')}</p>}
            </div>
        </QueryState>
    );
}
