import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LogOut, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api, basePath, money } from '../api';
import { Button, Card, ErrorNote, Field, Input, LogoIcon, QueryState, Select, Status, Table, useBranding } from '../ui';
import { ClientSecurityPage, type ClientProfile } from './security';
import { ClientChatPage, ClientNewTicketPage, ClientTicketPage, ClientTicketsPage } from './support';

type Overview = {
    services: { id: number; domain: string | null; cycle: string; recurring_amount: string; status: string; next_due_date: string | null; product: { name: string } }[];
    domains: { id: number; name: string; status: string; expires_at: string | null; recurring_amount: string }[];
    invoices: { id: number; number: string; status: string; currency: string; total: string; due_date: string }[];
};

function Home() {
    const query = useQuery({ queryKey: ['client-overview'], queryFn: async () => (await api.get<Overview>('/client/overview')).data });
    const d = query.data;

    return (
        <QueryState query={query}>
            {d && (
                <div className="space-y-4">
                    <Card title="My services">
                        <Table rows={d.services} empty="You have no services yet." columns={[
                            { header: 'Service', cell: (s) => <><div className="font-medium">{s.product.name}</div><div className="text-xs text-slate-500">{s.domain ?? 'No domain'}</div></> },
                            { header: 'Next due', cell: (s) => s.next_due_date ?? '-' },
                            { header: 'Amount', cell: (s) => `${money(s.recurring_amount)} / ${s.cycle}`, align: 'right' },
                            { header: 'Status', cell: (s) => <Status value={s.status} /> },
                        ]} />
                    </Card>
                    <Card title="My domains">
                        <Table rows={d.domains} empty="You have no domains yet." columns={[
                            { header: 'Domain', cell: (x) => <span className="font-medium">{x.name}</span> },
                            { header: 'Expires', cell: (x) => x.expires_at ?? '-' },
                            { header: 'Status', cell: (x) => <Status value={x.status} /> },
                        ]} />
                    </Card>
                    <Card title="My invoices">
                        <Table rows={d.invoices} empty="You have no invoices yet." columns={[
                            { header: 'Number', cell: (i) => <Link className="table-action-link font-semibold" to={`/invoices/${i.id}`}>{i.number}</Link> },
                            { header: 'Due', cell: (i) => i.due_date },
                            { header: 'Total', cell: (i) => money(i.total, i.currency), align: 'right' },
                            { header: 'Status', cell: (i) => <Status value={i.status} /> },
                        ]} />
                    </Card>
                </div>
            )}
        </QueryState>
    );
}

type InvoiceDetail = Overview['invoices'][number] & {
    items: { id: number; description: string; amount: string }[];
    payments: { id: number; gateway: string; transaction_id: string; amount: string }[];
    payment_instructions: string | null;
    pay_to: string | null;
    balance: string;
    gateways: { code: string; name: string; button: string | null }[];
};

const paymentNotices: Record<string, [string, string]> = {
    success: ['border-emerald-200 bg-emerald-50 text-emerald-800', 'Payment received. Thank you.'],
    processing: ['border-amber-200 bg-amber-50 text-amber-900', 'We are waiting for confirmation from the payment provider. This page updates once it arrives.'],
    failed: ['border-red-200 bg-red-50 text-red-700', 'The payment did not go through. You have not been credited. Please try again or use another method.'],
    cancelled: ['border-slate-200 bg-slate-50 text-slate-700', 'Payment cancelled.'],
};

