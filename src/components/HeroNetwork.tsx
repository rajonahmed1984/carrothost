// Premium minimal animated hero graphic: cloud + fast servers + network mesh.
// Pure SVG + CSS animations, no external libraries.

export function HeroNetwork() {
  return (
    <div className="relative w-full aspect-[5/4] max-w-[560px] mx-auto">
      {/* Soft brand glows behind the graphic */}
      <div className="glow-orange absolute -top-10 -left-6 h-56 w-56 opacity-70 pointer-events-none" aria-hidden />
      <div className="glow-green absolute -bottom-10 -right-6 h-56 w-56 opacity-70 pointer-events-none" aria-hidden />

      <svg
        viewBox="0 0 500 400"
        role="img"
        aria-label="CarrottHost cloud network and server infrastructure"
        className="relative w-full h-full"
      >
        <defs>
          {/* Subtle grid */}
          <pattern id="hero-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M24 0H0V24" fill="none" stroke="var(--color-border)" strokeWidth="1" />
          </pattern>
          {/* Node halos */}
          <radialGradient id="halo-orange" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--brand-orange)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--brand-orange)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="halo-green" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--brand-green)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--brand-green)" stopOpacity="0" />
          </radialGradient>
          {/* Dashed data line style */}
          <linearGradient id="line-fade" x1="0" x2="1">
            <stop offset="0%" stopColor="var(--brand-orange)" stopOpacity="0" />
            <stop offset="50%" stopColor="var(--brand-orange)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="var(--brand-green)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid + frame */}
        <rect x="0.5" y="0.5" width="499" height="399" rx="20" fill="url(#hero-grid)" stroke="var(--color-border)" />

        {/* Orbital rings around cloud */}
        <g transform="translate(250 150)" opacity="0.6">
          <ellipse cx="0" cy="0" rx="150" ry="42" fill="none" stroke="var(--color-border)" />
          <ellipse cx="0" cy="0" rx="110" ry="30" fill="none" stroke="var(--color-border)" />
          {/* Orbit dot */}
          <circle r="3" fill="var(--brand-orange)">
            <animateMotion dur="9s" repeatCount="indefinite" path="M 150 0 A 150 42 0 1 1 -150 0 A 150 42 0 1 1 150 0" />
          </circle>
          <circle r="2.5" fill="var(--brand-green)">
            <animateMotion dur="7s" repeatCount="indefinite" path="M -110 0 A 110 30 0 1 1 110 0 A 110 30 0 1 1 -110 0" />
          </circle>
        </g>

        {/* Central cloud */}
        <g transform="translate(250 150)">
          <circle r="70" fill="url(#halo-orange)" />
          <g className="hero-float">
            {/* cloud silhouette */}
            <path
              d="M -55 10 a 28 28 0 0 1 22 -34 a 34 34 0 0 1 66 -6 a 26 26 0 0 1 22 40 z"
              fill="var(--color-card)"
              stroke="var(--color-border)"
              strokeWidth="1.25"
            />
            {/* small server rack in cloud */}
            <g transform="translate(-22 -18)" stroke="var(--color-border)" strokeWidth="1">
              <rect width="44" height="10" rx="2" fill="var(--color-background)" />
              <rect y="14" width="44" height="10" rx="2" fill="var(--color-background)" />
              <circle cx="6" cy="5" r="1.4" fill="var(--brand-green)" className="hero-blink" />
              <circle cx="6" cy="19" r="1.4" fill="var(--brand-orange)" className="hero-blink hero-blink-2" />
              <rect x="14" y="3" width="24" height="1.2" fill="var(--color-border)" />
              <rect x="14" y="6" width="18" height="1.2" fill="var(--color-border)" />
              <rect x="14" y="17" width="24" height="1.2" fill="var(--color-border)" />
              <rect x="14" y="20" width="14" height="1.2" fill="var(--color-border)" />
            </g>
          </g>
        </g>

        {/* Edge nodes */}
        {[
          { x: 70,  y: 300, label: "Dhaka",    color: "orange", d: "3.2s" },
          { x: 250, y: 340, label: "BDIX",     color: "green",  d: "3.8s" },
          { x: 430, y: 300, label: "Global",   color: "orange", d: "4.4s" },
          { x: 90,  y: 90,  label: "Edge",     color: "green",  d: "5s"   },
          { x: 410, y: 90,  label: "CDN",      color: "orange", d: "4s"   },
        ].map((n) => (
          <g key={n.label} transform={`translate(${n.x} ${n.y})`}>
            <circle r="22" fill={n.color === "orange" ? "url(#halo-orange)" : "url(#halo-green)"} />
            <circle
              r="10"
              fill="var(--color-card)"
              stroke="var(--color-border)"
              strokeWidth="1"
            />
            <circle
              r="3"
              fill={n.color === "orange" ? "var(--brand-orange)" : "var(--brand-green)"}
              className="hero-pulse"
              style={{ animationDuration: n.d }}
            />
            <text
              x="0"
              y="26"
              textAnchor="middle"
              fontSize="9"
              fill="var(--color-muted-foreground)"
              fontFamily="Inter, system-ui, sans-serif"
              fontWeight="600"
              letterSpacing="0.5"
            >
              {n.label.toUpperCase()}
            </text>
          </g>
        ))}

        {/* Connection lines from cloud to nodes with traveling packets */}
        {[
          { id: "l1", d: "M 250 170 Q 160 240 70 300",  dur: "2.4s" },
          { id: "l2", d: "M 250 170 Q 250 260 250 340", dur: "2.0s" },
          { id: "l3", d: "M 250 170 Q 340 240 430 300", dur: "2.8s" },
          { id: "l4", d: "M 250 170 Q 170 130 90 90",   dur: "3.2s" },
          { id: "l5", d: "M 250 170 Q 330 130 410 90",  dur: "2.6s" },
        ].map((l) => (
          <g key={l.id}>
            <path d={l.d} fill="none" stroke="var(--color-border)" strokeWidth="1" strokeDasharray="3 4" />
            <circle r="2.5" fill="var(--brand-orange)">
              <animateMotion dur={l.dur} repeatCount="indefinite" path={l.d} />
            </circle>
          </g>
        ))}
      </svg>

      <style>{`
        .hero-float { transform-box: fill-box; transform-origin: center; animation: hero-float 6s ease-in-out infinite; }
        @keyframes hero-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
        .hero-pulse { transform-box: fill-box; transform-origin: center; animation: hero-pulse 3s ease-in-out infinite; }
        @keyframes hero-pulse { 0%,100% { opacity: 1; transform: scale(1) } 50% { opacity: .55; transform: scale(1.35) } }
        .hero-blink { animation: hero-blink 1.6s steps(2, end) infinite; }
        .hero-blink-2 { animation-delay: .8s; }
        @keyframes hero-blink { 0%,49% { opacity: 1 } 50%,100% { opacity: .25 } }
        @media (prefers-reduced-motion: reduce) {
          .hero-float, .hero-pulse, .hero-blink { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
