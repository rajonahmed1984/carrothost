import { PagedTable } from '../ui';

type LogEntry = { id: number; action: string; subject_type: string | null; subject_id: number | null; created_at: string; context: { description?: string } | null };

export function ActivityPage() {
    return (
        <>
            <PagedTable<LogEntry>
                url="/activity"
                noun="entries"
                empty="No activity yet."
                columns={[
                    { header: 'When', cell: (l) => new Date(l.created_at).toLocaleString() },
                    { header: 'Action', cell: (l) => l.context?.description ?? l.action },
                    { header: 'Subject', cell: (l) => (l.subject_type ? `${l.subject_type.split('\\').pop()} #${l.subject_id}` : '-') },
                ]}
            />
        </>
    );
}
