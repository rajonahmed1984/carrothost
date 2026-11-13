import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { Button, ErrorNote, Field, Input, QueryState, SecretInput, Select, Status, type Branding } from '../ui';
import { EmailTemplatesSection } from './email-templates';

/** Integration pages listed under System in the sidebar. */
export const settings = [
    { to: '/admin/settings/servers-config', label: 'Servers Config' },
    { to: '/admin/settings/registrars', label: 'Domain Registrars' },
    { to: '/admin/settings/gateways', label: 'Payment Gateways' },
];

const tabs = [
    { key: 'general', label: 'General', hint: 'Brand, contact, locale and sign-in security.' },
    { key: 'invoices', label: 'Invoices', hint: 'When new invoices fall due, and Add Funds limits.' },
    { key: 'currencies', label: 'Currencies', hint: 'Which currency new clients start in, and what 1 USD is worth in BDT.' },
    { key: 'domains', label: 'Domains', hint: 'What customers can order, and the defaults each new domain starts with.' },
    { key: 'automation', label: 'Automation', hint: 'Renewals, suspensions and support ticket clean-up.' },
    { key: 'email', label: 'Email', hint: 'How mail is sent, and the templates for every email your customers receive.' },
    { key: 'sms', label: 'SMS', hint: 'Text customers about their invoices through the 24bulksmsbd.com gateway.' },
];

const SMS_EVENTS = [
    { key: 'created', label: 'Send SMS when an invoice is created (payment reminder)', field: 'Invoice created message' },
    { key: 'paid', label: 'Send SMS when an invoice is paid (payment confirmation)', field: 'Invoice paid message' },
    { key: 'reminder', label: 'Send SMS with invoice reminders (before due date and overdue notices)', field: 'Invoice reminder message' },
] as const;

const SMS_EVENT_LABELS: Record<string, string> = { invoice_created: 'Invoice created', invoice_paid: 'Invoice paid', invoice_reminder: 'Invoice reminder', test: 'Test' };

type Values = {
    company_name: string; company_email: string | null; pay_to_text: string | null; company_country: string | null; time_zone: string;
    currency: string; usd_rate: string | null; invoice_due_days: number; renewal_notice_days: number; credit_min_deposit: string; credit_max_deposit: string; credit_max_balance: string; suspension_enabled: boolean; suspend_after_days: number;
    unsuspension_enabled: boolean; ticket_auto_close_days: number; domain_allow_register: boolean; domain_allow_transfer: boolean;
    domain_allow_own: boolean; domain_auto_renew: boolean; nameserver_1: string | null; nameserver_2: string | null; nameserver_3: string | null;
    nameserver_4: string | null; nameserver_5: string | null; recaptcha_enabled: boolean; recaptcha_site_key: string | null;
    recaptcha_project_id: string | null; recaptcha_score_threshold: number | string | null; mail_host: string | null; mail_port: number | string | null;
    mail_scheme: string | null; mail_username: string | null; mail_from_address: string | null; mail_from_name: string | null;
    termination_enabled: boolean; terminate_after_days: number; reminder_before_due_days: number; overdue_notice_1: number; overdue_notice_2: number;
    overdue_notice_3: number; domain_reminder_days: string; usage_update_enabled: boolean; domain_sync_enabled: boolean;
    cron_report_enabled: boolean; domain_sync_report_enabled: boolean; report_recipients: string | null;
    notify_new_order: boolean; notify_invoice_created: boolean; notify_invoice_paid: boolean; notify_order_status: boolean; notify_cancellation_request: boolean; notify_ticket: boolean; notify_chat: boolean;
    sms_enabled: boolean; sms_api_url: string | null; sms_customer_id: string | null; sms_whitelisted_ip: string | null;
    sms_invoice_created_enabled: boolean; sms_invoice_paid_enabled: boolean; sms_invoice_reminder_enabled: boolean;
    sms_invoice_created_template: string; sms_invoice_paid_template: string; sms_invoice_reminder_template: string;
};
type Automation = { heartbeat: string | null; runs: Record<string, { at: string; count: number | null }> };
type Secrets = { recaptcha_secret_key: boolean; recaptcha_api_key: boolean; mail_password: boolean; sms_api_key: boolean };
type SettingsResponse = { settings: Values; secrets: Secrets; branding: Branding; custom_logo: boolean; mailer: string; time_zones: string[]; automation?: Automation; sms_placeholders: string[] };
type SmsLogRow = {
    id: number; event: string; status: string; mobile: string | null; message: string | null; response: string | null;
    client: { id: number; name: string } | null; invoice: { id: number; number: string } | null; created_at: string | null;
};

