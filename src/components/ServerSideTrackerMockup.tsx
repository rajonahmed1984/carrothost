import { CheckCircle2, ShieldCheck, Zap, ArrowUpRight, Activity } from "lucide-react";

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
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5 bg-secondary/60 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
            <div className="ml-2 flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-0.5 text-[11px] text-muted-foreground font-mono">
              <ShieldCheck className="h-3 w-3 text-brand-green" />
              <span>https://store.com/wp-admin/admin.php?page=carrothost-sst</span>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-brand-orange bg-brand-orange/10 px-2 py-0.5 rounded-full">
            v1.3.5 Active
          </span>
        </div>

        {/* Plugin Content */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* Header Banner */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-brand-green animate-ping" />
                <h4 className="text-sm font-bold text-foreground">
                  Carrothost Server-Side Tracker
                </h4>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Node-Free GTM & Meta CAPI Engine (Powered by Nginx Core)
              </p>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-brand-green/10 border border-brand-green/30 px-2.5 py-1 text-[11px] font-semibold text-brand-green">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Live Diagnostics: 200 OK</span>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-xl border border-border bg-secondary/40 p-2.5">
              <div className="text-[10px] uppercase font-semibold text-muted-foreground">
                Google Nginx Proxy
              </div>
              <div className="mt-1 flex items-center gap-1 text-xs font-bold text-brand-green">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-green" />
                First-Party
              </div>
              <div className="text-[10px] text-muted-foreground font-mono truncate mt-0.5">
                /metrics/gtm.js
              </div>
            </div>

            <div className="rounded-xl border border-border bg-secondary/40 p-2.5">
              <div className="text-[10px] uppercase font-semibold text-muted-foreground">
                Meta CAPI Match
              </div>
              <div className="mt-1 text-xs font-bold text-foreground flex items-center gap-1">
                <span className="text-brand-orange font-extrabold">9.6</span> / 10
                <span className="text-[9px] text-brand-green font-medium">(Great)</span>
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Hashed User Data</div>
            </div>

            <div className="rounded-xl border border-border bg-secondary/40 p-2.5">
              <div className="text-[10px] uppercase font-semibold text-muted-foreground">
                Node.js Memory
              </div>
              <div className="mt-1 flex items-center gap-1 text-xs font-bold text-brand-green">
                <Zap className="h-3 w-3" />
                0 MB
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Zero RAM Leaks</div>
            </div>
          </div>

          {/* Real-time Event Feed */}
          <div className="rounded-xl border border-border bg-background p-3">
            <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground pb-2 border-b border-border/60">
              <span className="flex items-center gap-1.5 text-foreground">
                <Activity className="h-3.5 w-3.5 text-brand-green" /> Live WooCommerce Event
                Stream
              </span>
              <span className="text-[10px] text-brand-orange font-mono">Bypassing AdBlockers</span>
            </div>

            <div className="mt-2.5 space-y-2 text-[11px]">
              {/* Event 1 */}
              <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-2 border border-border/50">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-brand-green/20 text-brand-green font-mono text-[10px] px-1.5 py-0.5 font-bold">
                    Purchase
                  </span>
                  <span className="text-foreground font-medium">৳ 3,850 BDT</span>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-muted-foreground hidden sm:inline">Deduplicated</span>
                  <span className="text-brand-green font-semibold">Meta CAPI 200 OK</span>
                </div>
              </div>

              {/* Event 2 */}
              <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-2 border border-border/50">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-brand-orange/20 text-brand-orange font-mono text-[10px] px-1.5 py-0.5 font-bold">
                    InitiateCheckout
                  </span>
                  <span className="text-muted-foreground">Order #10428</span>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-foreground/80">EMQ 9.5</span>
                  <span className="text-brand-green font-semibold">First-Party</span>
                </div>
              </div>

              {/* Event 3 */}
              <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-2 border border-border/50">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-primary/15 text-primary font-mono text-[10px] px-1.5 py-0.5 font-bold">
                    AddToCart
                  </span>
                  <span className="text-muted-foreground">Product ID: 891</span>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-brand-green font-semibold">Proxy /metrics</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer inside mockup */}
          <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-green" />
              Automated 100% Server-Side Protection
            </span>
            <span className="text-[10px] font-mono text-foreground font-semibold">
              Included Free With Hosting
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
