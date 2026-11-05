import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, Copy, Eye, EyeOff, HardDrive, KeyRound, Play, Power, RefreshCw, RotateCcw, Server, Square, Terminal, TrendingUp } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { api, errorMessage } from '../api';
import { Button, ErrorNote, Field, Input, Modal, QueryState, Select } from '../ui';
import { alertDialog, confirmDialog } from '../dialog';

type Metrics = { cpu: number | null; memory_mb: number | null; disk_mb: number | null; disk_limit_mb: number | null; network_gb: number | null; network_limit_gb: number | null };
type Snapshot = { id: string; name: string; date: string | null; type: string | null; completed: boolean; deletable: boolean };
type Vps = {
    status: string; ipv4: string | null; ipv6: string | null; location: string | null; profile: string | null; image: string | null; hostname: string | null; created: string | null;
    metrics: Metrics; username: string | null; login_ready: boolean; setup_note: string | null; actions: string[]; snapshots: Snapshot[] | null;
};

const tone: Record<string, string> = {
    running: 'bg-emerald-100 text-emerald-700', stopped: 'bg-slate-200 text-slate-700', provisioning: 'bg-amber-100 text-amber-800',
    rebooting: 'bg-amber-100 text-amber-800', starting: 'bg-amber-100 text-amber-800', stopping: 'bg-amber-100 text-amber-800',
    reinstalling: 'bg-amber-100 text-amber-800', error: 'bg-rose-100 text-rose-700', suspended: 'bg-rose-100 text-rose-700',
};
const busy = ['provisioning', 'rebooting', 'starting', 'stopping', 'reinstalling', 'restoring', 'resizing'];

/**
 * A Webdock VPS like its own panel: status, IPs, power, reinstall, the sudo login, browser console,
 * and for admins snapshots and resize. `base` is the service's API path (admin or client).
 */
