import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { Button, ErrorNote, Field, Input, QueryState, Select, type Branding } from '../ui';

/** Integration pages listed under System in the sidebar. */
export const settings = [
    { to: '/admin/settings/gateways', label: 'Payment Gateways' },
    { to: '/admin/settings/servers', label: 'Servers' },
    { to: '/admin/settings/registrars', label: 'Domain Registrars' },
    { to: '/admin/settings/addons', label: 'Addons' },
];

const tabs = [
    { key: 'general', label: 'General', hint: 'Brand, contact, locale and sign-in security.' },
    { key: 'invoices', label: 'Invoices', hint: 'Currency and when new invoices fall due.' },
    { key: 'domains', label: 'Domains', hint: 'What customers can order, and the defaults each new domain starts with.' },
    { key: 'automation', label: 'Automation', hint: 'Renewals, suspensions and support ticket clean-up.' },
    { key: 'email', label: 'Email', hint: 'The SMTP server that sends every email.' },
];

type Values = {
    company_name: string; company_email: string | null; pay_to_text: string | null; company_country: string | null; time_zone: string;
    currency: string; invoice_due_days: number; renewal_notice_days: number; suspension_enabled: boolean; suspend_after_days: number;
    unsuspension_enabled: boolean; ticket_auto_close_days: number; domain_allow_register: boolean; domain_allow_transfer: boolean;
    domain_allow_own: boolean; domain_auto_renew: boolean; nameserver_1: string | null; nameserver_2: string | null; nameserver_3: string | null;
    nameserver_4: string | null; nameserver_5: string | null; recaptcha_enabled: boolean; recaptcha_site_key: string | null;
    recaptcha_project_id: string | null; recaptcha_score_threshold: number | string | null; mail_host: string | null; mail_port: number | string | null;
    mail_scheme: string | null; mail_username: string | null; mail_from_address: string | null; mail_from_name: string | null;
};
type Secrets = { recaptcha_secret_key: boolean; recaptcha_api_key: boolean; mail_password: boolean };
type SettingsResponse = { settings: Values; secrets: Secrets; branding: Branding; custom_logo: boolean; mailer: string; time_zones: string[] };

function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
    return (
        <section className="card p-5">
            <div className="flex items-center justify-between gap-3">
                <h2 className="text-[11px] font-bold tracking-[0.2em] text-accent uppercase">{title}</h2>
                {action}
            </div>
            <div className="mt-4 grid gap-4">{children}</div>
        </section>
    );
}

function Check({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
    return (
        <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
            <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} /> {label}
        </label>
    );
}

function TestEmail() {
    const [email, setEmail] = useState('');
    const send = useMutation({ mutationFn: async () => (await api.post<{ message: string }>('/settings/test-email', { email })).data });

    return (
        <Section title="Test Email">
            <p className="text-sm text-slate-500">Save the settings first, then send a test message.</p>
            <form onSubmit={(e) => { e.preventDefault(); send.mutate(); }} className="flex flex-wrap gap-2">
                <div className="min-w-0 flex-1"><Input type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                <Button variant="ghost" disabled={send.isPending}>{send.isPending ? 'Sending...' : 'Send test email'}</Button>
            </form>
            {send.data && <p role="status" className="text-xs text-emerald-700">{send.data.message}</p>}
            <ErrorNote error={send.error} />
        </Section>
    );
}

