import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { ArrowRightLeft, Check, KeyRound, RefreshCw, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, money } from '../api';
import { Button, ErrorNote, Field, Modal, Progress, QueryState } from '../ui';
import { ask } from '../dialog';

/* Dialogs opened from a service's More menu and module commands. Each posts to the service and hands back the fresh record. */

type Saved<T> = (result: T) => void;
const label = (v: string) => v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

type UpgradeOptions = {
    /** The client's currency: every amount here is in it. */
    currency: string;
    products: { id: number; name: string; prices: { cycle: string; price: string }[] }[];
    quote: { days_left: number; cycle_days: number; credit: string; new_recurring: string; amount_due: string; new_next_due_date: string | null } | null;
};

export function UpgradeModal({ service, onClose, onDone, base = `/services/${service.id}` }: {
    service: { id: number; product_id: number; cycle: string; domain: string | null; product: { name: string }; recurring_amount: string };
    onClose: () => void;
    onDone: Saved<{ message: string; invoice_id: number | null }>;
    /** The service's API path: the admin one by default, `/client/services/{id}` in the client area. */
    base?: string;
}) {
    const [productId, setProductId] = useState(service.product_id);
    const [cycle, setCycle] = useState(service.cycle);
    const options = useQuery({
        queryKey: [base, 'upgrade', productId, cycle],
        queryFn: async () => (await api.get<UpgradeOptions>(`${base}/upgrade`, { params: { product_id: productId, cycle } })).data,
        placeholderData: keepPreviousData,
        retry: false,
    });
    const product = options.data?.products.find((p) => p.id === productId);
    const unchanged = productId === service.product_id && cycle === service.cycle;
    const quote = options.data?.quote;
    const cur = options.data?.currency;
    const create = useMutation({
        mutationFn: async () => (await api.post<{ message: string; invoice_id: number | null }>(`${base}/upgrade`, { product_id: productId, cycle })).data,
        onSuccess: onDone,
    });

    // A product without the current cycle falls back to its first priced cycle.
    useEffect(() => {
        if (product && !product.prices.some((p) => p.cycle === cycle)) setCycle(product.prices[0]?.cycle ?? cycle);
    }, [product, cycle]);

    return (
        <Modal title="Upgrade / Downgrade" onClose={onClose}>
            <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="space-y-4">
                <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    Current: <strong className="text-slate-900">{service.product.name}</strong>{service.domain && ` (${service.domain})`}, {money(service.recurring_amount, cur)} {label(service.cycle)}
                </p>
                <Field label="New Product/Service">
                    <select className="ui-input" value={productId} onChange={(e) => setProductId(Number(e.target.value))}>
                        {options.data?.products.map((p) => <option key={p.id} value={p.id}>{p.name}{p.id === service.product_id ? ' (current)' : ''}</option>)}
                    </select>
                </Field>
                <Field label="Billing Cycle">
                    <select className="ui-input" value={cycle} onChange={(e) => setCycle(e.target.value)}>
                        {product?.prices.map((p) => <option key={p.cycle} value={p.cycle}>{money(p.price, cur)} {label(p.cycle)}</option>)}
                    </select>
                </Field>
                <div className="rounded-xl border border-slate-200 p-4">
                    <div className="mb-2 text-xs font-semibold text-slate-500">Upgrade Summary</div>
                    {options.isError ? <ErrorNote error={options.error} /> : quote ? (
                        <dl className="space-y-1.5 text-sm">
                            <div className="flex justify-between gap-3"><dt className="text-slate-500">Days left on current cycle</dt><dd className="tabular-nums">{quote.days_left} / {quote.cycle_days}</dd></div>
                            <div className="flex justify-between gap-3"><dt className="text-slate-500">Credit for unused days</dt><dd className="tabular-nums">{money(quote.credit, cur)}</dd></div>
                            <div className="flex justify-between gap-3"><dt className="text-slate-500">New recurring amount</dt><dd className="tabular-nums">{money(quote.new_recurring, cur)} {label(cycle)}</dd></div>
                            {quote.new_next_due_date && <div className="flex justify-between gap-3"><dt className="text-slate-500">Next due date</dt><dd className="tabular-nums">{quote.new_next_due_date}</dd></div>}
                            <div className="flex justify-between gap-3 border-t border-slate-200 pt-2 text-base font-semibold"><dt>Upgrade Total Due</dt><dd className="tabular-nums text-[var(--accent)]">{money(quote.amount_due, cur)}</dd></div>
                        </dl>
                    ) : <p className="text-sm text-slate-500">Calculating...</p>}
                </div>
                <p className="text-xs text-slate-500">With something to pay, this creates an order and invoice and the change happens when it is paid. With nothing to pay, it happens now. The server package follows the product.</p>
                <ErrorNote error={create.error} />
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={onClose}>Close</Button>
                    <Button disabled={unchanged || !quote || create.isPending || options.isFetching}>{create.isPending ? 'Creating...' : 'Create Order'}</Button>
                </div>
            </form>
        </Modal>
    );
}

