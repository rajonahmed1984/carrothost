import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowLeft, ArrowUp, ArrowUpDown, LifeBuoy, Pencil, Plus, ReceiptText, Search, Send, Trash2, Wallet } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { api, errorMessage, money } from '../api';
import { Button, ErrorNote, Field, Input, Modal, Status } from '../ui';
import type { Detail, EmailRow, InvoiceRow, TicketRow, TransactionRow } from './client';
import { DomainView } from './domain-view';
import { ServiceView } from './service-view';
import { TicketView } from './support';
import { InvoiceView } from './invoice-view';
import { alertDialog, ask } from '../dialog';

/* The client profile tabs, in the panel's own look: cards, pale headers, pills and text actions. */

export const day = (iso: string | null | undefined) => {
    if (!iso) return '-';
    const d = iso.length > 10 ? new Date(iso) : new Date(`${iso}T00:00:00`);

    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};
export const dayTime = (iso: string) => `${day(iso)} ${new Date(iso).toTimeString().slice(0, 5)}`;

export type RecordColumn<T> = { header: string; cell: (row: T) => ReactNode; sort?: (row: T) => string | number; align?: 'right'; wrap?: boolean };

/**
 * A searchable, sortable list in a card, matching PagedTable. Rows can be ticked, and the
 * "With N selected" bar appears above the table. Below md each row becomes a card.
 */