function SettingsForm({ data }: { data: SettingsResponse }) {
    const qc = useQueryClient();
    const [params, setParams] = useSearchParams();
    const tab = tabs.find((t) => t.key === params.get('tab')) ?? tabs[0];
    const [values, setValues] = useState<Values>(data.settings);
    const [secrets, setSecrets] = useState({ recaptcha_secret_key: '', recaptcha_api_key: '', mail_password: '' });
    const [files, setFiles] = useState<{ logo: File | null; favicon: File | null }>({ logo: null, favicon: null });
    const [remove, setRemove] = useState({ logo: false, favicon: false });
    const set = <K extends keyof Values>(key: K) => (value: Values[K]) => setValues({ ...values, [key]: value });
    const text = (key: keyof Values) => ({ value: String(values[key] ?? ''), onChange: (e: { target: { value: string } }) => setValues({ ...values, [key]: e.target.value }) });
    const secretHint = (key: keyof Secrets) => (data.secrets[key] ? 'Saved. Leave blank to keep it.' : undefined);

    const save = useMutation({
        mutationFn: async () => {
            const body = new FormData();
            Object.entries(values).forEach(([key, value]) => body.append(key, typeof value === 'boolean' ? (value ? '1' : '0') : String(value ?? '')));
            Object.entries(secrets).forEach(([key, value]) => value && body.append(key, value));
            if (files.logo) body.append('logo', files.logo);
            if (files.favicon) body.append('favicon', files.favicon);
            body.append('remove_logo', remove.logo ? '1' : '0');
            body.append('remove_favicon', remove.favicon ? '1' : '0');

            return (await api.post<SettingsResponse>('/settings', body)).data;
        },
        onSuccess: (fresh) => {
            qc.setQueryData(['settings'], fresh);
            qc.invalidateQueries({ queryKey: ['auth-config'] });
            qc.invalidateQueries({ queryKey: ['meta'] });
            setValues(fresh.settings);
            setSecrets({ recaptcha_secret_key: '', recaptcha_api_key: '', mail_password: '' });
            setFiles({ logo: null, favicon: null });
            setRemove({ logo: false, favicon: false });
        },
    });

    const image = (kind: 'logo' | 'favicon', label: string, accept: string, current: string, custom: boolean) => (
        <div className="space-y-2">
            <Field label={label}>
                <input type="file" accept={accept} className="ui-input py-1.5" style={{ height: 'auto' }} onChange={(e) => { setFiles({ ...files, [kind]: e.target.files?.[0] ?? null }); setRemove({ ...remove, [kind]: false }); }} />
            </Field>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <img src={current} alt={`Current ${label.toLowerCase()}`} className={kind === 'logo' ? 'h-10 w-auto object-contain' : 'h-10 w-10 rounded-lg object-contain'} />
                {custom && <label className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={remove[kind]} onChange={(e) => setRemove({ ...remove, [kind]: e.target.checked })} /> Use the default</label>}
            </div>
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="card p-4">
                <div className="flex flex-wrap gap-2">
                    {tabs.map((t) => (
                        <button
                            key={t.key}
                            type="button"
                            onClick={() => setParams({ tab: t.key }, { replace: true })}
                            className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold transition ${t.key === tab.key ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-[var(--accent)] hover:text-accent'}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
                <p className="mt-3 text-xs text-slate-500">{tab.hint}</p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-4">
                <div className={tab.key === 'general' ? 'space-y-4' : 'hidden'}>
                    <div className="grid gap-4 lg:grid-cols-2">
                        <Section title="Brand & Contact">
                            <Field label="Company name"><Input required maxLength={100} {...text('company_name')} /></Field>
                            <Field label="Email" hint="Shown to customers as your contact address."><Input type="email" {...text('company_email')} /></Field>
                            <Field label="Country"><Input {...text('company_country')} /></Field>
                            <Field label="Pay to text" hint="Your billing address, printed on every invoice.">
                                <textarea rows={3} className="ui-input py-2" style={{ height: 'auto' }} {...text('pay_to_text')} />
                            </Field>
                        </Section>
                        <div className="space-y-4">
                            <Section title="Locale">
                                <Field label="Time zone" hint="Used for due dates and when the daily automation runs.">
                                    <Select {...text('time_zone')}>{data.time_zones.map((z) => <option key={z} value={z}>{z}</option>)}</Select>
                                </Field>
                            </Section>
                            <Section title="Brand Assets">
                                {image('logo', 'Company logo', '.png,.jpg,.jpeg,.webp', data.branding.logo_url, data.custom_logo)}
                                {image('favicon', 'Favicon', '.png,.ico', data.branding.icon_url, data.branding.custom_icon)}
                                <p className="text-[11px] text-slate-500">Logo: PNG, JPG or WebP up to 2 MB, on a light background. Favicon: square PNG or ICO up to 512 KB.</p>
                            </Section>
                        </div>
                    </div>
                    <Section title="reCAPTCHA">
                        <Check checked={values.recaptcha_enabled} onChange={set('recaptcha_enabled')} label="Check sign-in and sign-up forms with reCAPTCHA" />
                        <div className="grid gap-4 md:grid-cols-2">
                            <Field label="Site key"><Input {...text('recaptcha_site_key')} /></Field>
                            <Field label="Secret key" hint={secretHint('recaptcha_secret_key')}><Input type="password" autoComplete="new-password" value={secrets.recaptcha_secret_key} onChange={(e) => setSecrets({ ...secrets, recaptcha_secret_key: e.target.value })} /></Field>
                            <Field label="Project ID" hint="Enterprise only."><Input {...text('recaptcha_project_id')} /></Field>
                            <Field label="API key" hint={secretHint('recaptcha_api_key') ?? 'Enterprise only.'}><Input type="password" autoComplete="new-password" value={secrets.recaptcha_api_key} onChange={(e) => setSecrets({ ...secrets, recaptcha_api_key: e.target.value })} /></Field>
                            <Field label="Score threshold" hint="0 to 1. Lower lets more through."><Input type="number" min="0" max="1" step="0.01" {...text('recaptcha_score_threshold')} /></Field>
                        </div>
                    </Section>
                </div>

                <div className={tab.key === 'invoices' ? 'space-y-4' : 'hidden'}>
                    <Section title="Invoice Settings">
                        <div className="grid gap-4 md:grid-cols-2">
                            <Field label="Currency" hint="Applies to new invoices. Existing invoices keep theirs.">
                                <Select {...text('currency')}><option value="BDT">BDT</option><option value="USD">USD</option></Select>
                            </Field>
                            <Field label="Invoice due days" hint="Days after an order that its invoice falls due. 0 = due straight away.">
                                <Input type="number" min="0" max="365" required {...text('invoice_due_days')} />
                            </Field>
                        </div>
                        <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                            Bank transfer and other payment instructions are set on the Manual gateway in <Link className="table-action-link" to="/admin/settings/gateways">Payment Gateways</Link>.
                        </p>
                    </Section>
                </div>

                <div className={tab.key === 'domains' ? 'space-y-4' : 'hidden'}>
                    <div className="grid gap-4 lg:grid-cols-2">
                        <Section title="Domain Ordering">
                            <Check checked={values.domain_allow_register} onChange={set('domain_allow_register')} label="Allow customers to register domains with you" />
                            <Check checked={values.domain_allow_transfer} onChange={set('domain_allow_transfer')} label="Allow customers to transfer a domain to you" />
                            <Check checked={values.domain_allow_own} onChange={set('domain_allow_own')} label="Allow customers to use their own domain for hosting" />
                            <p className="text-xs text-slate-500">
                                Prices come from <Link className="table-action-link" to="/admin/tlds">Domain Pricing</Link>. Only active extensions can be ordered.
                            </p>
                        </Section>
                        <Section title="Renewals">
                            <Check checked={values.domain_auto_renew} onChange={set('domain_auto_renew')} label="Raise renewal invoices for new domains by default" />
                            <p className="text-xs text-slate-500">
                                Each domain can be changed on its own page. A domain set not to renew gets no renewal invoice and lapses at expiry.
                            </p>
                        </Section>
                    </div>
                    <Section title="Default Nameservers">
                        <p className="text-sm text-slate-500">New domains start with these, and customers using their own domain are told to point it here.</p>
                        <div className="grid gap-4 md:grid-cols-2">
                            {([1, 2, 3, 4, 5] as const).map((n) => (
                                <Field key={n} label={`Nameserver ${n}`}><Input placeholder={n <= 2 ? `ns${n}.example.com` : 'Optional'} {...text(`nameserver_${n}`)} /></Field>
                            ))}
                        </div>
                    </Section>
                </div>

                <div className={tab.key === 'automation' ? 'space-y-4' : 'hidden'}>
                    <Section title="Lifecycle Automation">
                        <div className="grid gap-4 md:grid-cols-2">
                            <Field label="Renewal invoice days" hint="Days before the due date that a renewal invoice is raised.">
                                <Input type="number" min="0" max="90" required {...text('renewal_notice_days')} />
                            </Field>
                            <div />
                            <Check checked={values.suspension_enabled} onChange={set('suspension_enabled')} label="Suspend services that stay unpaid" />
                            <Field label="Suspend after days" hint="Days past the due date before suspending.">
                                <Input type="number" min="0" max="365" required {...text('suspend_after_days')} />
                            </Field>
                            <Check checked={values.unsuspension_enabled} onChange={set('unsuspension_enabled')} label="Unsuspend automatically once paid" />
                        </div>
                    </Section>
                    <Section title="Support Ticket Automation">
                        <Field label="Auto-close days" hint="Close tickets left Answered this many days with no customer reply. 0 = never.">
                            <Input type="number" min="0" max="365" required {...text('ticket_auto_close_days')} />
                        </Field>
                    </Section>
                    <p className="text-xs text-slate-500">These run from the daily scheduler, so the server needs a cron job calling <code className="rounded bg-slate-100 px-1">php artisan schedule:run</code> every minute.</p>
                </div>

                <div className={tab.key === 'email' ? 'space-y-4' : 'hidden'}>
                    <div className="grid gap-4 lg:grid-cols-2">
                        <Section title="SMTP Server" action={<span className="text-xs text-slate-500">Now sending with: <strong>{data.mailer}</strong></span>}>
                            <Field label="Host" hint="Leave blank to use the server's .env mail settings."><Input placeholder="mail.example.com" {...text('mail_host')} /></Field>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label="Port"><Input type="number" min="1" max="65535" placeholder="587" {...text('mail_port')} /></Field>
                                <Field label="Encryption">
                                    <Select {...text('mail_scheme')}><option value="">Auto (STARTTLS)</option><option value="smtps">SSL (port 465)</option></Select>
                                </Field>
                            </div>
                            <Field label="Username"><Input autoComplete="off" {...text('mail_username')} /></Field>
                            <Field label="Password" hint={secretHint('mail_password')}><Input type="password" autoComplete="new-password" value={secrets.mail_password} onChange={(e) => setSecrets({ ...secrets, mail_password: e.target.value })} /></Field>
                        </Section>
                        <div className="space-y-4">
                            <Section title="Sender">
                                <Field label="From address"><Input type="email" placeholder="billing@example.com" {...text('mail_from_address')} /></Field>
                                <Field label="From name" hint="Leave blank to use the company name."><Input {...text('mail_from_name')} /></Field>
                            </Section>
                            <TestEmail />
                        </div>
                    </div>
                </div>

                <ErrorNote error={save.error} />
                <div className="flex items-center justify-end gap-3 pb-2">
                    {save.isSuccess && <span role="status" className="text-xs font-semibold text-emerald-700">Settings saved.</span>}
                    <Button disabled={save.isPending}>{save.isPending ? 'Saving...' : 'Save settings'}</Button>
                </div>
            </form>
        </div>
    );
}

export function SettingsPage() {
    const query = useQuery({ queryKey: ['settings'], queryFn: async () => (await api.get<SettingsResponse>('/settings')).data });

    return <QueryState query={query}>{query.data && <SettingsForm data={query.data} />}</QueryState>;
}
