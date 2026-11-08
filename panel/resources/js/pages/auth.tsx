import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Mail, ShieldCheck } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api, basePath } from '../api';
import { Button, ErrorNote, Field, Input, Logo, Select, useAppConfig, useBranding } from '../ui';

type Audience = 'admin' | 'client';
type RecaptchaWidget = {
    render: (box: HTMLElement, options: { sitekey: string; action: string; callback: (token: string) => void; 'expired-callback': () => void }) => number;
    reset: (id: number) => void;
};

declare global {
    interface Window {
        grecaptcha?: RecaptchaWidget & { enterprise?: RecaptchaWidget };
    }
}

const prefix = (audience: Audience) => (audience === 'admin' ? '/admin' : '');

const googleErrors: Record<string, string> = {
    google_unavailable: 'Google login is currently unavailable.',
    google_failed: 'Google sign-in did not complete. Please try again.',
    google_unverified: 'Your Google email address is not verified.',
    google_closed: 'This account is not active. Please contact support.',
};

const phoneCountries = [['+880', 'BD +880'], ['+1', 'US +1'], ['+44', 'UK +44'], ['+91', 'IN +91'], ['+92', 'PK +92']];

export const isGuestPath = (path: string) => /^\/(admin\/)?(login(\/otp)?|forgot-password|reset-password\/[^/]+)$|^\/register(\/verify)?$|^\/auth\/sandbox\/google$/.test(path);

/** Only a path on this site: browsers read both // and /\ as the start of another host. */
export const safeRedirect = (value: string | null) => (value && /^\/(?![/\\])/.test(value) ? value : null);

const useAuthConfig = useAppConfig;

function useSignedIn() {
    const client = useQueryClient();

    return () => Promise.all([client.invalidateQueries({ queryKey: ['me'] }), client.invalidateQueries({ queryKey: ['client-me'] })]);
}

/** The widget is rendered by hand because the page may mount after Google's script has already run. */
function useRecaptcha(action: string) {
    const config = useAuthConfig().data?.recaptcha;
    const box = useRef<HTMLDivElement>(null);
    const widget = useRef<number | null>(null);
    const [token, setToken] = useState('');
    const client = () => (config?.enterprise ? window.grecaptcha?.enterprise : window.grecaptcha);

    useEffect(() => {
        if (!config?.enabled) return;

        const src = `https://www.google.com/recaptcha/${config.enterprise ? 'enterprise' : 'api'}.js?render=explicit`;
        if (!document.querySelector(`script[src="${src}"]`)) {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            document.head.appendChild(script);
        }

        const timer = window.setInterval(() => {
            const g = client();
            if (!g?.render || !box.current) return;

            window.clearInterval(timer);
            widget.current = g.render(box.current, { sitekey: config.site_key, action, callback: setToken, 'expired-callback': () => setToken('') });
        }, 100);

        return () => window.clearInterval(timer);
    }, [config?.enabled, config?.site_key, config?.enterprise, action]);

    return {
        field: { 'g-recaptcha-response': token },
        element: config?.enabled ? <div ref={box} className="flex justify-center" /> : null,
        // A token only works once, so a failed attempt needs a new one.
        reset: () => {
            if (widget.current !== null) client()?.reset(widget.current);
            setToken('');
        },
    };
}

function AuthCard({ title, subtitle, wide, children, footer }: { title: string; subtitle?: ReactNode; wide?: boolean; children: ReactNode; footer?: ReactNode }) {
    const brand = useBranding().name;

    useEffect(() => {
        document.title = `${title} | ${brand}`;
    }, [title, brand]);

    return (
        <main className="bg-guest flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
            <div className={`fade-in w-full ${wide ? 'max-w-xl' : 'max-w-[25.2rem]'}`}>
                <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-xl shadow-slate-200/30 sm:p-10">
                    <div className="mb-6 text-center">
                        <div className="mb-6 flex justify-center"><Logo className="h-11" /></div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
                        {subtitle && <div className="mt-1.5 text-xs text-slate-500">{subtitle}</div>}
                    </div>
                    {children}
                    {footer && <div className="mt-6 space-y-2 text-center text-xs text-slate-500">{footer}</div>}
                </div>
            </div>
        </main>
    );
}

