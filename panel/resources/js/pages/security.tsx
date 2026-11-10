import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, CheckCircle2, Eye, EyeOff, Info, KeyRound, Lock, Shield, ShieldAlert, ShieldCheck, Sparkles } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { api } from '../api';
import { Button, Card, ErrorNote } from '../ui';
import { ProfileHeader } from './account';

export type ClientProfile = {
    id: number; name: string; email: string; otp_enabled: boolean; has_password: boolean; impersonating: boolean;
    /** What this client is billed in; the whole client area shows amounts in it. */
    currency: string;
    /** Set when a user of the account, not its owner, is signed in. */
    user: { name: string; email: string; permissions: string[] } | null;
};

/** What the person signed in may use. "owner" is for the account owner alone. */
export const clientCan = (profile: ClientProfile, permission: string) => (permission === 'owner' ? !profile.user : !profile.user || profile.user.permissions.includes(permission));

function PasswordField({
    label,
    placeholder,
    value,
    onChange,
    required = true,
    hint,
}: {
    label: string;
    placeholder: string;
    value: string;
    onChange: (val: string) => void;
    required?: boolean;
    hint?: string;
}) {
    const [show, setShow] = useState(false);

    return (
        <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">{label}</label>
            <div className="relative flex items-center">
                <span className="pointer-events-none absolute left-3 text-slate-400">
                    <Lock size={15} />
                </span>
                <input
                    type={show ? 'text' : 'password'}
                    required={required}
                    value={value}
                    placeholder={placeholder}
                    onChange={(e) => onChange(e.target.value)}
                    className="ui-input pl-9 pr-10 text-xs py-2.5 rounded-lg border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                />
                <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 transition"
                    aria-label={show ? 'Hide password' : 'Show password'}
                >
                    {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
            </div>
            {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
        </div>
    );
}

export function AdminAccountPage() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const save = useMutation({
        mutationFn: async () => (await api.post<{ message: string }>('/password', {
            current_password: currentPassword,
            password,
            password_confirmation: confirm,
        })).data,
    });

    return (
        <div className="space-y-4 max-w-xl">
            <Card title="Change password">
                <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-4 p-5">
                    <PasswordField label="Current password" placeholder="Enter current password" value={currentPassword} onChange={setCurrentPassword} />
                    <PasswordField label="New password" placeholder="Enter new password" value={password} onChange={setPassword} hint="At least 12 characters." />
                    <PasswordField label="Confirm password" placeholder="Re-enter new password" value={confirm} onChange={setConfirm} />
                    {save.isSuccess && <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">{save.data.message}</p>}
                    <ErrorNote error={save.error} />
                    <Button disabled={save.isPending}>Change password</Button>
                </form>
            </Card>
        </div>
    );
}

export function ClientPasswordPage({ profile }: { profile: ClientProfile }) {
    const qc = useQueryClient();
    const [currentPassword, setCurrentPassword] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [saved, setSaved] = useState(false);

    const save = useMutation({
        mutationFn: async () => (await api.post<{ message: string }>('/client/password', {
            current_password: currentPassword,
            password,
            password_confirmation: confirm,
        })).data,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['client-me'] });
            setCurrentPassword('');
            setPassword('');
            setConfirm('');
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        },
    });

    const mismatch = confirm !== '' && password !== confirm;

    return (
        <div className="space-y-6">
            <ProfileHeader activeTab="password" breadcrumb="Change Password" />

            {/* Change Password Card matching Image 4 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                        <Lock size={16} />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-slate-800">Change Password</h2>
                        <p className="text-xs text-slate-400">Choose a strong password to keep your account secure.</p>
                    </div>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-4 pt-5 max-w-xl">
                    {profile.has_password && (
                        <PasswordField
                            label="Current Password"
                            placeholder="Enter current password"
                            value={currentPassword}
                            onChange={setCurrentPassword}
                        />
                    )}

                    <PasswordField
                        label="New Password"
                        placeholder="Enter new password"
                        value={password}
                        onChange={setPassword}
                        hint="Must be at least 8 characters."
                    />

                    <PasswordField
                        label="Confirm Password"
                        placeholder="Re-enter new password"
                        value={confirm}
                        onChange={setConfirm}
                        hint={mismatch ? 'Passwords do not match.' : undefined}
                    />

                    {saved && (
                        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                            <span>Password updated successfully!</span>
                        </div>
                    )}

                    <ErrorNote error={save.error} />

                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={save.isPending || mismatch || !password}
                            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition disabled:opacity-50"
                        >
                            <KeyRound size={14} />
                            <span>{save.isPending ? 'Saving...' : 'Save Changes'}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => { setCurrentPassword(''); setPassword(''); setConfirm(''); }}
                            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export function ClientSecurityPage({ profile }: { profile: ClientProfile }) {
    const email = profile.user?.email ?? profile.email;

    return (
        <div className="space-y-6">
            <ProfileHeader activeTab="security" breadcrumb="Security" />

            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div>
                    <h2 className="text-base font-bold text-slate-900">Two-step sign-in</h2>
                    <p className="mt-0.5 text-xs text-slate-500">Every sign-in with a password needs a code we email to you.</p>
                </div>
                <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs">
                    <ShieldCheck size={16} className="text-emerald-600" />
                    <span className="font-medium text-slate-600">Status:</span>
                    <strong className="text-emerald-700">Always on</strong>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-bold text-emerald-700">
                    <Shield size={18} />
                    <span>How it works</span>
                </div>
                <ul className="mt-4 space-y-2.5 text-xs text-slate-700">
                    {[
                        'Sign in with your email and password as usual.',
                        `We email a one-time code to ${email}.`,
                        'Enter the code to finish signing in. It expires after a few minutes.',
                        'Someone who learns your password still cannot get in without your email.',
                    ].map((line) => (
                        <li key={line} className="flex items-center gap-2">
                            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><Check size={11} strokeWidth={3} /></span>
                            <span>{line}</span>
                        </li>
                    ))}
                </ul>
                <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-sky-100 bg-sky-50/70 p-3.5 text-xs text-sky-800">
                    <Info size={16} className="mt-0.5 shrink-0 text-sky-600" />
                    <span>This protection is required for every account and cannot be turned off. Keep your email account secure, as the codes go there.</span>
                </div>
            </div>
        </div>
    );
}
