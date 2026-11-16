// Abstract scalable cloud infrastructure — four floating isometric layers with data flowing up the stack.
//
// SVG note: a CSS animation on an element replaces its `transform` attribute, so every animated
// element here is an inner <g> and the positioning transform lives on a separate outer <g>.

const CX = 205; // stack centre
const BASE_Y = 268; // centre of the bottom layer
const STEP = 56; // vertical distance between layers
const W = 104; // half width of a layer's top face
const H = 44; // half depth of a layer's top face
const T = 13; // layer thickness

const LAYERS = [
  { label: "STORAGE", tone: "card" },
  { label: "COMPUTE", tone: "card" },
  { label: "NETWORK", tone: "card" },
  { label: "EDGE", tone: "brand" },
] as const;

export function CloudStackIllustration() {
  const topY = BASE_Y - (LAYERS.length - 1) * STEP;

  return (
    <div className="relative w-full max-w-[520px] mx-auto">
      <div className="glow-orange absolute -top-10 -left-6 h-56 w-56 opacity-60 pointer-events-none" aria-hidden />
      <div className="glow-green absolute -bottom-10 -right-6 h-56 w-56 opacity-60 pointer-events-none" aria-hidden />

      <svg viewBox="0 0 460 360" className="relative w-full h-auto" role="img" aria-label="Scalable cloud infrastructure">
        <defs>
          <pattern id="cs-grid" width="22" height="22" patternUnits="userSpaceOnUse">
            <path d="M22 0H0V22" fill="none" stroke="var(--color-border)" strokeOpacity="0.7" />
          </pattern>
          <linearGradient id="cs-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--color-card)" stopOpacity="0" />
            <stop offset="1" stopColor="var(--color-card)" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="cs-flow" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="var(--brand-green)" stopOpacity="0" />
            <stop offset="0.5" stopColor="var(--brand-green)" stopOpacity="0.6" />
            <stop offset="1" stopColor="var(--brand-orange)" stopOpacity="0.9" />
          </linearGradient>
          <filter id="cs-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#000" floodOpacity="0.1" />
          </filter>
        </defs>

        <rect x="0.5" y="0.5" width="459" height="359" rx="20" fill="url(#cs-grid)" stroke="var(--color-border)" />
        <rect x="0.5" y="0.5" width="459" height="359" rx="20" fill="url(#cs-fade)" />

        {/* Soft ground shadow */}
        <ellipse cx={CX} cy={BASE_Y + H + T + 8} rx={W * 0.9} ry="12" fill="#000" opacity="0.06" className="cs-shadow" />

        {/* Vertical data line through the stack */}
        <line x1={CX} y1={BASE_Y + H} x2={CX} y2={topY - H} stroke="url(#cs-flow)" strokeWidth="1.5" strokeDasharray="3 5" className="cs-line" />

        {/* Layers, bottom to top so higher layers overlap lower ones correctly */}
        {LAYERS.map((layer, i) => {
          const y = BASE_Y - i * STEP;
          const brand = layer.tone === "brand";
          const top = brand ? "var(--brand-orange)" : "var(--color-card)";
          const left = brand ? "var(--brand-orange)" : "var(--color-muted)";
          const right = brand ? "var(--brand-orange)" : "var(--color-secondary)";

          return (
            <g key={layer.label} transform={`translate(${CX} ${y})`}>
              <g className="cs-layer" style={{ animationDelay: `${i * 0.35}s` }} filter={i === 0 ? "url(#cs-shadow)" : undefined}>
                {/* Left face */}
                <polygon points={`${-W},0 ${-W},${T} 0,${H + T} 0,${H}`} fill={left} stroke="var(--color-border)" strokeLinejoin="round" />
                {brand && <polygon points={`${-W},0 ${-W},${T} 0,${H + T} 0,${H}`} fill="#000" opacity="0.16" />}
                {/* Right face */}
                <polygon points={`${W},0 ${W},${T} 0,${H + T} 0,${H}`} fill={right} stroke="var(--color-border)" strokeLinejoin="round" />
                {brand && <polygon points={`${W},0 ${W},${T} 0,${H + T} 0,${H}`} fill="#000" opacity="0.06" />}
                {/* Top face */}
                <polygon points={`0,${-H} ${W},0 0,${H} ${-W},0`} fill={top} stroke="var(--color-border)" strokeLinejoin="round" />
                {brand && <polygon points={`0,${-H} ${W},0 0,${H} ${-W},0`} fill="#fff" opacity="0.1" />}

                {/* Inner outline gives each layer a tray look */}
                <polygon
                  points={`0,${-H * 0.62} ${W * 0.62},0 0,${H * 0.62} ${-W * 0.62},0`}
                  fill="none"
                  stroke={brand ? "#fff" : "var(--color-border)"}
                  strokeOpacity={brand ? 0.45 : 1}
                  strokeDasharray="3 3"
                />

                {/* Nodes */}
                {[-0.34, 0, 0.34].map((dx, di) => (
                  <circle
                    key={di}
                    cx={dx * W * 1.2}
                    cy={0}
                    r="2.6"
                    fill={brand ? "#fff" : di % 2 === 0 ? "var(--brand-orange)" : "var(--brand-green)"}
                    className="cs-dot"
                    style={{ animationDelay: `${i * 0.25 + di * 0.4}s` }}
                  />
                ))}
              </g>
            </g>
          );
        })}

        {/* Pulse on the top layer */}
        <g transform={`translate(${CX} ${topY})`}>
          <ellipse cx="0" cy="0" rx={W * 0.6} ry={H * 0.6} fill="none" stroke="var(--brand-orange)" strokeWidth="1.5" className="cs-ring" />
        </g>

        {/* Data packets travelling up the stack */}
        {[0, 1, 2].map((p) => (
          <g key={p} transform={`translate(${CX} ${BASE_Y + H})`}>
            <g className="cs-packet" style={{ animationDelay: `${p * 1.3}s` }}>
              <circle r="3.5" fill="var(--brand-green)" />
              <circle r="7" fill="var(--brand-green)" opacity="0.2" />
            </g>
          </g>
        ))}

        {/* Layer labels with leader lines */}
        <g fontFamily="Inter, system-ui, sans-serif" fontSize="10" fontWeight="700" letterSpacing="0.6" fill="var(--color-muted-foreground)">
          {LAYERS.map((layer, i) => {
            const y = BASE_Y - i * STEP;
            return (
              <g key={layer.label}>
                <line x1={CX + W + 6} y1={y + T / 2} x2="338" y2={y + T / 2} stroke="var(--color-border)" strokeDasharray="2 3" />
                <circle cx="338" cy={y + T / 2} r="2" fill={layer.tone === "brand" ? "var(--brand-orange)" : "var(--color-muted-foreground)"} />
                <text x="347" y={y + T / 2 + 3.5}>{layer.label}</text>
              </g>
            );
          })}
        </g>

        {/* Auto-scale arrows */}
        <g transform="translate(50 160)">
          <g className="cs-scale">
            <path
              d="M 0 -38 L 0 38 M -9 -28 L 0 -38 L 9 -28 M -9 28 L 0 38 L 9 28"
              stroke="var(--brand-green)"
              strokeWidth="1.75"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
          <text x="0" y="62" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--brand-green)" fontFamily="Inter, system-ui, sans-serif">
            Auto-scale
          </text>
        </g>
      </svg>

      <style>{`
        .cs-layer { animation: cs-float 5s ease-in-out infinite; }
        @keyframes cs-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-5px) } }

        .cs-dot { animation: cs-blink 2.2s ease-in-out infinite; }
        @keyframes cs-blink { 0%,100% { opacity: 1 } 50% { opacity: .25 } }

        .cs-packet { animation: cs-rise 4s ease-in-out infinite; opacity: 0; }
        @keyframes cs-rise {
          0% { transform: translateY(0); opacity: 0 }
          12% { opacity: 1 }
          85% { opacity: 1 }
          100% { transform: translateY(-${BASE_Y - topY + H * 2}px); opacity: 0 }
        }

        .cs-line { animation: cs-dash 1.6s linear infinite; }
        @keyframes cs-dash { to { stroke-dashoffset: -16 } }

        .cs-ring { transform-box: fill-box; transform-origin: center; animation: cs-ping 2.8s ease-out infinite; opacity: 0; }
        @keyframes cs-ping { 0% { transform: scale(.6); opacity: .8 } 100% { transform: scale(1.5); opacity: 0 } }

        .cs-scale { transform-box: fill-box; transform-origin: center; animation: cs-pump 2.4s ease-in-out infinite; }
        @keyframes cs-pump { 0%,100% { transform: scaleY(.9) } 50% { transform: scaleY(1.12) } }

        .cs-shadow { transform-box: fill-box; transform-origin: center; animation: cs-shadow 5s ease-in-out infinite; }
        @keyframes cs-shadow { 0%,100% { transform: scale(1); opacity: .06 } 50% { transform: scale(.94); opacity: .04 } }

        @media (prefers-reduced-motion: reduce) {
          .cs-layer, .cs-dot, .cs-line, .cs-ring, .cs-scale, .cs-shadow { animation: none !important }
          .cs-packet { animation: none !important; opacity: 0 }
        }
      `}</style>
    </div>
  );
}
