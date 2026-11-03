import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, money } from '../api';
import { Button, ErrorNote, Field, Input, Modal, PagedTable, QueryState, Status } from '../ui';

type Invoice = { id: number; number: string; status: string; currency: string; total: string; due_date: string; client: { id: number; name: string; email?: string } };
type Detail = Invoice & {
    items: { id: number; description: string; amount: string }[];
    payments: { id: number; gateway: string; transaction_id: string; amount: string; created_at: string }[];
};

function InvoiceModal({ id, onClose }: { id: number; onClose: () => void }) {
    const qc = useQueryClient();
    const query = useQuery({ queryKey: ['invoice', id], queryFn: async () => (await api.get<Detail>(`/invoices/${id}`)).data });
    const [transactionId, setTransactionId] = useState('');
    const [amount, setAmount] = useState('');
    const inv = query.data;

    const refresh = () => {
        qc.invalidateQueries({ queryKey: ['invoice', id] });
        qc.invalidateQueries({ queryKey: ['/invoices'] });
        qc.invalidateQueries({ queryKey: ['dashboard'] });
    };

    const pay = useMutation({
        mutationFn: () => api.post(`/invoices/${id}/payments`, { transaction_id: transactionId, amount: amount || balance }),
        onSuccess: () => { setTransactionId(''); setAmount(''); refresh(); },
    });
    const cancel = useMutation({ mutationFn: () => api.post(`/invoices/${id}/cancel`), onSuccess: refresh });

    const paid = inv?.payments.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;
    const balance = inv ? Math.max(Number(inv.total) - paid, 0).toFixed(2) : '0.00';

    return (
        <Modal title={inv?.number ?? 'Invoice'} onClose={onClose}>
            <QueryState query={query}>
                {inv && (
                    <div className="space-y-4">
                        <div className="flex items-start justify-between gap-3">
                            <div><Link className="table-action-link font-semibold" to={`/admin/clients/${inv.client.id}`}>{inv.client.name}</Link><div className="text-xs text-slate-500">{inv.client.email} - Due {inv.due_date}</div></div>
                            <Status value={inv.status} />
                        </div>
                        <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200">
                            {inv.items.map((item) => (
                                <li key={item.id} className="flex justify-between gap-3 px-3 py-2"><span>{item.description}</span><span className="tabular-nums whitespace-nowrap">{money(item.amount, inv.currency)}</span></li>
                            ))}
                            <li className="flex justify-between gap-3 px-3 py-2 font-semibold"><span>Total</span><span className="tabular-nums">{money(inv.total, inv.currency)}</span></li>
                        </ul>

                        {inv.payments.length > 0 && (
                            <div>
                                <h3 className="mb-1 text-xs font-medium text-slate-500">Payments</h3>
                                <ul className="space-y-1">
                                    {inv.payments.map((p) => <li key={p.id} className="flex justify-between gap-3"><span>{p.gateway}: {p.transaction_id}</span><span className="tabular-nums">{money(p.amount, inv.currency)}</span></li>)}
                                </ul>
                            </div>
                        )}

                        {inv.status === 'unpaid' && (
                            <form onSubmit={(e) => { e.preventDefault(); pay.mutate(); }} className="space-y-3 rounded-xl border border-slate-200 p-3">
                                <h3 className="font-medium">Record a manual payment</h3>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <Field label="Transaction ID"><Input required value={transactionId} onChange={(e) => setTransactionId(e.target.value)} /></Field>
                                    <Field label="Amount"><Input type="number" min="0.01" step="0.01" placeholder={balance} value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
                                </div>
                                <p className="text-xs text-slate-500">Paying in full activates the order and starts provisioning.</p>
                                <ErrorNote error={pay.error ?? cancel.error} />
                                <div className="flex flex-wrap justify-between gap-2">
                                    {inv.payments.length === 0 && <Button type="button" variant="danger" disabled={cancel.isPending} onClick={() => { if (window.confirm(`Cancel ${inv.number}?`)) cancel.mutate(); }}>Cancel invoice</Button>}
                                    <Button className="ml-auto" disabled={pay.isPending}>{pay.isPending ? 'Recording...' : 'Record payment'}</Button>
                                </div>
                            </form>
                        )}
                    </div>
                )}
            </QueryState>
        </Modal>
    );
}