const Notice = ({ children }: { children: ReactNode }) => <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">{children}</p>;
const TextLink = ({ to, children }: { to: string; children: ReactNode }) => <Link to={to} className="font-semibold text-accent hover:underline">{children}</Link>;

function EmailLogin({ audience, onBack }: { audience: Audience; onBack?: () => void }) {
    const navigate = useNavigate();
    const { search } = useLocation();
    const signedIn = useSignedIn();
    const recaptcha = useRecaptcha(audience === 'admin' ? 'ADMIN_LOGIN' : 'LOGIN');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(false);
    const login = useMutation({
        mutationFn: async () => (await api.post<{ requires_otp: boolean }>(audience === 'admin' ? '/login' : '/client/login', { email, password, remember, ...recaptcha.field })).data,
        onSuccess: (data) => (data.requires_otp ? navigate(`${prefix(audience)}/login/otp${search}`) : signedIn()),
        onError: recaptcha.reset,
    });

    return (
        <form onSubmit={(e: FormEvent) => { e.preventDefault(); login.mutate(); }} className="space-y-4">
            <Field label="Email"><Input type="email" autoComplete="username" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
            <Field label="Password"><Input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
            <div className="flex items-center justify-between gap-3 text-xs text-slate-600">
                <label className="flex cursor-pointer items-center gap-2 select-none">
                    <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Remember me
                </label>
                <TextLink to={`${prefix(audience)}/forgot-password`}>Forgot password?</TextLink>
            </div>
            {recaptcha.element}
            <ErrorNote error={login.error} />
            <Button type="submit" className="w-full" disabled={login.isPending}>{login.isPending ? 'Signing in...' : 'Sign in'}</Button>
            {onBack && <Button type="button" variant="ghost" className="w-full" onClick={onBack}>Other sign-in options</Button>}
        </form>
    );
}

