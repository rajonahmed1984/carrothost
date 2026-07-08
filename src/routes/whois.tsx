import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { breadcrumbSchema, createSeoMeta, jsonLdScript } from "@/lib/seo";
import {
  Search,
  Globe,
  Network,
  Calendar,
  ShieldCheck,
  Cpu,
  Terminal,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export const Route = createFileRoute("/whois")({
  head: () => {
    const seo = createSeoMeta({
      title: "Dynamic WHOIS & DNS Checker — CarrotHost",
      description:
        "Check live domain WHOIS details, registrar info, expiry dates, and look up real-time A, MX, NS, CNAME, and TXT DNS records instantly.",
      path: "/whois",
    });

    return {
      ...seo,
      scripts: [
        jsonLdScript(
          "ld-whois-breadcrumbs",
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "WHOIS & DNS Checker", path: "/whois" },
          ]),
        ),
      ],
    };
  },
  component: WhoisDnsPage,
});

interface DnsRecord {
  name: string;
  type: number;
  TTL: number;
  data: string;
}

interface DnsResponse {
  Answer?: DnsRecord[];
  Authority?: DnsRecord[];
  Status: number;
}

// Map DNS type IDs to common letters
const DNS_TYPES: Record<string, number> = {
  A: 1,
  AAAA: 28,
  MX: 15,
  TXT: 16,
  NS: 2,
  CNAME: 5,
};

