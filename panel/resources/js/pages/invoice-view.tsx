import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ban, ChevronDown, Download, Eye, FileText, HandCoins, Mail, NotebookPen, Pencil, Plus, Printer, ReceiptText, RotateCcw, Trash2, Wallet } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { api, basePath, errorMessage, money } from '../api';
import { Button, Dropdown, ErrorNote, Field, Input, QueryState, Status, useBranding } from '../ui';
import { day, dayTime, EditInvoiceForm, Notice, OpenLink, ViewHeader } from './client-tabs';
import { alertDialog, ask } from '../dialog';

/* One invoice inside the client's Invoices tab, in the panel's own look. */

type Payment = { id: number; gateway: string; gateway_name: string; transaction_id: string; amount: string; fee: string; currency: string; created_at: string; refund_of: number | null };

export type InvoiceFull = {
    id: number; number: string; status: string; currency: string; total: string; due_date: string; paid_at: string | null; created_at: string;
    admin_notes: string | null; subtotal: string; credit_applied: string; balance: string; payment_method: string | null;
    client: { id: number; name: string; company: string | null; email: string; phone: string | null; address: string | null; city: string | null; country: string | null; credit_balance: string; status: string };
    items: { id: number; description: string; amount: string; kind: string }[];
    payments: Payment[];
    attempts: { id: number; reference: string; external_id: string | null; amount: string; status: string; failure_reason: string | null; created_at: string; gateway_name: string }[];
    gateways: { code: string; name: string }[];
    company: { name: string; email: string | null; pay_to: string | null };
};

type Tab = 'summary' | 'payment' | 'credit' | 'refund' | 'notes';
const tabs: { key: Tab; label: string; icon: ReactNode }[] = [
    { key: 'summary', label: 'Summary', icon: <ReceiptText size={14} /> },
    { key: 'payment', label: 'Add Payment', icon: <Plus size={14} /> },
    { key: 'credit', label: 'Credit', icon: <Wallet size={14} /> },
    { key: 'refund', label: 'Refund', icon: <RotateCcw size={14} /> },
    { key: 'notes', label: 'Notes', icon: <NotebookPen size={14} /> },
];
const statusTone: Record<string, string> = { paid: 'text-emerald-600', unpaid: 'text-rose-600', overdue: 'text-rose-600', refunded: 'text-sky-600', cancelled: 'text-slate-500' };

const isOverdue = (inv: InvoiceFull) => inv.status === 'unpaid' && new Date(`${inv.due_date.slice(0, 10)}T23:59:59`) < new Date();
const today = () => new Date().toISOString().slice(0, 10);

