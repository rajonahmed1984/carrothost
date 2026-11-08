import { Archive, Clock, Database, FolderOpen, Forward, Globe, LayoutGrid, Lock, Mail, Table2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { PanelLogo, panelName } from './panel-logo';

/** Every shortcut the panel knows; the server says which ones the account's control panel supports. */
const SHORTCUTS: Record<string, { name: string; icon: ReactNode; tone: string }> = {
    email: { name: 'Email Accounts', icon: <Mail size={18} />, tone: 'bg-indigo-100 text-indigo-700' },
    forwarders: { name: 'Forwarders', icon: <Forward size={18} />, tone: 'bg-blue-100 text-blue-700' },
    files: { name: 'File Manager', icon: <FolderOpen size={18} />, tone: 'bg-teal-100 text-teal-700' },
    databases: { name: 'MySQL Databases', icon: <Database size={18} />, tone: 'bg-amber-100 text-amber-700' },
    phpmyadmin: { name: 'phpMyAdmin', icon: <Table2 size={18} />, tone: 'bg-orange-100 text-orange-700' },
    domains: { name: 'Domains', icon: <Globe size={18} />, tone: 'bg-purple-100 text-purple-700' },
    subdomains: { name: 'Subdomains', icon: <Globe size={18} />, tone: 'bg-purple-100 text-purple-700' },
    ssl: { name: 'SSL/TLS Status', icon: <Lock size={18} />, tone: 'bg-emerald-100 text-emerald-700' },
    cron: { name: 'Cron Jobs', icon: <Clock size={18} />, tone: 'bg-sky-100 text-sky-700' },
    backups: { name: 'Backups', icon: <Archive size={18} />, tone: 'bg-violet-100 text-violet-700' },
};

/**
 * The control panel's main pages as a grid. cPanel and Webuzo refuse to load inside another
 * site's frame, so each tile opens a fresh one-time login on that page in a new tab.
 */
export function PanelShortcuts({ module, apps, pending, onOpen }: { module: string | null; apps: string[]; pending: boolean; onOpen: (app?: string) => void }) {
    const tile = 'flex cursor-pointer flex-col items-center justify-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-5 text-center transition hover:border-[var(--accent)] hover:bg-white disabled:cursor-wait disabled:opacity-60';

    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <button type="button" className={tile} disabled={pending} onClick={() => onOpen()}>
                <PanelLogo module={module} size="sm" />
                <span className="text-xs font-semibold text-slate-800">{pending ? 'Signing in...' : `Login to ${panelName(module)}`}</span>
            </button>
            {apps.filter((key) => SHORTCUTS[key]).map((key) => (
                <button key={key} type="button" className={tile} disabled={pending} onClick={() => onOpen(key)}>
                    <span className={`flex h-10 w-10 items-center justify-center rounded-full ${SHORTCUTS[key].tone}`}>{SHORTCUTS[key].icon ?? <LayoutGrid size={18} />}</span>
                    <span className="text-xs font-semibold text-slate-800">{SHORTCUTS[key].name}</span>
                </button>
            ))}
        </div>
    );
}
