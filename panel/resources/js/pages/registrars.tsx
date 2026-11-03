import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api, errorMessage } from '../api';
import { Button, Card, ErrorNote, Field, Input, Modal, QueryState, Table } from '../ui';

type Registrar = { code: string; name: string; reseller_id: string | null; has_api_key: boolean };

function RegistrarForm({ registrar, onClose }: { registrar: Registrar; onClose: () => void }) {
    const qc = useQueryClient();
    const [resellerId, setResellerId] = useState(registrar.reseller_id ?? '');
    const [apiKey, setApiKey] = useState('');
    const save = useMutation({
        mutationFn: () => api.put(`/registrars/${registrar.code}`, { reseller_id: resellerId, api_key: apiKey }),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['registrars'] }); onClose(); },
    });

    return (
        <Modal title={`Edit ${registrar.name}`} onClose={onClose}>
            <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-3">
                <Field label="Reseller ID"><Input required value={resellerId} onChange={(e) => setResellerId(e.target.value)} /></Field>
                <Field label="API key" hint={registrar.has_api_key ? 'Leave blank to keep the current key' : 'Stored encrypted'}><Input type="password" autoComplete="new-password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} /></Field>
                <ErrorNote error={save.error} />
                <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button disabled={save.isPending}>Save registrar</Button></div>
            </form>
        </Modal>
    );
}

function TestButton({ code }: { code: string }) {
    const test = useMutation({
        mutationFn: async () => (await api.post<{ message: string }>(`/registrars/${code}/test`)).data,
        onSuccess: (r) => window.alert(r.message),
        onError: (e) => window.alert(errorMessage(e)),
    });

    return <Button variant="link" disabled={test.isPending} onClick={() => test.mutate()}>{test.isPending ? 'Testing...' : 'Test'}</Button>;
}

export function RegistrarsPage() {
    const query = useQuery({ queryKey: ['registrars'], queryFn: async () => (await api.get<Registrar[]>('/registrars')).data });
    const [editing, setEditing] = useState<Registrar | null>(null);

    return (
        <>
            <Card title="Domain registrars">
                <QueryState query={query}>
                    <Table<Registrar>
                        rows={query.data ?? []}
                        empty="No registrars."
                        columns={[
                            { header: 'Registrar', cell: (r) => <span className="font-medium">{r.name}</span> },
                            { header: 'Reseller ID', cell: (r) => r.reseller_id ?? '-' },
                            { header: 'API key', cell: (r) => (r.has_api_key ? 'Saved' : 'Not set') },
                            { header: 'Fulfilment', cell: () => 'Manual for now' },
                            { header: '', cell: (r) => <div className="flex justify-end gap-3"><TestButton code={r.code} /><Button variant="link" onClick={() => setEditing(r)}>Edit</Button></div>, align: 'right' },
                        ]}
                    />
                </QueryState>
            </Card>
            {editing && <RegistrarForm registrar={editing} onClose={() => setEditing(null)} />}
        </>
    );
}
