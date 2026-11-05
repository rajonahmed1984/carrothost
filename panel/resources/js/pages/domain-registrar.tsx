import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, KeyRound, Lock, RefreshCw, ShieldCheck, Unlock } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { api, errorMessage } from '../api';
import { Button, ErrorNote, Field, Input, Modal, QueryState } from '../ui';
import { alertDialog, confirmDialog } from '../dialog';
import { day } from './client-tabs';

export type Contact = { name: string; company: string; email: string; address: string; city: string; state: string; country: string; zipcode: string; phone_cc: string; phone: string };

export type RegistrarInfo = {
    found: boolean; order_id: string | null; status: string | null; statuses: string[]; expires_at: string | null; registered_at: string | null;
    nameservers: string[]; locked: boolean; privacy: boolean; privacy_allowed: boolean; has_epp_code: boolean;
    contact: { name: string | null; company: string | null; email: string | null; country: string | null } | null;
    contact_defaults: Contact;
};

type Result = { message: string; domain: unknown };

/** The registrar's live record for a domain. Read-only; never changes anything at the registrar. */
export const useRegistrarInfo = (id: number, enabled: boolean) => useQuery({
    queryKey: ['/domains/registrar', id],
    queryFn: async () => (await api.get<RegistrarInfo>(`/domains/${id}/registrar`)).data,
    enabled,
    retry: false,
    staleTime: 60_000,
});

/** Runs one registrar command, then refreshes the domain and the registrar record. */
export function useRegistrarCommand(id: number) {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: async ({ command, body }: { command: string; body?: object }) => (await api.post<Result>(`/domains/${id}/registrar/${command}`, body ?? {})).data,
        onSuccess: (r) => {
            qc.setQueryData(['/domains', String(id)], r.domain);
            qc.invalidateQueries({ queryKey: ['/domains/registrar', id] });
            void alertDialog(r.message);
        },
    });
}

export function RegistrarStatus({ id, name, info }: { id: number; name: string; info: ReturnType<typeof useRegistrarInfo> }) {
    const qc = useQueryClient();
    const sync = useMutation({
        mutationFn: async () => (await api.post<Result>(`/domains/${id}/registrar/sync`)).data,
        onSuccess: (r) => {
            qc.setQueryData(['/domains', String(id)], r.domain);
            qc.invalidateQueries({ queryKey: ['/domains/registrar', id] });
            void alertDialog(`${r.message} The form below now shows the registrar's values.`);
        },
        onError: (e) => alertDialog(errorMessage(e)),
    });

    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-sm">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-600">At {name}</span>
                <div className="flex gap-2">
                    <Button type="button" variant="link" disabled={info.isFetching} onClick={() => info.refetch()}><RefreshCw size={12} className={info.isFetching ? 'animate-spin' : ''} /> Refresh</Button>
                    {info.data?.found && <Button type="button" variant="link" disabled={sync.isPending} onClick={() => sync.mutate()} title="Copy expiry, nameservers, lock, privacy and EPP code into the panel">{sync.isPending ? 'Syncing...' : 'Sync to panel'}</Button>}
                </div>
            </div>
            <QueryState query={info}>
                {info.data && !info.data.found && (
                    <p className="flex items-start gap-2 text-amber-800"><AlertTriangle size={14} className="mt-0.5 shrink-0" /> Not in this {name} account. Register or transfer it, or choose the registrar that holds it.</p>
                )}
                {info.data?.found && (
                    <dl className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
                        <Item label="Status"><span className="capitalize">{info.data.status ?? '-'}</span></Item>
                        <Item label="Expires">{day(info.data.expires_at)}</Item>
                        <Item label="Lock">{info.data.locked ? <span className="inline-flex items-center gap-1 text-emerald-700"><Lock size={12} /> On</span> : <span className="inline-flex items-center gap-1 text-slate-500"><Unlock size={12} /> Off</span>}</Item>
                        <Item label="ID protection">{info.data.privacy ? <span className="inline-flex items-center gap-1 text-emerald-700"><ShieldCheck size={12} /> On</span> : 'Off'}</Item>
                        <Item label="Nameservers" wide>{info.data.nameservers.length ? info.data.nameservers.join(', ') : '-'}</Item>
                        {info.data.contact && <Item label="Registrant" wide>{[info.data.contact.name, info.data.contact.email].filter(Boolean).join(' · ')}</Item>}
                    </dl>
                )}
            </QueryState>
        </div>
    );
}