export function VpsPanel({ base, admin = false }: { base: string; admin?: boolean }) {
    const qc = useQueryClient();
    const key = ['vps', base];
    const vps = useQuery({
        queryKey: key,
        queryFn: async () => (await api.get<Vps>(`${base}/vps`)).data,
        retry: false,
        // While something is happening, look again every 10 seconds.
        refetchInterval: (q) => (q.state.data && busy.includes(q.state.data.status) ? 10_000 : false),
    });
    const [modal, setModal] = useState<'reinstall' | 'password' | 'resize' | 'snapshot' | null>(null);
    const act = useMutation({
        mutationFn: async ({ action, body }: { action: string; body?: object }) => (await api.post<{ message?: string; url?: string }>(`${base}/vps/${action}`, body ?? {})).data,
        onSuccess: (r) => {
            if (r.url) window.open(r.url, '_blank', 'noopener');
            else if (r.message) void alertDialog(r.message);
            setModal(null);
            window.setTimeout(() => qc.invalidateQueries({ queryKey: key }), 2500);
        },
        onError: (e) => alertDialog(errorMessage(e)),
    });
    const can = (a: string) => vps.data?.actions.includes(a) ?? false;
    const run = async (action: string, question?: string, body?: object) => {
        if (!question || (await confirmDialog(question))) act.mutate({ action, body });
    };
    const d = vps.data;

    return (
        <section className="card overflow-hidden">
            <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
                <h3 className="flex items-center gap-2 font-semibold text-slate-900"><Server size={16} className="text-[var(--accent)]" /> Virtual Server</h3>
                <div className="flex items-center gap-2">
                    {d && <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize ${tone[d.status] ?? 'bg-slate-100 text-slate-600'}`}>{d.status}</span>}
                    <button type="button" aria-label="Refresh" title="Refresh" disabled={vps.isFetching} onClick={() => vps.refetch()} className="icon-btn h-8 w-8"><RefreshCw size={14} className={vps.isFetching ? 'animate-spin' : ''} /></button>
                </div>
            </header>
            <QueryState query={vps}>
                {d && (
                    <div className="space-y-4 p-4">
                        {/* Power and access */}
                        <div className="flex flex-wrap gap-2">
                            {can('start') && <Button type="button" variant="ghost" disabled={act.isPending || d.status === 'running'} onClick={() => run('start')}><Play size={14} /> Start</Button>}
                            {can('reboot') && <Button type="button" variant="ghost" disabled={act.isPending || d.status !== 'running'} onClick={() => run('reboot', 'Reboot the VPS? It is offline for about a minute.')}><RotateCcw size={14} /> Reboot</Button>}
                            {can('stop') && <Button type="button" variant="ghost" disabled={act.isPending || d.status !== 'running'} onClick={() => run('stop', 'Shut down the VPS? Websites and services on it stop until you start it again.')}><Square size={14} /> Shut down</Button>}
                            {can('console') && <Button type="button" variant="ghost" disabled={act.isPending || d.status !== 'running' || !d.login_ready} title={!d.login_ready ? 'The login user is still being added' : undefined} onClick={() => run('console')}><Terminal size={14} /> Console</Button>}
                            {can('password') && <Button type="button" variant="ghost" disabled={act.isPending} onClick={() => setModal('password')}><KeyRound size={14} /> Reset root password</Button>}
                            {can('reinstall') && <Button type="button" variant="danger" disabled={act.isPending} onClick={() => setModal('reinstall')}><Power size={14} /> Reinstall OS</Button>}
                            {can('resize') && <Button type="button" variant="ghost" disabled={act.isPending} onClick={() => setModal('resize')}><TrendingUp size={14} /> Resize</Button>}
                        </div>
                        {d.actions.length === 0 && <p className="text-xs text-rose-700">Controls are off while this service is not active.</p>}
                        {d.setup_note && <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">{d.setup_note}</p>}

                        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                            <Item label="IPv4"><Copyable value={d.ipv4} /></Item>
                            <Item label="IPv6"><Copyable value={d.ipv6} /></Item>
                            <Item label="SSH login"><span className="font-mono">{d.username ?? '-'}</span>{d.username && !d.login_ready && <span className="ml-2 text-xs text-amber-700">being added...</span>}</Item>
                            <Item label="SSH">{d.ipv4 && d.username ? <Copyable value={`ssh ${d.username}@${d.ipv4}`} /> : '-'}</Item>
                            <Item label="Operating system">{d.image ?? '-'}</Item>
                            <Item label="Plan">{d.profile ?? '-'}</Item>
                            <Item label="Location">{d.location ?? '-'}</Item>
                            <Item label="Created">{d.created ? new Date(d.created).toLocaleDateString() : '-'}</Item>
                        </dl>
                        <p className="text-xs text-slate-500">The login user is in the sudo group: run <span className="font-mono">sudo -i</span> for root.</p>

                        <div className="grid gap-3 sm:grid-cols-3">
                            <Meter label="CPU" value={d.metrics.cpu} limit={100} unit="%" />
                            <Meter label="Disk" value={d.metrics.disk_mb !== null ? d.metrics.disk_mb / 1024 : null} limit={d.metrics.disk_limit_mb !== null ? d.metrics.disk_limit_mb / 1024 : null} unit="GB" />
                            <Meter label="Traffic this month" value={d.metrics.network_gb} limit={d.metrics.network_limit_gb} unit="GB" />
                        </div>

                        {admin && d.snapshots && (
                            <div>
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600"><Camera size={13} /> Snapshots</span>
                                    {can('snapshot') && <Button type="button" variant="link" disabled={act.isPending} onClick={() => setModal('snapshot')}>Take snapshot</Button>}
                                </div>
                                {d.snapshots.length === 0 ? <p className="text-xs text-slate-500">No snapshots.</p> : (
                                    <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 text-sm">
                                        {d.snapshots.map((s) => (
                                            <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                                                <span><span className="font-medium text-slate-800">{s.name || `#${s.id}`}</span> <span className="text-xs text-slate-500">{s.date ? new Date(s.date).toLocaleString() : ''}{s.type ? ` · ${s.type}` : ''}{!s.completed ? ' · in progress' : ''}</span></span>
                                                {can('restore') && s.completed && <Button type="button" variant="link-danger" disabled={act.isPending} onClick={() => run('restore', `Restore the VPS to "${s.name || s.id}"? Everything since then is lost.`, { snapshot_id: s.id })}>Restore</Button>}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </QueryState>

            {modal === 'reinstall' && <ReinstallModal base={base} current={d?.image ?? null} pending={act.isPending} error={act.error} onClose={() => setModal(null)} onSubmit={(image) => run('reinstall', 'Reinstall erases EVERYTHING on this VPS: files, databases and settings. This cannot be undone. Continue?', { image })} />}
            {modal === 'password' && <PasswordModal username={d?.username ?? null} pending={act.isPending} error={act.error} onClose={() => setModal(null)} onSubmit={(password) => run('password', undefined, { password })} />}
            {modal === 'resize' && <ResizeModal base={base} pending={act.isPending} error={act.error} onClose={() => setModal(null)} onSubmit={(profile) => run('resize', 'Resize the VPS? It restarts, and the new profile is billed by Webdock.', { profile })} />}
            {modal === 'snapshot' && <NameModal pending={act.isPending} error={act.error} onClose={() => setModal(null)} onSubmit={(name) => run('snapshot', undefined, { name })} />}
        </section>
    );
}

function Item({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="flex min-w-0 gap-3">
            <dt className="w-32 shrink-0 text-xs text-slate-500">{label}</dt>
            <dd className="min-w-0 break-all text-slate-800">{children}</dd>
        </div>
    );
}

function Copyable({ value }: { value: string | null }) {
    if (!value) return <span>-</span>;

    return (
        <span className="inline-flex items-center gap-1.5">
            <span className="font-mono">{value}</span>
            <button type="button" aria-label={`Copy ${value}`} title="Copy" className="cursor-pointer text-slate-400 hover:text-slate-700" onClick={() => void navigator.clipboard?.writeText(value)}><Copy size={12} /></button>
        </span>
    );
}

function Meter({ label, value, limit, unit }: { label: string; value: number | null; limit: number | null; unit: string }) {
    const pct = value !== null && limit ? Math.min(100, (value / limit) * 100) : null;
    const fmt = (n: number) => (n >= 10 ? Math.round(n).toString() : n.toFixed(1));

    return (
        <div className="rounded-xl border border-slate-200 p-3">
            <div className="flex items-center justify-between text-xs text-slate-500"><span className="flex items-center gap-1"><HardDrive size={12} /> {label}</span>{pct !== null && <span>{Math.round(pct)}%</span>}</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">{value === null ? '-' : `${fmt(value)}${unit === '%' ? '%' : ` ${unit}`}`}{limit && unit !== '%' ? <span className="font-normal text-slate-500"> / {fmt(limit)} {unit}</span> : null}</div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full ${pct !== null && pct > 85 ? 'bg-rose-500' : 'bg-[var(--accent)]'}`} style={{ width: `${pct ?? 0}%` }} /></div>
        </div>
    );
}

function ReinstallModal({ base, current, pending, error, onClose, onSubmit }: { base: string; current: string | null; pending: boolean; error: unknown; onClose: () => void; onSubmit: (image: string) => void }) {
    const images = useQuery({ queryKey: ['vps-images', base], queryFn: async () => (await api.get<{ slug: string; name: string }[]>(`${base}/vps/images`)).data, staleTime: 600_000 });
    const [image, setImage] = useState(current ?? '');

    return (
        <Modal title="Reinstall operating system" onClose={onClose}>
            <form onSubmit={(e) => { e.preventDefault(); onSubmit(image); }} className="space-y-3">
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">All data on the VPS is erased. Take a backup first. The IP address stays the same.</p>
                <QueryState query={images}>
                    <Field label="Operating system">
                        <Select required value={image} onChange={(e) => setImage(e.target.value)}>
                            <option value="">Choose...</option>
                            {images.data?.map((i) => <option key={i.slug} value={i.slug}>{i.name}</option>)}
                        </Select>
                    </Field>
                </QueryState>
                <ErrorNote error={error} />
                <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button variant="danger" disabled={pending || !image}>Reinstall</Button></div>
            </form>
        </Modal>
    );
}

/** Webdock allows letters, digits, dot, dash and underscore. */
function makePassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789-_';
    return Array.from(crypto.getRandomValues(new Uint32Array(16)), (n) => chars[n % chars.length]).join('');
}