const emptySecrets = { recaptcha_secret_key: '', recaptcha_api_key: '', mail_password: '', sms_api_key: '' };

const TASKS: [string, string][] = [
    ['renewals', 'Renewal invoices'], ['suspensions', 'Suspend overdue'], ['terminations', 'Terminate'], ['invoice_reminders', 'Payment reminders'],
    ['domain_reminders', 'Domain reminders'], ['domain_expiry', 'Expire domains'], ['domain_sync', 'Domain sync'], ['usage', 'Usage update'], ['enforce_suspensions', 'Server suspensions'],
    ['ticket_auto_close', 'Close tickets'],
];

/** Whether cron is running the scheduler, and when each daily job last ran. */
function CronStatus({ automation }: { automation?: Automation }) {
    if (!automation) return null;
    const beat = automation.heartbeat ? new Date(automation.heartbeat) : null;
    const minutes = beat ? Math.round((Date.now() - beat.getTime()) / 60000) : null;
    const ok = minutes !== null && minutes <= 10;

    return (
        <Section title="Cron Status">
            <p className={`rounded-xl border px-3 py-2 text-sm ${ok ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>
                {ok ? `Cron is running. The scheduler last ran ${minutes === 0 ? 'less than a minute' : `${minutes} min`} ago.`
                    : beat ? `Cron looks stopped: the scheduler last ran ${beat.toLocaleString()}. Nothing below runs until it is fixed.`
                    : 'Cron has not run yet. Add the cron job below on the server, or nothing below runs.'}
            </p>
            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                {TASKS.map(([key, label]) => {
                    const run = automation.runs[key];

                    return (
                        <div key={key} className="rounded-xl border border-slate-200 px-3 py-2">
                            <div className="text-xs text-slate-500">{label}</div>
                            <div className="text-slate-800">{run ? `${new Date(run.at).toLocaleString()}${run.count !== null ? ` · ${run.count}` : ''}` : <span className="text-slate-400">Not run yet</span>}</div>
                        </div>
                    );
                })}
            </div>
        </Section>
    );
}

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

function TestSms({ onSent }: { onSent: () => void }) {
    const [mobile, setMobile] = useState('');
    const send = useMutation({ mutationFn: async () => (await api.post<{ message: string }>('/settings/test-sms', { mobile })).data, onSettled: onSent });

    return (
        <Section title="Test SMS">
            <p className="text-sm text-slate-500">Save the gateway settings first, then send a test message to a Bangladeshi mobile number.</p>
            <form onSubmit={(e) => { e.preventDefault(); send.mutate(); }} className="flex flex-wrap gap-2">
                <div className="min-w-0 flex-1"><Input type="tel" required placeholder="01XXXXXXXXX" value={mobile} onChange={(e) => setMobile(e.target.value)} /></div>
                <Button variant="ghost" disabled={send.isPending}>{send.isPending ? 'Sending...' : 'Send test SMS'}</Button>
            </form>
            {send.data && <p role="status" className="text-xs text-emerald-700">{send.data.message}</p>}
            <ErrorNote error={send.error} />
        </Section>
    );
}

/** The latest SMS the panel tried to send, so a failing gateway or a missing phone number shows up. */
function SmsLogs() {
    const query = useQuery({ queryKey: ['sms-logs'], queryFn: async () => (await api.get<SmsLogRow[]>('/settings/sms-logs')).data });

    return (
        <Section title="Recent SMS" action={<button type="button" className="table-action-link text-xs" onClick={() => query.refetch()}>Refresh</button>}>
            <QueryState query={query}>
                {query.data && (query.data.length === 0 ? <p className="text-sm text-slate-500">No SMS sent yet.</p> : (
                    <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                        {query.data.map((log) => (
                            <div key={log.id} className="grid gap-1 px-4 py-3 text-sm md:grid-cols-[10rem_1fr_auto] md:gap-4">
                                <div className="min-w-0">
                                    <div className="font-medium text-slate-900">{SMS_EVENT_LABELS[log.event] ?? log.event}</div>
                                    <div className="text-xs text-slate-500">{log.created_at ? new Date(log.created_at).toLocaleString() : ''}</div>
                                </div>
                                <div className="min-w-0 space-y-1">
                                    <div className="flex flex-wrap gap-x-3 text-xs text-slate-600">
                                        {log.client && <Link className="table-action-link" to={`/admin/clients/${log.client.id}`}>{log.client.name}</Link>}
                                        {log.invoice && <Link className="table-action-link" to={`/admin/invoices/${log.invoice.id}`}>Invoice #{log.invoice.number}</Link>}
                                        {log.mobile && <span className="tabular-nums">{log.mobile}</span>}
                                    </div>
                                    {log.message && <p className="break-words text-slate-700">{log.message}</p>}
                                    {log.response && <p className="break-words text-xs text-slate-500">{log.response}</p>}
                                </div>
                                <div><Status value={log.status} /></div>
                            </div>
                        ))}
                    </div>
                ))}
            </QueryState>
        </Section>
    );
}

function SettingsForm({ data }: { data: SettingsResponse }) {
    const qc = useQueryClient();
    const [params, setParams] = useSearchParams();
    const tab = tabs.find((t) => t.key === params.get('tab')) ?? tabs[0];
    const smsLogs = tab.key === 'sms' && params.get('view') === 'logs';
    const [values, setValues] = useState<Values>(data.settings);
    const [secrets, setSecrets] = useState(emptySecrets);
    const [files, setFiles] = useState<{ logo: File | null; favicon: File | null }>({ logo: null, favicon: null });
    const [remove, setRemove] = useState({ logo: false, favicon: false });
    const set = <K extends keyof Values>(key: K) => (value: Values[K]) => setValues({ ...values, [key]: value });
    const text = (key: keyof Values) => ({ value: String(values[key] ?? ''), onChange: (e: { target: { value: string } }) => setValues({ ...values, [key]: e.target.value }) });
    const secretHint = (key: keyof Secrets) => (data.secrets[key] ? 'Saved. Press the eye to see it, or type a new one to replace it.' : undefined);
    const reveal = (key: keyof Secrets) => async () => (await api.post<{ value: string }>('/secrets/setting', { key })).data;

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
            setSecrets(emptySecrets);
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

            {tab.key === 'sms' && (
                <div className="flex gap-1 border-b border-slate-200">
                    {[{ key: 'settings', label: 'Settings' }, { key: 'logs', label: 'Recent SMS' }].map((v) => {
                        const active = (v.key === 'logs') === smsLogs;

                        return (
                            <button
                                key={v.key}
                                type="button"
                                onClick={() => setParams(v.key === 'logs' ? { tab: 'sms', view: 'logs' } : { tab: 'sms' }, { replace: true })}
                                className={`-mb-px cursor-pointer border-b-2 px-4 py-2 text-sm font-semibold transition ${active ? 'border-[var(--accent)] text-accent' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                            >
                                {v.label}
                            </button>
                        );
                    })}
                </div>
            )}

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
                            <Field label="Secret key" hint={secretHint('recaptcha_secret_key')}><SecretInput value={secrets.recaptcha_secret_key} onChange={(v) => setSecrets({ ...secrets, recaptcha_secret_key: v })} saved={data.secrets.recaptcha_secret_key} reveal={reveal('recaptcha_secret_key')} /></Field>
                            <Field label="Project ID" hint="Enterprise only."><Input {...text('recaptcha_project_id')} /></Field>
                            <Field label="API key" hint={secretHint('recaptcha_api_key') ?? 'Enterprise only.'}><SecretInput value={secrets.recaptcha_api_key} onChange={(v) => setSecrets({ ...secrets, recaptcha_api_key: v })} saved={data.secrets.recaptcha_api_key} reveal={reveal('recaptcha_api_key')} /></Field>
                            <Field label="Score threshold" hint="0 to 1. Lower lets more through."><Input type="number" min="0" max="1" step="0.01" {...text('recaptcha_score_threshold')} /></Field>
                        </div>
                    </Section>
                </div>

                <div className={tab.key === 'invoices' ? 'space-y-4' : 'hidden'}>
                    <Section title="Invoice Settings">
                        <div className="grid gap-4 md:grid-cols-2">
                            <Field label="Invoice due days" hint="Days after an order that its invoice falls due. 0 = due straight away.">
                                <Input type="number" min="0" max="365" required {...text('invoice_due_days')} />
                            </Field>
                        </div>
                        <div className="grid gap-4 md:grid-cols-3">
                            <Field label="Minimum deposit" hint="Smallest Add Funds amount a client can pay."><Input type="number" min="0.01" step="0.01" {...text('credit_min_deposit')} /></Field>
                            <Field label="Maximum deposit" hint="Largest single Add Funds payment."><Input type="number" min="0.01" step="0.01" {...text('credit_max_deposit')} /></Field>
                            <Field label="Maximum balance" hint="Highest credit balance a client can build up."><Input type="number" min="0.01" step="0.01" {...text('credit_max_balance')} /></Field>
                        </div>
                        <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                            Bank transfer and other payment instructions are set on the Manual gateway in <Link className="table-action-link" to="/admin/settings/gateways">Payment Gateways</Link>.
                        </p>
                    </Section>
                </div>

                <div className={tab.key === 'currencies' ? 'space-y-4' : 'hidden'}>
                    <Section title="Client Currency">
                        <div className="grid gap-4 md:grid-cols-2">
                            <Field label="Default for new clients" hint="Customers can pick BDT or USD when they sign up; this is preselected. Change an existing client's currency on their profile.">
                                <Select {...text('currency')}><option value="BDT">BDT</option><option value="USD">USD</option></Select>
                            </Field>
                        </div>
                        <p className="text-xs text-slate-500">
                            Each client is billed in their own currency: store prices, orders, invoices, renewals, upgrades and credit. Prices are set in BDT; a USD client pays the fixed USD price where a product or TLD has one, else the BDT price converted at the rate below. Reports add everything up in BDT.
                        </p>
                    </Section>
                    <Section title="Exchange Rates">
                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                            <table className="w-full min-w-[30rem] text-sm">
                                <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase">
                                    <tr><th className="px-4 py-2">Currency</th><th className="px-4 py-2">Rate</th><th className="px-4 py-2">Used for</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    <tr>
                                        <td className="px-4 py-3 font-medium text-slate-900">BDT <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">Base</span></td>
                                        <td className="px-4 py-3 text-slate-600 tabular-nums">1.00</td>
                                        <td className="px-4 py-3 text-xs text-slate-500">Every amount is converted to BDT.</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-medium text-slate-900">USD</td>
                                        <td className="px-4 py-3">
                                            <label className="flex items-center gap-2">
                                                <span className="text-xs whitespace-nowrap text-slate-500">1 USD =</span>
                                                <input type="number" min="0.0001" max="100000" step="0.0001" placeholder="122.00" aria-label="BDT per 1 USD" className="ui-input w-32" {...text('usd_rate')} />
                                                <span className="text-xs text-slate-500">BDT</span>
                                            </label>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-500">USD prices without a fixed price, bKash/SSLCommerz payments of USD invoices, PayPal payments of BDT invoices, USD registrar costs, and BDT totals in reports.</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <p className="text-xs text-slate-500">Keep this rate current. Domain profit uses it for USD costs with no deposit recorded in the registrar's wallet; a recorded deposit uses what you actually paid.</p>
                    </Section>
                </div>

                <div className={tab.key === 'domains' ? 'space-y-4' : 'hidden'}>
                    <div className="grid gap-4 lg:grid-cols-2">
                        <Section title="Domain Ordering">
                            <Check checked={values.domain_allow_register} onChange={set('domain_allow_register')} label="Allow customers to register domains with you" />
                            <Check checked={values.domain_allow_transfer} onChange={set('domain_allow_transfer')} label="Allow customers to transfer a domain to you" />
                            <Check checked={values.domain_allow_own} onChange={set('domain_allow_own')} label="Allow customers to use their own domain for hosting" />
                            <p className="text-xs text-slate-500">
                                Prices come from <Link className="table-action-link" to="/admin/domain-pricing">Domain Pricing</Link>. Only active extensions can be ordered.
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
                            <div />
                            <Check checked={values.termination_enabled} onChange={set('termination_enabled')} label="Terminate services left suspended for unpaid bills" />
                            <Field label="Terminate after days" hint="Days past the due date. Deletes the account on the server: off by default.">
                                <Input type="number" min="1" max="365" required disabled={!values.termination_enabled} {...text('terminate_after_days')} />
                            </Field>
                            <p className="text-xs text-slate-500 md:col-span-2">Services marked "Terminate at end of cycle" are always terminated on their due date.</p>
                        </div>
                    </Section>
                    <Section title="Billing Reminders">
                        <div className="grid gap-4 md:grid-cols-4">
                            <Field label="Reminder before due" hint="Days before. 0 = off"><Input type="number" min="0" max="60" required {...text('reminder_before_due_days')} /></Field>
                            <Field label="1st overdue notice" hint="Days after. 0 = off"><Input type="number" min="0" max="365" required {...text('overdue_notice_1')} /></Field>
                            <Field label="2nd overdue notice" hint="Days after. 0 = off"><Input type="number" min="0" max="365" required {...text('overdue_notice_2')} /></Field>
                            <Field label="3rd overdue notice" hint="Days after. 0 = off"><Input type="number" min="0" max="365" required {...text('overdue_notice_3')} /></Field>
                        </div>
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                            <Field label="Domain expiry reminders" hint="Days before expiry, comma separated; a negative number is days after. e.g. 30,14,7,3,1,-3">
                                <Input placeholder="30,14,7,3,1,-3" {...text('domain_reminder_days')} />
                            </Field>
                        </div>
                    </Section>
                    <Section title="Daily Sync">
                        <div className="grid gap-3 md:grid-cols-2">
                            <Check checked={values.usage_update_enabled} onChange={set('usage_update_enabled')} label="Update disk and bandwidth usage from the servers" />
                            <Check checked={values.domain_sync_enabled} onChange={set('domain_sync_enabled')} label="Sync domain expiry and status from the registrars" />
                        </div>
                    </Section>
                    <Section title="Admin Reports & Notifications">
                        <div className="grid gap-3 md:grid-cols-2">
                            <Check checked={values.cron_report_enabled} onChange={set('cron_report_enabled')} label="Daily report at midnight: what the cron jobs did" />
                            <Check checked={values.domain_sync_report_enabled} onChange={set('domain_sync_report_enabled')} label="Daily report at midnight: what the domain sync changed" />
                            <Check checked={values.notify_new_order} onChange={set('notify_new_order')} label="Email when a client places a new order" />
                            <Check checked={values.notify_invoice_created} onChange={set('notify_invoice_created')} label="Email when an invoice is created (renewals, add funds, manual)" />
                            <Check checked={values.notify_invoice_paid} onChange={set('notify_invoice_paid')} label="Email when an invoice is paid" />
                            <Check checked={values.notify_order_status} onChange={set('notify_order_status')} label="Email when an order is accepted or cancelled" />
                            <Check checked={values.notify_cancellation_request} onChange={set('notify_cancellation_request')} label="Email when a client requests a cancellation" />
                            <Check checked={values.notify_ticket} onChange={set('notify_ticket')} label="Email when a client opens or replies to a ticket" />
                            <Check checked={values.notify_chat} onChange={set('notify_chat')} label="Email when a client starts a chat" />
                        </div>
                        <Field label="Send reports and notifications to" hint="Comma separated. Leave blank to send to every admin.">
                            <Input placeholder="admin@example.com, billing@example.com" {...text('report_recipients')} />
                        </Field>
                    </Section>
                    <Section title="Support Ticket Automation">
                        <Field label="Auto-close days" hint="Close tickets left Answered this many days with no customer reply. 0 = never.">
                            <Input type="number" min="0" max="365" required {...text('ticket_auto_close_days')} />
                        </Field>
                    </Section>
                    <CronStatus automation={data.automation} />
                    <p className="text-xs text-slate-500">
                        These run from the scheduler, so the server needs one cron job every minute (cPanel &gt; Cron Jobs):{' '}
                        <code className="rounded bg-slate-100 px-1 break-all">* * * * * cd /path/to/panel &amp;&amp; php artisan schedule:run &gt;&gt; /dev/null 2&gt;&amp;1</code>
                    </p>
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
                            <Field label="Password" hint={secretHint('mail_password')}><SecretInput value={secrets.mail_password} onChange={(v) => setSecrets({ ...secrets, mail_password: v })} saved={data.secrets.mail_password} reveal={reveal('mail_password')} /></Field>
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

                <div className={tab.key === 'sms' && !smsLogs ? 'space-y-4' : 'hidden'}>
                    <div className="grid gap-4 lg:grid-cols-2">
                        <Section title="SMS Gateway">
                            <Check checked={values.sms_enabled} onChange={set('sms_enabled')} label="Enable SMS notifications" />
                            <Field label="API URL"><Input type="url" placeholder="https://www.24bulksmsbd.com/api/smsSendApi" {...text('sms_api_url')} /></Field>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label="Customer ID"><Input autoComplete="off" {...text('sms_customer_id')} /></Field>
                                <Field label="API key" hint={secretHint('sms_api_key')}><SecretInput value={secrets.sms_api_key} onChange={(v) => setSecrets({ ...secrets, sms_api_key: v })} saved={data.secrets.sms_api_key} reveal={reveal('sms_api_key')} /></Field>
                            </div>
                            <Field label="Whitelisted server IP" hint="For reference only. The gateway rejects requests from any other server IP."><Input placeholder="0.0.0.0" {...text('sms_whitelisted_ip')} /></Field>
                        </Section>
                        <TestSms onSent={() => qc.invalidateQueries({ queryKey: ['sms-logs'] })} />
                    </div>
                    <Section title="Invoice SMS">
                        <p className="text-sm text-slate-500">
                            Sent to the client's phone number. Placeholders:{' '}
                            {data.sms_placeholders.map((p) => <code key={p} className="mr-1 inline-block rounded bg-slate-100 px-1 text-xs">{`{{${p}}}`}</code>)}
                        </p>
                        <div className="grid gap-4 md:grid-cols-2">
                            {SMS_EVENTS.map((event) => (
                                <div key={event.key} className="space-y-3">
                                    <Check checked={values[`sms_invoice_${event.key}_enabled`]} onChange={set(`sms_invoice_${event.key}_enabled`)} label={event.label} />
                                    <Field label={event.field}>
                                        <textarea rows={3} maxLength={1000} className="ui-input py-2" style={{ height: 'auto' }} {...text(`sms_invoice_${event.key}_template`)} />
                                    </Field>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-slate-500">Clear a message to go back to the default. Reminders follow the days set under Automation &gt; Billing Reminders. Clients without a Bangladeshi mobile number are skipped.</p>
                    </Section>
                </div>

                <ErrorNote error={save.error} />
                <div className={smsLogs ? 'hidden' : 'flex items-center justify-end gap-3 pb-2'}>
                    {save.isSuccess && <span role="status" className="text-xs font-semibold text-emerald-700">Settings saved.</span>}
                    <Button disabled={save.isPending}>{save.isPending ? 'Saving...' : 'Save settings'}</Button>
                </div>
            </form>

            {/* Outside the settings form: templates save on their own. */}
            {tab.key === 'email' && <EmailTemplatesSection />}
            {smsLogs && <SmsLogs />}
        </div>
    );
}

export function SettingsPage() {
    const query = useQuery({ queryKey: ['settings'], queryFn: async () => (await api.get<SettingsResponse>('/settings')).data });

    return <QueryState query={query}>{query.data && <SettingsForm data={query.data} />}</QueryState>;
}
