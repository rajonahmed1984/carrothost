// Modern isometric-ish illustration: magnifying glass + secure key scanning a globe.
export function DomainSearchIllustration() {
  return (
    <div className="relative w-full max-w-[460px] mx-auto">
      <div className="glow-orange absolute -top-8 -left-4 h-48 w-48 opacity-60 pointer-events-none" aria-hidden />
      <div className="glow-green absolute -bottom-8 -right-4 h-48 w-48 opacity-60 pointer-events-none" aria-hidden />

      <svg viewBox="0 0 420 340" className="relative w-full h-auto" role="img" aria-label="Domain search illustration">
        <defs>
          <pattern id="dom-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20 0H0V20" fill="none" stroke="var(--color-border)" />
          </pattern>
        </defs>

        <rect x="0.5" y="0.5" width="419" height="339" rx="20" fill="url(#dom-grid)" stroke="var(--color-border)" />

        {/* Globe (isometric-tilted) */}
        <g transform="translate(210 170)">
          <ellipse cx="0" cy="0" rx="120" ry="120" fill="var(--color-card)" stroke="var(--color-border)" />
          <g className="dom-globe" stroke="var(--color-border)" fill="none">
            <ellipse rx="120" ry="42" />
            <ellipse rx="120" ry="80" />
            <ellipse rx="80" ry="120" />
            <ellipse rx="40" ry="120" />
            <path d="M-120 0 H120" />
          </g>
          {/* land blobs */}
          <g fill="var(--brand-orange)" opacity="0.14">
            <path d="M-70 -30 q 20 -15 40 -5 t 30 10 q -10 20 -35 22 t -35 -27z" />
            <path d="M20 20 q 30 -5 55 5 t 20 40 q -30 10 -55 -5 t -20 -40z" />
            <path d="M-40 55 q 15 -8 30 0 t 5 25 q -20 6 -35 -5z" />
          </g>
          {/* .bd pin */}
          <g transform="translate(30 -20)">
            <circle r="4" fill="var(--brand-green)" className="dom-pulse" />
            <circle r="4" fill="none" stroke="var(--brand-green)" className="dom-ring" />
          </g>
        </g>

        {/* Secure key ribbon (below globe) */}
        <g transform="translate(90 285)">
          <rect x="0" y="0" width="240" height="30" rx="15" fill="var(--color-card)" stroke="var(--color-border)" />
          <g transform="translate(14 15)">
            <circle r="6" fill="none" stroke="var(--brand-green)" strokeWidth="1.5" />
            <path d="M6 0 L20 0 M16 0 L16 5 M20 0 L20 6" stroke="var(--brand-green)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </g>
          <text x="46" y="19" fontSize="11" fontWeight="600" fill="var(--color-foreground)" fontFamily="Inter, system-ui, sans-serif">
            SSL + WHOIS Privacy Included
          </text>
        </g>

        {/* Magnifying glass — animated sweep */}
        <g className="dom-mag">
          <g transform="translate(300 90)">
            <circle r="46" fill="var(--color-background)" stroke="var(--brand-orange)" strokeWidth="2.5" />
            <circle r="46" fill="none" stroke="var(--brand-orange)" strokeWidth="1" opacity="0.25" />
            <line x1="33" y1="33" x2="70" y2="70" stroke="var(--brand-orange)" strokeWidth="6" strokeLinecap="round" />
            <line x1="33" y1="33" x2="70" y2="70" stroke="var(--color-card)" strokeWidth="1.5" strokeLinecap="round" />
            {/* domain text inside lens */}
            <text x="0" y="4" textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--brand-orange)" fontFamily="Inter, system-ui, sans-serif">
              .com.bd
            </text>
          </g>
        </g>

        {/* Isometric digital key floating near the globe */}
        <g className="dom-key" transform="translate(70 250)">
          {/* key ring */}
          <ellipse cx="0" cy="0" rx="18" ry="10" fill="var(--color-card)" stroke="var(--brand-green)" strokeWidth="2" />
          <ellipse cx="0" cy="0" rx="9" ry="5" fill="var(--color-background)" stroke="var(--brand-green)" strokeWidth="1.25" />
          {/* shaft (isometric slant) */}
          <path d="M 15 3 L 70 25 L 66 33 L 11 11 Z" fill="var(--brand-orange)" stroke="var(--color-border)" strokeWidth="1" />
          {/* teeth */}
          <path d="M 55 20 L 55 30 L 60 32 L 60 22 Z" fill="var(--brand-orange)" stroke="var(--color-border)" strokeWidth="1" />
          <path d="M 45 16 L 45 24 L 50 26 L 50 18 Z" fill="var(--brand-orange)" stroke="var(--color-border)" strokeWidth="1" />
          {/* highlight dot */}
          <circle cx="0" cy="-1" r="1.5" fill="var(--brand-green)" className="dom-pulse" />
        </g>
      </svg>


      <style>{`
        .dom-globe { animation: dom-spin 24s linear infinite; transform-box: fill-box; transform-origin: center; }
        @keyframes dom-spin { to { transform: rotate(360deg) } }
        .dom-mag { transform-box: fill-box; transform-origin: 300px 90px; animation: dom-mag 5s ease-in-out infinite; }
        @keyframes dom-mag {
          0%,100% { transform: translate(0,0) }
          25% { transform: translate(-30px, 20px) }
          50% { transform: translate(-90px, 40px) }
          75% { transform: translate(-40px, -10px) }
        }
        .dom-pulse { animation: dom-pulse 1.8s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
        @keyframes dom-pulse { 0%,100% { opacity: 1; transform: scale(1) } 50% { opacity: .6; transform: scale(1.4) } }
        .dom-ring { animation: dom-ring 1.8s ease-out infinite; transform-box: fill-box; transform-origin: center; }
        @keyframes dom-ring { 0% { opacity: .6; transform: scale(1) } 100% { opacity: 0; transform: scale(3.5) } }
        .dom-key { transform-box: fill-box; transform-origin: center; animation: dom-key-float 4.5s ease-in-out infinite; }
        @keyframes dom-key-float {
          0%,100% { transform: translateY(0) rotate(-2deg) }
          50% { transform: translateY(-6px) rotate(2deg) }
        }
        @media (prefers-reduced-motion: reduce) { .dom-globe, .dom-mag, .dom-pulse, .dom-ring, .dom-key { animation: none !important } }
      `}</style>

    </div>
  );
}
