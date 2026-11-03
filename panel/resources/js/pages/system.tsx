import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, errorMessage } from '../api';
import { Button, Card, PagedTable, QueryState, Status, Table } from '../ui';

type Addon = { code: string; name: string; version: string | null; description: string | null; is_enabled: boolean };

export function AddonsPage() {
    const qc = useQueryClient();
    const query = useQuery({ queryKey: ['addons'], queryFn: async () => (await api.get<Addon[]>('/addons')).data });
    const toggle = useMutation({
        mutationFn: (a: Addon) => api.put(`/addons/${a.code}`, { is_enabled: !a.is_enabled }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['addons'] }),
        onError: (e) => window.alert(errorMessage(e)),
    });

    return (
        <>
            <Card title="Addons">
                <QueryState query={query}>
                    <Table<Addon>
                        rows={query.data ?? []}
                        empty="No addons found in the addons folder."
                        columns={[
                            { header: 'Addon', cell: (a) => <><div className="font-medium">{a.name}</div><div className="text-xs text-slate-500">{a.description}</div></> },
                            { header: 'Version', cell: (a) => a.version ?? '-' },
                            { header: 'State', cell: (a) => <Status value={a.is_enabled ? 'active' : 'none'} /> },
                            { header: '', cell: (a) => <Button variant="link" disabled={toggle.isPending} onClick={() => toggle.mutate(a)}>{a.is_enabled ? 'Disable' : 'Enable'}</Button>, align: 'right' },
                        ]}
                    />
                </QueryState>
            </Card>
        </>
    );
}

type LogEntry = { id: number; action: string; subject_type: string | null; subject_id: number | null; created_at: string };

export function ActivityPage() {
    return (
        <>
            <PagedTable<LogEntry>
                url="/activity"
                noun="entries"
                empty="No activity yet."
                columns={[
                    { header: 'When', cell: (l) => new Date(l.created_at).toLocaleString() },
                    { header: 'Action', cell: (l) => l.action },
                    { header: 'Subject', cell: (l) => (l.subject_type ? `${l.subject_type.split('\\').pop()} #${l.subject_id}` : '-') },
                ]}
            />
        </>
    );
}
