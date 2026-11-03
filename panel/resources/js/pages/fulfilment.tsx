import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, errorMessage, money } from '../api';
import { Button, ErrorNote, Field, Input, Modal, PagedTable, Status } from '../ui';

export type Service = {
    id: number; domain: string | null; cycle: string; recurring_amount: string; status: string; provision_status: string;
    provision_error: string | null; remote_id: string | null; next_due_date: string | null;
    client: { name: string }; product: { name: string; module: string | null }; server: { name: string } | null;
};

const confirmText: Record<string, string> = {
    suspend: 'Suspend this account? The customer site goes offline.',
    terminate: 'Terminate this account? This permanently deletes the customer files, email and databases from the server.',
};

export function ServiceActions({ service }: { service: Service }) {
    const qc = useQueryClient();
    const [credentials, setCredentials] = useState<{ username?: string; password?: string } | null>(null);
    const act = useMutation({
        mutationFn: (action: string) => api.post(`/services/${service.id}/action`, { action }),
        onSettled: () => qc.invalidateQueries({ queryKey: ['/services'] }),
        onError: (e) => window.alert(errorMessage(e)),
    });
    const reveal = useMutation({
        mutationFn: async () => (await api.post(`/services/${service.id}/credentials`)).data,
        onSuccess: setCredentials,
        onError: (e) => window.alert(errorMessage(e)),
    });

    const run = (action: string) => {
        if (!confirmText[action] || window.confirm(confirmText[action])) act.mutate(action);
    };

    const busy = act.isPending || ['queued', 'running'].includes(service.provision_status);

    return (
        <div className="flex flex-wrap justify-end gap-3">
            {service.status === 'active' && !service.remote_id && service.product.module && <Button variant="link" disabled={busy} onClick={() => run('create')}>{service.provision_status === 'failed' ? 'Retry' : 'Provision'}</Button>}
            {service.status === 'active' && service.remote_id && <Button variant="link" disabled={busy} onClick={() => run('suspend')}>Suspend</Button>}
            {service.status === 'suspended' && service.remote_id && <Button variant="link" disabled={busy} onClick={() => run('unsuspend')}>Unsuspend</Button>}
            {service.remote_id && <Button variant="link" disabled={reveal.isPending} onClick={() => reveal.mutate()}>Login</Button>}
            {service.remote_id && service.status !== 'terminated' && <Button variant="link-danger" disabled={busy} onClick={() => run('terminate')}>Terminate</Button>}
            {credentials && (
                <Modal title="Account login" onClose={() => setCredentials(null)}>
                    <dl className="space-y-2 text-left">
                        <div><dt className="text-xs text-slate-500">Username</dt><dd className="font-mono">{credentials.username ?? '-'}</dd></div>
                        <div><dt className="text-xs text-slate-500">Password</dt><dd className="font-mono break-all">{credentials.password ?? '-'}</dd></div>
                    </dl>
                    <p className="mt-3 text-xs text-slate-500">This view is recorded in the activity log.</p>
                </Modal>
            )}
        </div>
    );
}

export function ServicesPage() {
    const [status, setStatus] = useState('');

    return (
        <>
            <PagedTable<Service>
                url="/services"
                noun="services"
                tabs={{ value: status, onChange: setStatus, options: [{ key: '', label: 'All' }, { key: 'pending', label: 'Pending' }, { key: 'active', label: 'Active' }, { key: 'suspended', label: 'Suspended' }, { key: 'terminated', label: 'Terminated' }] }}
                params={status ? { status } : undefined}
                empty="No services here. Services appear after an order is created."
                columns={[
                    { header: 'Service', cell: (s) => <><Link className="table-action-link font-semibold" to={`/services/${s.id}`}>{s.product.name}</Link><div className="text-xs text-slate-500">{s.domain ?? 'No domain'}</div></> },
                    { header: 'Client', cell: (s) => s.client.name },
                    { header: 'Next due', cell: (s) => s.next_due_date ?? '-' },
                    { header: 'Amount', cell: (s) => <>{money(s.recurring_amount)}<div className="text-xs text-slate-500">{s.cycle}</div></>, align: 'right' },
                    { header: 'Status', cell: (s) => <Status value={s.status} /> },
                    { header: 'Provisioning', cell: (s) => <><Status value={s.provision_status} />{s.provision_error && <div className="max-w-52 text-xs text-slate-500">{s.provision_error}</div>}</> },
                    { header: '', cell: (s) => <ServiceActions service={s} />, align: 'right' },
                ]}
            />
        </>
    );
}

type Domain = { id: number; name: string; action: string; years: number; registrar: string | null; status: string; provision_status: string; expires_at: string | null; recurring_amount: string; client: { name: string } };

function CompleteDomain({ domain, onClose }: { domain: Domain; onClose: () => void }) {
    const qc = useQueryClient();
    const [expiresAt, setExpiresAt] = useState('');
    const complete = useMutation({
        mutationFn: () => api.post(`/domains/${domain.id}/complete`, { expires_at: expiresAt }),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['/domains'] }); onClose(); },
    });

    return (
        <Modal title={`Complete ${domain.name}`} onClose={onClose}>
            <form onSubmit={(e) => { e.preventDefault(); complete.mutate(); }} className="space-y-3">
                <p className="text-slate-500">Finish the {domain.action} at your registrar first, then enter the expiry date it shows.</p>
                <Field label="Expiry date"><Input type="date" required value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} /></Field>
                <ErrorNote error={complete.error} />
                <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button disabled={complete.isPending}>Mark active</Button></div>
            </form>
        </Modal>
    );
}

export function DomainsPage() {
    const [completing, setCompleting] = useState<Domain | null>(null);

    return (
        <>
            <PagedTable<Domain>
                url="/domains"
                noun="domains"
                empty="No domains yet. Domains appear after an order is created."
                columns={[
                    { header: 'Domain', cell: (d) => <><Link className="table-action-link font-semibold" to={`/domains/${d.id}`}>{d.name}</Link><div className="text-xs text-slate-500">{d.action}, {d.years} yr</div></> },
                    { header: 'Client', cell: (d) => d.client.name },
                    { header: 'Registrar', cell: (d) => d.registrar ?? 'Manual' },
                    { header: 'Expires', cell: (d) => d.expires_at ?? '-' },
                    { header: 'Renewal', cell: (d) => money(d.recurring_amount), align: 'right' },
                    { header: 'Status', cell: (d) => <Status value={d.status} /> },
                    { header: 'Fulfilment', cell: (d) => <Status value={d.provision_status} /> },
                    { header: '', cell: (d) => d.provision_status === 'manual_required' && <Button variant="link" onClick={() => setCompleting(d)}>Complete</Button>, align: 'right' },
                ]}
            />
            {completing && <CompleteDomain domain={completing} onClose={() => setCompleting(null)} />}
        </>
    );
}
