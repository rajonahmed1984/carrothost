import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, money } from '../api';
import { Card, QueryState, Status, Table } from '../ui';
import { ServiceActions, type Service } from './fulfilment';

function Facts({ rows }: { rows: [string, ReactNode][] }) {
    return (
        <dl className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map(([label, value]) => (
                <div key={label}>
                    <dt className="text-[10px] font-semibold text-slate-400 uppercase">{label}</dt>
                    <dd className="mt-0.5 text-sm break-words text-slate-800">{value ?? '-'}</dd>
                </div>
            ))}
        </dl>
    );
}

function useRecord<T>(path: string) {
    const { id } = useParams();

    return useQuery({ queryKey: [path, id], queryFn: async () => (await api.get<T>(`${path}/${id}`)).data });
}

const clientLink = (client: { id: number; name: string }) => <Link className="table-action-link" to={`/clients/${client.id}`}>{client.name}</Link>;

type DomainRow = { id: number; name: string; status: string; expires_at: string | null };
type InvoiceRow = { id: number; number: string; status: string; total: string };

const domainColumns = [
    { header: 'Domain', cell: (d: DomainRow) => <Link className="table-action-link" to={`/domains/${d.id}`}>{d.name}</Link> },
    { header: 'Expires', cell: (d: DomainRow) => d.expires_at ?? '-' },
    { header: 'Status', cell: (d: DomainRow) => <Status value={d.status} /> },
];
const invoiceColumns = [
    { header: 'Number', cell: (i: InvoiceRow) => <Link className="table-action-link" to={`/invoices/${i.id}`}>{i.number}</Link> },
    { header: 'Total', cell: (i: InvoiceRow) => money(i.total), align: 'right' as const },
    { header: 'Status', cell: (i: InvoiceRow) => <Status value={i.status} /> },
];
type ServiceRow = { id: number; domain: string | null; status: string; product: { name: string } };
const serviceColumns = [
    { header: 'Service', cell: (s: ServiceRow) => <Link className="table-action-link" to={`/services/${s.id}`}>{s.product.name}{s.domain ? ` - ${s.domain}` : ''}</Link> },
    { header: 'Status', cell: (s: ServiceRow) => <Status value={s.status} /> },
];

type OrderDetail = { id: number; status: string; created_at: string; client: { id: number; name: string }; services: ServiceRow[]; domains: DomainRow[]; invoices: InvoiceRow[] };

export function OrderDetailPage() {
    const query = useRecord<OrderDetail>('/orders');
    const o = query.data;

    return (
        <QueryState query={query}>
            {o && (
                <div className="space-y-4">
                    <Card title={`Order #${o.id}`}><Facts rows={[['Client', clientLink(o.client)], ['Placed', new Date(o.created_at).toLocaleString()], ['Status', <Status key="s" value={o.status} />]]} /></Card>
                    <Card title="Services"><Table rows={o.services} columns={serviceColumns} empty="No services." /></Card>
                    <Card title="Domains"><Table rows={o.domains} columns={domainColumns} empty="No domains." /></Card>
                    <Card title="Invoices"><Table rows={o.invoices} columns={invoiceColumns} empty="No invoices." /></Card>
                </div>
            )}
        </QueryState>
    );
}

export function ServiceDetailPage() {
    const query = useRecord<Service & { client: { id: number; name: string } }>('/services');
    const s = query.data;

    return (
        <QueryState query={query}>
            {s && (
                <Card title={`${s.product.name}${s.domain ? ` - ${s.domain}` : ''}`} action={<ServiceActions service={s} />}>
                    <Facts rows={[
                        ['Client', clientLink(s.client)],
                        ['Server', s.server?.name],
                        ['Account', s.remote_id],
                        ['Amount', `${money(s.recurring_amount)} / ${s.cycle}`],
                        ['Next due', s.next_due_date],
                        ['Status', <Status key="s" value={s.status} />],
                        ['Provisioning', <Status key="p" value={s.provision_status} />],
                        ['Provisioning note', s.provision_error],
                    ]} />
                </Card>
            )}
        </QueryState>
    );
}

type DomainDetail = DomainRow & { action: string; years: number; registrar: string | null; provision_status: string; recurring_amount: string; client: { id: number; name: string } };

export function DomainDetailPage() {
    const query = useRecord<DomainDetail>('/domains');
    const d = query.data;

    return (
        <QueryState query={query}>
            {d && (
                <Card title={d.name}>
                    <Facts rows={[
                        ['Client', clientLink(d.client)],
                        ['Registrar', d.registrar ?? 'Manual'],
                        ['Order type', `${d.action}, ${d.years} yr`],
                        ['Expires', d.expires_at],
                        ['Renewal', money(d.recurring_amount)],
                        ['Status', <Status key="s" value={d.status} />],
                        ['Fulfilment', <Status key="f" value={d.provision_status} />],
                    ]} />
                </Card>
            )}
        </QueryState>
    );
}