function Invoice() {
    const { id } = useParams();
    const [params] = useSearchParams();
    const notice = paymentNotices[params.get('payment') ?? ''];
    const pay = useMutation({
        mutationFn: async (gateway: string) => (await api.post<{ redirect_url: string }>(`/client/invoices/${id}/pay`, { gateway })).data,
        onSuccess: ({ redirect_url }) => window.location.assign(redirect_url),
    });
    const query = useQuery({ queryKey: ['client-invoice', id], queryFn: async () => (await api.get<InvoiceDetail>(`/client/invoices/${id}`)).data });
    const inv = query.data;

    return (
        <QueryState query={query}>
            {inv && (
                <Card title={inv.number} action={<Status value={inv.status} />}>
                    <div className="space-y-4 p-4">
                        <div className="flex flex-wrap justify-between gap-4">
                            <p className="text-xs text-slate-500">Due {inv.due_date}</p>
                            {inv.pay_to && <div className="text-right text-xs whitespace-pre-line text-slate-600"><div className="font-semibold text-slate-800">Pay to</div>{inv.pay_to}</div>}
                        </div>
                        <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200">
                            {inv.items.map((item) => <li key={item.id} className="flex justify-between gap-3 px-3 py-2"><span>{item.description}</span><span className="whitespace-nowrap tabular-nums">{money(item.amount, inv.currency)}</span></li>)}
                            <li className="flex justify-between gap-3 px-3 py-2 font-semibold"><span>Total</span><span className="tabular-nums">{money(inv.total, inv.currency)}</span></li>
                        </ul>
                        {notice && <p role="status" className={`rounded-xl border p-3 text-xs ${notice[0]}`}>{notice[1]}</p>}
                        {inv.gateways.length > 0 && (
                            <div className="space-y-2">
                                <div className="text-xs font-semibold text-slate-600">Pay {money(inv.balance, inv.currency)} with</div>
                                <div className="flex flex-wrap gap-2">
                                    {inv.gateways.map((g) => <Button key={g.code} disabled={pay.isPending} onClick={() => pay.mutate(g.code)}>{g.button || g.name}</Button>)}
                                </div>
                                <ErrorNote error={pay.error} />
                            </div>
                        )}
                        {inv.payment_instructions && (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                                <div className="mb-1 font-semibold">How to pay</div>
                                <p className="whitespace-pre-line">{inv.payment_instructions}</p>
                            </div>
                        )}
                        <Link className="table-action-link" to="/">Back to my account</Link>
                    </div>
                </Card>
            )}
        </QueryState>
    );
}

type StoreProduct = { id: number; name: string; type: string; description: string | null; prices: { cycle: string; price: string; setup_fee: string }[] };
type StoreGroup = { id: number; name: string; slug: string; headline: string | null; products: StoreProduct[] };

const useStore = () => useQuery({ queryKey: ['client-store'], queryFn: async () => (await api.get<StoreGroup[]>('/client/store')).data });

function ProductCard({ product }: { product: StoreProduct }) {
    const navigate = useNavigate();
    const [cycle, setCycle] = useState(product.prices[0]?.cycle ?? '');
    const [domain, setDomain] = useState('');
    const price = product.prices.find((p) => p.cycle === cycle);
    const order = useMutation({
        mutationFn: async () => (await api.post<{ invoice_id: number }>('/client/orders', { product_id: product.id, cycle, domain: domain || null })).data,
        onSuccess: ({ invoice_id }) => navigate(`/invoices/${invoice_id}`),
    });

    return (
        <section className="card flex flex-col p-4">
            <h2 className="font-semibold text-slate-900">{product.name}</h2>
            {price && (
                <p className="mt-2">
                    <span className="text-2xl font-bold text-slate-900 tabular-nums">{money(price.price)}</span>
                    <span className="text-xs text-slate-500"> / {cycle}</span>
                    {Number(price.setup_fee) > 0 && <span className="block text-xs text-slate-500">+ {money(price.setup_fee)} setup fee</span>}
                </p>
            )}
            {product.description && <p className="mt-3 text-xs whitespace-pre-line text-slate-600">{product.description}</p>}
            <form onSubmit={(e) => { e.preventDefault(); order.mutate(); }} className="mt-auto space-y-3 pt-4">
                {product.prices.length > 1 && (
                    <Field label="Billing cycle">
                        <Select value={cycle} onChange={(e) => setCycle(e.target.value)}>
                            {product.prices.map((p) => <option key={p.cycle} value={p.cycle}>{p.cycle} - {money(p.price)}</option>)}
                        </Select>
                    </Field>
                )}
                {product.type !== 'vps' && (
                    <Field label={product.type === 'shared_hosting' ? 'Domain' : 'Domain (optional)'}>
                        <Input required={product.type === 'shared_hosting'} placeholder="example.com" value={domain} onChange={(e) => setDomain(e.target.value.trim())} />
                    </Field>
                )}
                <ErrorNote error={order.error} />
                <Button className="w-full" disabled={order.isPending || !price}>{order.isPending ? 'Placing order...' : 'Order now'}</Button>
            </form>
        </section>
    );
}

