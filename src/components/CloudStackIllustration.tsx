// Abstract scalable cloud infrastructure — stacked isometric layers with scaling arrows.
export function CloudStackIllustration() {
  return (
    <div className="relative w-full max-w-[520px] mx-auto">
      <div className="glow-orange absolute -top-10 -left-6 h-56 w-56 opacity-60 pointer-events-none" aria-hidden />
      <div className="glow-green absolute -bottom-10 -right-6 h-56 w-56 opacity-60 pointer-events-none" aria-hidden />

      <svg viewBox="0 0 460 360" className="relative w-full h-auto" role="img" aria-label="Scalable cloud infrastructure">
        <defs>
          <pattern id="cs-grid" width="22" height="22" patternUnits="userSpaceOnUse">
            <path d="M22 0H0V22" fill="none" stroke="var(--color-border)" />
          </pattern>
        </defs>
        <rect x="0.5" y="0.5" width="459" height="359" rx="20" fill="url(#cs-grid)" stroke="var(--color-border)" />

        {/* Isometric stacked layers */}
        <g transform="translate(230 200)">
          {[0, 1, 2, 3].map((i) => {
            const y = -i * 38;
            const scale = 1 - i * 0.09;
            const w = 160 * scale;
            const h = 46 * scale;
            const tint = i === 3 ? "var(--brand-orange)" : "var(--color-card)";
            return (
              <g key={i} transform={`translate(0 ${y})`} className={`cs-layer cs-layer-${i}`}>
                {/* Top face */}
                <polygon
                  points={`0,${-h} ${w},0 0,${h} ${-w},0`}
                  fill={tint}
                  stroke="var(--color-border)"
                  strokeWidth="1"
                />
                {/* Right face */}
                <polygon
                  points={`${w},0 ${w},14 0,${h + 14} 0,${h}`}
                  fill="var(--color-background)"
                  stroke="var(--color-border)"
                  strokeWidth="1"
                />
                {/* Left face */}
                <polygon
                  points={`${-w},0 ${-w},14 0,${h + 14} 0,${h}`}
                  fill="var(--color-muted)"
                  stroke="var(--color-border)"
                  strokeWidth="1"
                />
                {/* Node dots */}
                {i < 3 && [-w * 0.55, -w * 0.18, w * 0.18, w * 0.55].map((dx, di) => (
                  <circle
                    key={di}
                    cx={dx}
                    cy={0}
                    r="2"
                    fill={di % 2 === 0 ? "var(--brand-orange)" : "var(--brand-green)"}
                    className="cs-dot"
                    style={{ animationDelay: `${di * 0.3}s` }}
                  />
                ))}
              </g>
            );
          })}
        </g>

        {/* Scaling arrows */}
        <g transform="translate(90 180)" className="cs-scale">
          <path d="M 0 -30 L 0 30 M -10 -20 L 0 -30 L 10 -20 M -10 20 L 0 30 L 10 20" stroke="var(--brand-green)" strokeWidth="1.75" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <text x="16" y="4" fontSize="10" fontWeight="700" fill="var(--brand-green)" fontFamily="Inter, system-ui, sans-serif">Auto-scale</text>
        </g>
        <g transform="translate(370 180)" className="cs-scale cs-scale-h">
          <path d="M -30 0 L 30 0 M -20 -10 L -30 0 L -20 10 M 20 -10 L 30 0 L 20 10" stroke="var(--brand-orange)" strokeWidth="1.75" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <text x="-30" y="-14" fontSize="10" fontWeight="700" fill="var(--brand-orange)" fontFamily="Inter, system-ui, sans-serif">Elastic</text>
        </g>

        {/* Labels */}
        <g fontFamily="Inter, system-ui, sans-serif" fontSize="10" fill="var(--color-muted-foreground)" fontWeight="600">
          <text x="60"  y="330">STORAGE</text>
          <text x="60"  y="290">COMPUTE</text>
          <text x="60"  y="250">NETWORK</text>
          <text x="60"  y="210">EDGE</text>
        </g>
      </svg>

      <style>{`
        .cs-layer { transform-box: fill-box; transform-origin: center; }
        .cs-layer-0 { animation: cs-float 5s ease-in-out infinite; }
        .cs-layer-1 { animation: cs-float 5s ease-in-out infinite; animation-delay: .3s; }
        .cs-layer-2 { animation: cs-float 5s ease-in-out infinite; animation-delay: .6s; }
        .cs-layer-3 { animation: cs-float 5s ease-in-out infinite; animation-delay: .9s; }
        @keyframes cs-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-4px) } }
        .cs-dot { animation: cs-blink 2s ease-in-out infinite; }
        @keyframes cs-blink { 0%,100% { opacity: 1 } 50% { opacity: .3 } }
        .cs-scale { transform-box: fill-box; transform-origin: center; animation: cs-pump 2.4s ease-in-out infinite; }
        .cs-scale-h { animation: cs-pump-h 2.4s ease-in-out infinite; }
        @keyframes cs-pump { 0%,100% { transform: scaleY(1) } 50% { transform: scaleY(1.15) } }
        @keyframes cs-pump-h { 0%,100% { transform: scaleX(1) } 50% { transform: scaleX(1.15) } }
        @media (prefers-reduced-motion: reduce) { .cs-layer, .cs-dot, .cs-scale, .cs-scale-h { animation: none !important } }
      `}</style>
    </div>
  );
}
