import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../api';
import { Button, ErrorNote, Field, Input, Modal } from '../ui';

/** A product/service or domain picked to be invoiced. */
export type InvoiceRecord = { type: 'service' | 'domain'; id: number; label: string };
export type CreatedInvoice = { id: number; number: string; client_id: number; total: string; due_date: string };

const modes = [
    { value: 'renewal', title: 'Renewal for the coming term', hint: 'The normal renewal invoice. When it is paid the due date moves forward by one term.' },
    { value: 'already_renewed', title: 'Renewal already done', hint: 'The service or domain was already renewed by hand (for example at the registrar) and never invoiced. The invoice covers the term that just started; paying it only records the money and does not move the date again.' },
] as const;

/**
 * Create Invoice / Invoice Selected Items: one invoice for services and domains of a client.
 * The period each line covers is added to its description by the server.
 */
export function CreateInvoiceDialog({ clientId, records, onClose, onCreated }: { clientId: number; records: InvoiceRecord[]; onClose: () => void; onCreated: (invoice: CreatedInvoice) => void }) {
    const qc = useQueryClient();
    const [mode, setMode] = useState<(typeof modes)[number]['value']>('renewal');
    const [dueDate, setDueDate] = useState('');
    const [notify, setNotify] = useState<boolean | null>(null);
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const single = records.length === 1;
    // An invoice for a renewal already done is not announced unless asked.
    const emailClient = notify ?? mode === 'renewal';

    const create = useMutation({
        mutationFn: async () => (await api.post<CreatedInvoice>('/invoices/from-records', {
            services: records.filter((r) => r.type === 'service').map((r) => r.id),
            domains: records.filter((r) => r.type === 'domain').map((r) => r.id),
            mode,
            due_date: dueDate || null,
            notify: emailClient,
            ...(single && from && to ? { period_start: from, period_end: to } : {}),
        })).data,
        onSuccess: (invoice) => {
            qc.invalidateQueries({ queryKey: ['/clients', String(clientId)] });
            qc.invalidateQueries({ queryKey: ['/services'] });
            qc.invalidateQueries({ queryKey: ['/domains'] });
            qc.invalidateQueries({ queryKey: ['/invoices'] });
            onCreated(invoice);
        },
    });

    return (
        <Modal title={single ? 'Create Invoice' : `Invoice ${records.length} selected items`} onClose={onClose}>
            <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="space-y-4">
                <ul className="max-h-32 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 text-sm">
                    {records.map((r) => (
                        <li key={`${r.type}-${r.id}`} className="flex items-center justify-between gap-3 px-3 py-1.5">
                            <span className="truncate text-slate-800">{r.label}</span>
                            <span className="shrink-0 text-[11px] font-semibold text-slate-400 uppercase">{r.type === 'domain' ? 'Domain' : 'Service'}</span>
                        </li>
                    ))}
                </ul>

                <fieldset className="space-y-2">
                    <legend className="mb-1 text-xs font-semibold text-slate-500">What is this invoice for?</legend>
                    {modes.map((m) => (
                        <label key={m.value} className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 ${mode === m.value ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-slate-200'}`}>
                            <input type="radio" name="invoice-mode" className="mt-1" checked={mode === m.value} onChange={() => setMode(m.value)} />
                            <span><span className="block text-sm font-semibold text-slate-900">{m.title}</span><span className="block text-xs text-slate-600">{m.hint}</span></span>
                        </label>
                    ))}
                </fieldset>

                <Field label="Due date" hint={mode === 'renewal' ? 'Blank uses the next due date (or today if that has passed).' : 'Blank uses today.'}>
                    <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </Field>

                {single && (
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Period from" hint="Optional. Blank works it out from the cycle."><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
                        <Field label="Period to"><Input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} /></Field>
                    </div>
                )}
                <p className="text-xs text-slate-500">The period each line covers, like 16/07/2026 - 15/07/2027, is shown on the invoice.</p>

                <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" checked={emailClient} onChange={(e) => setNotify(e.target.checked)} /> Email the client about this invoice
                </label>

                <ErrorNote error={create.error} />
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button disabled={create.isPending || (single && Boolean(from) !== Boolean(to))}>{create.isPending ? 'Creating...' : 'Create Invoice'}</Button>
                </div>
            </form>
        </Modal>
    );
}