export function InvoicesPage({ mode = 'all' }: { mode?: 'all' | 'paid' | 'unpaid' | 'overdue' | 'cancelled' | 'refunded' } = {}) {
    const [status, setStatus] = useState('');
    const [search, setSearch] = useState('');
    const { id } = useParams();
    const navigate = useNavigate();

    const activeStatus = mode === 'all' ? status : mode;
    const queryParams: Record<string, string> = {
        ...(activeStatus ? { status: activeStatus } : {}),
        ...(search ? { q: search } : {}),
    };

    const nounMap: Record<string, string> = {
        all: 'invoices',
        paid: 'paid invoices',
        unpaid: 'unpaid invoices',
        overdue: 'overdue invoices',
        cancelled: 'cancelled invoices',
        refunded: 'refunded invoices',
    };

    const emptyMap: Record<string, string> = {
        all: 'No invoices here.',
        paid: 'No paid invoices found.',
        unpaid: 'No unpaid invoices found.',
        overdue: 'No overdue invoices found.',
        cancelled: 'No cancelled invoices found.',
        refunded: 'No refunded invoices found.',
    };

    const basePath = mode === 'all' ? '/admin/paid-invoices' : `/admin/${mode}-invoices`;

    return (
        <>
            <PagedTable<Invoice>
                url="/invoices"
                noun={nounMap[mode] ?? 'invoices'}
                search={{ value: search, onChange: setSearch, placeholder: 'Invoice # or client name...' }}
                tabs={mode === 'all' ? { value: status, onChange: setStatus, options: [{ key: '', label: 'All' }, { key: 'unpaid', label: 'Unpaid' }, { key: 'paid', label: 'Paid' }, { key: 'cancelled', label: 'Cancelled' }, { key: 'refunded', label: 'Refunded' }] } : undefined}
                params={queryParams}
                empty={emptyMap[mode] ?? 'No invoices found.'}
                columns={[
                    { header: 'Number', cell: (i) => <Link className="table-action-link font-semibold" to={`${basePath}/${i.id}`}>{i.number}</Link> },
                    { header: 'Client', cell: (i) => <Link className="hover:text-accent" to={`/admin/clients/${i.client.id}`}>{i.client.name}</Link> },
                    { header: 'Due', cell: (i) => i.due_date },
                    { header: 'Total', cell: (i) => money(i.total, i.currency), align: 'right' },
                    { header: 'Status', cell: (i) => <Status value={i.status} /> },
                ]}
            />
            {id && <InvoiceModal id={Number(id)} onClose={() => navigate(-1)} />}
        </>
    );
}

export type Transaction = {
    id: number;
    gateway: string;
    transaction_id: string;
    amount: string;
    currency: string;
    created_at: string;
    invoice?: { id: number; number: string; client?: { id: number; name: string } } | null;
};

export function TransactionsPage() {
    const [search, setSearch] = useState('');

    return (
        <PagedTable<Transaction>
            url="/transactions"
            noun="transactions"
            search={{ value: search, onChange: setSearch, placeholder: 'Transaction ID, gateway, invoice #...' }}
            params={search ? { q: search } : undefined}
            empty="No transactions found."
            columns={[
                { header: 'Date', cell: (t) => new Date(t.created_at).toLocaleDateString('en-GB') },
                { header: 'Client', cell: (t) => t.invoice?.client ? <Link className="table-action-link font-semibold" to={`/admin/clients/${t.invoice.client.id}`}>{t.invoice.client.name}</Link> : '-' },
                { header: 'Invoice', cell: (t) => t.invoice ? <Link className="table-action-link font-semibold" to={`/admin/paid-invoices/${t.invoice.id}`}>#{t.invoice.number}</Link> : '-' },
                { header: 'Gateway', cell: (t) => <span className="capitalize">{t.gateway}</span> },
                { header: 'Transaction ID', cell: (t) => <span className="font-mono text-xs text-slate-600 break-all">{t.transaction_id}</span> },
                { header: 'Amount', cell: (t) => money(t.amount, t.currency), align: 'right' },
            ]}
        />
    );
}
