import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Globe,
  Loader2,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { breadcrumbSchema, createSeoMeta, jsonLdScript } from "@/lib/seo";
import { orderDomainUrl, PORTAL_URL } from "@/lib/portal";

export const Route = createFileRoute("/domains")({
  head: () => {
    const seo = createSeoMeta({
      title: "Domain Registration & Search — CarrotHost",
      description:
        "Search and register .com, .net, .org, .com.bd and more. Live domain availability and transparent TLD prices with local bKash / Nagad payment.",
      path: "/domains",
    });

    return {
      ...seo,
      scripts: [
        jsonLdScript(
          "ld-domains-breadcrumbs",
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Domains", path: "/domains" },
          ]),
        ),
      ],
    };
  },
  component: DomainsPage,
});

type Tld = {
  tld: string;
  is_spotlight: boolean;
  register_price: string;
  renew_price: string;
  transfer_price: string;
};
type TldResponse = { currency: string; tlds: Tld[] };
type Status = "available" | "taken" | "premium" | "unknown" | "unsupported";
type Result = { domain: string; status: Status | "invalid" | "checking" };

// Popular extensions suggested first when a bare name is searched; only those we actually sell are used.
const PREFERRED = [".com", ".net", ".org", ".com.bd", ".xyz", ".online", ".store", ".site", ".shop", ".info", ".co", ".io", ".us"];

const SYMBOL: Record<string, string> = { BDT: "৳", USD: "$" };
const NAME_PATTERN = /^([a-z0-9-]+\.)+[a-z]{2,}$/i;

