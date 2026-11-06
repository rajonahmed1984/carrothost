import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowRightLeft, BadgeCheck, CircleAlert, CircleCheck, CircleX, Globe, Headset, KeyRound, Loader2, Lock, Search, ServerCog, ShoppingCart, Sparkles, Star } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { api, errorMessage, money } from '../api';
import { ErrorNote, QueryState } from '../ui';

type Tld = { tld: string; register_price: string; renew_price: string; transfer_price: string; is_spotlight: boolean; epp_required: boolean };
type Options = { register: boolean; transfer: boolean; own: boolean; nameservers: string[]; tlds: Tld[]; lookup: boolean; premium: boolean };
type Lookup = { domain: string; status: 'available' | 'taken' | 'premium' | 'unknown' };
type Action = 'register' | 'transfer';

const YEARS = [1, 2, 3, 5, 10];
const accents = [
    'from-orange-500 to-rose-500', 'from-sky-500 to-indigo-500', 'from-emerald-500 to-teal-500', 'from-violet-500 to-fuchsia-500',
    'from-amber-500 to-orange-500', 'from-cyan-500 to-sky-500', 'from-pink-500 to-rose-500', 'from-lime-500 to-emerald-500',
];

/** Longest suffix first, as the server matches it, so example.com.bd prices as .com.bd. */
function tldFor(domain: string, tlds: Tld[]) {
    const parts = domain.toLowerCase().split('.');
    for (let i = 1; i < parts.length; i++) {
        const match = tlds.find((t) => t.tld === `.${parts.slice(i).join('.')}`);
        if (match) return match;
    }
    return undefined;
}

