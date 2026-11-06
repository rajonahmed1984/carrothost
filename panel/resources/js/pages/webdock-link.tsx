import { useQuery } from '@tanstack/react-query';
import { CircleCheck, Link2, MapPin, Search, Server, User } from 'lucide-react';
import { useState } from 'react';
import { api } from '../api';
import { Button, ErrorNote, Modal, QueryState, Status } from '../ui';

type WebdockServer = { slug: string; name: string; status: string; ipv4: string | null; location: string | null; profile: string | null; image: string | null; aliases: string[]; linked_to: { service_id: number; client: string | null } | null };
type ServersResponse = { account: { id: number; name: string }; accounts: { id: number; name: string }[]; servers: WebdockServer[] };
type ShellUser = { id: number | null; username: string; group: string | null };

export type WebdockLink = { server_id: string; remote_id: string; dedicated_ip: string; username: string };

/**
 * Picks a VPS in the Webdock account and its customer login, and fills the service form with them.
 * Saving the service then links it, so the customer sees and runs that VPS from their service page.
 */
export function LinkWebdockModal({ serviceId, current, onClose, onPick }: { serviceId: number; current: string; onClose: () => void; onPick: (link: WebdockLink) => void }) {
    const [accountId, setAccountId] = useState('');
    const [search, setSearch] = useState('');
    const [picked, setPicked] = useState<WebdockServer | null>(null);
    const servers = useQuery({
        queryKey: ['webdock-servers', serviceId, accountId],
        queryFn: async () => (await api.get<ServersResponse>(`/services/${serviceId}/webdock/servers`, { params: { server_id: accountId || undefined } })).data,
        retry: false,
    });
    const account = String(servers.data?.account.id ?? accountId);
    const users = useQuery({
        queryKey: ['webdock-users', serviceId, account, picked?.slug],
        queryFn: async () => (await api.get<{ users: ShellUser[] }>(`/services/${serviceId}/webdock/servers/${picked!.slug}/users`, { params: { server_id: account || undefined } })).data.users,
        enabled: !!picked,
        retry: false,
    });
    const needle = search.trim().toLowerCase();
    const list = (servers.data?.servers ?? []).filter((s) => !needle || `${s.name} ${s.slug} ${s.ipv4 ?? ''} ${s.aliases.join(' ')}`.toLowerCase().includes(needle));
    const link = (username: string) => {
        if (!picked) return;
        onPick({ server_id: account, remote_id: picked.slug, dedicated_ip: picked.ipv4 ?? '', username });
        onClose();
    };

    return (
        <Modal title={picked ? `Choose the customer's login on ${picked.name}` : 'Link a Webdock server'} onClose={onClose} wide>
            {!picked ? (
                <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                        {(servers.data?.accounts.length ?? 0) > 1 && (
                            <select aria-label="Webdock account" className="ui-input w-auto" value={account} onChange={(e) => setAccountId(e.target.value)}>
                                {servers.data?.accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                        )}
                        <div className="relative min-w-0 flex-1">
                            <Search size={15} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
                            <input aria-label="Search servers" className="ui-input pl-9" placeholder="Search by name, slug, IP or domain" value={search} onChange={(e) => setSearch(e.target.value)} />
                        </div>
                    </div>
                    <QueryState query={servers}>
                        {servers.data && (list.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">{servers.data.servers.length ? 'No server matches.' : 'There are no servers in this Webdock account.'}</p> : (
                            <ul className="max-h-[28rem] divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200">
                                {list.map((s) => (
                                    <li key={s.slug}>
                                        <button type="button" onClick={() => setPicked(s)} className={`flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 ${s.slug === current ? 'bg-emerald-50/60' : ''}`}>
                                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600"><Server size={16} /></span>
                                            <span className="min-w-0 flex-1">
                                                <span className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900">
                                                    {s.name} <span className="font-mono text-xs font-normal text-slate-500">{s.slug}</span>
                                                    {s.slug === current && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700"><CircleCheck size={10} /> Linked here</span>}
                                                    {s.linked_to && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">Used by #{s.linked_to.service_id}{s.linked_to.client ? ` (${s.linked_to.client})` : ''}</span>}
                                                </span>
                                                <span className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-slate-500">
                                                    {s.ipv4 && <span className="font-mono">{s.ipv4}</span>}
                                                    {s.location && <span className="inline-flex items-center gap-1"><MapPin size={11} /> {s.location}</span>}
                                                    {s.profile && <span>{s.profile}</span>}
                                                    {s.image && <span>{s.image}</span>}
                                                </span>
                                                {s.aliases.length > 0 && <span className="block truncate text-xs text-slate-400">{s.aliases.join(', ')}</span>}
                                            </span>
                                            <Status value={s.status} />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ))}
                    </QueryState>
                </div>
            ) : (
                <div className="space-y-4">
                    <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        <strong className="text-slate-900">{picked.name}</strong> <span className="font-mono text-xs">({picked.slug})</span>{picked.ipv4 && <> · <span className="font-mono">{picked.ipv4}</span></>}.
                        Choose the shell user the customer signs in with. The web console opens as this user.
                    </p>
                    <QueryState query={users}>
                        {users.data && (users.data.length === 0 ? (
                            <div className="space-y-3 text-sm text-slate-600">
                                <p>This server has no shell users yet. Link it without one, then use Reset password on the VPS panel to create the customer's login.</p>
                                <Button type="button" onClick={() => link('')}><Link2 size={14} /> Link without a login</Button>
                            </div>
                        ) : (
                            <ul className="grid gap-2 sm:grid-cols-2">
                                {users.data.map((u) => (
                                    <li key={u.username}>
                                        <button type="button" onClick={() => link(u.username)} className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left hover:border-[var(--accent)] hover:bg-slate-50">
                                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent-soft)] text-accent"><User size={16} /></span>
                                            <span><span className="block font-mono text-sm font-semibold text-slate-900">{u.username}</span><span className="block text-xs text-slate-500">{u.group ?? 'user'}</span></span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ))}
                    </QueryState>
                    <ErrorNote error={users.error} />
                    <div className="flex justify-between gap-2">
                        <Button type="button" variant="ghost" onClick={() => setPicked(null)}>Back to servers</Button>
                    </div>
                </div>
            )}
        </Modal>
    );
}