function Item({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
    return (
        <div className={`flex gap-2 ${wide ? 'sm:col-span-2' : ''}`}>
            <dt className="w-24 shrink-0 text-xs text-slate-500">{label}</dt>
            <dd className="min-w-0 break-words text-slate-800">{children}</dd>
        </div>
    );
}

export function EppModal({ id, canFetch, onClose }: { id: number; canFetch: boolean; onClose: () => void }) {
    const [source, setSource] = useState<'panel' | 'registrar'>('panel');
    const q = useQuery({
        queryKey: ['/domains/epp', id, source],
        queryFn: async () => (await api.get<{ epp_code: string | null }>(`/domains/${id}/epp`, { params: source === 'registrar' ? { source } : {} })).data,
        gcTime: 0,
        retry: false,
    });

    return (
        <Modal title="EPP code" onClose={onClose}>
            <QueryState query={q}>
                <p className="rounded-xl bg-slate-50 px-4 py-3 font-mono text-lg break-all text-slate-900">
                    {q.data?.epp_code ?? (source === 'registrar' ? 'The registrar returned no EPP code for this domain.' : 'No EPP code stored for this domain.')}
                </p>
            </QueryState>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-slate-500">{source === 'registrar' ? 'Fetched from the registrar and saved in the panel.' : 'This is the code stored in the panel.'} Viewing it is recorded in the activity log.</p>
                {canFetch && source === 'panel' && <Button type="button" variant="ghost" onClick={() => setSource('registrar')}><KeyRound size={14} /> Get from registrar</Button>}
            </div>
        </Modal>
    );
}

function ContactFields({ value, onChange }: { value: Contact; onChange: (c: Contact) => void }) {
    const f = (key: keyof Contact) => ({ value: value[key], onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...value, [key]: e.target.value }) });

    return (
        <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Full name"><Input required {...f('name')} /></Field>
            <Field label="Company" hint="Blank sends N/A"><Input {...f('company')} /></Field>
            <Field label="Email"><Input required type="email" {...f('email')} /></Field>
            <Field label="Address"><Input required maxLength={64} {...f('address')} /></Field>
            <Field label="City"><Input required {...f('city')} /></Field>
            <Field label="State / division"><Input required {...f('state')} /></Field>
            <Field label="Country" hint="2-letter code, e.g. BD"><Input required maxLength={2} {...f('country')} /></Field>
            <Field label="Postcode"><Input required {...f('zipcode')} /></Field>
            <Field label="Phone country code" hint="Digits only, e.g. 880"><Input required inputMode="numeric" maxLength={3} {...f('phone_cc')} /></Field>
            <Field label="Phone" hint="Without the country code"><Input required inputMode="tel" {...f('phone')} /></Field>
        </div>
    );
}

export type CommandForm = 'register' | 'transfer' | 'renew' | 'contacts' | 'release';

/** One form per command that needs input. Money-spending ones say so and ask once more before sending. */
export function CommandModal({ id, kind, domain, registrar, years, eppCode, defaults, onClose }: {
    id: number; kind: CommandForm; domain: string; registrar: string; years: number; eppCode: boolean; defaults: Contact; onClose: () => void;
}) {
    const run = useRegistrarCommand(id);
    const [contact, setContact] = useState<Contact>(defaults);
    const [period, setPeriod] = useState(years || 1);
    const [authCode, setAuthCode] = useState('');
    const [tag, setTag] = useState('');
    const spends = kind === 'register' || kind === 'transfer' || kind === 'renew';
    const titles: Record<CommandForm, string> = { register: `Register ${domain}`, transfer: `Transfer ${domain} in`, renew: `Renew ${domain}`, contacts: 'Modify contact details', release: `Release ${domain}` };

    const submit = async () => {
        const body = kind === 'register' ? { years: period, contact }
            : kind === 'transfer' ? { auth_code: authCode, contact }
            : kind === 'renew' ? { years: period }
            : kind === 'contacts' ? { contact }
            : { tag };
        const warning = spends
            ? `${titles[kind]}${kind === 'transfer' ? '' : ` for ${period} year(s)`} at ${registrar}? This is charged to your ${registrar} balance straight away and cannot be undone.`
            : kind === 'release' ? `Release ${domain} to tag ${tag.toUpperCase()}? The domain leaves your account.` : `Replace all four contacts of ${domain} at ${registrar}?`;

        if (await confirmDialog(warning)) run.mutate({ command: kind, body }, { onSuccess: onClose });
    };

    return (
        <Modal title={titles[kind]} onClose={onClose} wide={kind !== 'renew' && kind !== 'release'}>
            <form onSubmit={(e) => { e.preventDefault(); void submit(); }} className="space-y-4">
                {spends && <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"><AlertTriangle size={15} className="mt-0.5 shrink-0" /> Charged to the {registrar} balance. No invoice is raised for the client here.</p>}
                {(kind === 'register' || kind === 'renew') && (
                    <Field label="Years"><Input type="number" min={1} max={10} required value={period} onChange={(e) => setPeriod(Number(e.target.value))} /></Field>
                )}
                {kind === 'transfer' && (
                    <Field label="EPP / auth code" hint={eppCode ? 'The stored code is not filled in for you; paste the current one from the old registrar' : 'From the current registrar'}><Input required value={authCode} onChange={(e) => setAuthCode(e.target.value)} /></Field>
                )}
                {kind === 'release' && (
                    <Field label="New IPS tag" hint="The receiving registrar's Nominet tag"><Input required value={tag} onChange={(e) => setTag(e.target.value)} /></Field>
                )}
                {(kind === 'register' || kind === 'transfer' || kind === 'contacts') && (
                    <div>
                        <p className="mb-2 text-xs text-slate-500">Filled from the client profile. Used for the registrant, admin, tech and billing contacts.</p>
                        <ContactFields value={contact} onChange={setContact} />
                    </div>
                )}
                <ErrorNote error={run.error} />
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button disabled={run.isPending}>{run.isPending ? 'Sending...' : spends ? `${titles[kind].split(' ')[0]} now` : 'Send to registrar'}</Button>
                </div>
            </form>
        </Modal>
    );
}
