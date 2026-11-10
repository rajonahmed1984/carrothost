import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, errorMessage, money } from '../api';
import { Button, ErrorNote, Field, Input, Modal, PagedTable, Progress, Select, Status } from '../ui';
import { alertDialog, ask } from '../dialog';

/** The status tab, kept in the URL (?status=) so dashboard cards can link straight to a filtered list. */
function useStatusParam(): [string, (value: string) => void] {
    const [params, setParams] = useSearchParams();
    const status = params.get('status') ?? '';
    const set = (value: string) => {
        const next = new URLSearchParams(params);
        if (value) next.set('status', value); else next.delete('status');
        setParams(next, { replace: true });
    };

    return [status, set];
}

export type Service = {
    id: number; domain: string | null; cycle: string; recurring_amount: string; status: string; provision_status: string;
    provision_error: string | null; remote_id: string | null; next_due_date: string | null;
    client: { id: number; name: string }; product: { name: string; module: string | null; group?: { id: number; name: string } | null }; server: { name: string } | null;
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
        onError: (e) => alertDialog(errorMessage(e)),
    });
    const reveal = useMutation({
        mutationFn: async () => (await api.post(`/services/${service.id}/credentials`)).data,
        onSuccess: setCredentials,
        onError: (e) => alertDialog(errorMessage(e)),
    });

    const run = (action: string) => {
        if (confirmText[action]) ask(confirmText[action], () => act.mutate(action));
        else act.mutate(action);
    };

    const working = ['queued', 'running'].includes(service.provision_status);
    const busy = act.isPending || working;
    // A background create or terminate: re-read the list until it finishes.
    useEffect(() => {
        if (!working) return;
        const timer = setInterval(() => qc.invalidateQueries({ queryKey: ['/services'] }), 5000);

        return () => clearInterval(timer);
    }, [working, qc]);
    const doing: Record<string, string> = { create: 'Creating...', suspend: 'Suspending...', unsuspend: 'Unsuspending...', terminate: 'Terminating...' };

    if (busy) {
        return (
            <div className="flex justify-end">
                <Progress compact label={act.isPending && act.variables ? doing[act.variables] ?? 'Working...' : service.provision_status === 'queued' ? 'Queued...' : 'Working...'} />
            </div>
        );
    }

    return (
        <div className="flex flex-wrap justify-end gap-3">
            {service.status === 'active' && !service.remote_id && service.product.module && <Button variant="link" disabled={busy} onClick={() => run('create')}>{service.provision_status === 'failed' ? 'Retry' : 'Provision'}</Button>}
            {service.status === 'active' && service.remote_id && <Button variant="link" disabled={busy} onClick={() => run('suspend')}>Suspend</Button>}
            {service.status === 'suspended' && service.remote_id && <Button variant="link" disabled={busy} onClick={() => run('unsuspend')}>Unsuspend</Button>}
            {service.remote_id && service.status !== 'terminated' && <Button variant="link" disabled={reveal.isPending} onClick={() => reveal.mutate()}>Login</Button>}
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
    const [status, setStatus] = useStatusParam();
    const [search, setSearch] = useState('');
    const [group, setGroup] = useState('');
    const groups = useQuery({ queryKey: ['product-groups'], queryFn: async () => (await api.get<{ id: number; name: string }[]>('/product-groups')).data });
    // Opened from the Products list: one plan's services, optionally only the inactive ones.
    const [urlParams, setUrlParams] = useSearchParams();
    const product = urlParams.get('product') ?? '';
    const state = urlParams.get('state') ?? '';
    const products = useQuery({ queryKey: ['products'], queryFn: async () => (await api.get<{ id: number; name: string }[]>('/products')).data, enabled: !!product });
    const productName = products.data?.find((p) => String(p.id) === product)?.name;
    const clearProduct = () => {
        const next = new URLSearchParams(urlParams);
        next.delete('product');
        next.delete('state');
        setUrlParams(next, { replace: true });
    };

    const params: Record<string, string> = {
        ...(search ? { q: search } : {}),
        ...(status ? { status } : {}),
        ...(group ? { group } : {}),
        ...(product ? { product } : {}),
        ...(state && !status ? { state } : {}),
    };

    return (
        <>
            {product && (
                <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-sky-900">
                    Showing {state === 'inactive' && !status ? 'inactive ' : ''}services on <strong>{productName ?? `product #${product}`}</strong>.
                    <button type="button" onClick={clearProduct} className="ml-auto cursor-pointer font-semibold text-sky-800 hover:underline">Show all products</button>
                </div>
            )}
            <PagedTable<Service>
                url="/services"
                noun="services"
                search={{ value: search, onChange: setSearch, placeholder: 'Domain, username, client or product' }}
                action={
                    <div className="w-full sm:w-56">
                        <Select aria-label="Product group" value={group} onChange={(e) => setGroup(e.target.value)}>
                            <option value="">All product groups</option>
                            {groups.data?.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                            <option value="none">Ungrouped</option>
                        </Select>
                    </div>
                }
                tabs={{
                    value: status,
                    onChange: setStatus,
                    options: [
                        { key: '', label: 'All' },
                        { key: 'pending', label: 'Pending' },
                        { key: 'active', label: 'Active' },
                        { key: 'suspended', label: 'Suspended' },
                        { key: 'terminated', label: 'Terminated' },
                        { key: 'cancelled', label: 'Cancelled' },
                        { key: 'needs_action', label: 'Needs Action' },
                        { key: 'pending_cancellation', label: 'Pending Cancellation' },
                    ],
                }}
                params={params}
                empty="No services here. Services appear after an order is created."
                columns={[
                    {
                        header: 'Service',
                        cell: (s) => (
                            <>
                                <Link className="table-action-link font-semibold" to={`/admin/products-services/${s.id}`}>
                                    {s.product.name}
                                </Link>
                                <div className="text-xs text-slate-500">{s.product.group ? `${s.product.group.name} · ` : ''}{s.domain ?? 'No domain'}</div>
                            </>
                        ),
                    },
                    {
                        header: 'Client',
                        cell: (s) => (
                            <Link className="table-action-link font-medium" to={`/admin/clients/${s.client.id}`}>
                                {s.client.name}
                            </Link>
                        ),
                    },
                    { header: 'Next due', cell: (s) => s.next_due_date ?? '-' },
                    {
                        header: 'Amount',
                        cell: (s) => (
                            <>
                                {money(s.recurring_amount)}
                                <div className="text-xs text-slate-500 capitalize">{s.cycle}</div>
                            </>
                        ),
                        align: 'right',
                    },
                    { header: 'Status', cell: (s) => <Status value={s.status} /> },
                    {
                        header: 'Provisioning',
                        cell: (s) => (
                            <>
                                <Status value={s.provision_status} />
                                {s.provision_error && (
                                    <div className="max-w-52 text-xs text-slate-500">{s.provision_error}</div>
                                )}
                            </>
                        ),
                    },
                    { header: '', cell: (s) => <ServiceActions service={s} />, align: 'right' },
                ]}
            />
        </>
    );
}

type Domain = { id: number; name: string; action: string; years: number; registrar: string | null; status: string; provision_status: string; expires_at: string | null; recurring_amount: string; client: { id: number; name: string } };

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
    const [status, setStatus] = useStatusParam();
    const [search, setSearch] = useState('');

    const params: Record<string, string> = {
        ...(search ? { q: search } : {}),
        ...(status ? { status } : {}),
    };

    return (
        <>
            <PagedTable<Domain>
                url="/domains"
                noun="domains"
                search={{ value: search, onChange: setSearch, placeholder: 'Domain name, registrar or client' }}
                tabs={{
                    value: status,
                    onChange: setStatus,
                    options: [
                        { key: '', label: 'All' },
                        { key: 'pending', label: 'Pending' },
                        { key: 'active', label: 'Active' },
                        { key: 'expired', label: 'Expired' },
                        { key: 'cancelled', label: 'Cancelled' },
                        { key: 'fraud', label: 'Fraud' },
                        { key: 'needs_action', label: 'Needs Action' },
                    ],
                }}
                params={params}
                empty="No domains yet. Domains appear after an order is created."
                columns={[
                    {
                        header: 'Domain',
                        cell: (d) => (
                            <>
                                <Link className="table-action-link font-semibold" to={`/admin/domain-registrations/${d.id}`}>
                                    {d.name}
                                </Link>
                                <div className="text-xs text-slate-500 capitalize">
                                    {d.action}, {d.years} yr
                                </div>
                            </>
                        ),
                    },
                    {
                        header: 'Client',
                        cell: (d) => (
                            <Link className="table-action-link font-medium" to={`/admin/clients/${d.client.id}`}>
                                {d.client.name}
                            </Link>
                        ),
                    },
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