const money = (value: string, currency: string) => {
  const n = Number(value);
  return `${SYMBOL[currency] ?? `${currency} `}${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
};

/** What people paste: URLs, www., spaces and capitals. */
function clean(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, "")
    .replace(/^www\./, "")
    .replace(/[/?#].*$/, "")
    .replace(/\s+/g, "");
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${PORTAL_URL}/api/public/domains/${path}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
}

async function check(domain: string): Promise<Result> {
  if (!NAME_PATTERN.test(domain)) return { domain, status: "invalid" };
  try {
    const data = await getJson<{ status: Status }>(`lookup?name=${encodeURIComponent(domain)}`);
    return { domain, status: data.status };
  } catch {
    return { domain, status: "unknown" };
  }
}

function DomainsPage() {
  const [input, setInput] = useState("");
  const [filter, setFilter] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Result[] | null>(null);

  const prices = useQuery({
    queryKey: ["public-tlds"],
    queryFn: () => getJson<TldResponse>("tlds"),
    staleTime: 5 * 60_000,
    retry: 1,
  });
  const tlds = useMemo(() => prices.data?.tlds ?? [], [prices.data]);
  const currency = prices.data?.currency ?? "BDT";

  const priceOf = (domain: string) => {
    const parts = domain.split(".");
    for (let i = 1; i < parts.length; i++) {
      const hit = tlds.find((t) => t.tld === `.${parts.slice(i).join(".")}`);
      if (hit) return hit;
    }
    return undefined;
  };

  const spotlight = useMemo(() => {
    const picks = tlds.filter((t) => t.is_spotlight);
    return (picks.length ? picks : tlds).slice(0, 6);
  }, [tlds]);

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase().replace(/^\./, "");
    return q ? tlds.filter((t) => t.tld.includes(q)) : tlds;
  }, [tlds, filter]);

  // Extensions suggested for a bare name: the popular ones we sell, topped up from the spotlight list.
  const suggestions = useMemo(() => {
    const sold = new Set(tlds.map((t) => t.tld));
    const picked = PREFERRED.filter((t) => sold.has(t));
    for (const t of spotlight) if (!picked.includes(t.tld)) picked.push(t.tld);
    return picked.slice(0, 6);
  }, [tlds, spotlight]);

  const latest = useRef(0);

  /** Checks every name in parallel and fills each row in as its answer arrives. */
  const run = useCallback(
    async (raw: string) => {
      const name = clean(raw);
      const id = ++latest.current;
      if (!name || name.length < 2) {
        setResults(null);
        setSearching(false);
        return;
      }

      const bare = name.split(".")[0];
      const names = name.includes(".")
        ? [name]
        : (suggestions.length ? suggestions : [".com"]).map((t) => `${name}${t}`);

      setSearching(true);
      setResults(names.map((domain) => ({ domain, status: "checking" })));

      const settle = (r: Result) => {
        if (latest.current !== id) return;
        setResults((prev) => (prev ? prev.map((x) => (x.domain === r.domain ? r : x)) : prev));
      };
      const first = await Promise.all(names.map((d) => check(d).then((r) => (settle(r), r))));
      if (latest.current !== id) return;

      // A full name on an extension we do not sell: offer the same name on ones we do.
      if (name.includes(".") && first[0]?.status === "unsupported") {
        const extra = suggestions.slice(0, 5).map((t) => `${bare}${t}`).filter((d) => d !== name);
        setResults((prev) => [...(prev ?? []), ...extra.map((domain) => ({ domain, status: "checking" as const }))]);
        await Promise.all(extra.map((d) => check(d).then(settle)));
      }
      if (latest.current === id) setSearching(false);
    },
    [suggestions],
  );

  // Realtime: check shortly after the visitor stops typing. The button and Enter check immediately.
  useEffect(() => {
    if (!tlds.length) return;
    const timer = setTimeout(() => run(input), 600);
    return () => clearTimeout(timer);
  }, [input, tlds.length, run]);

  function search(e: React.FormEvent) {
    e.preventDefault();
    run(input);
  }

  return (
    <div>
      <Header />

      <section className="relative overflow-hidden bg-gradient-soft border-b border-border/55 py-14 md:py-20">
        <div className="absolute top-1/4 left-10 h-72 w-72 rounded-full bg-brand-orange/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-10 h-72 w-72 rounded-full bg-brand-green/10 blur-3xl pointer-events-none" />
        <div className="relative mx-auto max-w-3xl px-6 text-center space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-green/10 border border-brand-green/20 px-4 py-1.5 text-xs font-semibold text-brand-green">
            <Globe className="h-4 w-4" /> Domain registration
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            Find your perfect <span className="text-gradient-brand">domain name</span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg">
            Live availability and transparent prices. Pay locally with bKash, Nagad or card.
          </p>

          <form onSubmit={search} className="flex flex-col sm:flex-row gap-3 text-left">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="yourbrand or yourbrand.com"
                aria-label="Domain name"
                className="w-full rounded-xl border border-border bg-background pl-12 pr-4 py-3.5 text-base shadow-soft focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-7 py-3.5 font-bold text-primary-foreground shadow-elegant hover:opacity-95 disabled:opacity-60 transition"
            >
              {searching ? (
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
              ) : (
                <Search className="h-4.5 w-4.5" />
              )}
              Search
            </button>
          </form>

          {results && (
            <ul className="space-y-2.5 text-left" aria-live="polite">
              {results.map((r) => (
                <ResultRow key={r.domain} result={r} tld={priceOf(r.domain)} currency={currency} />
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="py-14 md:py-20 border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">Domain prices</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Per year, in {currency}. Renewal and transfer prices shown up front.
              </p>
            </div>
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter extensions, e.g. com"
              aria-label="Filter extensions"
              className="w-full md:w-64 rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
            />
          </div>

          {prices.isLoading && (
            <div className="mt-10 flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading prices…
            </div>
          )}
          {prices.isError && (
            <div className="mt-10 rounded-xl border border-border bg-background p-6 text-center text-sm text-muted-foreground">
              We couldn't load live prices right now.{" "}
              <a
                className="font-semibold text-brand-green hover:underline"
                href={`${PORTAL_URL}/order-domain`}
              >
                See prices in the client portal
              </a>
              .
            </div>
          )}

          {spotlight.length > 0 && !filter && (
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {spotlight.map((t) => (
                <div
                  key={t.tld}
                  className="rounded-2xl border border-border bg-background p-4 text-center shadow-soft"
                >
                  <div className="text-xl font-extrabold text-gradient-brand">{t.tld}</div>
                  <div className="mt-1 text-sm font-semibold text-foreground">
                    {money(t.register_price, currency)}
                  </div>
                  <div className="text-[11px] text-muted-foreground">first year</div>
                </div>
              ))}
            </div>
          )}

          {visible.length > 0 && (
            <div className="mt-8 overflow-x-auto rounded-2xl border border-border bg-background shadow-soft">
              <table className="w-full min-w-[560px] text-sm text-left">
                <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Extension</th>
                    <th className="px-5 py-3 font-semibold">Register</th>
                    <th className="px-5 py-3 font-semibold">Renew</th>
                    <th className="px-5 py-3 font-semibold">Transfer</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {visible.map((t) => (
                    <tr key={t.tld} className="hover:bg-accent/30 transition">
                      <td className="px-5 py-3 font-bold text-foreground">{t.tld}</td>
                      <td className="px-5 py-3">{money(t.register_price, currency)}</td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {money(t.renew_price, currency)}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {money(t.transfer_price, currency)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <a
                          href={`${PORTAL_URL}/order-domain`}
                          className="inline-flex items-center gap-1 font-semibold text-brand-green hover:underline"
                        >
                          Order <ArrowRight className="h-3.5 w-3.5" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!prices.isLoading && !prices.isError && visible.length === 0 && (
            <p className="mt-10 text-center text-sm text-muted-foreground">
              No extensions match “{filter}”.
            </p>
          )}
        </div>
      </section>

      <section className="py-14 md:py-16 bg-gradient-soft">
        <div className="mx-auto max-w-6xl px-6 grid sm:grid-cols-3 gap-6 text-sm">
          {[
            {
              icon: ShieldCheck,
              t: "Secure & transferable",
              d: "Registrar lock, EPP code and easy transfers whenever you need them.",
            },
            {
              icon: Globe,
              t: "Full DNS control",
              d: "Manage nameservers and DNS records from your client area.",
            },
            {
              icon: CheckCircle2,
              t: "Local payments",
              d: "Pay with bKash, Nagad, Rocket or international cards.",
            },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <Icon className="h-6 w-6 text-brand-green" />
              <div className="mt-3 font-bold text-foreground">{t}</div>
              <p className="mt-1 text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}

function ResultRow({ result, tld, currency }: { result: Result; tld?: Tld; currency: string }) {
  const { domain, status } = result;
  const orderable = status === "available" || status === "unknown";
  const priced = status === "available" || status === "unknown" || status === "premium";

  const badge =
    status === "checking" ? (
      <span className="inline-flex items-center gap-1 text-muted-foreground font-semibold text-xs">
        <Loader2 className="h-4 w-4 animate-spin" /> Checking…
      </span>
    ) : status === "unsupported" ? (
      <span className="inline-flex items-center gap-1 text-muted-foreground font-semibold text-xs">
        <CircleAlert className="h-4 w-4" /> We don't sell this extension yet
      </span>
    ) : status === "available" ? (
      <span className="inline-flex items-center gap-1 text-brand-green font-semibold text-xs">
        <CheckCircle2 className="h-4 w-4" /> Available
      </span>
    ) : status === "taken" ? (
      <span className="inline-flex items-center gap-1 text-destructive font-semibold text-xs">
        <XCircle className="h-4 w-4" /> Taken
      </span>
    ) : status === "premium" ? (
      <span className="inline-flex items-center gap-1 text-brand-orange font-semibold text-xs">
        <CircleAlert className="h-4 w-4" /> Premium — contact us
      </span>
    ) : status === "invalid" ? (
      <span className="inline-flex items-center gap-1 text-destructive font-semibold text-xs">
        <CircleAlert className="h-4 w-4" /> Not a valid domain
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 text-muted-foreground font-semibold text-xs">
        <CircleAlert className="h-4 w-4" /> Availability confirmed at checkout
      </span>
    );

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3 shadow-soft">
      <div className="min-w-0">
        <div className="font-bold text-foreground break-all">{domain}</div>
        {badge}
      </div>
      <div className="flex items-center gap-3">
        {tld && priced && (
          <span className="text-sm font-semibold text-foreground">
            {money(tld.register_price, currency)}
            <span className="text-xs font-normal text-muted-foreground">/yr</span>
          </span>
        )}
        {orderable && (
          <a
            href={orderDomainUrl(domain)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-95 transition"
          >
            Order now <ArrowRight className="h-4 w-4" />
          </a>
        )}
        {status === "taken" && (
          <>
            <Link to="/whois" className="text-xs font-semibold text-muted-foreground hover:text-foreground hover:underline">
              WHOIS &amp; DNS
            </Link>
            <a
              href={orderDomainUrl(domain, "transfer")}
              className="text-xs font-semibold text-brand-green hover:underline"
            >
              Transfer it to us
            </a>
          </>
        )}
      </div>
    </li>
  );
}
