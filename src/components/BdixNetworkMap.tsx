// Minimal digital network map focused on Bangladesh with glowing nodes → Dhaka.
export function BdixNetworkMap() {
  const cities = [
    { name: "Dhaka",      x: 220, y: 175, hub: true },
    { name: "Chittagong", x: 300, y: 245 },
    { name: "Sylhet",     x: 305, y: 130 },
    { name: "Rajshahi",   x: 140, y: 155 },
    { name: "Khulna",     x: 165, y: 245 },
    { name: "Rangpur",    x: 175, y: 90  },
    { name: "Barisal",    x: 220, y: 250 },
  ];
  return (
    <div className="relative w-full max-w-[520px] mx-auto">
      <div className="glow-orange absolute inset-0 opacity-60 pointer-events-none" aria-hidden />

      <svg viewBox="0 0 440 340" className="relative w-full h-auto" role="img" aria-label="Bangladesh BDIX network map">
        <defs>
          <pattern id="bd-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20 0H0V20" fill="none" stroke="var(--color-border)" />
          </pattern>
          <radialGradient id="bd-hub-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--brand-orange)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="var(--brand-orange)" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect x="0.5" y="0.5" width="439" height="339" rx="20" fill="url(#bd-grid)" stroke="var(--color-border)" />

        {/* Stylized Bangladesh outline (simplified) */}
        <path
          d="M170 70 L210 55 L245 65 L275 55 L305 70 L320 105 L325 145 L345 180 L340 215 L305 250 L275 265 L235 265 L215 275 L185 260 L155 260 L130 235 L120 200 L135 165 L125 130 L145 100 Z"
          fill="var(--color-card)"
          stroke="var(--color-border)"
          strokeWidth="1.25"
        />

        {/* Connections from every city to Dhaka */}
        {cities.filter(c => !c.hub).map((c) => {
          const path = `M ${c.x} ${c.y} L 220 175`;
          return (
            <g key={c.name}>
              <path d={path} stroke="var(--color-border)" strokeWidth="1" strokeDasharray="3 4" />
              <circle r="2.2" fill="var(--brand-orange)">
                <animateMotion dur={`${1.6 + Math.random() * 1.4}s`} repeatCount="indefinite" path={path} />
              </circle>
            </g>
          );
        })}

        {/* Cities */}
        {cities.map((c) => (
          <g key={c.name} transform={`translate(${c.x} ${c.y})`}>
            {c.hub && <circle r="34" fill="url(#bd-hub-glow)" />}
            <circle
              r={c.hub ? 6 : 3.5}
              fill={c.hub ? "var(--brand-orange)" : "var(--brand-green)"}
              className="bd-node"
            />
            <text
              x="0"
              y={c.hub ? -14 : -10}
              textAnchor="middle"
              fontSize={c.hub ? 11 : 9}
              fontWeight={c.hub ? 700 : 600}
              fill="var(--color-foreground)"
              fontFamily="Inter, system-ui, sans-serif"
            >
              {c.name}
            </text>
          </g>
        ))}

        {/* Legend */}
        <g transform="translate(20 310)" fontFamily="Inter, system-ui, sans-serif" fontSize="10" fill="var(--color-muted-foreground)">
          <circle cx="6" cy="0" r="4" fill="var(--brand-orange)" />
          <text x="16" y="3">BDIX Hub · Dhaka</text>
          <circle cx="130" cy="0" r="3" fill="var(--brand-green)" />
          <text x="140" y="3">Edge PoP</text>
        </g>
      </svg>

      <style>{`
        .bd-node { transform-box: fill-box; transform-origin: center; animation: bd-pulse 2.4s ease-in-out infinite; }
        @keyframes bd-pulse { 0%,100% { opacity: 1 } 50% { opacity: .55 } }
        @media (prefers-reduced-motion: reduce) { .bd-node { animation: none } }
      `}</style>
    </div>
  );
}

// Animated speedometer for ultra-low latency
export function SpeedometerIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className="speedo-icon" aria-hidden>
      <path d="M4 22 A 12 12 0 0 1 28 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6 22 h2 M24 22 h2 M16 8 v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <circle cx="16" cy="22" r="1.6" fill="currentColor" />
      <line x1="16" y1="22" x2="22" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="speedo-needle" />
      <style>{`
        .speedo-needle { transform-box: fill-box; transform-origin: 16px 22px; animation: speedo-sweep 2.6s ease-in-out infinite; }
        @keyframes speedo-sweep {
          0%,100% { transform: rotate(-60deg) }
          50% { transform: rotate(65deg) }
        }
        @media (prefers-reduced-motion: reduce) { .speedo-needle { animation: none } }
      `}</style>
    </svg>
  );
}