function Card({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
    return (
        <section className="card overflow-hidden">
            <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
                <h3 className="font-semibold text-slate-900">{title}</h3>
                {action}
            </header>
            {children}
        </section>
    );
}

/** A plain, printable copy of the invoice in its own window. "Download" is the same with Save as PDF. */
function printInvoice(inv: InvoiceFull, brand: string, download: boolean) {
    const esc = (v: string | null | undefined) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
    const m = (v: string | number) => esc(money(v, inv.currency));
    const status = isOverdue(inv) ? 'overdue' : inv.status;
    const rows = inv.items.map((i) => `<tr><td>${esc(i.description)}</td><td class="r">${m(i.amount)}</td></tr>`).join('');
    const pays = inv.payments.map((p) => `<tr><td>${esc(dayTime(p.created_at))}</td><td>${esc(p.gateway_name)}</td><td>${esc(p.transaction_id)}</td><td class="r">${m(p.amount)}</td></tr>`).join('');
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Invoice-${esc(inv.number)}</title><style>
        body{font:14px/1.5 'Segoe UI',Arial,sans-serif;color:#0f172a;margin:40px}h1{margin:0;font-size:22px}.muted{color:#64748b}
        .top{display:flex;justify-content:space-between;gap:24px;margin-bottom:28px}.status{font-size:20px;font-weight:700;text-transform:uppercase}
        .paid{color:#059669}.unpaid,.overdue{color:#e11d48}.refunded{color:#0284c7}.cancelled{color:#64748b}
        table{width:100%;border-collapse:collapse;margin:12px 0 24px}th,td{padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:left}
        th{background:#f8fafc;font-size:12px;color:#475569}.r{text-align:right}.tot td{font-weight:700;border-bottom:0}
        .grid{display:flex;gap:40px;margin-bottom:24px}@media print{body{margin:0}}
    </style></head><body>
        <div class="top"><div><h1>${esc(brand)}</h1>${inv.company.pay_to ? `<div class="muted">${esc(inv.company.pay_to).replace(/\n/g, '<br>')}</div>` : ''}${inv.company.email ? `<div class="muted">${esc(inv.company.email)}</div>` : ''}</div>
        <div style="text-align:right"><div class="status ${status}">${esc(status)}</div><h1>Invoice #${esc(inv.number)}</h1><div class="muted">Invoice date ${esc(day(inv.created_at))}<br>Due date ${esc(day(inv.due_date))}</div></div></div>
        <div class="grid"><div><strong>Invoiced to</strong><br>${esc(inv.client.name)}${inv.client.company ? `<br>${esc(inv.client.company)}` : ''}${inv.client.address ? `<br>${esc(inv.client.address)}` : ''}${inv.client.city ? `<br>${esc(inv.client.city)}` : ''}<br>${esc(inv.client.email)}</div></div>
        <table><thead><tr><th>Description</th><th class="r">Amount</th></tr></thead><tbody>${rows}</tbody>
        <tfoot><tr><td class="r">Sub Total</td><td class="r">${m(inv.subtotal)}</td></tr><tr><td class="r">Credit</td><td class="r">${m(inv.credit_applied)}</td></tr><tr class="tot"><td class="r">Total</td><td class="r">${m(inv.total)}</td></tr></tfoot></table>
        ${pays ? `<strong>Transactions</strong><table><thead><tr><th>Date</th><th>Method</th><th>Transaction ID</th><th class="r">Amount</th></tr></thead><tbody>${pays}</tbody></table>` : ''}
        <div class="r"><strong>Balance: ${m(inv.balance)}</strong></div>
        ${download ? '<p class="muted" style="margin-top:32px">To save a PDF, choose "Save as PDF" as the printer.</p>' : ''}
    </body></html>`;
    const win = window.open('', '_blank');
    if (!win) return alertDialog('Allow pop-ups for this site to print the invoice.');
    win.document.write(html);
    win.document.close();
    win.focus();
    win.setTimeout(() => win.print(), 250);
}

export function InvoiceView({ id, clientId, edit, onOpen, onGo }: {
    id: number; clientId: number; edit: boolean;
    onOpen: (id: number | null, edit?: boolean) => void;
    onGo: (tab: string, id: number) => void;
}) {
    const query = useQuery({ queryKey: ['/invoices', id], queryFn: async () => (await api.get<InvoiceFull>(`/invoices/${id}`)).data });

    return <QueryState query={query}>{query.data && <InvoiceScreen key={query.data.id} inv={query.data} clientId={clientId} edit={edit} onOpen={onOpen} onGo={onGo} />}</QueryState>;
}

function InvoiceScreen({ inv, clientId, edit, onOpen, onGo }: { inv: InvoiceFull; clientId: number; edit: boolean; onOpen: (id: number | null, edit?: boolean) => void; onGo: (tab: string, id: number) => void }) {
    const qc = useQueryClient();
    const brand = useBranding().name;
    const [tab, setTab] = useState<Tab>('summary');
    const [notice, setNotice] = useState('');
    const [template, setTemplate] = useState(inv.status === 'paid' ? 'paid' : inv.status === 'unpaid' ? 'reminder' : 'created');
    const status = isOverdue(inv) ? 'overdue' : inv.status;
    const editable = inv.status === 'unpaid' && inv.payments.length === 0;
    const refreshAll = () => {
        qc.invalidateQueries({ queryKey: ['/invoices'] });
        qc.invalidateQueries({ queryKey: ['/clients', String(clientId)] });
        qc.invalidateQueries({ queryKey: ['/transactions'] });
    };
    const saved = (data: InvoiceFull, message: string) => {
        qc.setQueryData(['/invoices', inv.id], data);
        refreshAll();
        setNotice(message);
        setTab('summary');
    };
    const email = useMutation({ mutationFn: async () => (await api.post<{ message: string }>(`/invoices/${inv.id}/email`, { template })).data, onSuccess: (d) => setNotice(d.message) });
    const cancel = useMutation({ mutationFn: () => api.post(`/invoices/${inv.id}/cancel`), onSuccess: () => { refreshAll(); setNotice('Invoice cancelled.'); }, onError: (e) => alertDialog(errorMessage(e)) });
    const remove = useMutation({ mutationFn: () => api.delete(`/invoices/${inv.id}`), onSuccess: () => { refreshAll(); onOpen(null); }, onError: (e) => alertDialog(errorMessage(e)) });
    const viewAsClient = useMutation({
        mutationFn: () => api.post(`/clients/${inv.client.id}/impersonate`),
        onSuccess: () => window.location.assign(`${basePath}/invoices/${inv.id}`),
        onError: (e) => alertDialog(errorMessage(e)),
    });
    const menuItem = 'flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left text-slate-700 hover:bg-slate-50';

    return (
        <div className="space-y-4">
            <ViewHeader
                onBack={() => onOpen(null)}
                backLabel="Back to invoices"
                icon={<ReceiptText size={18} />}
                title={`Invoice #${inv.number}`}
                status={<Status value={status} />}
                meta={<>{inv.client.name} · Due {day(inv.due_date)} · {money(inv.total, inv.currency)}</>}
            >
                {editable && !edit && <Button variant="ghost" className="h-9" onClick={() => onOpen(inv.id, true)}><Pencil size={14} /> Manage Invoice</Button>}
                <Button
                    variant="ghost"
                    className="h-9"
                    disabled={viewAsClient.isPending || inv.client.status !== 'active'}
                    title={inv.client.status !== 'active' ? 'Only an active client can be viewed as.' : undefined}
                    onClick={() => ask(`View this invoice as ${inv.client.name}? You will be signed in as the client until you return to the admin area.`, () => viewAsClient.mutate())}
                >
                    <Eye size={14} /> View as Client
                </Button>
                <Button variant="ghost" className="h-9" onClick={() => printInvoice(inv, brand, false)}><Printer size={14} /> Print</Button>
                <Button variant="ghost" className="h-9" onClick={() => printInvoice(inv, brand, true)}><Download size={14} /> Download</Button>
                {(editable || inv.payments.length === 0) && (
                    <Dropdown label="More invoice actions" buttonClassName="ui-btn ui-btn-secondary h-9" button={<>More <ChevronDown size={14} /></>} menuClassName="w-48 py-1 text-sm">
                        {editable && <button type="button" role="menuitem" disabled={cancel.isPending} onClick={() => ask(`Cancel invoice #${inv.number}?`, () => cancel.mutate())} className={menuItem}><Ban size={14} className="text-slate-400" /> Cancel Invoice</button>}
                        <button type="button" role="menuitem" disabled={remove.isPending} onClick={() => ask(`Delete invoice #${inv.number}?`, () => remove.mutate())} className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left text-rose-600 hover:bg-rose-50"><Trash2 size={14} /> Delete</button>
                    </Dropdown>
                )}
            </ViewHeader>

            {notice && <Notice text={notice} onClose={() => setNotice('')} />}

            {edit ? (
                <Card title="Manage Invoice" action={<span className="text-xs text-slate-500">Changes apply when you save</span>}>
                    <div className="p-4">
                        {editable
                            ? <EditInvoiceForm inv={inv} onClose={() => onOpen(inv.id)} onSaved={() => { setNotice('Invoice updated.'); refreshAll(); onOpen(inv.id); }} />
                            : <p className="text-sm text-slate-600">Only an unpaid invoice with no payments can be edited. Delete its transactions first.</p>}
                    </div>
                </Card>
            ) : (
                <>
                    <nav className="flex gap-1 overflow-x-auto border-b border-slate-200" aria-label="Invoice sections">
                        {tabs.map((t) => (
                            <button
                                key={t.key}
                                type="button"
                                onClick={() => setTab(t.key)}
                                aria-current={tab === t.key ? 'page' : undefined}
                                className={`-mb-px flex shrink-0 cursor-pointer items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition ${tab === t.key ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                            >
                                {t.icon}{t.label}
                            </button>
                        ))}
                    </nav>

                    {tab === 'summary' && (
                        <div className="space-y-4">
                            <div className="grid items-start gap-4 lg:grid-cols-2">
                                <Card title="Invoice Details">
                                    <dl className="divide-y divide-slate-100 text-sm">
                                        {([
                                            ['Client Name', <span key="c">{inv.client.name} <OpenLink onClick={() => onOpen(null)}>(View Invoices)</OpenLink></span>],
                                            ['Invoice Date', day(inv.created_at)],
                                            ['Due Date', day(inv.due_date)],
                                            ['Invoice Amount', <span key="t" className="font-semibold tabular-nums">{money(inv.total, inv.currency)}</span>],
                                            ['Balance', <span key="b" className={`font-semibold tabular-nums ${Number(inv.balance) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{money(inv.balance, inv.currency)}</span>],
                                        ] as [string, ReactNode][]).map(([k, v]) => (
                                            <div key={k} className="grid grid-cols-[9rem_1fr] gap-3 px-4 py-2.5"><dt className="text-slate-500">{k}</dt><dd className="min-w-0 text-slate-800">{v}</dd></div>
                                        ))}
                                    </dl>
                                </Card>
                                <section className="card flex flex-col items-center justify-center gap-3 p-6 text-center">
                                    <div className={`text-2xl font-bold tracking-wide uppercase ${statusTone[status] ?? 'text-slate-700'}`}>{status}</div>
                                    <div className="text-sm text-slate-600">Payment Method: <strong className="text-slate-900">{inv.payment_method ?? 'None yet'}</strong></div>
                                    <form onSubmit={(e) => { e.preventDefault(); email.mutate(); }} className="flex w-full max-w-md flex-wrap justify-center gap-2">
                                        <label className="sr-only" htmlFor={`tpl-${inv.id}`}>Email template</label>
                                        <select id={`tpl-${inv.id}`} className="ui-input h-9 min-w-0 flex-1" value={template} onChange={(e) => setTemplate(e.target.value)}>
                                            <option value="created">Invoice Created</option>
                                            <option value="reminder" disabled={inv.status !== 'unpaid'}>Invoice Payment Reminder</option>
                                            <option value="paid" disabled={inv.status !== 'paid'}>Invoice Payment Confirmation</option>
                                        </select>
                                        <Button variant="ghost" className="h-9" disabled={email.isPending}><Mail size={14} /> {email.isPending ? 'Sending...' : 'Send Email'}</Button>
                                    </form>
                                    <ErrorNote error={email.error} />
                                </section>
                            </div>

                            <Card title="Invoice Items">
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[30rem] text-sm">
                                        <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500"><tr><th className="px-4 py-2">Description</th><th className="px-4 py-2 text-right">Amount</th></tr></thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {inv.items.filter((i) => !(i.description === 'Credit applied' && Number(i.amount) < 0)).map((i) => (
                                                <tr key={i.id}><td className="px-4 py-2.5 text-slate-800">{i.description}</td><td className="px-4 py-2.5 text-right whitespace-nowrap tabular-nums">{money(i.amount, inv.currency)}</td></tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="border-t border-slate-200 bg-slate-50/60">
                                            <tr><td className="px-4 py-1.5 text-right text-slate-500">Sub Total</td><td className="px-4 py-1.5 text-right tabular-nums">{money(inv.subtotal, inv.currency)}</td></tr>
                                            <tr><td className="px-4 py-1.5 text-right text-slate-500">Credit</td><td className="px-4 py-1.5 text-right tabular-nums">{money(inv.credit_applied, inv.currency)}</td></tr>
                                            <tr><td className="px-4 pt-1.5 pb-3 text-right font-semibold text-slate-900">Total Due</td><td className="px-4 pt-1.5 pb-3 text-right text-base font-semibold text-slate-900 tabular-nums">{money(inv.total, inv.currency)}</td></tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </Card>

                            <Card title="Transactions">
                                {inv.payments.length === 0 ? <p className="px-4 py-5 text-center text-sm text-slate-500">No transactions yet.</p> : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[40rem] text-sm">
                                            <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500"><tr><th className="px-4 py-2">Date</th><th className="px-4 py-2">Payment Method</th><th className="px-4 py-2">Transaction ID</th><th className="px-4 py-2 text-right">Amount</th><th className="px-4 py-2 text-right">Fees</th></tr></thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {inv.payments.map((p) => (
                                                    <tr key={p.id} className="hover:bg-slate-50/60">
                                                        <td className="px-4 py-2.5 tabular-nums"><OpenLink onClick={() => onGo('transactions', p.id)}>{dayTime(p.created_at)}</OpenLink></td>
                                                        <td className="px-4 py-2.5">{p.gateway_name}{p.refund_of && <span className="ml-1.5 rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-sky-700">Refund</span>}</td>
                                                        <td className="px-4 py-2.5 font-mono text-xs break-all text-slate-600">{p.transaction_id}</td>
                                                        <td className={`px-4 py-2.5 text-right font-semibold tabular-nums ${Number(p.amount) < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>{money(p.amount, p.currency)}</td>
                                                        <td className="px-4 py-2.5 text-right tabular-nums">{money(p.fee, p.currency)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </Card>

                            <Card title="Transaction History" action={<span className="text-xs text-slate-500">Online payment attempts</span>}>
                                {inv.attempts.length === 0 ? <p className="px-4 py-5 text-center text-sm text-slate-500">No records found.</p> : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[40rem] text-sm">
                                            <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500"><tr><th className="px-4 py-2">Date</th><th className="px-4 py-2">Payment Method</th><th className="px-4 py-2">Transaction ID</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Description</th></tr></thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {inv.attempts.map((a) => (
                                                    <tr key={a.id}>
                                                        <td className="px-4 py-2.5 tabular-nums">{dayTime(a.created_at)}</td>
                                                        <td className="px-4 py-2.5">{a.gateway_name}</td>
                                                        <td className="px-4 py-2.5 font-mono text-xs break-all text-slate-600">{a.external_id ?? a.reference}</td>
                                                        <td className="px-4 py-2.5"><Status value={a.status} /></td>
                                                        <td className="px-4 py-2.5 text-slate-600">{a.failure_reason ?? `${money(a.amount, inv.currency)} payment`}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </Card>
                        </div>
                    )}

                    {tab === 'payment' && <AddPayment inv={inv} onSaved={(d) => saved(d, 'Payment added.')} />}
                    {tab === 'credit' && <CreditTab inv={inv} onSaved={saved} />}
                    {tab === 'refund' && <RefundTab inv={inv} onSaved={(d) => saved(d, 'Refund recorded.')} />}
                    {tab === 'notes' && <NotesTab inv={inv} onSaved={(d) => saved(d, 'Notes saved.')} />}
                </>
            )}
        </div>
    );
}

function AddPayment({ inv, onSaved }: { inv: InvoiceFull; onSaved: (d: InvoiceFull) => void }) {
    const [form, setForm] = useState({ date: today(), gateway: 'manual', transaction_id: '', amount: Number(inv.balance) > 0 ? inv.balance : '', fee: '0.00' });
    const pay = useMutation({ mutationFn: async () => (await api.post<InvoiceFull>(`/invoices/${inv.id}/payments`, form)).data, onSuccess: onSaved });

    if (inv.status === 'cancelled') return <Card title="Add Payment"><p className="px-4 py-6 text-center text-sm text-slate-500">This invoice is cancelled, so it cannot take payments.</p></Card>;

    return (
        <Card title="Add Payment" action={<span className="text-xs text-slate-500">Balance {money(inv.balance, inv.currency)}</span>}>
            <form onSubmit={(e) => { e.preventDefault(); pay.mutate(); }} className="space-y-4 p-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <Field label="Date"><Input type="date" required max={today()} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
                    <Field label="Payment Method">
                        <select className="ui-input" value={form.gateway} onChange={(e) => setForm({ ...form, gateway: e.target.value })}>
                            {inv.gateways.map((g) => <option key={g.code} value={g.code}>{g.name}</option>)}
                        </select>
                    </Field>
                    <Field label="Transaction ID"><Input required maxLength={191} value={form.transaction_id} onChange={(e) => setForm({ ...form, transaction_id: e.target.value })} /></Field>
                    <Field label="Amount"><Input type="number" required min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></Field>
                    <Field label="Transaction Fees" hint="What the payment provider kept."><Input type="number" min="0" step="0.01" value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} /></Field>
                </div>
                <p className="text-xs text-slate-500">Paying the full balance marks the invoice paid, sets up what it was for and emails the payment confirmation.</p>
                <ErrorNote error={pay.error} />
                <div className="flex justify-end"><Button disabled={pay.isPending}><HandCoins size={14} /> {pay.isPending ? 'Adding...' : 'Add Payment'}</Button></div>
            </form>
        </Card>
    );
}

function CreditTab({ inv, onSaved }: { inv: InvoiceFull; onSaved: (d: InvoiceFull, message: string) => void }) {
    const available = Math.min(Number(inv.client.credit_balance), Number(inv.balance));
    const [amount, setAmount] = useState(available > 0 ? available.toFixed(2) : '');
    const change = useMutation({
        mutationFn: async (action: 'apply' | 'remove') => (await api.post<InvoiceFull>(`/invoices/${inv.id}/credit`, { action, amount: action === 'apply' ? amount : null })).data,
        onSuccess: (d, action) => onSaved(d, action === 'apply' ? 'Credit applied.' : 'Credit removed and returned to the client.'),
    });
    const unpaid = inv.status === 'unpaid';

    return (
        <Card title="Credit">
            <div className="space-y-4 p-4">
                <div className="grid gap-3 sm:grid-cols-3">
                    {[['Client credit balance', inv.client.credit_balance], ['Credit on this invoice', inv.credit_applied], ['Invoice balance', inv.balance]].map(([k, v]) => (
                        <div key={k} className="rounded-xl bg-slate-50 px-4 py-3"><div className="text-xs text-slate-500">{k}</div><div className="text-lg font-semibold text-slate-900 tabular-nums">{money(v, inv.currency)}</div></div>
                    ))}
                </div>
                {!unpaid ? <p className="text-sm text-slate-500">Credit can only be changed on an unpaid invoice.</p> : (
                    <div className="flex flex-wrap items-end gap-3">
                        <form onSubmit={(e) => { e.preventDefault(); change.mutate('apply'); }} className="flex flex-wrap items-end gap-2">
                            <Field label="Apply credit"><Input type="number" required min="0.01" step="0.01" max={available || undefined} value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
                            <Button disabled={change.isPending || available <= 0}><Wallet size={14} /> Apply Credit</Button>
                        </form>
                        {Number(inv.credit_applied) > 0 && (
                            <Button type="button" variant="ghost" disabled={change.isPending} onClick={() => ask(`Take ${money(inv.credit_applied, inv.currency)} of credit off this invoice and give it back to the client?`, () => change.mutate('remove'))}>
                                <RotateCcw size={14} /> Remove Applied Credit
                            </Button>
                        )}
                    </div>
                )}
                {unpaid && available <= 0 && <p className="text-xs text-slate-500">The client has no credit to apply{Number(inv.balance) <= 0 ? ', and nothing is owed' : ''}.</p>}
                <ErrorNote error={change.error} />
            </div>
        </Card>
    );
}

function RefundTab({ inv, onSaved }: { inv: InvoiceFull; onSaved: (d: InvoiceFull) => void }) {
    const refundable = inv.payments.filter((p) => Number(p.amount) > 0).map((p) => {
        const refunded = inv.payments.filter((r) => r.refund_of === p.id).reduce((sum, r) => sum - Number(r.amount), 0);

        return { ...p, left: Math.max(0, Number(p.amount) - refunded) };
    }).filter((p) => p.left > 0);
    const [paymentId, setPaymentId] = useState(refundable[0]?.id ?? 0);
    const chosen = refundable.find((p) => p.id === paymentId);
    const [amount, setAmount] = useState(chosen ? chosen.left.toFixed(2) : '');
    const [type, setType] = useState<'record' | 'credit'>('record');
    const [transactionId, setTransactionId] = useState('');
    const refund = useMutation({
        mutationFn: async () => (await api.post<InvoiceFull>(`/invoices/${inv.id}/refund`, { payment_id: paymentId, amount, type, transaction_id: transactionId || null })).data,
        onSuccess: onSaved,
    });

    if (refundable.length === 0) return <Card title="Refund"><p className="px-4 py-6 text-center text-sm text-slate-500">There is no payment left to refund on this invoice.</p></Card>;

    return (
        <Card title="Refund">
            <form onSubmit={(e) => { e.preventDefault(); ask(`Record a ${money(amount, inv.currency)} refund?`, () => refund.mutate()); }} className="space-y-4 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Transaction">
                        <select className="ui-input" value={paymentId} onChange={(e) => { const id = Number(e.target.value); setPaymentId(id); setAmount(refundable.find((p) => p.id === id)?.left.toFixed(2) ?? ''); }}>
                            {refundable.map((p) => <option key={p.id} value={p.id}>{day(p.created_at)} · {p.gateway_name} · {p.transaction_id} ({money(p.left, p.currency)} left)</option>)}
                        </select>
                    </Field>
                    <Field label="Amount"><Input type="number" required min="0.01" step="0.01" max={chosen?.left} value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
                </div>
                <fieldset className="grid gap-2 sm:grid-cols-2">
                    <legend className="mb-1 text-xs font-semibold text-slate-600">Refund Type</legend>
                    {([['record', 'Record a refund', 'You send the money back yourself, at the gateway or bank.'], ['credit', 'Add to client credit', 'The money stays on the account as credit for future invoices.']] as const).map(([v, t, h]) => (
                        <label key={v} className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 ${type === v ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-slate-200'}`}>
                            <input type="radio" name={`refund-type-${inv.id}`} className="mt-1" checked={type === v} onChange={() => setType(v)} />
                            <span><span className="block text-sm font-medium text-slate-800">{t}</span><span className="block text-xs text-slate-500">{h}</span></span>
                        </label>
                    ))}
                </fieldset>
                {type === 'record' && <Field label="Refund Transaction ID" hint="Optional: the gateway's refund reference."><Input maxLength={191} value={transactionId} onChange={(e) => setTransactionId(e.target.value)} /></Field>}
                <p className="text-xs text-slate-500">Refunding everything paid marks the invoice Refunded. Services stay as they are.</p>
                <ErrorNote error={refund.error} />
                <div className="flex justify-end"><Button variant="danger" disabled={refund.isPending}><RotateCcw size={14} /> {refund.isPending ? 'Refunding...' : 'Refund'}</Button></div>
            </form>
        </Card>
    );
}

function NotesTab({ inv, onSaved }: { inv: InvoiceFull; onSaved: (d: InvoiceFull) => void }) {
    const [notes, setNotes] = useState(inv.admin_notes ?? '');
    const save = useMutation({ mutationFn: async () => (await api.put<InvoiceFull>(`/invoices/${inv.id}/notes`, { admin_notes: notes })).data, onSuccess: onSaved });

    return (
        <Card title="Notes" action={<span className="text-xs text-slate-500">Only staff see these</span>}>
            <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-3 p-4">
                <textarea rows={6} aria-label="Invoice notes" className="ui-input py-2" value={notes} onChange={(e) => setNotes(e.target.value)} />
                <ErrorNote error={save.error} />
                <div className="flex justify-end"><Button disabled={save.isPending || notes === (inv.admin_notes ?? '')}><FileText size={14} /> {save.isPending ? 'Saving...' : 'Save Notes'}</Button></div>
            </form>
        </Card>
    );
}