type ClientHit = { id: number; name: string; company: string | null; email: string };

export function TransferModal<T>({ serviceId, currentClientId, onClose, onDone }: { serviceId: number; currentClientId: number; onClose: () => void; onDone: Saved<T> }) {
    const [search, setSearch] = useState('');
    const [term, setTerm] = useState('');
    const [clientId, setClientId] = useState('');
    const hits = useQuery({
        queryKey: ['/clients-transfer', term],
        queryFn: async () => (await api.get<{ data: ClientHit[] }>('/clients', { params: { q: term, per_page: 15 } })).data.data,
        enabled: term.length > 0,
        placeholderData: keepPreviousData,
    });
    const transfer = useMutation({
        mutationFn: async () => (await api.post<T>(`/services/${serviceId}/transfer`, { client_id: Number(clientId) })).data,
        onSuccess: onDone,
    });

    useEffect(() => {
        const timer = window.setTimeout(() => setTerm(search.trim()), 250);

        return () => window.clearTimeout(timer);
    }, [search]);

    return (
        <Modal title="Transfer Ownership" onClose={onClose}>
            <form onSubmit={(e) => { e.preventDefault(); ask(`Move this service to client #${clientId}?`, () => transfer.mutate()); }} className="space-y-4">
                <p className="text-sm text-slate-600">Moves this service to another client. Its existing invoices stay with the current client.</p>
                <div className="flex items-end gap-2">
                    <Field label="Client ID"><input className="ui-input w-36" inputMode="numeric" required value={clientId} onChange={(e) => setClientId(e.target.value.replace(/\D/g, ''))} /></Field>
                    <Button disabled={!clientId || Number(clientId) === currentClientId || transfer.isPending}><ArrowRightLeft size={14} /> {transfer.isPending ? 'Moving...' : 'Transfer'}</Button>
                </div>
                <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600" htmlFor="transfer-search">Find a client by name, company or email</label>
                    <div className="relative">
                        <Search size={14} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
                        <input id="transfer-search" className="ui-input pl-8" placeholder="Search as you type" value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <div className="mt-2 max-h-64 overflow-y-auto rounded-xl border border-slate-200">
                        {!term ? <p className="px-3 py-4 text-center text-xs text-slate-500">Results appear here.</p> : (
                            <QueryState query={hits}>
                                {hits.data?.length === 0 ? <p className="px-3 py-4 text-center text-xs text-slate-500">No clients found.</p> : (
                                    <ul className="divide-y divide-slate-100">
                                        {hits.data?.map((c) => (
                                            <li key={c.id}>
                                                <button
                                                    type="button"
                                                    disabled={c.id === currentClientId}
                                                    onClick={() => setClientId(String(c.id))}
                                                    className={`flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 ${String(c.id) === clientId ? 'bg-[var(--accent-soft)]' : ''}`}
                                                >
                                                    <span className="min-w-0">
                                                        <span className="block truncate font-medium text-slate-900">{c.name}{c.company && c.company !== c.name ? ` (${c.company})` : ''}</span>
                                                        <span className="block truncate text-xs text-slate-500">{c.email}</span>
                                                    </span>
                                                    <span className="flex shrink-0 items-center gap-1 text-xs text-slate-500 tabular-nums">#{c.id}{String(c.id) === clientId && <Check size={14} className="text-[var(--accent)]" />}</span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </QueryState>
                        )}
                    </div>
                </div>
                <ErrorNote error={transfer.error} />
            </form>
        </Modal>
    );
}

const generate = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    const bytes = crypto.getRandomValues(new Uint32Array(16));

    return Array.from(bytes, (b) => chars[b % chars.length]).join('');
};

export function ChangePasswordModal<T>({ serviceId, username, onClose, onDone }: { serviceId: number; username: string | null; onClose: () => void; onDone: Saved<T> }) {
    const [password, setPassword] = useState('');
    const change = useMutation({
        mutationFn: async () => (await api.post<T>(`/services/${serviceId}/password`, { password })).data,
        onSuccess: onDone,
    });

    return (
        <Modal title="Change Password" onClose={onClose}>
            <form onSubmit={(e) => { e.preventDefault(); change.mutate(); }} className="space-y-4">
                <p className="text-sm text-slate-600">Sets a new password for <strong className="font-mono text-slate-900">{username ?? 'this account'}</strong> on the server and saves it here.</p>
                <Field label="New password" hint="8 to 64 characters.">
                    <div className="flex gap-2">
                        <input className="ui-input font-mono" required minLength={8} maxLength={64} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
                        <Button type="button" variant="ghost" className="shrink-0" onClick={() => setPassword(generate())}><RefreshCw size={14} /> Generate</Button>
                    </div>
                </Field>
                {change.isPending && <Progress label="Changing the password on the server..." />}
                <ErrorNote error={change.error} />
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button disabled={change.isPending}><KeyRound size={14} /> {change.isPending ? 'Changing...' : 'Change Password'}</Button>
                </div>
            </form>
        </Modal>
    );
}
