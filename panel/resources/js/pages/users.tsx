import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api, errorMessage } from '../api';
import { alertDialog, ask } from '../dialog';
import { Button, ErrorNote, Field, Input, Modal, PagedTable, Select } from '../ui';

export type StaffRole = 'admin' | 'support';
type StaffUser = { id: number; name: string; email: string; role: StaffRole; is_active: boolean; created_at: string };

export const roleLabels: Record<StaffRole, string> = { admin: 'Administrator', support: 'Support' };

const roleHelp: Record<StaffRole, string> = {
    admin: 'Full access: billing, products, servers, settings and staff users.',
    support: 'Tickets and chat, plus a read-only view of clients, orders, invoices, services and domains.',
};

function RoleBadge({ role }: { role: StaffRole }) {
    const style = role === 'admin' ? 'bg-orange-100 text-orange-800' : 'bg-sky-100 text-sky-800';

    return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${style}`}>{roleLabels[role]}</span>;
}

function UserForm({ user, onClose }: { user: StaffUser | null; onClose: () => void }) {
    const qc = useQueryClient();
    const [name, setName] = useState(user?.name ?? '');
    const [email, setEmail] = useState(user?.email ?? '');
    const [role, setRole] = useState<StaffRole>(user?.role ?? 'support');
    const [active, setActive] = useState(user?.is_active ?? true);
    const [password, setPassword] = useState('');

    const save = useMutation({
        mutationFn: async () => {
            const body = { name, email, role, password: password || null, ...(user ? { is_active: active } : {}) };

            return user ? api.put(`/users/${user.id}`, body) : api.post('/users', body);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['/users'] });
            onClose();
        },
    });

    return (
        <Modal title={user ? `Edit ${user.name}` : 'Add staff user'} onClose={onClose}>
            <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-3">
                <Field label="Name"><Input required value={name} onChange={(e) => setName(e.target.value)} /></Field>
                <Field label="Email" hint="Sign-in codes are sent here."><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
                <Field label="Role" hint={roleHelp[role]}>
                    <Select value={role} onChange={(e) => setRole(e.target.value as StaffRole)}>
                        <option value="support">Support</option>
                        <option value="admin">Administrator</option>
                    </Select>
                </Field>
                <Field label={user ? 'New password' : 'Password'} hint={user ? 'Leave blank to keep the current password. At least 12 characters.' : 'At least 12 characters.'}>
                    <Input type="password" autoComplete="new-password" required={!user} minLength={12} value={password} onChange={(e) => setPassword(e.target.value)} />
                </Field>
                {user && (
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
                        Active (can sign in)
                    </label>
                )}
                <ErrorNote error={save.error} />
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button disabled={save.isPending}>{save.isPending ? 'Saving...' : user ? 'Save' : 'Add user'}</Button>
                </div>
            </form>
        </Modal>
    );
}

export function UsersPage({ meId }: { meId: number }) {
    const qc = useQueryClient();
    const [search, setSearch] = useState('');
    const [role, setRole] = useState('');
    const [editing, setEditing] = useState<StaffUser | 'new' | null>(null);
    const remove = useMutation({
        mutationFn: (id: number) => api.delete(`/users/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['/users'] }),
        onError: (e) => alertDialog(errorMessage(e)),
    });

    const params: Record<string, string> = { ...(search ? { q: search } : {}), ...(role ? { role } : {}) };

    return (
        <>
            <PagedTable<StaffUser>
                url="/users"
                noun="users"
                search={{ value: search, onChange: setSearch, placeholder: 'Name or email' }}
                action={<Button onClick={() => setEditing('new')}>Add user</Button>}
                tabs={{
                    value: role,
                    onChange: setRole,
                    options: [
                        { key: '', label: 'All' },
                        { key: 'admin', label: 'Administrators' },
                        { key: 'support', label: 'Support' },
                        { key: 'disabled', label: 'Disabled' },
                    ],
                }}
                params={params}
                empty="No staff users match."
                columns={[
                    {
                        header: 'Name',
                        cell: (u) => (
                            <>
                                <span className="font-semibold text-slate-900">{u.name}</span>
                                {u.id === meId && <span className="ml-2 text-xs text-slate-500">(you)</span>}
                                <div className="text-xs text-slate-500">{u.email}</div>
                            </>
                        ),
                    },
                    { header: 'Role', cell: (u) => <RoleBadge role={u.role} /> },
                    {
                        header: 'Status',
                        cell: (u) => (u.is_active
                            ? <span className="text-xs font-semibold text-emerald-700">Active</span>
                            : <span className="text-xs font-semibold text-slate-500">Disabled</span>),
                    },
                    { header: 'Added', cell: (u) => new Date(u.created_at).toLocaleDateString() },
                    {
                        header: '',
                        align: 'right',
                        cell: (u) => (
                            <div className="flex justify-end gap-3">
                                <Button variant="link" onClick={() => setEditing(u)}>Edit</Button>
                                {u.id !== meId && (
                                    <Button variant="link-danger" disabled={remove.isPending} onClick={() => ask(`Delete ${u.name}? They will no longer be able to sign in.`, () => remove.mutate(u.id))}>Delete</Button>
                                )}
                            </div>
                        ),
                    },
                ]}
            />
            {editing && <UserForm user={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
        </>
    );
}