/** What people paste: URLs, www., spaces and capitals. A bare name gets the default extension. */
function normalize(input: string, fallbackTld: string) {
    const clean = input.trim().toLowerCase().replace(/^[a-z]+:\/\//, '').replace(/^www\./, '').replace(/[/?#].*$/, '').replace(/\s+/g, '');
    if (!clean) return '';

    return clean.includes('.') ? clean : `${clean}${fallbackTld}`;
}

const label = (domain: string, tld?: Tld) => (tld ? domain.slice(0, -tld.tld.length) : domain.split('.')[0]);
const price = (t: Tld, action: Action) => (action === 'transfer' ? t.transfer_price : t.register_price);

export function DomainOrderPage() {
    const query = useQuery({ queryKey: ['client-domain-options'], queryFn: async () => (await api.get<Options & { currency: string }>('/client/store/domains')).data });

    return <QueryState query={query}>{query.data && <DomainOrder options={query.data} />}</QueryState>;
}

function DomainOrder({ options }: { options: Options & { currency: string } }) {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const allowed = (['register', 'transfer'] as const).filter((a) => options[a]);
    const [picked, setPicked] = useState<Action>(params.get('action') === 'transfer' ? 'transfer' : 'register');
    const action: Action | undefined = allowed.includes(picked) ? picked : allowed[0];
    const featured = options.tlds.filter((t) => t.is_spotlight);
    const fallbackTld = (featured[0] ?? options.tlds.find((t) => t.tld === '.com') ?? options.tlds[0])?.tld ?? '.com';

    const [input, setInput] = useState(() => normalize(params.get('domain') ?? '', fallbackTld));
    const [domain, setDomain] = useState(() => normalize(params.get('domain') ?? '', fallbackTld));
    const [years, setYears] = useState(1);
    const [epp, setEpp] = useState('');
    const [filter, setFilter] = useState('');
    const [showAll, setShowAll] = useState(false);

    const tld = domain ? tldFor(domain, options.tlds) : undefined;
    const lookup = useQuery({
        queryKey: ['client-domain-lookup', domain],
        queryFn: async () => (await api.get<Lookup>('/client/store/domains/lookup', { params: { name: domain } })).data,
        enabled: options.lookup && !!tld,
        staleTime: 120000,
        retry: false,
    });
    const order = useMutation({
        mutationFn: async () => (await api.post<{ invoice_id: number }>('/client/orders/domain', { name: domain, action, years: action === 'transfer' ? 1 : years, epp_code: action === 'transfer' ? epp || null : null })).data,
        onSuccess: ({ invoice_id }) => navigate(`/invoices/${invoice_id}`),
    });

    const sld = label(domain, tld);
    const alternatives = useMemo(() => (sld ? featured.filter((t) => t.tld !== tld?.tld).slice(0, 6) : []), [sld, featured, tld]);
    const priced = options.tlds.filter((t) => !filter || t.tld.includes(filter.trim().toLowerCase().replace(/^\.?/, '.')));
    const shown = showAll || filter ? priced : priced.slice(0, 15);

    if (!action) return <Navigate to="/" replace />;

    const status = lookup.data?.domain === domain ? lookup.data.status : null;
    // Registering needs a free name; transferring needs one that is already registered.
    const blocked = status !== null && status !== 'unknown' && (action === 'register' ? status !== 'available' : status === 'available');
    const eppRequired = tld?.epp_required ?? true;
    const total = tld ? Number(price(tld, action)) * (action === 'transfer' ? 1 : years) : 0;
    const search = (value: string) => {
        const next = normalize(value, fallbackTld);
        setInput(next);
        setDomain(next);
        order.reset();
    };
    const pick = (t: Tld) => search(`${sld || 'yourname'}${t.tld}`);
    const switchTo = (a: Action) => { setPicked(a); order.reset(); };

    return (
        <div className="space-y-6">
            {/* Search hero */}
            <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-900 to-[oklch(0.35_0.12_40)] px-5 py-10 text-white shadow-sm sm:px-10 sm:py-14">
                <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[var(--accent)] opacity-30 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-sky-500 opacity-20 blur-3xl" />
                <div className="relative mx-auto max-w-3xl text-center">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 ring-1 ring-white/15"><Sparkles size={13} /> {options.tlds.length} extensions available</span>
                    <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{action === 'transfer' ? 'Transfer your domain to us' : 'Find your perfect domain'}</h1>
                    <p className="mt-2 text-sm text-white/70 sm:text-base">{action === 'transfer' ? 'Move it in a few minutes. A transfer adds a year to its expiry.' : 'Search a name, see if it is free, and register it in a minute.'}</p>

                    {allowed.length > 1 && (
                        <div className="mt-6 inline-flex rounded-full bg-white/10 p-1 ring-1 ring-white/15" role="tablist" aria-label="Order type">
                            {allowed.map((a) => (
                                <button key={a} type="button" role="tab" aria-selected={a === action} onClick={() => switchTo(a)} className={`flex cursor-pointer items-center gap-1.5 rounded-full px-5 py-2 text-sm font-semibold transition ${a === action ? 'bg-white text-slate-900 shadow' : 'text-white/80 hover:text-white'}`}>
                                    {a === 'register' ? <Globe size={15} /> : <ArrowRightLeft size={15} />} {a === 'register' ? 'Register' : 'Transfer'}
                                </button>
                            ))}
                        </div>
                    )}

                    <form onSubmit={(e) => { e.preventDefault(); search(input); }} className="mt-5 flex flex-col gap-2 rounded-2xl bg-white p-2 shadow-xl sm:flex-row">
                        <div className="relative min-w-0 flex-1">
                            <Search size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400" />
                            <input
                                aria-label="Domain name"
                                className="h-12 w-full rounded-xl border-0 bg-transparent pr-3 pl-11 text-base text-slate-900 outline-none placeholder:text-slate-400"
                                placeholder={action === 'transfer' ? 'yourdomain.com' : `Type a name, like yourbrand${fallbackTld}`}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                            />
                        </div>
                        <button className="ui-btn ui-btn-primary h-12 justify-center px-7 text-base"><Search size={16} /> {action === 'transfer' ? 'Check' : 'Search'}</button>
                    </form>

                    {featured.length > 0 && (
                        <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs">
                            {featured.slice(0, 6).map((t) => (
                                <button key={t.tld} type="button" onClick={() => pick(t)} className="cursor-pointer rounded-full bg-white/10 px-3 py-1 font-semibold text-white ring-1 ring-white/15 hover:bg-white/20">
                                    {t.tld} <span className="font-normal text-white/70">{money(price(t, action))}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {domain && (
                <div className="grid items-start gap-6 lg:grid-cols-[1fr_22rem]">
                    <div className="space-y-6">
                        {/* The result */}
                        <ResultCard domain={domain} tld={tld} action={action} lookupEnabled={options.lookup} loading={lookup.isFetching} status={status} premium={options.premium} lookupError={lookup.error} tlds={options.tlds} />

                        {action === 'register' && alternatives.length > 0 && (
                            <section className="card overflow-hidden">
                                <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
                                    <h2 className="font-semibold text-slate-900">More options for <span className="text-accent">{sld}</span></h2>
                                    <span className="text-xs text-slate-500">Tap one to check it</span>
                                </header>
                                <ul className="divide-y divide-slate-100">
                                    {alternatives.map((t) => (
                                        <li key={t.tld} className="flex items-center gap-3 px-5 py-3">
                                            <Globe size={16} className="shrink-0 text-slate-400" />
                                            <span className="min-w-0 flex-1 truncate font-medium text-slate-900">{sld}<span className="text-accent">{t.tld}</span></span>
                                            <span className="text-right">
                                                <span className="block text-sm font-semibold text-slate-900 tabular-nums">{money(t.register_price)}</span>
                                                <span className="block text-[11px] text-slate-500">renews {money(t.renew_price)}</span>
                                            </span>
                                            <button type="button" onClick={() => pick(t)} className="ui-btn ui-btn-secondary h-9 shrink-0 px-3 text-xs">Check</button>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}
                    </div>

                    {/* Order summary */}
                    <aside className="card sticky top-4 overflow-hidden">
                        <header className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                            <h2 className="flex items-center gap-2 font-semibold text-slate-900"><ShoppingCart size={16} /> Order Summary</h2>
                        </header>
                        <form onSubmit={(e) => { e.preventDefault(); order.mutate(); }} className="space-y-4 p-5">
                            <div className="rounded-xl bg-slate-50 px-4 py-3">
                                <div className="text-xs text-slate-500">{action === 'transfer' ? 'Domain transfer' : 'Domain registration'}</div>
                                <div className="mt-0.5 font-semibold break-all text-slate-900">{domain}</div>
                            </div>
                            {tld ? (
                                <>
                                    {action === 'register' ? (
                                        <label className="block">
                                            <span className="mb-1 block text-xs font-semibold text-slate-600">Registration period</span>
                                            <select className="ui-input" value={years} onChange={(e) => setYears(Number(e.target.value))}>
                                                {YEARS.map((y) => <option key={y} value={y}>{y} year{y > 1 ? 's' : ''} · {money(Number(tld.register_price) * y)}</option>)}
                                            </select>
                                        </label>
                                    ) : (
                                        <label className="block">
                                            <span className="mb-1 block text-xs font-semibold text-slate-600">Auth (EPP) code {eppRequired ? '' : '(optional)'}</span>
                                            <input className="ui-input font-mono" required={eppRequired} autoComplete="off" value={epp} onChange={(e) => setEpp(e.target.value)} />
                                            <span className="mt-1 block text-[11px] text-slate-500">Get it from your current registrar, and unlock the domain there first.</span>
                                        </label>
                                    )}
                                    <dl className="space-y-1.5 border-t border-slate-100 pt-3 text-sm">
                                        <div className="flex justify-between gap-3"><dt className="text-slate-500">{action === 'transfer' ? 'Transfer (+1 year)' : `${years} year${years > 1 ? 's' : ''}`}</dt><dd className="tabular-nums">{money(total)}</dd></div>
                                        <div className="flex justify-between gap-3"><dt className="text-slate-500">Renews at</dt><dd className="tabular-nums">{money(tld.renew_price)} / yr</dd></div>
                                        <div className="flex justify-between gap-3 border-t border-slate-100 pt-2 text-base font-bold text-slate-900"><dt>Total due today</dt><dd className="text-accent tabular-nums">{money(total)}</dd></div>
                                    </dl>
                                    <ErrorNote error={order.error} />
                                    <button className="ui-btn ui-btn-primary h-11 w-full justify-center text-sm" disabled={order.isPending || blocked}>
                                        {order.isPending ? <><Loader2 size={15} className="animate-spin" /> Placing order...</> : <><ShoppingCart size={15} /> {blocked ? 'Not available' : action === 'transfer' ? 'Order Transfer' : 'Register Now'}</>}
                                    </button>
                                </>
                            ) : <p className="text-sm text-rose-600">We do not offer this extension. Pick one from the list below.</p>}
                            <ul className="space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-600">
                                <li className="flex items-center gap-2"><ServerCog size={14} className="text-emerald-600" /> Nameservers and DNS managed from your client area</li>
                                <li className="flex items-center gap-2"><Lock size={14} className="text-emerald-600" /> Registrar lock against unwanted transfers</li>
                                <li className="flex items-center gap-2"><Headset size={14} className="text-emerald-600" /> Local support when you need it</li>
                            </ul>
                        </form>
                    </aside>
                </div>
            )}

            {/* Featured extensions */}
            {featured.length > 0 && (
                <section>
                    <div className="mb-3 flex items-end justify-between gap-3">
                        <div>
                            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><Star size={18} className="text-amber-500" /> Featured Domains</h2>
                            <p className="text-sm text-slate-500">Popular extensions, ready to {action === 'transfer' ? 'transfer' : 'register'}.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
                        {featured.map((t, i) => (
                            <button key={t.tld} type="button" onClick={() => pick(t)} className="group card relative cursor-pointer overflow-hidden p-5 text-left transition hover:-translate-y-0.5 hover:shadow-lg">
                                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accents[i % accents.length]}`} />
                                {i === 0 && <span className="absolute top-3 right-3 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">Popular</span>}
                                <div className={`bg-gradient-to-r ${accents[i % accents.length]} bg-clip-text text-3xl font-extrabold tracking-tight text-transparent`}>{t.tld}</div>
                                <div className="mt-3 text-lg font-bold text-slate-900 tabular-nums">{money(price(t, action))}</div>
                                <div className="text-[11px] text-slate-500">{action === 'transfer' ? 'transfer' : 'first year'} · renews {money(t.renew_price)}</div>
                                <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-accent group-hover:underline">{action === 'transfer' ? 'Transfer' : 'Search'} {t.tld} →</span>
                            </button>
                        ))}
                    </div>
                </section>
            )}

            {/* All prices */}
            <section className="card overflow-hidden">
                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
                    <div>
                        <h2 className="font-semibold text-slate-900">Domain Pricing</h2>
                        <p className="text-xs text-slate-500">Yearly prices in {options.currency}. Click an extension to search it.</p>
                    </div>
                    <div className="relative w-full sm:w-64">
                        <Search size={15} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
                        <input aria-label="Filter extensions" className="ui-input pl-9" placeholder="Find an extension, like .bd" value={filter} onChange={(e) => setFilter(e.target.value)} />
                    </div>
                </header>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[34rem] text-sm">
                        <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase">
                            <tr><th className="px-5 py-3">Extension</th><th className="px-5 py-3 text-right">Register</th><th className="px-5 py-3 text-right">Transfer</th><th className="px-5 py-3 text-right">Renew</th><th className="px-5 py-3" /></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {shown.length === 0 && <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-500">No extension matches “{filter}”.</td></tr>}
                            {shown.map((t) => (
                                <tr key={t.tld} className="hover:bg-slate-50/70">
                                    <td className="px-5 py-3 font-semibold text-slate-900">{t.tld} {t.is_spotlight && <Star size={12} className="mb-0.5 inline text-amber-500" aria-label="Featured" />}</td>
                                    <td className="px-5 py-3 text-right tabular-nums">{money(t.register_price)}</td>
                                    <td className="px-5 py-3 text-right text-slate-600 tabular-nums">{money(t.transfer_price)}</td>
                                    <td className="px-5 py-3 text-right text-slate-600 tabular-nums">{money(t.renew_price)}</td>
                                    <td className="px-5 py-3 text-right"><button type="button" onClick={() => { pick(t); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="table-action-link text-xs font-semibold">{action === 'transfer' ? 'Transfer' : 'Search'}</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {!filter && priced.length > 15 && (
                    <div className="border-t border-slate-200 px-5 py-3 text-center">
                        <button type="button" onClick={() => setShowAll(!showAll)} className="table-action-link text-sm font-semibold">{showAll ? 'Show fewer' : `Show all ${priced.length} extensions`}</button>
                    </div>
                )}
            </section>

            {action === 'transfer' && (
                <section className="card p-5">
                    <h2 className="font-semibold text-slate-900">How a transfer works</h2>
                    <ol className="mt-4 grid gap-4 md:grid-cols-3">
                        {[
                            [<Lock key="l" size={16} />, 'Unlock it', 'Turn off the registrar lock at your current registrar.'],
                            [<KeyRound key="k" size={16} />, 'Get the auth code', 'Copy its EPP code there and enter it above.'],
                            [<BadgeCheck key="b" size={16} />, 'Approve and done', 'Approve any email from the registry. It usually completes in 5-7 days.'],
                        ].map(([icon, title, text], i) => (
                            <li key={i} className="flex gap-3 rounded-2xl bg-slate-50 p-4">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-accent">{icon}</span>
                                <div><div className="text-sm font-semibold text-slate-900">{i + 1}. {title}</div><div className="text-xs text-slate-600">{text}</div></div>
                            </li>
                        ))}
                    </ol>
                </section>
            )}

            {options.own && <p className="text-center text-xs text-slate-500">Already have a domain somewhere else? Use it with any hosting plan from <Link to="/services" className="table-action-link">our hosting</Link>{options.nameservers.length ? `, pointing it at ${options.nameservers.join(', ')}` : ''}.</p>}
        </div>
    );
}

function ResultCard({ domain, tld, action, lookupEnabled, loading, status, premium, lookupError, tlds }: {
    domain: string; tld?: Tld; action: Action; lookupEnabled: boolean; loading: boolean; status: Lookup['status'] | null; premium: boolean; lookupError: unknown; tlds: Tld[];
}) {
    if (!tld) {
        return (
            <section className="card flex items-start gap-4 border-rose-200 p-5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600"><CircleX size={22} /></span>
                <div>
                    <div className="font-semibold break-all text-slate-900">{domain}</div>
                    <p className="text-sm text-slate-600">We do not offer this extension. Try one of {tlds.slice(0, 5).map((t) => t.tld).join(', ')} or see the full list below.</p>
                </div>
            </section>
        );
    }

    const good = action === 'register' ? status === 'available' : status === 'taken';
    const bad = status !== null && status !== 'unknown' && !good;
    const [tone, icon, heading, text] = !lookupEnabled ? ['slate', <Globe key="g" size={22} />, domain, 'We confirm availability before we register it.']
        : loading ? ['slate', <Loader2 key="l" size={22} className="animate-spin" />, 'Checking...', `Looking up ${domain}.`]
        : lookupError ? ['amber', <CircleAlert key="a" size={22} />, domain, `We could not check right now (${errorMessage(lookupError)}). You can still order; we confirm it before registering.`]
        : status === 'premium' ? ['amber', <Star key="s" size={22} />, `${domain} is premium`, premium ? 'Premium names have their own price. Open a ticket and we will quote it.' : 'This name is not available at the standard price.']
        : good ? ['emerald', <CircleCheck key="c" size={22} />, action === 'register' ? `${domain} is available!` : `${domain} can be transferred`, action === 'register' ? 'Great choice. Register it before someone else does.' : 'It is registered elsewhere. Enter its auth code to move it to us.']
        : bad ? ['rose', <CircleX key="x" size={22} />, action === 'register' ? `${domain} is taken` : `${domain} is not registered yet`, action === 'register' ? 'Try another extension below, or transfer it if it is yours.' : 'Register it instead.']
        : ['slate', <Globe key="g" size={22} />, domain, 'We confirm availability before we register it.'];
    const tones: Record<string, string> = {
        emerald: 'border-emerald-200 bg-gradient-to-r from-emerald-50 to-white',
        rose: 'border-rose-200 bg-gradient-to-r from-rose-50 to-white',
        amber: 'border-amber-200 bg-gradient-to-r from-amber-50 to-white',
        slate: '',
    };
    const iconTones: Record<string, string> = { emerald: 'bg-emerald-100 text-emerald-700', rose: 'bg-rose-100 text-rose-600', amber: 'bg-amber-100 text-amber-700', slate: 'bg-slate-100 text-slate-600' };

    return (
        <section role="status" className={`card flex flex-wrap items-center gap-4 p-5 ${tones[tone as string]}`}>
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconTones[tone as string]}`}>{icon}</span>
            <div className="min-w-[12rem] flex-1">
                <div className="text-lg font-bold break-words text-slate-900">{heading}</div>
                <p className="text-sm text-slate-600">{text}</p>
            </div>
            <div className="w-full border-t border-slate-200/70 pt-3 sm:w-auto sm:border-0 sm:pt-0 sm:text-right">
                <div className="text-xl font-bold text-slate-900 tabular-nums">{money(price(tld, action))}</div>
                <div className="text-xs text-slate-500">{action === 'transfer' ? 'transfer incl. 1 year' : 'first year'} · renews {money(tld.renew_price)}</div>
            </div>
        </section>
    );
}