function Store() {
    const { slug } = useParams();
    const query = useStore();
    const group = query.data?.find((g) => g.slug === slug);

    return (
        <QueryState query={query}>
            {query.data && !group && <Navigate to="/" replace />}
            {group && (
                <div className="space-y-4">
                    {group.headline && <p className="text-sm text-slate-600">{group.headline}</p>}
                    {group.products.length === 0 && <p className="card p-6 text-center text-sm text-slate-500">Nothing to order here yet.</p>}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {group.products.map((p) => <ProductCard key={p.id} product={p} />)}
                    </div>
                </div>
            )}
        </QueryState>
    );
}

export function CustomerArea({ profile }: { profile: ClientProfile }) {
    const client = useQueryClient();
    const logout = useMutation({
        mutationFn: () => api.post('/client/logout'),
        onSuccess: () => client.clear(),
        onSettled: () => window.location.assign(`${basePath}/login`),
    });
    const stopImpersonating = useMutation({
        mutationFn: async () => (await api.post<{ client_id: number }>('/client/impersonate/stop')).data,
        onSuccess: ({ client_id }) => window.location.assign(`${basePath}/clients/${client_id}`),
        onError: () => window.location.assign(`${basePath}/admin/login`),
    });

    const store = useStore();
    const brand = useBranding().name;
    const badges = useQuery({ queryKey: ['client-badges'], queryFn: async () => (await api.get<{ unread_chat: number; answered_tickets: number }>('/client/badges')).data, refetchInterval: 30000 });
    const count = (n = 0) => (n > 0 ? <span className="ml-auto rounded-full bg-accent px-1.5 py-0.5 text-[10px] leading-none font-bold text-white">{n}</span> : null);
    const { pathname } = useLocation();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const navClass = ({ isActive }: { isActive: boolean }) => `nav-link ${isActive ? 'nav-link-active' : ''}`;
    const dot = <span className="h-2 w-2 shrink-0 rounded-full bg-current" />;
    const titles: Record<string, string> = { '/security': 'Security', '/tickets': 'Support Tickets', '/tickets/new': 'Open Ticket', '/chat': 'Chat' };
    const title = titles[pathname]
        ?? (pathname.startsWith('/invoices/') ? 'Invoice' : pathname.startsWith('/tickets/') ? 'Support Ticket' : store.data?.find((g) => pathname === `/store/${g.slug}`)?.name ?? 'My Account');

    useEffect(() => {
        document.title = `${title} | ${brand}`;
        setDrawerOpen(false);
    }, [pathname, title, brand]);

    return (
        <div className="bg-dashboard min-h-screen">
            {profile.impersonating && (
                <div role="status" className="flex flex-wrap items-center justify-center gap-3 bg-amber-100 px-4 py-2 text-xs font-semibold text-amber-900">
                    You are logged in as {profile.name}.
                    <Button variant="ghost" disabled={stopImpersonating.isPending} onClick={() => stopImpersonating.mutate()}>Back to admin</Button>
                </div>
            )}
            <div className="flex min-h-screen flex-col md:flex-row">
                <div onClick={() => setDrawerOpen(false)} className={`fixed inset-0 z-[45] bg-slate-900/60 transition-opacity duration-200 md:hidden ${drawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`} />

                <aside className={`sidebar fixed inset-y-0 left-0 z-50 flex max-h-screen w-72 max-w-[90vw] shrink-0 transform flex-col overflow-y-auto px-6 py-7 transition-transform duration-200 md:sticky md:top-0 md:h-screen md:w-64 md:max-w-none md:translate-x-0 ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <Link to="/" className="flex items-center gap-3">
                        <LogoIcon className="h-11 w-11 shrink-0 rounded-2xl bg-white p-1" />
                        <div className="min-w-0">
                            <div className="text-xs tracking-[0.35em] text-slate-400 uppercase">Client</div>
                            <div className="truncate text-lg font-semibold text-white">{brand}</div>
                        </div>
                    </Link>
                    <button type="button" aria-label="Close menu" onClick={() => setDrawerOpen(false)} className="absolute top-4 right-4 cursor-pointer rounded-full border border-white/10 bg-white/10 p-2 text-slate-200 md:hidden"><X size={16} /></button>

                    <nav className="mt-8 flex-1 space-y-4 text-sm">
                        <div className="space-y-2">
                            <div className="nav-section">My Account</div>
                            <NavLink to="/" end className={navClass}>{dot} Dashboard</NavLink>
                            {!profile.impersonating && <NavLink to="/security" className={navClass}>{dot} Security</NavLink>}
                        </div>
                        <div className="space-y-2">
                            <div className="nav-section">Support & Chat</div>
                            <NavLink to="/tickets" end className={({ isActive }) => navClass({ isActive: isActive || (pathname.startsWith('/tickets/') && pathname !== '/tickets/new') })}>{dot} Support Tickets{count(badges.data?.answered_tickets)}</NavLink>
                            <NavLink to="/tickets/new" className={navClass}>{dot} Open Ticket</NavLink>
                            <NavLink to="/chat" className={navClass}>{dot} Chat{count(badges.data?.unread_chat)}</NavLink>
                        </div>
                        {!!store.data?.length && (
                            <div className="space-y-2">
                                <div className="nav-section">Order New Services</div>
                                {store.data.map((g) => <NavLink key={g.id} to={`/store/${g.slug}`} className={navClass}>{dot} <span className="truncate">{g.name}</span></NavLink>)}
                            </div>
                        )}
                    </nav>
                </aside>

                <div className="flex w-full min-w-0 flex-1 flex-col">
                    <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-slate-300/70 bg-white/80 px-3 py-2 backdrop-blur md:px-6 md:py-3">
                        <div className="flex min-w-0 items-center gap-3">
                            <button type="button" aria-label="Open menu" className="icon-btn md:hidden" onClick={() => setDrawerOpen(true)}><Menu size={20} /></button>
                            <h1 className="truncate text-base font-semibold text-slate-900 md:text-lg">{title}</h1>
                        </div>
                        <div className="flex min-w-0 items-center gap-3">
                            <span className="hidden truncate text-xs font-semibold text-slate-700 sm:block">{profile.name}</span>
                            <Button variant="ghost" disabled={logout.isPending} onClick={() => logout.mutate()}><LogOut size={14} /> Sign out</Button>
                        </div>
                    </header>
                    <main key={pathname} className="fade-in mx-auto w-full max-w-5xl px-3 py-4 sm:px-4 md:px-6 md:py-6">
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/invoices/:id" element={<Invoice />} />
                            <Route path="/store/:slug" element={<Store />} />
                            <Route path="/tickets" element={<ClientTicketsPage />} />
                            <Route path="/tickets/new" element={<ClientNewTicketPage />} />
                            <Route path="/tickets/:id" element={<ClientTicketPage />} />
                            <Route path="/chat" element={<ClientChatPage />} />
                            <Route path="/security" element={<ClientSecurityPage profile={profile} />} />
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </main>
                </div>
            </div>
        </div>
    );
}