export function RecordsTable<T extends { id: number }>({ rows, columns, empty, noun, search, selected, onSelect, bulk, action, initialSort }: {
    rows: T[];
    columns: RecordColumn<T>[];
    empty: string;
    noun: string;
    search?: { placeholder: string; text: (row: T) => string };
    selected?: number[];
    onSelect?: (ids: number[]) => void;
    /** Buttons for the "With N selected" bar. */
    bulk?: ReactNode;
    action?: ReactNode;
    initialSort?: { index: number; desc: boolean };
}) {
    const perPage = 25;
    const [page, setPage] = useState(1);
    const [query, setQuery] = useState('');
    const [sort, setSort] = useState(initialSort ?? { index: -1, desc: false });
    const sortBy = columns[sort.index]?.sort;
    const found = rows
        .filter((r) => !query || search?.text(r).toLowerCase().includes(query.trim().toLowerCase()))
        .sort((a, b) => {
            if (!sortBy) return 0;
            const [x, y] = [sortBy(a), sortBy(b)];

            return (x < y ? -1 : x > y ? 1 : 0) * (sort.desc ? -1 : 1);
        });
    const pages = Math.max(1, Math.ceil(found.length / perPage));
    const current = Math.min(page, pages);
    const shown = found.slice((current - 1) * perPage, current * perPage);
    const ticks = selected ?? [];
    const allTicked = shown.length > 0 && shown.every((r) => ticks.includes(r.id));
    const tickAll = () => onSelect?.(allTicked ? ticks.filter((id) => !shown.some((r) => r.id === id)) : [...new Set([...ticks, ...shown.map((r) => r.id)])]);
    const tick = (row: T) => onSelect && (
        <input type="checkbox" aria-label={`Select #${row.id}`} className="cursor-pointer" checked={ticks.includes(row.id)} onChange={(e) => onSelect(e.target.checked ? [...ticks, row.id] : ticks.filter((id) => id !== row.id))} />
    );
    const [heading, ...rest] = columns;

    return (
        <section className="card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                    {search && (
                        <div className="relative w-full max-w-sm">
                            <input type="search" aria-label={search.placeholder} className="ui-input pr-9" placeholder={search.placeholder} value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
                            <Search size={14} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-slate-400" />
                        </div>
                    )}
                    <span className="hidden text-xs whitespace-nowrap text-slate-500 sm:inline">Total {noun}: {found.length}</span>
                </div>
                {action}
            </div>

            {onSelect && ticks.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-600">
                    <span className="font-semibold">With {ticks.length} selected:</span>
                    {bulk}
                    <Button type="button" variant="link" onClick={() => onSelect([])}>Clear</Button>
                </div>
            )}

            {shown.length === 0 ? <p className="p-6 text-center text-sm text-slate-500">{query ? 'Nothing matches your search.' : empty}</p> : (
                <>
                    <div className="divide-y divide-slate-200 md:hidden">
                        {onSelect && <label className="flex items-center gap-2 px-4 py-2 text-xs text-slate-600"><input type="checkbox" checked={allTicked} onChange={tickAll} /> Select all on this page</label>}
                        {shown.map((row) => (
                            <div key={row.id} className="flex flex-col gap-2 p-4">
                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">{tick(row)}{heading.cell(row)}</div>
                                {rest.map((c, i) => {
                                    const value = c.cell(row);

                                    return c.header ? (
                                        <div key={c.header} className="flex items-start justify-between gap-4 text-xs">
                                            <span className="text-[10px] font-semibold text-slate-400 uppercase">{c.header}</span>
                                            <span className="text-right text-slate-700">{value}</span>
                                        </div>
                                    ) : <div key={`actions-${i}`} className="flex justify-end border-t border-slate-100 pt-2">{value}</div>;
                                })}
                            </div>
                        ))}
                    </div>
                    <div className="hidden overflow-x-auto md:block">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 text-[11px] text-slate-500 uppercase">
                                    {onSelect && <th className="w-8 px-4 py-3"><input type="checkbox" aria-label="Select all on this page" className="cursor-pointer" checked={allTicked} onChange={tickAll} /></th>}
                                    {columns.map((c, i) => (
                                        <th key={c.header || `col-${i}`} className={`px-4 py-3 font-semibold whitespace-nowrap ${c.align === 'right' ? 'text-right' : ''}`}>
                                            {c.sort ? (
                                                <button type="button" className={`inline-flex cursor-pointer items-center gap-1 uppercase hover:text-slate-800 ${sort.index === i ? 'text-slate-800' : ''}`} onClick={() => setSort({ index: i, desc: sort.index === i ? !sort.desc : false })}>
                                                    {c.header}{sort.index === i ? (sort.desc ? <ArrowDown size={11} /> : <ArrowUp size={11} />) : <ArrowUpDown size={11} className="opacity-40" />}
                                                </button>
                                            ) : c.header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {shown.map((row) => (
                                    <tr key={row.id} className={`border-b border-slate-100 last:border-0 hover:bg-slate-50/70 ${ticks.includes(row.id) ? 'bg-[var(--accent-soft)]/40' : ''}`}>
                                        {onSelect && <td className="w-8 px-4 py-3 align-middle">{tick(row)}</td>}
                                        {columns.map((c, i) => (
                                            <td key={c.header || `col-${i}`} className={`px-4 py-3 align-middle text-slate-700 ${c.align === 'right' ? 'text-right tabular-nums' : ''} ${c.wrap ? '' : 'whitespace-nowrap'}`}>{c.cell(row)}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {pages > 1 && (
                <footer className="flex items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
                    <span>Page {current} of {pages}</span>
                    <span className="flex gap-2">
                        <Button variant="ghost" disabled={current <= 1} onClick={() => setPage(current - 1)}>Previous</Button>
                        <Button variant="ghost" disabled={current >= pages} onClick={() => setPage(current + 1)}>Next</Button>
                    </span>
                </footer>
            )}
        </section>
    );
}

/** Summary numbers above a list, as on the dashboard. */
export function StatCards({ items }: { items: { label: string; value: ReactNode; icon: ReactNode; tone: string }[] }) {
    return (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {items.map((s) => (
                <div key={s.label} className="card flex items-center gap-4 p-4">
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${s.tone}`}>{s.icon}</span>
                    <div className="min-w-0">
                        <div className="text-xs text-slate-500">{s.label}</div>
                        <div className="truncate text-xl font-semibold text-slate-900 tabular-nums">{s.value}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export function Notice({ text, onClose, tone = 'success' }: { text: ReactNode; onClose: () => void; tone?: 'success' | 'warning' }) {
    const style = tone === 'warning'
        ? 'border-amber-200 bg-amber-50 text-amber-900'
        : 'border-emerald-200 bg-emerald-50 text-emerald-900';

    return (
        <p role="status" className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-2.5 text-sm ${style}`}>
            <span>{text}</span>
            <button type="button" aria-label="Dismiss" className={`cursor-pointer ${tone === 'warning' ? 'text-amber-700' : 'text-emerald-700'}`} onClick={onClose}>×</button>
        </p>
    );
}

/** Row actions as the theme's text links, separated by dots. */
export function RowActions({ children }: { children: ReactNode }) {
    return <span className="inline-flex items-center gap-3">{children}</span>;
}

function useRefresh(clientId: number) {
    const qc = useQueryClient();

    return () => {
        qc.invalidateQueries({ queryKey: ['/clients', String(clientId)] });
        qc.invalidateQueries({ queryKey: ['/invoices'] });
        qc.invalidateQueries({ queryKey: ['/transactions'] });
        qc.invalidateQueries({ queryKey: ['badges'] });
    };
}

/** Top bar of a record opened inside a tab: back arrow, icon, title, status and actions. */
export function ViewHeader({ onBack, backLabel, icon, title, status, meta, children }: { onBack: () => void; backLabel: string; icon: ReactNode; title: ReactNode; status?: ReactNode; meta?: ReactNode; children?: ReactNode }) {
    return (
        <section className="card flex flex-wrap items-center gap-3 px-4 py-3">
            <button type="button" onClick={onBack} className="icon-btn h-9 w-9" aria-label={backLabel}><ArrowLeft size={16} /></button>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">{icon}</span>
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><h2 className="truncate text-lg font-semibold text-slate-900">{title}</h2>{status}</div>
                {meta && <div className="text-xs text-slate-500">{meta}</div>}
            </div>
            {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
        </section>
    );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="card p-4">
            <div className="text-xs font-semibold text-slate-500">{label}</div>
            <div className="mt-1 text-sm break-words text-slate-800">{children}</div>
        </div>
    );
}

/* ---------- Products/Services and Domains ---------- */

type Viewer = { open: number | null; onOpen: (id: number | null, edit?: boolean) => void; edit?: boolean };
/** Opens a record in another tab of the client profile, e.g. a payment's invoice. */
type GoTo = (tab: string, id: number) => void;

/** A text button styled like the table links, opening the record inside the tab. */
export const OpenLink = ({ onClick, children, className = '' }: { onClick: () => void; children: ReactNode; className?: string }) => (
    <button type="button" onClick={onClick} className={`table-action-link cursor-pointer ${className}`}>{children}</button>
);

export function ServicesTab({ client, open, onOpen }: { client: Detail } & Viewer) {
    if (open) return <ServiceView id={open} onSelect={onOpen} onBack={() => onOpen(null)} />;

    return (
        <RecordsTable
            rows={client.services}
            noun="services"
            empty="No products or services."
            search={{ placeholder: 'Product, domain or status', text: (s) => `${s.product.name} ${s.domain ?? ''} ${s.status}` }}
            initialSort={{ index: 0, desc: true }}
            action={<Link to={`/admin/active-orders?client=${client.id}`} className="ui-btn ui-btn-primary"><Plus size={14} /> Add New Order</Link>}
            columns={[
                { header: 'ID', cell: (s) => <OpenLink className="font-semibold tabular-nums" onClick={() => onOpen(s.id)}>{s.id}</OpenLink>, sort: (s) => s.id },
                { header: 'Product/Service', cell: (s) => <OpenLink className="font-semibold" onClick={() => onOpen(s.id)}>{s.product.name}</OpenLink>, sort: (s) => s.product.name },
                { header: 'Domain', cell: (s) => s.domain ?? '-', sort: (s) => s.domain ?? '' },
                { header: 'Pricing', cell: (s) => <>{money(s.recurring_amount, client.currency)} <span className="text-xs text-slate-400 capitalize">/ {s.cycle}</span></>, sort: (s) => Number(s.recurring_amount), align: 'right' },
                { header: 'Next Due', cell: (s) => day(s.next_due_date), sort: (s) => s.next_due_date ?? '' },
                { header: 'Server', cell: (s) => s.server?.name ?? '-' },
                { header: 'Status', cell: (s) => <Status value={s.status} />, sort: (s) => s.status },
                { header: 'Setup', cell: (s) => <Status value={s.provision_status} /> },
                { header: '', cell: (s) => <OpenLink onClick={() => onOpen(s.id)}>View</OpenLink>, align: 'right' },
            ]}
        />
    );
}

export function DomainsTab({ client, open, onOpen }: { client: Detail } & Viewer) {
    if (open) return <DomainView id={open} onSelect={onOpen} onBack={() => onOpen(null)} />;

    return (
        <RecordsTable
            rows={client.domains}
            noun="domains"
            empty="No domains."
            search={{ placeholder: 'Domain, registrar or status', text: (d) => `${d.name} ${d.registrar ?? ''} ${d.status}` }}
            initialSort={{ index: 0, desc: true }}
            columns={[
                { header: 'ID', cell: (d) => <OpenLink className="font-semibold tabular-nums" onClick={() => onOpen(d.id)}>{d.id}</OpenLink>, sort: (d) => d.id },
                { header: 'Domain', cell: (d) => <OpenLink className="font-semibold" onClick={() => onOpen(d.id)}>{d.name}</OpenLink>, sort: (d) => d.name },
                { header: 'Type', cell: (d) => <span className="capitalize">{d.action}</span> },
                { header: 'Registrar', cell: (d) => d.registrar ?? 'Manual', sort: (d) => d.registrar ?? '' },
                { header: 'Registered', cell: (d) => day(d.created_at), sort: (d) => d.created_at },
                { header: 'Expires', cell: (d) => day(d.expires_at), sort: (d) => d.expires_at ?? '' },
                { header: 'Renewal', cell: (d) => <>{money(d.recurring_amount, client.currency)} <span className="text-xs text-slate-400">/ {d.years} yr</span></>, sort: (d) => Number(d.recurring_amount), align: 'right' },
                { header: 'Auto Renew', cell: (d) => <Status value={d.auto_renew ? 'on' : 'off'} /> },
                { header: 'Status', cell: (d) => <Status value={d.status} />, sort: (d) => d.status },
                { header: '', cell: (d) => <OpenLink onClick={() => onOpen(d.id)}>View</OpenLink>, align: 'right' },
            ]}
        />
    );
}

/* ---------- Invoices ---------- */

type InvoiceDetail = { id: number; number: string; status: string; due_date: string; total: string; currency: string; items: { id: number; description: string; amount: string; kind: string }[]; payments: unknown[] };

const isCreditLine = (item: InvoiceDetail['items'][number]) => item.description === 'Credit applied' && Number(item.amount) < 0;

export function EditInvoiceForm({ inv, onClose, onSaved }: { inv: Omit<InvoiceDetail, 'payments'>; onClose: () => void; onSaved: () => void }) {
    const credit = inv.items.filter(isCreditLine);
    const [dueDate, setDueDate] = useState(inv.due_date.slice(0, 10));
    const [items, setItems] = useState<{ id?: number; description: string; amount: string }[]>(inv.items.filter((i) => !isCreditLine(i)).map(({ id, description, amount }) => ({ id, description, amount })));
    const save = useMutation({ mutationFn: () => api.put(`/invoices/${inv.id}`, { due_date: dueDate, items }), onSuccess: onSaved });
    const patch = (n: number, change: Partial<(typeof items)[number]>) => setItems(items.map((item, i) => (i === n ? { ...item, ...change } : item)));
    const total = items.reduce((sum, i) => sum + (Number(i.amount) || 0), 0) + credit.reduce((sum, i) => sum + Number(i.amount), 0);

    return (
        <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-3">
            <Field label="Due date"><Input type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></Field>
            {items.map((item, i) => (
                <div key={item.id ?? `new-${i}`} className="grid grid-cols-[1fr_8rem_auto] items-end gap-2">
                    <Field label="Description"><Input required maxLength={255} value={item.description} onChange={(e) => patch(i, { description: e.target.value })} /></Field>
                    <Field label="Amount"><Input type="number" min="0" step="0.01" required value={item.amount} onChange={(e) => patch(i, { amount: e.target.value })} /></Field>
                    <Button type="button" variant="ghost" aria-label="Remove line" disabled={items.length === 1} onClick={() => setItems(items.filter((_, n) => n !== i))}><Trash2 size={14} /></Button>
                </div>
            ))}
            <Button type="button" variant="ghost" onClick={() => setItems([...items, { description: '', amount: '' }])}><Plus size={14} /> Add line</Button>
            <div className="space-y-1 rounded-xl bg-slate-50 px-4 py-3 text-right text-sm">
                {credit.map((c) => <div key={c.id} className="text-xs text-slate-500">Credit applied: {money(c.amount, inv.currency)}</div>)}
                <div className="font-semibold text-slate-900">Total: {money(total, inv.currency)}</div>
            </div>
            <ErrorNote error={save.error} />
            <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button disabled={save.isPending}>Save changes</Button></div>
        </form>
    );
}

const bulkActions: { key: string; label: string; variant?: 'primary' | 'danger'; confirm?: string }[] = [
    { key: 'mark_paid', label: 'Mark Paid', variant: 'primary', confirm: 'Record a manual payment for the amount owed on the selected unpaid invoices?' },
    { key: 'mark_unpaid', label: 'Mark Unpaid' },
    { key: 'mark_cancelled', label: 'Mark Cancelled', confirm: 'Cancel the selected unpaid invoices? Credit used on them goes back to the client.' },
    { key: 'duplicate', label: 'Duplicate' },
    { key: 'reminder', label: 'Send Reminder' },
    { key: 'merge', label: 'Merge', confirm: 'Merge the selected unpaid invoices into one? The originals are cancelled.' },
    { key: 'mass_pay', label: 'Mass Pay' },
    { key: 'delete', label: 'Delete', variant: 'danger', confirm: 'Delete the selected invoices? Invoices with payments are kept.' },
];

export function InvoicesTab({ client, onCreate, open, onOpen, edit = false, onGo }: { client: Detail; onCreate: () => void; onGo: GoTo } & Viewer) {
    if (open) return <InvoiceView key={open} id={open} clientId={client.id} edit={edit} onOpen={onOpen} onGo={onGo} />;

    return <InvoiceList client={client} onCreate={onCreate} onOpen={onOpen} />;
}

function InvoiceList({ client, onCreate, onOpen }: { client: Detail; onCreate: () => void; onOpen: Viewer['onOpen'] }) {
    const refresh = useRefresh(client.id);
    const [selected, setSelected] = useState<number[]>([]);
    const [notice, setNotice] = useState<{ text: ReactNode; tone?: 'success' | 'warning' } | null>(null);
    const bulk = useMutation({
        mutationFn: async (action: string) => (await api.post<{ message: string; count?: number; invoice_id?: number }>('/invoices/bulk', { invoice_ids: selected, action })).data,
        onMutate: () => setNotice(null),
        onSuccess: (data) => {
            setSelected([]);
            setNotice({
                text: <>{data.message} {data.invoice_id && <OpenLink className="font-semibold underline" onClick={() => onOpen(data.invoice_id!)}>Open it</OpenLink>}</>,
                tone: data.count === 0 ? 'warning' : 'success',
            });
            refresh();
        },
    });
    const remove = useMutation({
        mutationFn: (id: number) => api.delete(`/invoices/${id}`),
        onSuccess: () => { setNotice({ text: 'Invoice deleted.' }); refresh(); },
        onError: (e) => alertDialog(errorMessage(e)),
    });
    const overdue = (i: InvoiceRow) => i.status === 'unpaid' && new Date(`${i.due_date.slice(0, 10)}T23:59:59`) < new Date();

    return (
        <div className="space-y-3">
            {notice && <Notice text={notice.text} tone={notice.tone} onClose={() => setNotice(null)} />}
            <ErrorNote error={bulk.error} />
            <RecordsTable
                rows={client.invoices}
                noun="invoices"
                empty="No invoices."
                selected={selected}
                onSelect={(ids) => { setSelected(ids); if (ids.length === 0) bulk.reset(); }}
                search={{ placeholder: 'Invoice #, amount, status or method', text: (i) => `${i.number} ${i.total} ${i.status} ${i.payment_method ?? ''}` }}
                initialSort={{ index: 2, desc: true }}
                action={<Button type="button" onClick={onCreate}><Plus size={14} /> Create Invoice</Button>}
                bulk={bulkActions.map((a) => (
                    <Button
                        key={a.key}
                        type="button"
                        variant={a.variant ?? 'ghost'}
                        className="h-8 px-3"
                        disabled={bulk.isPending}
                        onClick={() => (a.confirm ? ask(a.confirm, () => bulk.mutate(a.key)) : bulk.mutate(a.key))}
                    >
                        {a.label}
                    </Button>
                ))}
                columns={[
                    { header: 'Invoice #', cell: (i) => <OpenLink className="font-semibold" onClick={() => onOpen(i.id)}>#{i.number}</OpenLink>, sort: (i) => i.id },
                    { header: 'Invoice Date', cell: (i) => day(i.created_at), sort: (i) => i.created_at },
                    { header: 'Due Date', cell: (i) => day(i.due_date), sort: (i) => i.due_date },
                    { header: 'Date Paid', cell: (i) => day(i.paid_at), sort: (i) => i.paid_at ?? '' },
                    { header: 'Total', cell: (i) => <span className="font-semibold text-slate-900">{money(i.total, i.currency)}</span>, sort: (i) => Number(i.total), align: 'right' },
                    { header: 'Payment Method', cell: (i) => i.payment_method ?? '-' },
                    { header: 'Status', cell: (i) => <Status value={overdue(i) ? 'overdue' : i.status} />, sort: (i) => i.status },
                    {
                        header: '',
                        align: 'right',
                        cell: (i) => (
                            <RowActions>
                                <OpenLink onClick={() => onOpen(i.id)}>View</OpenLink>
                                <Button variant="link" onClick={() => onOpen(i.id, true)}>Edit</Button>
                                <Button variant="link-danger" disabled={remove.isPending} onClick={() => ask(`Delete invoice #${i.number}?`, () => remove.mutate(i.id))}>Delete</Button>
                            </RowActions>
                        ),
                    },
                ]}
            />
        </div>
    );
}

/* ---------- Transactions ---------- */

export function TransactionForm({ row, onCancel, onSaved }: { row: TransactionRow; onCancel: () => void; onSaved: () => void }) {
    const [form, setForm] = useState({ date: row.created_at.slice(0, 10), transaction_id: row.transaction_id, fee: row.fee });
    const save = useMutation({ mutationFn: () => api.put(`/transactions/${row.id}`, form), onSuccess: onSaved });

    return (
        <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-3 p-4">
            <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Date"><Input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
                <Field label="Transaction ID"><Input required maxLength={191} value={form.transaction_id} onChange={(e) => setForm({ ...form, transaction_id: e.target.value })} /></Field>
                <Field label="Fees" hint="What the payment provider kept."><Input type="number" min="0" step="0.01" required value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} /></Field>
            </div>
            <p className="text-xs text-slate-500">To change the amount, delete this transaction and record the payment again.</p>
            <ErrorNote error={save.error} />
            <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button><Button disabled={save.isPending}>{save.isPending ? 'Saving...' : 'Save Changes'}</Button></div>
        </form>
    );
}

/** One payment inside the Transactions tab, edited in place. */
function TransactionView({ client, row, edit, onOpen, onGo }: { client: Detail; row: TransactionRow | undefined; edit: boolean; onOpen: Viewer['onOpen']; onGo: GoTo }) {
    const refresh = useRefresh(client.id);
    const [notice, setNotice] = useState('');
    const remove = useMutation({ mutationFn: (id: number) => api.delete(`/transactions/${id}`), onSuccess: () => { refresh(); onOpen(null); }, onError: (e) => alertDialog(errorMessage(e)) });

    if (!row) {
        return (
            <div className="card px-4 py-8 text-center text-sm text-slate-500">
                This transaction is not on this client. <OpenLink onClick={() => onOpen(null)}>Back to transactions</OpenLink>
            </div>
        );
    }

    const amount = Number(row.amount);

    return (
        <div className="space-y-4">
            <ViewHeader
                onBack={() => onOpen(null)}
                backLabel="Back to transactions"
                icon={<Wallet size={18} />}
                title={<span className={amount < 0 ? 'text-rose-600' : ''}>{money(Math.abs(amount), row.currency)} {amount < 0 ? 'refund' : 'payment'}</span>}
                meta={<>{row.gateway_name} · {dayTime(row.created_at)}</>}
            >
                {!edit && <Button variant="ghost" className="h-9" onClick={() => onOpen(row.id, true)}><Pencil size={14} /> Edit</Button>}
                <Button variant="danger" className="h-9" disabled={remove.isPending} onClick={() => ask(`Delete this ${money(row.amount, row.currency)} payment? Invoice #${row.invoice.number} goes back to unpaid if it is no longer covered.`, () => remove.mutate(row.id))}><Trash2 size={14} /> Delete</Button>
            </ViewHeader>
            {notice && <Notice text={notice} onClose={() => setNotice('')} />}
            {edit && (
                <section className="card overflow-hidden">
                    <header className="border-b border-slate-200 px-4 py-3"><h3 className="font-semibold text-slate-900">Edit Transaction</h3></header>
                    <TransactionForm key={row.id} row={row} onCancel={() => onOpen(row.id)} onSaved={() => { setNotice('Transaction updated.'); refresh(); onOpen(row.id); }} />
                </section>
            )}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <Fact label="Date">{dayTime(row.created_at)}</Fact>
                <Fact label="Payment Method">{row.gateway_name}</Fact>
                <Fact label="Transaction ID"><span className="font-mono">{row.transaction_id || '-'}</span></Fact>
                <Fact label={amount < 0 ? 'Amount Out' : 'Amount In'}><span className={`text-lg font-semibold tabular-nums ${amount < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>{money(Math.abs(amount), row.currency)}</span></Fact>
                <Fact label="Fees"><span className="tabular-nums">{money(row.fee, row.currency)}</span></Fact>
                <Fact label="Invoice"><OpenLink className="font-semibold" onClick={() => onGo('invoices', row.invoice.id)}>Invoice #{row.invoice.number}</OpenLink></Fact>
            </div>
        </div>
    );
}

export function TransactionsTab({ client, open, onOpen, edit = false, onGo }: { client: Detail; onGo: GoTo } & Viewer) {
    if (open) return <TransactionView client={client} row={client.transactions.find((t) => t.id === open)} edit={edit} onOpen={onOpen} onGo={onGo} />;

    return <TransactionList client={client} onOpen={onOpen} onGo={onGo} />;
}

function TransactionList({ client, onOpen, onGo }: { client: Detail; onOpen: Viewer['onOpen']; onGo: GoTo }) {
    const refresh = useRefresh(client.id);
    const remove = useMutation({
        mutationFn: (id: number) => api.delete(`/transactions/${id}`),
        onSuccess: refresh,
        onError: (e) => alertDialog(errorMessage(e)),
    });
    const t = client.transaction_totals;

    return (
        <div className="space-y-4">
            <StatCards items={[
                { label: 'Total In', value: money(t.in, client.currency), icon: <ArrowDown size={20} />, tone: 'bg-emerald-100 text-emerald-700' },
                { label: 'Total Fees', value: money(t.fees, client.currency), icon: <ReceiptText size={20} />, tone: 'bg-amber-100 text-amber-700' },
                { label: 'Total Out', value: money(t.out, client.currency), icon: <ArrowUp size={20} />, tone: 'bg-rose-100 text-rose-600' },
                { label: 'Balance', value: money(t.balance, client.currency), icon: <Wallet size={20} />, tone: 'bg-[var(--accent-soft)] text-accent' },
            ]} />
            <RecordsTable
                rows={client.transactions}
                noun="transactions"
                empty="No transactions."
                search={{ placeholder: 'Method, transaction ID or invoice', text: (p) => `${p.gateway_name} ${p.transaction_id} ${p.invoice.number} ${p.amount}` }}
                initialSort={{ index: 0, desc: true }}
                columns={[
                    { header: 'Date', cell: (p) => <OpenLink className="tabular-nums" onClick={() => onOpen(p.id)}>{day(p.created_at)}</OpenLink>, sort: (p) => p.created_at },
                    { header: 'Payment Method', cell: (p) => p.gateway_name, sort: (p) => p.gateway_name },
                    {
                        header: 'Description',
                        wrap: true,
                        cell: (p) => <>Invoice Payment <OpenLink onClick={() => onGo('invoices', p.invoice.id)}>#{p.invoice.number}</OpenLink>{p.transaction_id && <span className="block font-mono text-[11px] break-all text-slate-400">{p.transaction_id}</span>}</>,
                    },
                    { header: 'Amount In', cell: (p) => (Number(p.amount) > 0 ? <span className="font-semibold text-emerald-700">{money(p.amount, p.currency)}</span> : '-'), sort: (p) => Number(p.amount), align: 'right' },
                    { header: 'Fees', cell: (p) => (Number(p.fee) > 0 ? money(p.fee, p.currency) : '-'), sort: (p) => Number(p.fee), align: 'right' },
                    { header: 'Amount Out', cell: (p) => (Number(p.amount) < 0 ? <span className="font-semibold text-rose-600">{money(-Number(p.amount), p.currency)}</span> : '-'), align: 'right' },
                    {
                        header: '',
                        align: 'right',
                        cell: (p) => (
                            <RowActions>
                                <OpenLink onClick={() => onOpen(p.id)}>View</OpenLink>
                                <Button variant="link" onClick={() => onOpen(p.id, true)}>Edit</Button>
                                <Button variant="link-danger" disabled={remove.isPending} onClick={() => ask(`Delete this ${money(p.amount, p.currency)} payment? Invoice #${p.invoice.number} goes back to unpaid if it is no longer covered.`, () => remove.mutate(p.id))}>Delete</Button>
                            </RowActions>
                        ),
                    },
                ]}
            />
        </div>
    );
}

/* ---------- Tickets ---------- */

export function TicketsTab({ client, open, onOpen }: { client: Detail } & Viewer) {
    if (open) return <TicketView id={open} onBack={() => onOpen(null)} />;

    const s = client.ticket_stats;
    const stat = (label: string, value: number, tone: string) => ({ label, value, tone, icon: <LifeBuoy size={20} /> });

    return (
        <div className="space-y-4">
            <StatCards items={[
                stat('Opened This Month', s.this_month, 'bg-[var(--accent-soft)] text-accent'),
                stat('Opened Last Month', s.last_month, 'bg-sky-100 text-sky-700'),
                stat('Opened This Year', s.this_year, 'bg-emerald-100 text-emerald-700'),
                stat('Opened Last Year', s.last_year, 'bg-slate-100 text-slate-600'),
            ]} />
            <RecordsTable<TicketRow>
                rows={client.tickets ?? []}
                noun="tickets"
                empty="This client has not opened any tickets."
                search={{ placeholder: 'Ticket # or subject', text: (t) => `${t.number} ${t.subject}` }}
                initialSort={{ index: 0, desc: true }}
                action={<Link to={`/admin/tickets?client=${client.id}`} className="ui-btn ui-btn-secondary">All tickets</Link>}
                columns={[
                    { header: 'Date Opened', cell: (t) => dayTime(t.created_at), sort: (t) => t.created_at },
                    { header: 'Department', cell: (t) => t.department_name, sort: (t) => t.department_name },
                    { header: 'Subject', wrap: true, cell: (t) => <OpenLink className="text-left" onClick={() => onOpen(t.id)}><span className="text-slate-400">#{t.number}</span> {t.subject}</OpenLink>, sort: (t) => t.subject },
                    { header: 'Status', cell: (t) => <Status value={t.status} />, sort: (t) => t.status },
                    { header: 'Last Reply', cell: (t) => (t.last_reply_at ? dayTime(t.last_reply_at) : '-'), sort: (t) => t.last_reply_at ?? '' },
                    { header: '', cell: (t) => <OpenLink onClick={() => onOpen(t.id)}>View</OpenLink>, align: 'right' },
                ]}
            />
        </div>
    );
}

/* ---------- Emails ---------- */

export function EmailsTab({ client }: { client: Detail }) {
    const refresh = useRefresh(client.id);
    const [viewing, setViewing] = useState<EmailRow | null>(null);
    const [notice, setNotice] = useState('');
    const resend = useMutation({
        mutationFn: async (id: number) => (await api.post<{ message: string }>(`/clients/${client.id}/emails/${id}/resend`)).data,
        onSuccess: (data) => { setNotice(data.message); refresh(); },
        onError: (e) => alertDialog(errorMessage(e)),
    });
    const remove = useMutation({ mutationFn: (id: number) => api.delete(`/clients/${client.id}/emails/${id}`), onSuccess: refresh });

    return (
        <div className="space-y-3">
            {notice && <Notice text={notice} onClose={() => setNotice('')} />}
            <RecordsTable<EmailRow>
                rows={client.emails ?? []}
                noun="emails"
                empty="No emails sent to this client yet."
                search={{ placeholder: 'Subject or address', text: (e) => `${e.subject} ${e.to}` }}
                initialSort={{ index: 0, desc: true }}
                columns={[
                    { header: 'Date', cell: (e) => dayTime(e.created_at), sort: (e) => e.created_at },
                    { header: 'Subject', wrap: true, cell: (e) => <Button variant="link" className="text-left whitespace-normal" onClick={() => setViewing(e)}>{e.subject}</Button>, sort: (e) => e.subject },
                    { header: 'To', cell: (e) => <span className="text-xs text-slate-500">{e.to}</span> },
                    {
                        header: '',
                        align: 'right',
                        cell: (e) => (
                            <RowActions>
                                <Button variant="link" onClick={() => setViewing(e)}>View</Button>
                                <Button variant="link" disabled={resend.isPending} onClick={() => ask(`Send "${e.subject}" to ${e.to} again?`, () => resend.mutate(e.id))}>Resend</Button>
                                <Button variant="link-danger" disabled={remove.isPending} onClick={() => ask('Delete this email from the log? The client will no longer see it in My Emails.', () => remove.mutate(e.id))}>Delete</Button>
                            </RowActions>
                        ),
                    },
                ]}
            />
            {viewing && (
                <Modal wide title={viewing.subject} onClose={() => setViewing(null)}>
                    <div className="space-y-3">
                        <p className="text-xs text-slate-500">To {viewing.to} on {dayTime(viewing.created_at)}</p>
                        {viewing.body
                            ? <iframe title={viewing.subject} sandbox="allow-popups allow-popups-to-escape-sandbox" srcDoc={`<base target="_blank">${viewing.body}`} className="h-[28rem] w-full rounded-xl border border-slate-200 bg-white" />
                            : <p className="text-sm text-slate-500">No copy of this email's content was kept.</p>}
                        <div className="flex justify-end"><Button variant="ghost" disabled={resend.isPending} onClick={() => resend.mutate(viewing.id)}><Send size={14} /> Resend</Button></div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
