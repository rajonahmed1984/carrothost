import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ButtonHTMLAttributes, type CSSProperties, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';
import { api, basePath, errorMessage, type Page } from './api';

export type Branding = { name: string; currency: string; logo_url: string; icon_url: string; custom_icon: boolean };
export type AppConfig = { recaptcha: { enabled: boolean; site_key: string; enterprise: boolean }; google: boolean; branding: Branding };

/** Public config every page needs: sign-in options and the company name, logo and currency. */
export const useAppConfig = () => useQuery({ queryKey: ['auth-config'], queryFn: async () => (await api.get<AppConfig>('/auth/config')).data, staleTime: Infinity });

export function useBranding(): Branding {
    return useAppConfig().data?.branding ?? { name: 'CarrotHost', currency: 'BDT', logo_url: `${basePath}/logo.png`, icon_url: `${basePath}/icon.png`, custom_icon: false };
}

/** The full logo has dark text, so it only goes on light backgrounds. */
export function Logo({ className = 'h-9' }: { className?: string }) {
    const brand = useBranding();

    return <img src={brand.logo_url} alt={brand.name} width={321} height={71} className={`${className} w-auto object-contain`} />;
}

export const LogoIcon = ({ className = '' }: { className?: string }) => <img src={useBranding().icon_url} alt="" width={150} height={150} className={className} />;

type ButtonVariant = 'primary' | 'ghost' | 'danger' | 'link' | 'link-danger';

