import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CircleCheck, Copy, Eye, FileText, Globe, Headset, Lock, Mail, Package, Pencil, RotateCcw, Search, Send, Users } from 'lucide-react';
import { lazy, Suspense, useState, type ReactNode } from 'react';
import { api, errorMessage } from '../api';
import { alertDialog, ask } from '../dialog';
import { Button, ErrorNote, Field, Input, Modal, QueryState } from '../ui';

const RichEditor = lazy(() => import('../editor'));

type Row = { key: string; name: string; description: string; group: string; locked: boolean; subject: string; is_active: boolean; customized: boolean };
type Group = { key: string; name: string; templates: Row[] };
type Detail = Row & { body: string; fields: string[]; required: string[]; default: { subject: string; body: string } };

const groupIcons: Record<string, ReactNode> = {
    general: <Users size={16} />, product: <Package size={16} />, domain: <Globe size={16} />, invoice: <FileText size={16} />, support: <Headset size={16} />,
};

function Switch({ on, disabled, onChange, name }: { on: boolean; disabled?: boolean; onChange: (on: boolean) => void; name: string }) {
    return (
        <button type="button" role="switch" aria-checked={on} aria-label={name} disabled={disabled} onClick={() => onChange(!on)}
            className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition disabled:cursor-not-allowed disabled:opacity-60 ${on ? 'bg-emerald-500' : 'bg-slate-300'}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
        </button>
    );
}

