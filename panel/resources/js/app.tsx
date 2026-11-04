import { QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Boxes, ChevronDown, KeyRound, LayoutDashboard, LogOut, Menu, MoreHorizontal, PanelLeft, Receipt, Users, X, type LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { api, basePath, setDefaultCurrency } from './api';
import { ActivityPage, AddonsPage } from './pages/system';
import { GatewaysPage } from './pages/gateways';
import { ClientsPage, OrdersPage } from './pages/sales';
import { DashboardPage } from './pages/dashboard';
import { InvoicesPage, TransactionsPage } from './pages/invoices';
import { DomainsPage, ServicesPage } from './pages/fulfilment';
import { ProductEditPage, ProductsPage, ServersPage, TldsPage } from './pages/catalog';
import { RegistrarsPage } from './pages/registrars';
import { SettingsPage, settings } from './pages/settings';
import { CustomerArea } from './pages/customer';
import { DomainDetailPage, OrderDetailPage, ServiceDetailPage } from './pages/records';
import { ClientDetailPage } from './pages/client';
import { GuestPages, isGuestPath, safeRedirect } from './pages/auth';
import { AdminAccountPage, type ClientProfile } from './pages/security';
import { ChatsPage, TicketDetailPage, TicketsPage } from './pages/support';
import { Dropdown, LogoIcon, useAppConfig, useBranding } from './ui';

type Badges = { awaiting_tickets: number; unread_chat: number };
type NavItem = { to: string; label: string; badge?: keyof Badges; end?: boolean };

const navSections: { title: string; items: NavItem[] }[] = [
    {
        title: 'Sales & Customers',
        items: [
            { to: '/admin/clients', label: 'Clients' },
            { to: '/admin/active-orders', label: 'Active Orders' },
            { to: '/admin/pending-orders', label: 'Pending Orders' },
            { to: '/admin/cancelled-orders', label: 'Cancelled Orders' },
            { to: '/admin/products-services', label: 'Products/Services' },
            { to: '/admin/domain-registrations', label: 'Domain Registrations' },
        ],
    },
    {
        title: 'Billing',
        items: [
            { to: '/admin/paid-invoices', label: 'Paid Invoices' },
            { to: '/admin/unpaid-invoices', label: 'Unpaid Invoices' },
            { to: '/admin/overdue-invoices', label: 'Overdue Invoices' },
            { to: '/admin/cancelled-invoices', label: 'Cancelled Invoices' },
            { to: '/admin/refunded-invoices', label: 'Refunded Invoices' },
            { to: '/admin/transactions', label: 'Transactions' },
        ],
    },
    {
        title: 'Support & Chat',
        items: [
            { to: '/admin/tickets', label: 'Support', badge: 'awaiting_tickets' },
            { to: '/admin/chats', label: 'Chat', badge: 'unread_chat' },
        ],
    },
    {
        title: 'Products/Services',
        items: [
            { to: '/admin/products', label: 'Products' },
            { to: '/admin/tlds', label: 'Domain Pricing' },
        ],
    },
    {
        title: 'System',
        items: [
            { to: '/admin/activity', label: 'Activity Log' },
            { to: '/admin/settings', label: 'Settings', end: true },
            ...settings,
        ],
    },
];

const pageTitles: Record<string, string> = {
    '/admin/dashboard': 'Dashboard',
    '/admin': 'Dashboard',
    '/admin/tickets': 'Support Tickets',
    '/admin/account': 'Change Password',
    '/admin/orders': 'Active Orders',
    '/admin/services': 'Products/Services',
    '/admin/domains': 'Domain Registrations',
    ...Object.fromEntries(navSections.flatMap((s) => s.items).map((i) => [i.to, i.label])),
};

const bottomNav: [string, string, LucideIcon][] = [
    ['/admin/dashboard', 'Dashboard', LayoutDashboard],
    ['/admin/clients', 'Clients', Users],
    ['/admin/paid-invoices', 'Billing', Receipt],
    ['/admin/products-services', 'Services', Boxes],
];

function UserMenu({ name }: { name: string }) {
    const client = useQueryClient();
    const logout = useMutation({
        mutationFn: () => api.post('/logout'),
        onSuccess: () => client.clear(),
        onSettled: () => window.location.assign(`${basePath}/admin/login`),
    });

    return (
        <Dropdown
            label="Account menu"
            buttonClassName="flex cursor-pointer items-center gap-2 rounded-xl px-1.5 py-1 hover:bg-slate-100"
            menuClassName="w-44 p-1"
            button={(
                <>
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-accent text-xs font-bold text-white">{name.charAt(0).toUpperCase()}</span>
                    <span className="hidden text-left sm:block">
                        <span className="block max-w-36 truncate text-xs font-semibold text-slate-900">{name}</span>
                        <span className="block text-[10px] text-slate-500">Master Administrator</span>
                    </span>
                    <ChevronDown size={14} className="hidden text-slate-500 sm:block" />
                </>
            )}
        >
            <Link to="/admin/account" role="menuitem" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100">
                <KeyRound size={14} /> Change password
            </Link>
            <button type="button" role="menuitem" disabled={logout.isPending} onClick={() => logout.mutate()} className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100">
                <LogOut size={14} /> Sign out
            </button>
        </Dropdown>
    );
}

function Shell({ name }: { name: string }) {
    const { pathname } = useLocation();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [moreOpen, setMoreOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(() => {
        try {
            return window.localStorage.getItem('sidebar-collapsed') === '1';
        } catch {
            return false;
        }
    });
    const brand = useBranding().name;
    const badges = useQuery({ queryKey: ['badges'], queryFn: async () => (await api.get<Badges>('/badges')).data, refetchInterval: 30000 });
    const badge = (item: NavItem) => {
        const count = item.badge ? badges.data?.[item.badge] ?? 0 : 0;

        return count > 0 ? <span className="ml-auto rounded-full bg-accent px-1.5 py-0.5 text-[10px] leading-none font-bold text-white">{count}</span> : null;
    };
    const section = pathname.startsWith('/admin')
        ? (pathname.split('/')[2] ? `/admin/${pathname.split('/')[2]}` : '/admin/dashboard')
        : `/${pathname.split('/')[1] ?? ''}`;
    const title = pageTitles[pathname] ?? pageTitles[section] ?? 'Overview';

    useEffect(() => {
        document.title = `${title} | ${brand} Admin`;
        setDrawerOpen(false);
        setMoreOpen(false);
    }, [pathname, title, brand]);

    const toggleSidebar = () => {
        setCollapsed(!collapsed);
        try {
            window.localStorage.setItem('sidebar-collapsed', collapsed ? '0' : '1');
        } catch {
            // The preference just won't survive a reload.
        }
    };

    const navClass = ({ isActive }: { isActive: boolean }) => `nav-link ${isActive ? 'nav-link-active' : ''}`;

    return (
        <div className={`bg-dashboard flex min-h-screen flex-col md:flex-row ${collapsed ? 'sidebar-collapsed' : ''}`}>
            <div onClick={() => setDrawerOpen(false)} className={`fixed inset-0 z-[45] bg-slate-900/60 transition-opacity duration-200 md:hidden ${drawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`} />

            <aside className={`sidebar fixed inset-y-0 left-0 z-50 flex max-h-screen w-72 max-w-[90vw] shrink-0 transform flex-col overflow-y-auto px-6 py-7 transition-transform duration-200 md:sticky md:top-0 md:h-screen md:w-64 md:max-w-none md:translate-x-0 ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex items-center gap-3">
                    <LogoIcon className="h-11 w-11 shrink-0 rounded-2xl bg-white p-1" />
                    <div className="min-w-0">
                        <div className="text-xs tracking-[0.35em] text-slate-400 uppercase">Admin</div>
                        <div className="truncate text-lg font-semibold text-white">{brand}</div>
                    </div>
                </div>
                <button type="button" aria-label="Close menu" onClick={() => setDrawerOpen(false)} className="absolute top-4 right-4 cursor-pointer rounded-full border border-white/10 bg-white/10 p-2 text-slate-200 md:hidden"><X size={16} /></button>

                <nav className="mt-8 flex-1 space-y-4 text-sm">
                    <NavLink to="/admin/dashboard" end className={navClass}><span className="h-2 w-2 shrink-0 rounded-full bg-current" /> Dashboard</NavLink>
                    {navSections.map((section) => (
                        <div key={section.title} className="space-y-2">
                            <div className="nav-section">{section.title}</div>
                            {section.items.map((item) => (
                                <NavLink key={item.to} to={item.to} end={item.end} className={navClass}><span className="h-2 w-2 shrink-0 rounded-full bg-current" /> <span className="truncate">{item.label}</span>{badge(item)}</NavLink>
                            ))}
                        </div>
                    ))}
                </nav>
            </aside>

            <div className="flex w-full min-w-0 flex-1 flex-col">
                <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-3 py-2 backdrop-blur md:hidden">
                    <button type="button" aria-label="Open menu" className="icon-btn" onClick={() => setDrawerOpen(true)}><Menu size={20} /></button>
                    <h1 className="min-w-0 flex-1 truncate text-base font-semibold">{title}</h1>
                    <UserMenu name={name} />
                </header>

                <header className="sticky top-0 z-20 hidden items-center justify-between gap-6 border-b border-slate-300/70 bg-white/80 px-6 py-3 backdrop-blur md:flex">
                    <div className="flex min-w-0 items-center gap-3">
                        <button type="button" aria-label="Toggle sidebar" aria-expanded={!collapsed} className="icon-btn" onClick={toggleSidebar}><PanelLeft size={18} /></button>
                        <h1 className="truncate text-lg font-semibold text-slate-900">{title}</h1>
                    </div>
                    <UserMenu name={name} />
                </header>

                <main key={section} className="fade-in pb-safe-nav w-full px-3 py-4 sm:px-4 md:px-6 md:py-6">
                    <Routes>
                        <Route path="/admin/dashboard" element={<DashboardPage />} />
                        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                        <Route path="/admin/clients" element={<ClientsPage />} />
                        <Route path="/admin/clients/:id" element={<ClientDetailPage />} />
                        <Route path="/admin/active-orders" element={<OrdersPage mode="active" />} />
                        <Route path="/admin/pending-orders" element={<OrdersPage mode="pending" />} />
                        <Route path="/admin/cancelled-orders" element={<OrdersPage mode="cancelled" />} />
                        <Route path="/admin/orders" element={<Navigate to="/admin/active-orders" replace />} />
                        <Route path="/admin/orders/:id" element={<OrderDetailPage />} />
                        <Route path="/admin/invoices" element={<Navigate to="/admin/paid-invoices" replace />} />
                        <Route path="/admin/invoices/:id" element={<InvoicesPage />} />
                        <Route path="/admin/paid-invoices" element={<InvoicesPage mode="paid" />} />
                        <Route path="/admin/paid-invoices/:id" element={<InvoicesPage mode="paid" />} />
                        <Route path="/admin/unpaid-invoices" element={<InvoicesPage mode="unpaid" />} />
                        <Route path="/admin/unpaid-invoices/:id" element={<InvoicesPage mode="unpaid" />} />
                        <Route path="/admin/overdue-invoices" element={<InvoicesPage mode="overdue" />} />
                        <Route path="/admin/overdue-invoices/:id" element={<InvoicesPage mode="overdue" />} />
                        <Route path="/admin/cancelled-invoices" element={<InvoicesPage mode="cancelled" />} />
                        <Route path="/admin/cancelled-invoices/:id" element={<InvoicesPage mode="cancelled" />} />
                        <Route path="/admin/refunded-invoices" element={<InvoicesPage mode="refunded" />} />
                        <Route path="/admin/refunded-invoices/:id" element={<InvoicesPage mode="refunded" />} />
                        <Route path="/admin/transactions" element={<TransactionsPage />} />
                        <Route path="/admin/products-services" element={<ServicesPage />} />
                        <Route path="/admin/products-services/:id" element={<ServiceDetailPage />} />
                        <Route path="/admin/services" element={<Navigate to="/admin/products-services" replace />} />
                        <Route path="/admin/services/:id" element={<ServiceDetailPage />} />
                        <Route path="/admin/domain-registrations" element={<DomainsPage />} />
                        <Route path="/admin/domain-registrations/:id" element={<DomainDetailPage />} />
                        <Route path="/admin/domains" element={<Navigate to="/admin/domain-registrations" replace />} />
                        <Route path="/admin/domains/:id" element={<DomainDetailPage />} />
                        <Route path="/admin/products" element={<ProductsPage />} />
                        <Route path="/admin/products/new" element={<ProductEditPage />} />
                        <Route path="/admin/products/:id" element={<ProductEditPage />} />
                        <Route path="/admin/tlds" element={<TldsPage />} />
                        <Route path="/admin/tickets" element={<TicketsPage />} />
                        <Route path="/admin/tickets/:id" element={<TicketDetailPage />} />
                        <Route path="/admin/chats" element={<ChatsPage />} />
                        <Route path="/admin/chats/:clientId" element={<ChatsPage />} />
                        <Route path="/admin/activity" element={<ActivityPage />} />
                        <Route path="/admin/settings" element={<SettingsPage />} />
                        <Route path="/admin/settings/gateways" element={<GatewaysPage />} />
                        <Route path="/admin/settings/servers" element={<ServersPage />} />
                        <Route path="/admin/settings/registrars" element={<RegistrarsPage />} />
                        <Route path="/admin/settings/addons" element={<AddonsPage />} />
                        {['gateways', 'servers', 'registrars', 'addons'].map((page) => (
                            <Route key={page} path={`/admin/${page}`} element={<Navigate to={`/admin/settings/${page}`} replace />} />
                        ))}
                        <Route path="/admin/account" element={<AdminAccountPage />} />

                        {/* Backward compatibility redirects */}
                        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
                        <Route path="/clients" element={<Navigate to="/admin/clients" replace />} />
                        <Route path="/clients/:id" element={<Navigate to="/admin/clients" replace />} />
                        <Route path="/active-orders" element={<Navigate to="/admin/active-orders" replace />} />
                        <Route path="/pending-orders" element={<Navigate to="/admin/pending-orders" replace />} />
                        <Route path="/cancelled-orders" element={<Navigate to="/admin/cancelled-orders" replace />} />
                        <Route path="/orders" element={<Navigate to="/admin/active-orders" replace />} />
                        <Route path="/paid-invoices" element={<Navigate to="/admin/paid-invoices" replace />} />
                        <Route path="/unpaid-invoices" element={<Navigate to="/admin/unpaid-invoices" replace />} />
                        <Route path="/overdue-invoices" element={<Navigate to="/admin/overdue-invoices" replace />} />
                        <Route path="/cancelled-invoices" element={<Navigate to="/admin/cancelled-invoices" replace />} />
                        <Route path="/refunded-invoices" element={<Navigate to="/admin/refunded-invoices" replace />} />
                        <Route path="/transactions" element={<Navigate to="/admin/transactions" replace />} />
                        <Route path="/products-services" element={<Navigate to="/admin/products-services" replace />} />
                        <Route path="/services" element={<Navigate to="/admin/products-services" replace />} />
                        <Route path="/domain-registrations" element={<Navigate to="/admin/domain-registrations" replace />} />
                        <Route path="/domains" element={<Navigate to="/admin/domain-registrations" replace />} />
                        <Route path="/products" element={<Navigate to="/admin/products" replace />} />
                        <Route path="/products/new" element={<Navigate to="/admin/products/new" replace />} />
                        <Route path="/tlds" element={<Navigate to="/admin/tlds" replace />} />
                        <Route path="/tickets" element={<Navigate to="/admin/tickets" replace />} />
                        <Route path="/chats" element={<Navigate to="/admin/chats" replace />} />
                        <Route path="/activity" element={<Navigate to="/admin/activity" replace />} />
                        <Route path="/settings" element={<Navigate to="/admin/settings" replace />} />
                        <Route path="/account" element={<Navigate to="/admin/account" replace />} />

                        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
                    </Routes>
                </main>
            </div>

            <nav aria-label="Main" className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden">
                {bottomNav.map(([to, label, Icon]) => (
                    <NavLink key={to} to={to} end={to === '/admin/dashboard'} className={({ isActive }) => `flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold ${isActive ? 'text-accent' : 'text-slate-500'}`}>
                        <Icon size={20} /> {label}
                    </NavLink>
                ))}
                <button type="button" aria-expanded={moreOpen} onClick={() => setMoreOpen(true)} className={`flex cursor-pointer flex-col items-center justify-center gap-0.5 text-[10px] font-semibold ${moreOpen ? 'text-accent' : 'text-slate-500'}`}>
                    <MoreHorizontal size={20} /> More
                </button>
            </nav>

            {moreOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 md:hidden" onClick={() => setMoreOpen(false)}>
                    <div role="dialog" aria-modal="true" aria-label="All features" onClick={(e) => e.stopPropagation()} className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-white p-4">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="font-semibold">All Features & Tools</h2>
                            <button type="button" aria-label="Close" onClick={() => setMoreOpen(false)} className="cursor-pointer rounded-lg p-1 text-slate-500"><X size={18} /></button>
                        </div>
                        <div className="space-y-5 py-2">
                            {navSections.map((section) => (
                                <div key={section.title} className="space-y-2">
                                    <div className="border-b border-slate-100 pb-1 text-[11px] font-bold tracking-[0.2em] text-accent uppercase">{section.title}</div>
                                    <div className="grid grid-cols-2 gap-2 pt-1">
                                        {section.items.map((item) => (
                                            <Link key={item.to} to={item.to} className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/70 p-2.5 text-xs font-semibold text-slate-800">
                                                <span className="h-2 w-2 shrink-0 rounded-full bg-accent" /> <span className="truncate">{item.label}</span>{badge(item)}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function App() {
    const me = useQuery({
        queryKey: ['me'],
        queryFn: async () => (await api.get<{ name: string }>('/me')).data,
        retry: false,
    });

    const clientMe = useQuery({
        queryKey: ['client-me'],
        queryFn: async () => (await api.get<ClientProfile>('/client/me')).data,
        retry: false,
    });
    const config = useAppConfig();
    const { pathname, search } = useLocation();
    const guestPage = isGuestPath(pathname);
    const home = safeRedirect(new URLSearchParams(search).get('redirect')) ?? (me.data ? '/admin/dashboard' : '/');

    if (config.data) setDefaultCurrency(config.data.branding.currency);
    if (me.isLoading || clientMe.isLoading || config.isLoading) return <p className="p-10 text-center text-slate-500">Loading...</p>;

    if (me.data) {
        if (guestPage) return <Navigate to={home} replace />;
        if (pathname === '/' || pathname === '/admin') return <Navigate to="/admin/dashboard" replace />;
        return <Shell name={me.data.name} />;
    }

    // An admin can still sign in from a browser that holds a customer session.
    if (guestPage && pathname.startsWith('/admin/')) return <GuestPages />;

    if (clientMe.data) {
        return guestPage ? <Navigate to={home} replace /> : <CustomerArea profile={clientMe.data} />;
    }

    if (guestPage) return <GuestPages />;

    const from = encodeURIComponent(pathname + search);

    // The customer's home is /, and a gateway returns them to their invoice with ?payment=.
    if (pathname === '/') return <Navigate to="/login" replace />;
    if (new URLSearchParams(search).has('payment')) return <Navigate to={`/login?redirect=${from}`} replace />;

    return <Navigate to={`/admin/login?redirect=${from}`} replace />;
}

const queryClient = new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false, retry: false } } });

createRoot(document.getElementById('root')!).render(
    <QueryClientProvider client={queryClient}>
        <BrowserRouter basename={basePath || undefined}>
            <App />
        </BrowserRouter>
    </QueryClientProvider>,
);