export function Button({ variant = 'primary', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
    const styles = {
        primary: 'ui-btn ui-btn-primary',
        ghost: 'ui-btn ui-btn-secondary',
        danger: 'ui-btn ui-btn-danger',
        link: 'table-action-link',
        'link-danger': 'table-action-link table-action-link-danger',
    }[variant];

    return <button {...props} className={`${styles} ${className}`} />;
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
    return (
        <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">{label}</span>
            {children}
            {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
        </label>
    );
}

export const Input = (props: InputHTMLAttributes<HTMLInputElement>) => <input {...props} className="ui-input" />;
export const Select = (props: SelectHTMLAttributes<HTMLSelectElement>) => <select {...props} className="ui-input" />;

export function Card({ title, action, children }: { title?: string; action?: ReactNode; children: ReactNode }) {
    return (
        <section className="card overflow-hidden">
            {(title || action) && (
                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
                    <h2 className="font-semibold text-slate-900">{title}</h2>
                    {action}
                </header>
            )}
            {children}
        </section>
    );
}

const tones: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700',
    connected: 'bg-emerald-100 text-emerald-700',
    not_connected: 'bg-rose-100 text-rose-700',
    checking: 'bg-amber-100 text-amber-800',
    not_checked: 'bg-slate-100 text-slate-600',
    paid: 'bg-emerald-100 text-emerald-700',
    done: 'bg-emerald-100 text-emerald-700',
    pending: 'bg-amber-100 text-amber-800',
    unpaid: 'bg-amber-100 text-amber-800',
    queued: 'bg-amber-100 text-amber-800',
    running: 'bg-amber-100 text-amber-800',
    manual_required: 'bg-amber-100 text-amber-800',
    awaiting_accept: 'bg-amber-100 text-amber-800',
    refunded: 'bg-slate-200 text-slate-700',
    cancelled: 'bg-slate-200 text-slate-700',
    terminated: 'bg-rose-100 text-rose-700',
    suspended: 'bg-rose-100 text-rose-700',
    failed: 'bg-rose-100 text-rose-700',
    open: 'bg-amber-100 text-amber-800',
    answered: 'bg-emerald-100 text-emerald-700',
    customer_reply: 'bg-sky-100 text-sky-700',
    on_hold: 'bg-slate-200 text-slate-700',
    high: 'bg-rose-100 text-rose-700',
    overdue: 'bg-rose-100 text-rose-700',
    closed: 'bg-slate-200 text-slate-700',
    on: 'bg-emerald-100 text-emerald-700',
    off: 'bg-slate-100 text-slate-500',
};

export function Status({ value }: { value: string }) {
    return <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold whitespace-nowrap capitalize ${tones[value] ?? 'bg-slate-100 text-slate-600'}`}>{value.replace('_', ' ')}</span>;
}

export type Column<T> = { header: string; cell: (row: T) => ReactNode; align?: 'right' };

/** Ticked row ids. They are kept across pages, so a tick survives paging and searching. */
export type Selection = { ids: number[]; onChange: (ids: number[]) => void };

/** A table from md up; below that each row becomes a card so nothing scrolls sideways. */
export function Table<T extends { id?: number; code?: string }>({ columns, rows, empty, selection }: { columns: Column<T>[]; rows: T[]; empty: string; selection?: Selection }) {
    if (!rows.length) return <p className="p-6 text-center text-sm text-slate-500">{empty}</p>;

    const [heading, ...rest] = columns;
    const pageIds = rows.map((row) => row.id).filter((id): id is number => id !== undefined);
    const allTicked = pageIds.length > 0 && pageIds.every((id) => selection?.ids.includes(id));
    const tickAll = () => selection?.onChange(allTicked ? selection.ids.filter((id) => !pageIds.includes(id)) : [...new Set([...selection.ids, ...pageIds])]);
    const tick = (row: T) => row.id !== undefined && selection && (
        <input
            type="checkbox"
            aria-label={`Select #${row.id}`}
            className="cursor-pointer"
            checked={selection.ids.includes(row.id)}
            onChange={(e) => selection.onChange(e.target.checked ? [...selection.ids, row.id!] : selection.ids.filter((id) => id !== row.id))}
        />
    );

    return (
        <>
            <div className="divide-y divide-slate-200 md:hidden">
                {selection && (
                    <label className="flex items-center gap-2 px-4 py-2 text-xs text-slate-600"><input type="checkbox" checked={allTicked} onChange={tickAll} /> Select all on this page</label>
                )}
                {rows.map((row, i) => (
                    <div key={row.id ?? row.code ?? i} className="flex flex-col gap-2 p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">{tick(row)}{heading.cell(row)}</div>
                        {rest.map((c) => {
                            const value = c.cell(row);

                            const isAction = !c.header || ((c.header === 'Action' || c.header === 'Actions') && c.align === 'right');

                            return !isAction ? (
                                <div key={c.header} className="flex items-start justify-between gap-4 text-xs">
                                    <span className="text-[10px] font-semibold uppercase text-slate-400">{c.header}</span>
                                    <span className="text-right text-slate-700">{value}</span>
                                </div>
                            ) : value ? (
                                <div key="actions" className="flex justify-end border-t border-slate-100 pt-2">{value}</div>
                            ) : null;
                        })}
                    </div>
                ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-slate-200 text-[11px] text-slate-500 uppercase">
                            {selection && <th className="w-8 px-4 py-3"><input type="checkbox" aria-label="Select all on this page" className="cursor-pointer" checked={allTicked} onChange={tickAll} /></th>}
                            {columns.map((c) => (
                                <th key={c.header} className={`px-4 py-3 font-semibold whitespace-nowrap ${c.align === 'right' ? 'text-right' : ''}`}>{c.header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, i) => (
                            <tr key={row.id ?? row.code ?? i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70">
                                {selection && <td className="w-8 px-4 py-3 align-middle">{tick(row)}</td>}
                                {columns.map((c) => (
                                    <td key={c.header} className={`px-4 py-3 align-middle text-slate-700 ${c.align === 'right' ? 'text-right tabular-nums' : ''}`}>{c.cell(row)}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}

export type Tab = { key: string; label: string };

export function FilterTabs({ tabs, value, onChange }: { tabs: Tab[]; value: string; onChange: (key: string) => void }) {
    return (
        <div className="hide-scrollbar flex gap-2 overflow-x-auto border-b border-slate-200 px-4 py-3">
            {tabs.map((tab) => (
                <button key={tab.label} type="button" aria-pressed={tab.key === value} onClick={() => onChange(tab.key)} className={`filter-tab ${tab.key === value ? 'filter-tab-active' : ''}`}>{tab.label}</button>
            ))}
        </div>
    );
}

/** A paginated list endpoint in a card: search and action on top, filter tabs below, then rows. */
export function PagedTable<T extends { id?: number }>({ url, params, columns, empty, noun, search, action, tabs, selection, bulk }: {
    url: string;
    params?: Record<string, string>;
    columns: Column<T>[];
    empty: string;
    noun: string;
    search?: { value: string; onChange: (value: string) => void; placeholder: string };
    action?: ReactNode;
    tabs?: { options: Tab[]; value: string; onChange: (key: string) => void };
    selection?: Selection;
    /** Buttons for the "With selected" bar, shown once something is ticked. */
    bulk?: ReactNode;
}) {
    const [page, setPage] = useState(1);
    useEffect(() => setPage(1), [JSON.stringify(params)]);

    const query = useQuery({
        queryKey: [url, params, page],
        queryFn: async () => (await api.get<Page<T>>(url, { params: { ...params, page } })).data,
    });

    return (
        <section className="card overflow-hidden">
            <div className={`${search || action ? 'flex' : 'hidden sm:flex'} flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3`}>
                <div className="flex min-w-0 flex-1 items-center gap-3">
                    {search && (
                        <div className="w-full max-w-sm">
                            <input type="search" aria-label={search.placeholder} className="ui-input" placeholder={search.placeholder} value={search.value} onChange={(e) => search.onChange(e.target.value)} />
                        </div>
                    )}
                    {query.data && <span className="hidden whitespace-nowrap text-xs text-slate-500 sm:inline">Total {noun}: {query.data.total}</span>}
                </div>
                {action}
            </div>
            {tabs && <FilterTabs tabs={tabs.options} value={tabs.value} onChange={tabs.onChange} />}
            {selection && selection.ids.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-600">
                    <span className="font-semibold">With {selection.ids.length} selected:</span>
                    {bulk}
                    <Button variant="link" onClick={() => selection.onChange([])}>Clear</Button>
                </div>
            )}
            <QueryState query={query}>
                {query.data && (
                    <>
                        <Table columns={columns} rows={query.data.data} empty={empty} selection={selection} />
                        {query.data.last_page > 1 && (
                            <footer className="flex items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
                                <span>Page {query.data.current_page} of {query.data.last_page}</span>
                                <span className="flex gap-2">
                                    <Button variant="ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
                                    <Button variant="ghost" disabled={page >= query.data.last_page} onClick={() => setPage(page + 1)}>Next</Button>
                                </span>
                            </footer>
                        )}
                    </>
                )}
            </QueryState>
        </section>
    );
}

export function QueryState({ query, children }: { query: { isLoading: boolean; error: unknown }; children: ReactNode }) {
    if (query.isLoading) return <p className="p-6 text-center text-sm text-slate-500">Loading...</p>;
    if (query.error) return <p role="alert" className="p-6 text-center text-sm text-red-700">{errorMessage(query.error)}</p>;

    return <>{children}</>;
}

export function ErrorNote({ error }: { error: unknown }) {
    if (!error) return null;

    return <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{errorMessage(error)}</p>;
}

/**
 * A button with a menu under it. The menu is drawn on <body> at the button's spot, so a
 * table's scroll box or a card's overflow-hidden can never cut it off. It opens upwards
 * when there is no room below and is kept inside the screen. A click on a link or button
 * in the menu closes it.
 */
export function Dropdown({ button, label, buttonClassName, menuClassName = 'w-48', align = 'right', children }: {
    button: ReactNode;
    label?: string;
    buttonClassName?: string;
    menuClassName?: string;
    align?: 'left' | 'right';
    children: ReactNode;
}) {
    const [open, setOpen] = useState(false);
    const [style, setStyle] = useState<CSSProperties>({ position: 'fixed', visibility: 'hidden' });
    const anchor = useRef<HTMLButtonElement>(null);
    const menu = useRef<HTMLDivElement>(null);

    const place = useCallback(() => {
        if (!anchor.current || !menu.current) return;
        const gap = 6;
        const edge = 8;
        const a = anchor.current.getBoundingClientRect();
        const { offsetWidth: width, offsetHeight: height } = menu.current;
        const below = a.bottom + gap;
        const top = below + height > window.innerHeight - edge && a.top - gap - height >= edge ? a.top - gap - height : below;
        const left = Math.min(Math.max(align === 'right' ? a.right - width : a.left, edge), window.innerWidth - width - edge);
        setStyle({ position: 'fixed', top, left, visibility: 'visible' });
    }, [align]);

    useLayoutEffect(() => {
        if (open) place();
    }, [open, place]);

    useEffect(() => {
        if (!open) return;
        const outside = (e: MouseEvent) => {
            const target = e.target as Node;
            if (!anchor.current?.contains(target) && !menu.current?.contains(target)) setOpen(false);
        };
        const escape = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
        document.addEventListener('mousedown', outside);
        document.addEventListener('keydown', escape);
        window.addEventListener('resize', place);
        window.addEventListener('scroll', place, true); // any scrolling box, so it follows a table row

        return () => {
            document.removeEventListener('mousedown', outside);
            document.removeEventListener('keydown', escape);
            window.removeEventListener('resize', place);
            window.removeEventListener('scroll', place, true);
        };
    }, [open, place]);

    return (
        <>
            <button ref={anchor} type="button" aria-label={label} aria-haspopup="menu" aria-expanded={open} className={buttonClassName} onClick={() => { setStyle({ position: 'fixed', visibility: 'hidden' }); setOpen(!open); }}>
                {button}
            </button>
            {open && createPortal(
                <div
                    ref={menu}
                    role="menu"
                    style={style}
                    onClick={(e) => (e.target as Element).closest('a, button') && setOpen(false)}
                    className={`z-[70] max-w-[calc(100vw-16px)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl ${menuClassName}`}
                >
                    {children}
                </div>,
                document.body,
            )}
        </>
    );
}

export function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
    useEffect(() => {
        // Escape inside a rich editor's own dialog or menu closes only that.
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !(e.target instanceof Element && e.target.closest('.tox')) && onClose();
        window.addEventListener('keydown', onKey);

        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    // Rendered on body: the page's fade-in transform would otherwise size the
    // fixed backdrop to the content area instead of the whole screen.
    return createPortal(
        <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-slate-900/60 p-4 sm:pt-16" role="dialog" aria-modal="true" aria-label={title}>
            <div className={`w-full ${wide ? 'max-w-5xl' : 'max-w-lg'} rounded-2xl border border-slate-200 bg-white shadow-xl`}>
                <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                    <h2 className="font-semibold text-slate-900">{title}</h2>
                    <button type="button" aria-label="Close" onClick={onClose} className="cursor-pointer rounded-lg p-1 text-slate-500 hover:bg-slate-100"><X size={16} /></button>
                </header>
                <div className="p-4">{children}</div>
            </div>
        </div>,
        document.body,
    );
}
