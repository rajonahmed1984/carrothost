import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { api } from '../api';
import { Button, Card, ErrorNote, Field, Input } from '../ui';

export type ClientProfile = { id: number; name: string; email: string; otp_enabled: boolean; has_password: boolean; impersonating: boolean };

function PasswordForm({ url, minimum, needsCurrent, onSaved }: { url: string; minimum: number; needsCurrent: boolean; onSaved?: () => void }) {
    const empty = { current_password: '', password: '', password_confirmation: '' };
    const [form, setForm] = useState(empty);
    const set = (field: keyof typeof empty) => (e: { target: { value: string } }) => setForm({ ...form, [field]: e.target.value });
    const save = useMutation({
        mutationFn: async () => (await api.post<{ message: string }>(url, form)).data,
        onSuccess: () => {
            setForm(empty);
            onSaved?.();
        },
    });
    const mismatch = form.password_confirmation !== '' && form.password !== form.password_confirmation;

    return (
        <form onSubmit={(e: FormEvent) => { e.preventDefault(); save.mutate(); }} className="max-w-sm space-y-3 p-4">
            {needsCurrent && <Field label="Current password"><Input type="password" required autoComplete="current-password" value={form.current_password} onChange={set('current_password')} /></Field>}
            <Field label="New password" hint={`At least ${minimum} characters`}><Input type="password" required minLength={minimum} autoComplete="new-password" value={form.password} onChange={set('password')} /></Field>
            <Field label="Confirm new password" hint={mismatch ? 'Passwords do not match' : undefined}><Input type="password" required autoComplete="new-password" value={form.password_confirmation} onChange={set('password_confirmation')} /></Field>
            {save.isSuccess && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">{save.data.message}</p>}
            <ErrorNote error={save.error} />
            <Button disabled={save.isPending || mismatch}>{needsCurrent ? 'Change password' : 'Set password'}</Button>
        </form>
    );
}

export function AdminAccountPage() {
    return (
        <div className="space-y-4">
            <Card title="Change password"><PasswordForm url="/password" minimum={12} needsCurrent /></Card>
            <p className="text-xs text-slate-500">Every admin sign-in also needs a code sent to your email.</p>
        </div>
    );
}

export function ClientSecurityPage({ profile }: { profile: ClientProfile }) {
    const client = useQueryClient();
    const refresh = () => client.invalidateQueries({ queryKey: ['client-me'] });
    const otp = useMutation({ mutationFn: (enabled: boolean) => api.put('/client/security', { otp_enabled: enabled }), onSuccess: refresh });

    return (
        <div className="space-y-4">
            <Card title="Two-step sign-in">
                <div className="space-y-3 p-4">
                    <p className="text-xs text-slate-600">
                        {profile.otp_enabled
                            ? 'On. Signing in with your password also needs a code sent to your email.'
                            : 'Off. Turn this on to also require a code sent to your email when you sign in with your password.'}
                    </p>
                    <ErrorNote error={otp.error} />
                    <Button variant={profile.otp_enabled ? 'ghost' : 'primary'} disabled={otp.isPending} onClick={() => otp.mutate(!profile.otp_enabled)}>
                        {profile.otp_enabled ? 'Turn off' : 'Turn on'}
                    </Button>
                </div>
            </Card>
            <Card title={profile.has_password ? 'Change password' : 'Set a password'}>
                <PasswordForm url="/client/password" minimum={10} needsCurrent={profile.has_password} onSaved={refresh} />
            </Card>
        </div>
    );
}
