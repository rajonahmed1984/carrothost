// Clean Webuzo-style control panel mockup — pure SVG, minimal.
export function WebuzoMockup() {
  const apps = [
    { name: "WordPress", c: "var(--brand-orange)" },
    { name: "Joomla", c: "var(--brand-green)" },
    { name: "Magento", c: "var(--brand-orange)" },
    { name: "Drupal", c: "var(--brand-green)" },
    { name: "Ghost", c: "var(--brand-orange)" },
    { name: "Node.js", c: "var(--brand-green)" },
  ];
  return (
    <div className="relative w-full max-w-[620px] mx-auto">
      <div className="glow-orange absolute -top-12 -left-8 h-56 w-56 opacity-60 pointer-events-none" aria-hidden />
      <div className="glow-green absolute -bottom-10 -right-8 h-56 w-56 opacity-60 pointer-events-none" aria-hidden />

      <div className="relative rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
        {/* Window chrome */}
        <div className="flex items-center gap-2 border-b border-border px-4 py-2.5 bg-background/60">
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
          <div className="ml-3 flex-1 rounded-md border border-border bg-background px-3 py-1 text-[11px] text-muted-foreground font-mono">
            https://earth.carrothost.com
          </div>
        </div>

        <div className="grid grid-cols-[130px_1fr]">
          {/* Sidebar */}
          <aside className="border-r border-border p-3 space-y-1 text-[11px]">
            {["Dashboard", "Domains", "Databases", "Files", "Email", "SSL", "Backups", "Users"].map((s, i) => (
              <div
                key={s}
                className={`flex items-center gap-2 rounded-md px-2 py-1.5 ${
                  i === 0 ? "bg-secondary text-foreground font-semibold" : "text-muted-foreground"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${i === 0 ? "bg-brand-orange" : "bg-border"}`} />
                {s}
              </div>
            ))}
          </aside>

          {/* Main */}
          <div className="p-4 space-y-4">
            {/* Stat row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Uptime", value: "99.98%", tint: "var(--brand-green)" },
                { label: "CPU", value: "18%", tint: "var(--brand-orange)" },
                { label: "Storage", value: "12 / 50 GB", tint: "var(--brand-green)" },
              ].map((s) => (
                <div key={s.label} className="rounded-lg border border-border p-2.5">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{s.label}</div>
                  <div className="mt-0.5 text-sm font-bold" style={{ color: s.tint }}>{s.value}</div>
                  <div className="mt-1.5 h-1 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full webuzo-bar"
                      style={{ background: s.tint, width: "68%" }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* App grid */}
            <div>
              <div className="text-[11px] font-semibold text-muted-foreground mb-2">1-Click Installer</div>
              <div className="grid grid-cols-6 gap-2">
                {apps.map((a) => (
                  <div
                    key={a.name}
                    className="flex flex-col items-center gap-1 rounded-md border border-border p-2 hover:border-brand-orange transition"
                    title={a.name}
                  >
                    <span className="h-6 w-6 rounded-md" style={{ background: a.c, opacity: 0.9 }} />
                    <span className="text-[9px] text-muted-foreground truncate max-w-full">{a.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Traffic chart */}
            <div className="rounded-lg border border-border p-3">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="font-semibold">Visitor Traffic</span>
                <span className="text-brand-green">+18.4%</span>
              </div>
              <svg viewBox="0 0 300 60" className="mt-2 w-full h-14">
                <path
                  d="M0 45 L30 40 L60 42 L90 30 L120 34 L150 20 L180 24 L210 12 L240 18 L270 8 L300 14"
                  fill="none"
                  stroke="var(--brand-orange)"
                  strokeWidth="1.75"
                />
                <path
                  d="M0 45 L30 40 L60 42 L90 30 L120 34 L150 20 L180 24 L210 12 L240 18 L270 8 L300 14 L300 60 L0 60 Z"
                  fill="var(--brand-orange)"
                  opacity="0.08"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .webuzo-bar { animation: webuzo-fill 3s ease-in-out infinite alternate; }
        @keyframes webuzo-fill { from { width: 40% } to { width: 78% } }
        @media (prefers-reduced-motion: reduce) { .webuzo-bar { animation: none } }
      `}</style>
    </div>
  );
}