function Login({ audience }: { audience: Audience }) {
    const [params] = useSearchParams();
    const { state } = useLocation();
    const config = useAuthConfig();
    const google = audience === 'client' && Boolean(config.data?.google);
    const [useEmail, setUseEmail] = useState(false);
    const redirect = safeRedirect(params.get('redirect'));
    const googleError = googleErrors[params.get('error') ?? ''];
    const googleUrl = `${basePath}/auth/google/redirect${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`;

    return (
        <AuthCard
            title={audience === 'admin' ? 'Admin login' : 'Log in to your account'}
            subtitle={google && !useEmail ? 'Choose a method to continue to the client portal' : 'Enter your credentials to continue'}
            footer={audience === 'admin'
                ? <p>Client account? Use the <TextLink to="/login">client login</TextLink>.</p>
                : <p>Need an account? <TextLink to={`/register${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}>Register</TextLink>.</p>}
        >
            <div className="space-y-4">
                {state?.status && <Notice>{state.status}</Notice>}
                {googleError && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">{googleError}</p>}
                {google && !useEmail ? (
                    <div className="space-y-3">
                        <Button type="button" className="w-full" onClick={() => setUseEmail(true)}><Mail size={15} /> Login with email</Button>
                        <a href={googleUrl} className="ui-btn ui-btn-secondary w-full">Login with Google</a>
                    </div>
                ) : (
                    <EmailLogin audience={audience} onBack={google ? () => setUseEmail(false) : undefined} />
                )}
            </div>
        </AuthCard>
    );
}

type CodeStatus = { email: string; local_otp: string | null };

function CodeScreen({ url, heading, submitLabel, cancelLabel, cancelTo, onCancel }: { url: string; heading: string; submitLabel: string; cancelLabel: string; cancelTo: string; onCancel: () => void }) {
    const signedIn = useSignedIn();
    const [otp, setOtp] = useState('');
    const [cooldown, setCooldown] = useState(0);
    const status = useQuery({ queryKey: [url], queryFn: async () => (await api.get<CodeStatus>(url)).data, retry: false, staleTime: Infinity, gcTime: 0 });
    const verify = useMutation({ mutationFn: () => api.post(url, { otp }), onSuccess: () => signedIn() });
    const resend = useMutation({
        mutationFn: async () => (await api.post<{ message: string }>(`${url}/resend`)).data,
        onSuccess: () => setCooldown(60),
    });

    useEffect(() => {
        if (cooldown <= 0) return;

        const timer = window.setTimeout(() => setCooldown(cooldown - 1), 1000);

        return () => window.clearTimeout(timer);
    }, [cooldown]);

    if (status.isError) return <Navigate to={cancelTo} replace />;
    if (status.isLoading) return <p className="p-10 text-center text-slate-500">Loading...</p>;

    return (
        <AuthCard
            title={heading}
            subtitle={<>We have sent a 6-digit code to <span className="font-semibold text-slate-800">{status.data?.email}</span></>}
            footer={(
                <>
                    <p>
                        Didn&apos;t receive the code?{' '}
                        <button type="button" disabled={cooldown > 0 || resend.isPending} onClick={() => resend.mutate()} className="cursor-pointer font-semibold text-accent hover:underline disabled:cursor-not-allowed disabled:text-slate-400">
                            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
                        </button>
                    </p>
                    <p><button type="button" onClick={onCancel} className="cursor-pointer text-slate-500 hover:underline">{cancelLabel}</button></p>
                </>
            )}
        >
            <form onSubmit={(e: FormEvent) => { e.preventDefault(); verify.mutate(); }} className="space-y-4">
                <div className="flex justify-center text-accent"><ShieldCheck size={32} /></div>
                {status.data?.local_otp && (
                    <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
                        <span className="font-semibold">Local development:</span> code <code className="font-bold">{status.data.local_otp}</code> also works.{' '}
                        <button type="button" onClick={() => setOtp(status.data!.local_otp!)} className="cursor-pointer font-semibold underline">Fill it in</button>
                    </div>
                )}
                {resend.isSuccess && <Notice>{resend.data.message}</Notice>}
                <Field label="Verification code">
                    <input
                        autoFocus
                        required
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        placeholder="••••••"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="ui-input text-center font-mono text-2xl tracking-[0.4em]"
                    />
                </Field>
                <ErrorNote error={verify.error ?? resend.error} />
                <Button type="submit" className="w-full" disabled={otp.length < 6 || verify.isPending}>{verify.isPending ? 'Checking...' : submitLabel}</Button>
            </form>
        </AuthCard>
    );
}

function LoginCode({ audience }: { audience: Audience }) {
    const navigate = useNavigate();
    const { search } = useLocation();
    const loginPath = `${prefix(audience)}/login${search}`;

    return (
        <CodeScreen
            url="/login/otp"
            heading="Security verification"
            submitLabel="Verify code & sign in"
            cancelLabel="Back to login"
            cancelTo={loginPath}
            onCancel={() => { void api.post('/login/otp/cancel').finally(() => navigate(loginPath)); }}
        />
    );
}

function RegisterCode() {
    const navigate = useNavigate();
    const { search } = useLocation();

    return (
        <CodeScreen
            url="/client/register/verify"
            heading="Verify your email"
            submitLabel="Verify & complete registration"
            cancelLabel="Back to registration"
            cancelTo={`/register${search}`}
            onCancel={() => { void api.post<{ form: object | null }>('/client/register/verify/cancel').then(({ data }) => navigate(`/register${search}`, { state: { form: data.form } })); }}
        />
    );
}

function Register() {
    const navigate = useNavigate();
    const { state, search } = useLocation();
    const recaptcha = useRecaptcha('REGISTER');
    const branding = useBranding();
    const currencies = branding.currencies ?? ['BDT', 'USD'];
    const [form, setForm] = useState({ name: '', company: '', email: '', phone_country: '+880', phone: '', address: '', currency: '', password: '', password_confirmation: '', ...state?.form });
    const set = (field: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [field]: e.target.value });
    const submit = useMutation({
        mutationFn: () => api.post('/client/register', { ...form, ...recaptcha.field }),
        onSuccess: () => navigate(`/register/verify${search}`),
        onError: recaptcha.reset,
    });
    const mismatch = form.password_confirmation !== '' && form.password !== form.password_confirmation;

    return (
        <AuthCard wide title="Create an account" subtitle={<>Already have an account? <TextLink to={`/login${search}`}>Sign in</TextLink>.</>}>
            <form onSubmit={(e: FormEvent) => { e.preventDefault(); submit.mutate(); }} className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name"><Input required autoComplete="name" maxLength={255} value={form.name} onChange={set('name')} /></Field>
                <Field label="Company (optional)"><Input autoComplete="organization" maxLength={255} value={form.company ?? ''} onChange={set('company')} /></Field>
                <div className="sm:col-span-2"><Field label="Email"><Input type="email" required autoComplete="email" maxLength={255} value={form.email} onChange={set('email')} /></Field></div>
                <Field label="Country code"><Select value={form.phone_country} onChange={set('phone_country')}>{phoneCountries.map(([code, label]) => <option key={code} value={code}>{label}</option>)}</Select></Field>
                <Field label="Phone (optional)"><Input type="tel" autoComplete="tel-national" maxLength={24} value={form.phone ?? ''} onChange={set('phone')} /></Field>
                <Field label="Address (optional)"><Input autoComplete="street-address" maxLength={255} value={form.address ?? ''} onChange={set('address')} /></Field>
                <Field label="Currency" hint="Your prices and invoices are in this.">
                    <Select value={form.currency || branding.default_currency || 'BDT'} onChange={set('currency')}>
                        {currencies.map((c) => <option key={c} value={c}>{c === 'BDT' ? 'BDT (Bangladeshi Taka)' : c === 'USD' ? 'USD (US Dollar)' : c}</option>)}
                    </Select>
                </Field>
                <Field label="Password" hint="At least 10 characters"><Input type="password" required minLength={10} autoComplete="new-password" value={form.password} onChange={set('password')} /></Field>
                <Field label="Confirm password" hint={mismatch ? 'Passwords do not match' : undefined}><Input type="password" required autoComplete="new-password" value={form.password_confirmation} onChange={set('password_confirmation')} /></Field>
                <div className="space-y-4 sm:col-span-2">
                    {recaptcha.element}
                    <ErrorNote error={submit.error} />
                    <Button type="submit" className="w-full" disabled={submit.isPending || mismatch}>{submit.isPending ? 'Sending code...' : 'Create account'}</Button>
                </div>
            </form>
        </AuthCard>
    );
}

function ForgotPassword({ audience }: { audience: Audience }) {
    const recaptcha = useRecaptcha('FORGOT_PASSWORD');
    const [email, setEmail] = useState('');
    const send = useMutation({
        mutationFn: async () => (await api.post<{ message: string }>(`/${audience}/forgot-password`, { email, ...recaptcha.field })).data,
        onSettled: recaptcha.reset,
    });

    return (
        <AuthCard
            title="Forgot password"
            subtitle="Enter your email and we will send a reset link."
            footer={<p>Remember your password? <TextLink to={`${prefix(audience)}/login`}>Sign in</TextLink>.</p>}
        >
            <form onSubmit={(e: FormEvent) => { e.preventDefault(); send.mutate(); }} className="space-y-4">
                {send.isSuccess && <Notice>{send.data.message}</Notice>}
                <Field label="Email"><Input type="email" required autoFocus autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
                {recaptcha.element}
                <ErrorNote error={send.error} />
                <Button type="submit" className="w-full" disabled={send.isPending}>{send.isPending ? 'Sending...' : 'Send reset link'}</Button>
            </form>
        </AuthCard>
    );
}

function ResetPassword({ audience }: { audience: Audience }) {
    const navigate = useNavigate();
    const { token } = useParams();
    const [params] = useSearchParams();
    const [email, setEmail] = useState(params.get('email') ?? '');
    const [password, setPassword] = useState('');
    const [confirmation, setConfirmation] = useState('');
    const minimum = audience === 'admin' ? 12 : 10;
    const reset = useMutation({
        mutationFn: async () => (await api.post<{ message: string }>(`/${audience}/reset-password`, { token, email, password, password_confirmation: confirmation })).data,
        onSuccess: ({ message }) => navigate(`${prefix(audience)}/login`, { replace: true, state: { status: message } }),
    });
    const mismatch = confirmation !== '' && password !== confirmation;

    return (
        <AuthCard
            title="Reset password"
            subtitle="Create a new password for your account."
            footer={<p>Back to <TextLink to={`${prefix(audience)}/login`}>sign in</TextLink>.</p>}
        >
            <form onSubmit={(e: FormEvent) => { e.preventDefault(); reset.mutate(); }} className="space-y-4">
                <Field label="Email"><Input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
                <Field label="New password" hint={`At least ${minimum} characters`}><Input type="password" required minLength={minimum} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
                <Field label="Confirm password" hint={mismatch ? 'Passwords do not match' : undefined}><Input type="password" required autoComplete="new-password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} /></Field>
                <ErrorNote error={reset.error} />
                <Button type="submit" className="w-full" disabled={reset.isPending || mismatch}>{reset.isPending ? 'Saving...' : 'Reset password'}</Button>
            </form>
        </AuthCard>
    );
}

function GoogleSandbox() {
    const signedIn = useSignedIn();
    const { search } = useLocation();
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const list = useQuery({ queryKey: ['google-sandbox'], queryFn: async () => (await api.get<{ clients: { id: number; name: string; email: string }[] }>('/auth/sandbox/google')).data, retry: false });
    const login = useMutation({
        mutationFn: (account: { email: string; name?: string }) => api.post('/auth/sandbox/google', account),
        onSuccess: () => signedIn(),
    });

    // The server answers 404 anywhere but local development.
    if (list.isError) return <Navigate to={`/login${search}`} replace />;
    if (list.isLoading) return <p className="p-10 text-center text-slate-500">Loading...</p>;

    return (
        <AuthCard wide title="Google login sandbox" subtitle="Google keys are not set, so this stands in for Google on your computer." footer={<p>Back to <TextLink to={`/login${search}`}>sign in</TextLink>.</p>}>
            <div className="space-y-5">
                <p role="note" className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
                    <span className="font-semibold">Local development only.</span> This signs in without a password and is switched off on a live server.
                </p>
                <div className="space-y-2">
                    <h2 className="text-xs font-semibold text-slate-600">Sign in as an existing customer</h2>
                    {list.data?.clients.length === 0 && <p className="text-xs text-slate-500">No customers yet.</p>}
                    <ul className="max-h-60 space-y-2 overflow-y-auto">
                        {list.data?.clients.map((client) => (
                            <li key={client.id}>
                                <button type="button" disabled={login.isPending} onClick={() => login.mutate({ email: client.email })} className="w-full cursor-pointer rounded-xl border border-slate-200 p-3 text-left hover:border-accent disabled:cursor-not-allowed">
                                    <span className="block text-xs font-semibold text-slate-900">{client.name}</span>
                                    <span className="block text-xs break-all text-slate-500">{client.email}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
                <form onSubmit={(e: FormEvent) => { e.preventDefault(); login.mutate({ email, name }); }} className="space-y-3 border-t border-slate-100 pt-4">
                    <h2 className="text-xs font-semibold text-slate-600">Or use a new Google account</h2>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Email"><Input type="email" required maxLength={255} value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
                        <Field label="Name (optional)"><Input maxLength={255} value={name} onChange={(e) => setName(e.target.value)} /></Field>
                    </div>
                    <ErrorNote error={login.error} />
                    <Button type="submit" className="w-full" disabled={login.isPending}>Continue as this account</Button>
                </form>
            </div>
        </AuthCard>
    );
}

export function GuestPages() {
    return (
        <Routes>
            <Route path="/auth/sandbox/google" element={<GoogleSandbox />} />
            <Route path="/login" element={<Login audience="client" />} />
            <Route path="/login/otp" element={<LoginCode audience="client" />} />
            <Route path="/register" element={<Register />} />
            <Route path="/register/verify" element={<RegisterCode />} />
            <Route path="/forgot-password" element={<ForgotPassword audience="client" />} />
            <Route path="/reset-password/:token" element={<ResetPassword audience="client" />} />
            <Route path="/admin/login" element={<Login audience="admin" />} />
            <Route path="/admin/login/otp" element={<LoginCode audience="admin" />} />
            <Route path="/admin/forgot-password" element={<ForgotPassword audience="admin" />} />
            <Route path="/admin/reset-password/:token" element={<ResetPassword audience="admin" />} />
        </Routes>
    );
}
