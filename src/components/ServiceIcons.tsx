// Minimal animated SVG icons for the four service cards.
// Animations trigger gently on hover of the nearest `.group` ancestor.

const baseProps = {
  width: 28,
  height: 28,
  viewBox: "0 0 32 32",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

// Spinning globe (Domain)
export function DomainIcon() {
  return (
    <>
      <svg {...baseProps} className="svc-icon svc-globe">
        <g className="svc-globe-spin">
          <circle cx="16" cy="16" r="11" />
          <ellipse cx="16" cy="16" rx="5" ry="11" />
          <path d="M5 16h22" />
          <path d="M6.5 10.5h19" />
          <path d="M6.5 21.5h19" />
        </g>
        <circle cx="16" cy="16" r="1.4" fill="currentColor" stroke="none" className="svc-globe-dot" />
      </svg>
      <ScopedStyles />
    </>
  );
}

// Pulsing server lights (Shared Hosting)
export function HostingIcon() {
  return (
    <>
      <svg {...baseProps} className="svc-icon svc-server">
        <rect x="5" y="6" width="22" height="8" rx="2" />
        <rect x="5" y="18" width="22" height="8" rx="2" />
        <path d="M11 10h11" />
        <path d="M11 22h11" />
        <circle cx="8.5" cy="10" r="1" fill="currentColor" stroke="none" className="svc-led svc-led-1" />
        <circle cx="8.5" cy="22" r="1" fill="currentColor" stroke="none" className="svc-led svc-led-2" />
      </svg>
      <ScopedStyles />
    </>
  );
}

// BDIX map pin with radar ping (BDIX VPS)
export function BdixIcon() {
  return (
    <>
      <svg {...baseProps} className="svc-icon svc-pin">
        <g className="svc-pin-drop">
          <path d="M16 28c0 0 8-8.5 8-15a8 8 0 1 0-16 0c0 6.5 8 15 8 15z" />
          <circle cx="16" cy="13" r="3" />
        </g>
        <circle cx="16" cy="28" r="2" className="svc-pin-ping" fill="none" />
      </svg>
      <ScopedStyles />
    </>
  );
}

// Cloud with rising data (Cloud VPS)
export function CloudIcon() {
  return (
    <>
      <svg {...baseProps} className="svc-icon svc-cloud">
        <path
          d="M9 22a5 5 0 0 1 .6-9.96A7 7 0 0 1 23 13.5a4.5 4.5 0 0 1 0 8.5z"
          className="svc-cloud-body"
        />
        <path d="M12 26v2" className="svc-cloud-drop svc-cloud-drop-1" />
        <path d="M16 27v2" className="svc-cloud-drop svc-cloud-drop-2" />
        <path d="M20 26v2" className="svc-cloud-drop svc-cloud-drop-3" />
      </svg>
      <ScopedStyles />
    </>
  );
}

function ScopedStyles() {
  return (
    <style>{`
      .svc-icon { overflow: visible; }
      .svc-icon g, .svc-icon path, .svc-icon circle, .svc-icon rect, .svc-icon ellipse {
        transform-box: fill-box; transform-origin: center;
      }

      /* Globe: slow spin on hover */
      .svc-globe-spin { transform-origin: 16px 16px; transition: transform .3s ease; }
      .group:hover .svc-globe-spin { animation: svc-spin 6s linear infinite; }
      @keyframes svc-spin { to { transform: rotate(360deg); } }
      .svc-globe-dot { opacity: .8; }
      .group:hover .svc-globe-dot { animation: svc-blink 1.4s ease-in-out infinite; }

      /* Server LEDs: gentle pulse (subtle even at rest, stronger on hover) */
      .svc-led { opacity: .55; animation: svc-led 2.4s ease-in-out infinite; }
      .svc-led-2 { animation-delay: 1.2s; }
      .group:hover .svc-led { animation-duration: 1.1s; }
      @keyframes svc-led { 0%,100% { opacity: .35 } 50% { opacity: 1 } }

      /* Pin: gentle drop + radar ring on hover */
      .svc-pin-drop { transition: transform .35s cubic-bezier(.2,.7,.2,1); }
      .group:hover .svc-pin-drop { animation: svc-drop 1.6s ease-in-out infinite; }
      @keyframes svc-drop { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-2px) } }
      .svc-pin-ping { opacity: 0; stroke: currentColor; }
      .group:hover .svc-pin-ping { animation: svc-ping 1.6s ease-out infinite; }
      @keyframes svc-ping {
        0% { opacity: .6; transform: scale(.4); }
        100% { opacity: 0; transform: scale(2.2); }
      }

      /* Cloud: subtle float + rising data dashes on hover */
      .svc-cloud-body { transition: transform .3s ease; }
      .group:hover .svc-cloud-body { animation: svc-float 3s ease-in-out infinite; }
      @keyframes svc-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-1.5px) } }
      .svc-cloud-drop { opacity: 0; }
      .group:hover .svc-cloud-drop { animation: svc-rain 1.6s ease-in-out infinite; }
      .group:hover .svc-cloud-drop-2 { animation-delay: .25s; }
      .group:hover .svc-cloud-drop-3 { animation-delay: .5s; }
      @keyframes svc-rain {
        0%   { opacity: 0; transform: translateY(-4px); }
        30%  { opacity: 1; }
        100% { opacity: 0; transform: translateY(4px); }
      }
      @keyframes svc-blink { 0%,100% { opacity: 1 } 50% { opacity: .3 } }

      @media (prefers-reduced-motion: reduce) {
        .svc-icon *, .group:hover .svc-icon * { animation: none !important; transition: none !important; opacity: 1 !important; }
      }
    `}</style>
  );
}