function PasswordModal({ username, pending, error, onClose, onSubmit }: { username: string | null; pending: boolean; error: unknown; onClose: () => void; onSubmit: (password: string) => void }) {
    const [password, setPassword] = useState(makePassword);
    const [show, setShow] = useState(true);
    const valid = /^[A-Za-z0-9._-]{8,64}$/.test(password);

    return (
        <Modal title="Reset root password" onClose={onClose}>
            <form onSubmit={(e) => { e.preventDefault(); onSubmit(password); }} className="space-y-3">
                <p className="text-sm text-slate-600">Sets the password of <span className="font-mono">{username ?? 'the login user'}</span>, the sudo user you log in with over SSH or the console.</p>
                <Field label="New password" hint="8 to 64 characters: letters, digits, dot, dash and underscore">
                    <div className="relative">
                        <input className="ui-input pr-20 font-mono" type={show ? 'text' : 'password'} autoComplete="new-password" spellCheck={false} value={password} onChange={(e) => setPassword(e.target.value)} />
                        <div className="absolute top-1/2 right-2 flex -translate-y-1/2 gap-1 text-slate-400">
                            <button type="button" aria-label="New random password" title="New random password" className="cursor-pointer p-1 hover:text-slate-700" onClick={() => setPassword(makePassword())}><RefreshCw size={14} /></button>
                            <button type="button" aria-label={show ? 'Hide' : 'Show'} className="cursor-pointer p-1 hover:text-slate-700" onClick={() => setShow(!show)}>{show ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                        </div>
                    </div>
                </Field>
                {!valid && password !== '' && <p className="text-xs text-rose-600">Use 8 to 64 letters, digits, dots, dashes or underscores.</p>}
                <ErrorNote error={error} />
                <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button disabled={pending || !valid}>Set password</Button></div>
            </form>
        </Modal>
    );
}

function ResizeModal({ base, pending, error, onClose, onSubmit }: { base: string; pending: boolean; error: unknown; onClose: () => void; onSubmit: (profile: string) => void }) {
    const profiles = useQuery({ queryKey: ['vps-profiles', base], queryFn: async () => (await api.get<{ id: string; name: string }[]>(`${base}/vps/profiles`)).data, staleTime: 600_000 });
    const [profile, setProfile] = useState('');

    return (
        <Modal title="Resize VPS" onClose={onClose}>
            <form onSubmit={(e) => { e.preventDefault(); onSubmit(profile); }} className="space-y-3">
                <p className="text-sm text-slate-600">Moves the VPS to another hardware profile. Change the client's product too, so billing matches.</p>
                <QueryState query={profiles}>
                    <Field label="Profile">
                        <Select required value={profile} onChange={(e) => setProfile(e.target.value)}>
                            <option value="">Choose...</option>
                            {profiles.data?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </Select>
                    </Field>
                </QueryState>
                <ErrorNote error={error} />
                <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button disabled={pending || !profile}>Resize</Button></div>
            </form>
        </Modal>
    );
}

function NameModal({ pending, error, onClose, onSubmit }: { pending: boolean; error: unknown; onClose: () => void; onSubmit: (name: string) => void }) {
    const [name, setName] = useState(`Panel ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`);

    return (
        <Modal title="Take snapshot" onClose={onClose}>
            <form onSubmit={(e) => { e.preventDefault(); onSubmit(name); }} className="space-y-3">
                <Field label="Name"><Input required maxLength={60} value={name} onChange={(e) => setName(e.target.value)} /></Field>
                <ErrorNote error={error} />
                <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button disabled={pending}>Take snapshot</Button></div>
            </form>
        </Modal>
    );
}