function WhoisDnsPage() {
  const [domainInput, setDomainInput] = useState("");
  const [activeTab, setActiveTab] = useState<"whois" | "dns">("whois");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // WHOIS/RDAP state
  const [whoisData, setWhoisData] = useState<any>(null);

  // DNS State
  const [dnsResults, setDnsResults] = useState<Record<string, DnsRecord[]>>({});

  const cleanDomain = (input: string) => {
    let clean = input.trim().toLowerCase();
    clean = clean.replace(/^(https?:\/\/)?(www\.)?/, "");
    clean = clean.split("/")[0];
    return clean;
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const domain = cleanDomain(domainInput);

    if (!domain || !domain.includes(".")) {
      setError("Please enter a valid domain name (e.g. google.com)");
      return;
    }

    setLoading(true);
    setError(null);
    setWhoisData(null);
    setDnsResults({});

    try {
      // 1. Fetch DNS records in parallel using Google's public JSON DNS API
      const dnsPromises = Object.entries(DNS_TYPES).map(async ([typeName, typeId]) => {
        try {
          const res = await fetch(`https://dns.google/resolve?name=${domain}&type=${typeId}`);
          if (res.ok) {
            const data: DnsResponse = await res.json();
            return { type: typeName, records: data.Answer || [] };
          }
        } catch (e) {
          // Silent catch
        }
        return { type: typeName, records: [] };
      });

      const dnsResponseArray = await Promise.all(dnsPromises);
      const dnsMap: Record<string, DnsRecord[]> = {};
      dnsResponseArray.forEach((item) => {
        dnsMap[item.type] = item.records;
      });
      setDnsResults(dnsMap);

      // 2. Fetch WHOIS metadata via standardized RDAP protocol
      try {
        const rdapRes = await fetch(`https://rdap.org/domain/${domain}`);
        if (rdapRes.ok) {
          const data = await rdapRes.json();
          setWhoisData(data);
        } else {
          // If RDAP returns 404 or fails, we mock standard attributes from DNS NS records
          setWhoisData({
            fallback: true,
            ldhName: domain,
            status: ["active"],
          });
        }
      } catch (err) {
        // Fallback for CORS or offline
        setWhoisData({
          fallback: true,
          ldhName: domain,
          status: ["active"],
        });
      }
    } catch (err) {
      setError("Failed to run lookup. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  // Helper selectors for RDAP data
  const getRegistrar = () => {
    if (!whoisData) return "Unknown";
    if (whoisData.fallback) return "Refer to NS delegation below";

    const entities = whoisData.entities || [];
    for (const ent of entities) {
      if (ent.roles?.includes("registrar")) {
        // Look for fn in vcard
        const vcard = ent.vcardArray?.[1] || [];
        const fn = vcard.find((v: any) => v[0] === "fn");
        if (fn) return fn[3];
      }
    }
    return "Unknown Registrar";
  };

  const getDates = () => {
    const dates = { created: "N/A", expired: "N/A" };
    if (!whoisData || whoisData.fallback) return dates;

    const events = whoisData.events || [];
    events.forEach((ev: any) => {
      if (ev.eventAction === "registration") {
        dates.created = new Date(ev.eventDate).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      }
      if (ev.eventAction === "expiration") {
        dates.expired = new Date(ev.eventDate).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      }
    });
    return dates;
  };

  return (
    <div>
      <Header />
      <div className="bg-gradient-soft py-16 md:py-24 border-b border-border/55">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-orange/10 border border-brand-orange/20 px-4 py-1.5 text-xs font-semibold text-brand-orange">
              <Cpu className="h-4 w-4" />
              Dynamic Tools
            </span>
            <h1 className="mt-4 text-3xl md:text-5xl font-extrabold tracking-tight">
              WHOIS & DNS Checker
            </h1>
            <p className="mt-3 text-muted-foreground text-sm md:text-base">
              Query real-time name servers, registrar status, and resolve dynamic DNS records
              straight from your browser.
            </p>
          </div>

          {/* Form Input */}
          <div className="bg-card rounded-3xl border border-border p-6 shadow-soft max-w-3xl mx-auto mb-10">
            <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 flex items-center rounded-xl border border-input bg-background px-4 focus-within:ring-2 focus-within:ring-ring transition">
                <Globe className="h-5 w-5 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  placeholder="enter domain (e.g. google.com)"
                  className="w-full bg-transparent px-3 py-3.5 outline-none text-sm font-medium"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-gradient-brand px-6 py-3.5 font-bold text-primary-foreground shadow-elegant hover:opacity-95 transition flex items-center justify-center gap-2 disabled:opacity-70"
              >
                <Search className="h-4 w-4" />
                {loading ? "Searching..." : "Lookup"}
              </button>
            </form>
            {error && (
              <div className="mt-4 flex items-center gap-2 text-destructive text-sm font-semibold">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>

          {loading && (
            <div className="text-center py-12 space-y-4">
              <div className="h-10 w-10 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-bold text-muted-foreground">
                Fetching dynamic registrar metadata...
              </p>
            </div>
          )}

          {!loading && (whoisData || Object.keys(dnsResults).length > 0) && (
            <div className="space-y-6">
              {/* Tab Selector */}
              <div className="flex border-b border-border">
                <button
                  onClick={() => setActiveTab("whois")}
                  className={`px-6 py-3 text-sm font-bold border-b-2 transition ${
                    activeTab === "whois"
                      ? "border-brand-orange text-brand-orange"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" /> WHOIS Meta
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("dns")}
                  className={`px-6 py-3 text-sm font-bold border-b-2 transition ${
                    activeTab === "dns"
                      ? "border-brand-orange text-brand-orange"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Network className="h-4 w-4" /> DNS Records
                  </span>
                </button>
              </div>

              {/* WHOIS VIEW */}
              {activeTab === "whois" && whoisData && (
                <div className="animate-in fade-in duration-300">
                  <div className="bg-card rounded-2xl border border-border p-6 shadow-soft space-y-6">
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                      <Globe className="h-5 w-5 text-brand-orange" /> Domain Identity Details
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm">
                      <div>
                        <span className="block text-xs text-muted-foreground font-semibold uppercase">
                          Domain Name
                        </span>
                        <span className="font-bold text-foreground">
                          {whoisData.ldhName || cleanDomain(domainInput)}
                        </span>
                      </div>
                      <div>
                        <span className="block text-xs text-muted-foreground font-semibold uppercase">
                          Registrar
                        </span>
                        <span className="font-bold text-foreground">{getRegistrar()}</span>
                      </div>
                      <div>
                        <span className="block text-xs text-muted-foreground font-semibold uppercase">
                          Created On
                        </span>
                        <span className="font-bold text-foreground">{getDates().created}</span>
                      </div>
                      <div>
                        <span className="block text-xs text-muted-foreground font-semibold uppercase">
                          Expires On
                        </span>
                        <span className="font-bold text-foreground">{getDates().expired}</span>
                      </div>
                    </div>

                    {whoisData.status && (
                      <div className="pt-4 border-t border-border/50">
                        <span className="block text-xs text-muted-foreground font-semibold uppercase mb-2">
                          Domain Status Flags
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {whoisData.status.map((st: string) => (
                            <span
                              key={st}
                              className="rounded-full bg-brand-green/10 border border-brand-green/20 px-3 py-1 text-xs font-bold text-brand-green"
                            >
                              {st}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* DNS VIEW */}
              {activeTab === "dns" && (
                <div className="bg-card rounded-2xl border border-border p-6 shadow-soft space-y-8 animate-in fade-in duration-300">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Network className="h-5 w-5 text-brand-orange" /> Real-time DNS Resolution
                    Records
                  </h3>

                  <div className="space-y-6">
                    {Object.entries(dnsResults).map(([type, records]) => (
                      <div
                        key={type}
                        className="border border-border/60 rounded-xl overflow-hidden bg-secondary/15"
                      >
                        <div className="bg-secondary/40 px-4 py-2 border-b border-border/60 flex justify-between items-center">
                          <span className="font-bold text-sm text-foreground">{type} Records</span>
                          <span className="text-xs rounded bg-brand-orange/10 px-2 py-0.5 text-brand-orange font-bold">
                            {records.length} Found
                          </span>
                        </div>
                        {records.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs md:text-sm">
                              <thead>
                                <tr className="border-b border-border/40 text-muted-foreground font-semibold">
                                  <th className="px-4 py-3">Host / Name</th>
                                  <th className="px-4 py-3">TTL</th>
                                  <th className="px-4 py-3">Data / Destination</th>
                                </tr>
                              </thead>
                              <tbody>
                                {records.map((r, idx) => (
                                  <tr
                                    key={idx}
                                    className="border-b border-border/30 hover:bg-card/80 text-muted-foreground"
                                  >
                                    <td className="px-4 py-3 font-mono font-medium text-foreground">
                                      {r.name}
                                    </td>
                                    <td className="px-4 py-3 font-mono">{r.TTL}s</td>
                                    <td className="px-4 py-3 font-mono text-brand-green font-semibold break-all">
                                      {r.data}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="p-4 text-xs text-muted-foreground italic">
                            No {type} records resolved for this domain host.
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