/** Admin > Settings > Email: every email a customer receives, grouped as in WHMCS. */
export function EmailTemplatesSection() {
    const qc = useQueryClient();
    const query = useQuery({ queryKey: ['email-templates'], queryFn: async () => (await api.get<{ groups: Group[] }>('/settings/email-templates')).data.groups });
    const [search, setSearch] = useState('');
    const [editing, setEditing] = useState<string | null>(null);
    const toggle = useMutation({
        mutationFn: async ({ key, on }: { key: string; on: boolean }) => (await api.post<{ groups: Group[] }>(`/settings/email-templates/${key}/toggle`, { is_active: on })).data.groups,
        onSuccess: (groups) => qc.setQueryData(['email-templates'], groups),
        onError: (e) => alertDialog(errorMessage(e)),
    });
    const needle = search.trim().toLowerCase();
    const groups = (query.data ?? []).map((g) => ({ ...g, templates: g.templates.filter((t) => !needle || `${t.name} ${t.description} ${t.subject}`.toLowerCase().includes(needle)) })).filter((g) => g.templates.length);
    const total = query.data?.reduce((n, g) => n + g.templates.length, 0) ?? 0;
    const off = query.data?.reduce((n, g) => n + g.templates.filter((t) => !t.is_active).length, 0) ?? 0;

    return (
        <section className="card overflow-hidden">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
                <div>
                    <h2 className="text-[11px] font-bold tracking-[0.2em] text-accent uppercase">Email Templates</h2>
                    <p className="mt-1 text-xs text-slate-500">Every email your customers receive. {total} templates{off ? `, ${off} turned off` : ''}. Edit the wording with merge fields like <code className="rounded bg-slate-100 px-1">{'{$client_name}'}</code>.</p>
                </div>
                <div className="relative w-full sm:w-64">
                    <Search size={15} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
                    <input aria-label="Search templates" className="ui-input pl-9" placeholder="Search templates" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
            </header>
            <QueryState query={query}>
                <div className="grid gap-4 p-4 xl:grid-cols-2">
                    {groups.length === 0 && <p className="p-6 text-center text-sm text-slate-500 xl:col-span-2">No template matches “{search}”.</p>}
                    {groups.map((g) => (
                        <div key={g.key} className="overflow-hidden rounded-2xl border border-slate-200">
                            <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-accent">{groupIcons[g.key] ?? <Mail size={16} />}</span>
                                <h3 className="text-sm font-semibold text-slate-900">{g.name}</h3>
                                <span className="ml-auto text-xs text-slate-500">{g.templates.length}</span>
                            </div>
                            <ul className="divide-y divide-slate-100">
                                {g.templates.map((t) => (
                                    <li key={t.key} className={`flex items-center gap-3 px-4 py-3 ${t.is_active ? '' : 'bg-slate-50/60'}`}>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <button type="button" onClick={() => setEditing(t.key)} className={`cursor-pointer text-left text-sm font-semibold hover:text-accent ${t.is_active ? 'text-slate-900' : 'text-slate-500'}`}>{t.name}</button>
                                                {t.customized && <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700">Customized</span>}
                                                {t.locked && <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600"><Lock size={10} /> Always sent</span>}
                                                {!t.is_active && <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">Off</span>}
                                            </div>
                                            <div className="truncate text-xs text-slate-500">{t.description}</div>
                                        </div>
                                        <Switch name={`Send ${t.name}`} on={t.is_active} disabled={t.locked || toggle.isPending} onChange={(on) => toggle.mutate({ key: t.key, on })} />
                                        <button type="button" onClick={() => setEditing(t.key)} className="icon-btn h-8 w-8 shrink-0" aria-label={`Edit ${t.name}`} title="Edit"><Pencil size={14} /></button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </QueryState>
            {editing && <TemplateEditor templateKey={editing} onClose={() => setEditing(null)} />}
        </section>
    );
}

function TemplateEditor({ templateKey, onClose }: { templateKey: string; onClose: () => void }) {
    const query = useQuery({ queryKey: ['email-template', templateKey], queryFn: async () => (await api.get<Detail>(`/settings/email-templates/${templateKey}`)).data, gcTime: 0 });

    return (
        <Modal title={query.data ? `Edit: ${query.data.name}` : 'Edit email template'} onClose={onClose} wide>
            <QueryState query={query}>{query.data && <EditorForm key={query.data.subject + query.data.body} t={query.data} onClose={onClose} />}</QueryState>
        </Modal>
    );
}

function EditorForm({ t, onClose }: { t: Detail; onClose: () => void }) {
    const qc = useQueryClient();
    const [subject, setSubject] = useState(t.subject);
    const [body, setBody] = useState(t.body);
    const [active, setActive] = useState(t.is_active);
    const [view, setView] = useState<'edit' | 'preview'>('edit');
    const [testTo, setTestTo] = useState('');
    const [copied, setCopied] = useState<string | null>(null);
    const refresh = (data: Detail) => {
        qc.setQueryData(['email-template', t.key], data);
        qc.invalidateQueries({ queryKey: ['email-templates'] });
    };
    const save = useMutation({ mutationFn: async () => (await api.put<Detail>(`/settings/email-templates/${t.key}`, { subject, body, is_active: active })).data, onSuccess: (data) => { refresh(data); onClose(); } });
    const reset = useMutation({ mutationFn: async () => (await api.delete<Detail>(`/settings/email-templates/${t.key}`)).data, onSuccess: refresh, onError: (e) => alertDialog(errorMessage(e)) });
    const preview = useMutation({ mutationFn: async () => (await api.post<{ subject: string; html: string }>(`/settings/email-templates/${t.key}/preview`, { subject, body })).data });
    const test = useMutation({ mutationFn: async () => (await api.post<{ message: string }>(`/settings/email-templates/${t.key}/test`, { email: testTo, subject, body })).data });
    const dirty = subject !== t.subject || body !== t.body || active !== t.is_active;
    const copy = (field: string) => navigator.clipboard?.writeText(`{$${field}}`).then(() => { setCopied(field); setTimeout(() => setCopied(null), 1200); });
    const showPreview = () => { setView('preview'); preview.mutate(); };

    return (
        <div className="grid gap-5 lg:grid-cols-[1fr_16rem]">
            <div className="min-w-0 space-y-4">
                <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">{t.description}</p>
                <Field label="Subject"><Input value={subject} maxLength={255} onChange={(e) => setSubject(e.target.value)} /></Field>

                <div className="flex gap-1 border-b border-slate-200">
                    {(['edit', 'preview'] as const).map((v) => (
                        <button key={v} type="button" onClick={() => (v === 'preview' ? showPreview() : setView('edit'))} className={`-mb-px flex cursor-pointer items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-semibold ${view === v ? 'border-[var(--accent)] text-accent' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                            {v === 'edit' ? <Pencil size={14} /> : <Eye size={14} />} {v === 'edit' ? 'Message' : 'Preview'}
                        </button>
                    ))}
                </div>

                {view === 'edit' ? (
                    <Suspense fallback={<p className="py-10 text-center text-sm text-slate-500">Loading editor...</p>}>
                        <RichEditor value={body} onChange={setBody} height={420} />
                    </Suspense>
                ) : (
                    <div className="rounded-2xl border border-slate-200 bg-slate-100 p-4">
                        {preview.isPending ? <p className="py-10 text-center text-sm text-slate-500">Rendering...</p> : preview.error ? <ErrorNote error={preview.error} /> : preview.data && (
                            <div className="mx-auto max-w-[640px] overflow-hidden rounded-xl border border-slate-200 bg-white">
                                <div className="border-b border-slate-200 px-5 py-3 text-sm"><span className="text-slate-500">Subject: </span><strong className="text-slate-900">{preview.data.subject}</strong></div>
                                {/* Sanitized on the server; shown with sample values. */}
                                <div className="px-6 py-5 text-sm leading-relaxed text-slate-700" dangerouslySetInnerHTML={{ __html: preview.data.html }} />
                            </div>
                        )}
                        <p className="mt-3 text-center text-[11px] text-slate-500">Filled with sample values. The real email also has its action button, like Pay invoice.</p>
                    </div>
                )}

                <ErrorNote error={save.error} />
                <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-4">
                    {t.locked
                        ? <span className="inline-flex items-center gap-1.5 text-xs text-slate-500"><Lock size={13} /> Always sent: customers need it to sign in.</span>
                        : <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700"><Switch name="Send this email" on={active} onChange={setActive} /> Send this email</label>}
                    <span className="flex-1" />
                    {t.customized && <Button type="button" variant="ghost" disabled={reset.isPending} onClick={() => ask(`Reset "${t.name}" to the default subject and message?`, () => reset.mutate())}><RotateCcw size={14} /> Reset to default</Button>}
                    <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button type="button" disabled={!dirty || save.isPending} onClick={() => save.mutate()}>{save.isPending ? 'Saving...' : 'Save Template'}</Button>
                </div>
            </div>

            <aside className="space-y-4">
                <div className="rounded-2xl border border-slate-200">
                    <div className="border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-900">Merge Fields</div>
                    <p className="px-4 pt-3 text-[11px] text-slate-500">Click to copy, then paste into the subject or message.</p>
                    <ul className="max-h-80 space-y-1 overflow-y-auto p-3">
                        {t.fields.map((f) => (
                            <li key={f}>
                                <button type="button" onClick={() => copy(f)} className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left font-mono text-xs text-slate-700 hover:bg-slate-50">
                                    <span className="truncate">{`{$${f}}`}{t.required.includes(f) && <span className="ml-1 font-sans text-[10px] font-bold text-rose-600">required</span>}</span>
                                    {copied === f ? <CircleCheck size={13} className="shrink-0 text-emerald-600" /> : <Copy size={13} className="shrink-0 text-slate-400" />}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="mb-2 text-sm font-semibold text-slate-900">Send a Test</div>
                    <p className="mb-3 text-[11px] text-slate-500">Sends this version, unsaved changes included, with sample values.</p>
                    <div className="space-y-2">
                        <Input type="email" placeholder="you@example.com" value={testTo} onChange={(e) => setTestTo(e.target.value)} />
                        <Button type="button" variant="ghost" className="w-full justify-center" disabled={!testTo.includes('@') || test.isPending} onClick={() => test.mutate()}><Send size={14} /> {test.isPending ? 'Sending...' : 'Send test'}</Button>
                    </div>
                    {test.data && <p role="status" className="mt-2 text-xs text-emerald-700">{test.data.message}</p>}
                    <div className="mt-2"><ErrorNote error={test.error} /></div>
                </div>
            </aside>
        </div>
    );
}
