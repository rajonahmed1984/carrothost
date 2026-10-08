import { CheckCircle2, ShieldCheck, Zap } from "lucide-react";

export const SST_PLUGIN_VERSION = "1.5.0";

const MATCH_KEYS = [
  { label: "Phone", pct: 100, tone: "good" },
  { label: "External ID", pct: 100, tone: "good" },
  { label: "IP address", pct: 100, tone: "good" },
  { label: "Browser ID (fbp)", pct: 95, tone: "good" },
  { label: "City", pct: 93, tone: "good" },
  { label: "Email", pct: 32, tone: "bad" },
  { label: "Click ID (fbc)", pct: 27, tone: "info" },
] as const;

const TONE_BAR: Record<string, string> = {
  good: "bg-brand-green",
  warn: "bg-amber-500",
  bad: "bg-red-500",
  info: "bg-sky-500",
};

function Bar({ pct, tone }: { pct: number; tone: string }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
      <div className={`h-full rounded-full ${TONE_BAR[tone]}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function ServerSideTrackerMockup() {
  return (
    <div className="relative w-full max-w-[620px] mx-auto">
      {/* Ambient background glows */}
      <div
        className="glow-orange absolute -top-10 -left-8 h-52 w-52 opacity-60 pointer-events-none"
        aria-hidden
      />
      <div
        className="glow-green absolute -bottom-10 -right-8 h-52 w-52 opacity-60 pointer-events-none"
        aria-hidden
      />

      <div className="relative rounded-2xl border border-border bg-card shadow-elegant overflow-hidden">
        {/* Window Chrome Header */}
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5 bg-secondary/60 backdrop-blur-sm">
          <div className="flex items-center gap-2 min-w-0">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/80 shrink-0" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80 shrink-0" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80 shrink-0" />
            <div className="ml-2 flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-0.5 text-[11px] text-muted-foreground font-mono min-w-0">
              <ShieldCheck className="h-3 w-3 text-brand-green shrink-0" />
              <span className="truncate">store.com/wp-admin/admin.php?page=carrothost-sst</span>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-brand-orange bg-brand-orange/10 px-2 py-0.5 rounded-full shrink-0">
            v{SST_PLUGIN_VERSION}
          </span>
        </div>

        {/* Plugin Content */}
        <div className="p-4 sm:p-5 space-y-3.5">
          {/* Title + action */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-bold text-foreground">Carrothost Server-Side Tracker</h4>
              <p className="text-[11px] text-muted-foreground">
                Dashboard · Activity Log · Configuration
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-lg bg-brand-orange px-2.5 py-1 text-[11px] font-bold text-white">
              <Zap className="h-3 w-3" /> Run Test Ping
            </span>
          </div>

          {/* Health banner */}
          <div className="rounded-xl border border-brand-green/30 bg-brand-green/5 p-3 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <span className="h-2 w-2 rounded-full bg-brand-green" /> All systems healthy
            </div>
            <div className="grid sm:grid-cols-2 gap-1.5 text-[11px]">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-brand-green shrink-0" />
                <span>
                  <strong className="text-foreground">Facebook</strong> receiving data · 99.9% accepted
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-brand-green shrink-0" />
                <span>
                  <strong className="text-foreground">Google</strong> GTM first-party · 45 ms
                </span>
              </div>
            </div>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="rounded-xl border border-border bg-secondary/40 p-2.5">
              <div className="text-[9px] uppercase font-semibold text-muted-foreground">Match quality</div>
              <div className="mt-1 flex items-center gap-2">
                <div
                  className="h-9 w-9 rounded-full grid place-items-center shrink-0"
                  style={{ background: "conic-gradient(var(--color-brand-green) 84%, var(--color-secondary) 0)" }}
                >
                  <span className="h-7 w-7 rounded-full bg-card grid place-items-center text-[11px] font-extrabold text-foreground">
                    8.4
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-brand-green">Great</span>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-secondary/40 p-2.5">
              <div className="text-[9px] uppercase font-semibold text-muted-foreground">Delivered to Meta</div>
              <div className="mt-1 text-lg font-extrabold text-brand-green leading-none">99.9%</div>
              <div className="text-[10px] text-muted-foreground mt-1">4,678 events</div>
            </div>
            <div className="rounded-xl border border-border bg-secondary/40 p-2.5 space-y-1">
              <div className="text-[9px] uppercase font-semibold text-muted-foreground">Orders tracked</div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">Facebook</span>
                <strong className="text-foreground">98%</strong>
              </div>
              <Bar pct={98} tone="good" />
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">Google</span>
                <strong className="text-foreground">83%</strong>
              </div>
              <Bar pct={83} tone="warn" />
            </div>
            <div className="rounded-xl border border-border bg-secondary/40 p-2.5">
              <div className="text-[9px] uppercase font-semibold text-muted-foreground">GTM proxy</div>
              <div className="mt-1 text-lg font-extrabold text-brand-green leading-none">45 ms</div>
              <div className="text-[10px] text-muted-foreground font-mono mt-1 truncate">/metrics/gtm.js</div>
            </div>
          </div>

          {/* Match keys */}
          <div className="rounded-xl border border-border bg-background p-3">
            <div className="flex items-center justify-between text-[11px] font-semibold pb-2 border-b border-border/60">
              <span className="text-foreground">
                Customer data sent with <span className="text-brand-orange">Purchase</span>
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">SHA-256 hashed</span>
            </div>
            <div className="mt-2 space-y-1.5">
              {MATCH_KEYS.map((k) => (
                <div key={k.label} className="grid grid-cols-[96px_1fr_34px] items-center gap-2 text-[11px]">
                  <span className="text-muted-foreground truncate">{k.label}</span>
                  <Bar pct={k.pct} tone={k.tone} />
                  <span className="text-right font-semibold text-foreground tabular-nums">{k.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer inside mockup */}
          <div className="flex items-center justify-between gap-2 pt-0.5 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-green" />
              Pixel + CAPI deduplicated · GA4 ecommerce
            </span>
            <span className="text-[10px] font-mono text-foreground font-semibold hidden sm:inline">
              Free With Hosting
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
