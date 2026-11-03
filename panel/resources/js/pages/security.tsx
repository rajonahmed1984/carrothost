import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, CheckCircle2, Eye, EyeOff, Info, KeyRound, Lock, Shield, ShieldAlert, ShieldCheck, Sparkles } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { api } from '../api';
import { Button, Card, ErrorNote } from '../ui';
import { ProfileHeader } from './account';

export type ClientProfile = { id: number; name: string; email: string; otp_enabled: boolean; has_password: boolean; impersonating: boolean };

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
    const qc = useQueryClient();
    const refresh = () => qc.invalidateQueries({ queryKey: ['client-me'] });
    const otp = useMutation({
        mutationFn: (enabled: boolean) => api.put('/client/security', { otp_enabled: enabled }),
        onSuccess: refresh,
    });

    return (
        <div className="space-y-6">
            <ProfileHeader activeTab="security" breadcrumb="Security" />

            {/* Top Bar / Status Card matching Image 5 */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div>
                    <h2 className="text-base font-bold text-slate-900">Two Factor Authentication (2FA)</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Add an extra layer of protection to your account by enabling Two Factor Authentication.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2 text-xs">
                        <Shield size={16} className={profile.otp_enabled ? 'text-emerald-600' : 'text-slate-400'} />
                        <span className="text-slate-600 font-medium">2FA Status:</span>
                        <strong className={profile.otp_enabled ? 'text-emerald-700' : 'text-rose-600'}>
                            {profile.otp_enabled ? 'Enabled' : 'Disabled'}
                        </strong>
                    </div>

                    <button
                        type="button"
                        disabled={otp.isPending}
                        onClick={() => otp.mutate(!profile.otp_enabled)}
                        className={`rounded-lg px-4 py-2 text-xs font-semibold shadow-sm transition disabled:opacity-50 ${
                            profile.otp_enabled
                                ? 'border border-rose-200 bg-white text-rose-600 hover:bg-rose-50'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                    >
                        {profile.otp_enabled ? 'Disable 2FA' : 'Enable 2FA'}
                    </button>
                </div>
            </div>

            {/* Two Columns Grid matching Image 5 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column: Why enable 2FA? */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between space-y-4">
                    <div>
                        <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                            <ShieldCheck size={18} />
                            <span>Why enable 2FA?</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            Two Factor Authentication adds an extra layer of protection to your account by requiring a verification code in addition to your password.
                        </p>

                        <ul className="mt-4 space-y-2.5 text-xs text-slate-700">
                            <li className="flex items-center gap-2">
                                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                                    <Check size={11} strokeWidth={3} />
                                </span>
                                <span>Protect your account from unauthorized access</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                                    <Check size={11} strokeWidth={3} />
                                </span>
                                <span>Secure your data and services</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                                    <Check size={11} strokeWidth={3} />
                                </span>
                                <span>Recommended for all users</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                                    <Check size={11} strokeWidth={3} />
                                </span>
                                <span>Easy to set up and use</span>
                            </li>
                        </ul>
                    </div>

                    <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-3.5 text-xs text-sky-800 flex items-start gap-2.5">
                        <Info size={16} className="text-sky-600 shrink-0 mt-0.5" />
                        <div>
                            <strong className="font-semibold block mb-0.5">How it works</strong>
                            When 2FA is enabled, you'll need to enter a code from your authenticator app in addition to your password when signing in.
                        </div>
                    </div>
                </div>

                {/* Right Column: Enable Two Factor Authentication (2 cols wide) */}
                <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
                    <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                        <Sparkles size={18} />
                        <span>Enable Two Factor Authentication</span>
                    </div>

                    {/* Step 1 */}
                    <div className="flex items-start gap-4">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white shadow-sm">
                            1
                        </span>
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold text-slate-800">Install an Authenticator App</h3>
                            <p className="text-xs text-slate-500">
                                Download and install an authenticator app on your phone. We recommend:
                            </p>
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                                <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">
                                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                                    Google Authenticator
                                </span>
                                <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">
                                    <span className="h-2 w-2 rounded-full bg-orange-500" />
                                    Microsoft Authenticator
                                </span>
                                <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">
                                    <span className="h-2 w-2 rounded-full bg-red-500" />
                                    Authy
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-start gap-4">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white shadow-sm">
                            2
                        </span>
                        <div>
                            <h3 className="text-xs font-bold text-slate-800">Scan the QR Code</h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Open your authenticator app and scan the QR code provided on the next step.
                            </p>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-start gap-4">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white shadow-sm">
                            3
                        </span>
                        <div>
                            <h3 className="text-xs font-bold text-slate-800">Enter Verification Code</h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Enter the 6-digit code from your authenticator app to verify and activate 2FA.
                            </p>
                        </div>
                    </div>

                    <ErrorNote error={otp.error} />

                    <div className="pt-2">
                        <button
                            type="button"
                            disabled={otp.isPending}
                            onClick={() => otp.mutate(!profile.otp_enabled)}
                            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition disabled:opacity-50"
                        >
                            <span>{profile.otp_enabled ? 'Disable 2FA' : 'Continue to Setup'}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
