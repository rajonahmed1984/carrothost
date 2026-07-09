import { Link } from "@tanstack/react-router";
import { ArrowRight, Home, Globe, Server, Cpu, Database, HelpCircle } from "lucide-react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { Button } from "./ui/button";

export function NotFound() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-soft overflow-x-hidden">
      <Header />

      <main className="flex-1 flex flex-col items-center justify-center py-16 px-6 relative">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-brand-orange/5 blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] rounded-full bg-brand-green/5 blur-[100px] pointer-events-none" />

        <div className="w-full max-w-4xl mx-auto flex flex-col items-center text-center relative z-10">
          
          {/* Animated SVG Scene */}
          <div className="w-full max-w-[420px] h-[280px] mb-8 relative flex items-center justify-center">
            <svg
              viewBox="0 0 400 300"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full drop-shadow-elegant select-none"
            >
              {/* Definitions for gradients and shadows */}
              <defs>
                <linearGradient id="carrotGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--brand-orange)" />
                  <stop offset="100%" stopColor="oklch(0.65 0.22 55)" />
                </linearGradient>
                <linearGradient id="leafGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="var(--brand-green)" />
                  <stop offset="100%" stopColor="oklch(0.65 0.16 140)" />
                </linearGradient>
                <linearGradient id="serverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="oklch(0.24 0.015 240)" />
                  <stop offset="100%" stopColor="oklch(0.18 0.015 240)" />
                </linearGradient>
                <linearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--brand-orange)" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                </linearGradient>
                <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="8" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <style>{`
                @keyframes floatServer {
                  0%, 100% { transform: translateY(0px) rotate(0deg); }
                  50% { transform: translateY(-10px) rotate(1deg); }
                }
                @keyframes floatCarrot {
                  0%, 100% { transform: translateY(-8px) rotate(-3deg); }
                  50% { transform: translateY(8px) rotate(5deg); }
                }
                @keyframes pulsePort {
                  0%, 100% { opacity: 0.3; filter: drop-shadow(0 0 2px var(--brand-orange)); }
                  50% { opacity: 1; filter: drop-shadow(0 0 12px var(--brand-orange)); }
                }
                @keyframes drawCable {
                  0%, 100% { stroke-dashoffset: 0; }
                  50% { stroke-dashoffset: 15; }
                }
                @keyframes starBlink {
                  0%, 100% { opacity: 0.2; transform: scale(0.8); }
                  50% { opacity: 0.8; transform: scale(1.2); }
                }
                @keyframes floatDigit {
                  0%, 100% { transform: translateY(0px) scale(1); }
                  50% { transform: translateY(-6px) scale(1.03); }
                }
                .anim-server { animation: floatServer 6s ease-in-out infinite; transform-origin: center; }
                .anim-carrot { animation: floatCarrot 5s ease-in-out infinite; transform-origin: 290px 150px; }
                .anim-port { animation: pulsePort 2s infinite ease-in-out; }
                .anim-cable { stroke-dasharray: 8 4; animation: drawCable 4s linear infinite; }
                .anim-star { animation: starBlink 3s infinite ease-in-out; }
                .anim-digit { animation: floatDigit 4s ease-in-out infinite; }
              `}</style>

              {/* Grid Background Matrix */}
              <g opacity="0.15" stroke="currentColor" strokeWidth="1">
                <path d="M 20 0 L 20 300 M 60 0 L 60 300 M 100 0 L 100 300 M 140 0 L 140 300 M 180 0 L 180 300 M 220 0 L 220 300 M 260 0 L 260 300 M 300 0 L 300 300 M 340 0 L 340 300 M 380 0 L 380 300" />
                <path d="M 0 30 L 400 30 M 0 70 L 400 70 M 0 110 L 400 110 M 0 150 L 400 150 M 0 190 L 400 190 M 0 230 L 400 230 M 0 270 L 400 270" />
              </g>

              {/* Floating Stars */}
              <circle cx="45" cy="55" r="2.5" className="anim-star fill-current text-brand-orange/40" style={{ animationDelay: '0.2s' }} />
              <circle cx="340" cy="80" r="1.5" className="anim-star fill-current text-brand-green/40" style={{ animationDelay: '1.2s' }} />
              <circle cx="85" cy="220" r="2" className="anim-star fill-current text-brand-green/30" style={{ animationDelay: '0.7s' }} />
              <circle cx="310" cy="240" r="3" className="anim-star fill-current text-brand-orange/30" style={{ animationDelay: '1.7s' }} />

              {/* Giant Orbiting 404 Numbers behind server */}
              <text x="70" y="90" className="anim-digit font-sans fill-muted-foreground/15 font-black text-8xl" style={{ animationDelay: '0.5s' }}>4</text>
              <text x="180" y="70" className="anim-digit font-sans fill-muted-foreground/15 font-black text-8xl" style={{ animationDelay: '1s' }}>0</text>
              <text x="280" y="90" className="anim-digit font-sans fill-muted-foreground/15 font-black text-8xl" style={{ animationDelay: '1.5s' }}>4</text>

              {/* Main Server Cabinet Component */}
              <g className="anim-server">
                {/* Server Glow shadow */}
                <rect x="75" y="105" width="130" height="110" rx="16" fill="url(#glowGrad)" filter="url(#neonGlow)" opacity="0.4" />
                {/* Server Chassis */}
                <rect x="80" y="110" width="120" height="100" rx="14" fill="url(#serverGrad)" stroke="var(--border)" strokeWidth="2" className="dark:stroke-neutral-800" />
                
                {/* Server Front Details */}
                {/* Rack mount ears */}
                <rect x="76" y="125" width="4" height="15" rx="2" fill="oklch(0.5 0.01 240)" />
                <rect x="76" y="170" width="4" height="15" rx="2" fill="oklch(0.5 0.01 240)" />
                <rect x="200" y="125" width="4" height="15" rx="2" fill="oklch(0.5 0.01 240)" />
                <rect x="200" y="170" width="4" height="15" rx="2" fill="oklch(0.5 0.01 240)" />

                {/* Ventilation slots */}
                <line x1="95" y1="125" x2="145" y2="125" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.3" />
                <line x1="95" y1="133" x2="135" y2="133" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.3" />
                
                <line x1="95" y1="185" x2="145" y2="185" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.3" />
                <line x1="95" y1="193" x2="135" y2="193" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.3" />

                {/* Status Indicator Lights */}
                <circle cx="95" cy="155" r="4.5" fill="var(--brand-green)" className="animate-pulse" />
                <circle cx="110" cy="155" r="4.5" fill="var(--brand-orange)" opacity="0.8" />
                <circle cx="125" cy="155" r="4.5" fill="oklch(0.65 0.02 240)" opacity="0.5" />

                {/* Disconnected Glowing Ethernet Port */}
                <rect x="155" y="145" width="30" height="20" rx="4" fill="oklch(0.1 0.02 240)" stroke="var(--brand-orange)" strokeWidth="1.5" />
                <rect x="162" y="149" width="16" height="12" rx="2" fill="url(#carrotGrad)" className="anim-port" />
                
                {/* Small indicator inside the port */}
                <rect x="167" y="152" width="6" height="6" fill="white" opacity="0.8" />
              </g>

              {/* Cable connecting from Server port, floating out */}
              <g className="anim-server">
                {/* Wavy Cable path */}
                <path
                  d="M 170 160 C 170 210, 240 230, 260 170"
                  fill="none"
                  stroke="var(--brand-orange)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  className="anim-cable"
                />
              </g>

              {/* The Carrot Connector Plug (floating at the right end of the cable) */}
              <g className="anim-carrot">
                {/* Leaf stalks (green connector cap) */}
                <path d="M 252 165 C 248 155, 235 152, 238 142 C 241 132, 255 138, 253 148 C 255 135, 270 132, 268 145 C 267 155, 257 160, 257 165" fill="url(#leafGrad)" />
                <path d="M 262 162 C 265 150, 278 145, 278 135 C 278 125, 264 128, 262 140" fill="url(#leafGrad)" opacity="0.8" />
                
                {/* Green connector base collar */}
                <rect x="250" y="161" width="16" height="8" rx="2" fill="var(--brand-green)" stroke="oklch(0.45 0.12 150)" strokeWidth="1" />

                {/* Carrot Body (Orange Plug) */}
                <path
                  d="M 250 167 L 266 167 C 265 178, 268 190, 258 208 C 248 190, 251 178, 250 167 Z"
                  fill="url(#carrotGrad)"
                  stroke="oklch(0.55 0.18 47)"
                  strokeWidth="1"
                />

                {/* Carrot Details / ridges */}
                <line x1="253" y1="175" x2="257" y2="175" stroke="white" strokeWidth="1" opacity="0.4" />
                <line x1="259" y1="184" x2="263" y2="184" stroke="white" strokeWidth="1" opacity="0.4" />
                <line x1="255" y1="193" x2="260" y2="193" stroke="white" strokeWidth="1" opacity="0.4" />

                {/* Metal Pins (the plug contacts) */}
                <rect x="255" y="208" width="2" height="5" fill="oklch(0.85 0.1 80)" />
                <rect x="258" y="209" width="2" height="5" fill="oklch(0.85 0.1 80)" />
                <rect x="261" y="208" width="2" height="5" fill="oklch(0.85 0.1 80)" />
              </g>
            </svg>

            {/* Glowing neon warning tag */}
            <div className="absolute top-2 right-12 animate-bounce bg-brand-orange/10 border border-brand-orange/30 text-brand-orange text-[10px] font-bold tracking-widest uppercase py-1 px-2.5 rounded-full backdrop-blur-sm shadow-soft">
              Link Severed
            </div>
          </div>

          {/* Heading and error description */}
          <div className="space-y-4 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-orange/10 border border-brand-orange/20 px-3.5 py-1 text-xs font-bold text-brand-orange uppercase tracking-wider">
              Error Code 404
            </span>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground leading-tight">
              Oops! Connection <span className="text-gradient-brand">Uprooted</span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-lg mx-auto">
              We searched under every digital leaf, but this page seems to have withered away or was transplanted to another location.
            </p>
          </div>

          {/* Search bar simulation / navigation path */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="rounded-xl font-bold bg-primary hover:opacity-95 transition shadow-elegant hover:-translate-y-0.5 duration-200">
              <Link to="/">
                <Home className="h-4.5 w-4.5 mr-2" /> Go Back Home
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-xl font-bold border-border bg-card shadow-soft hover:bg-secondary/40 hover:-translate-y-0.5 duration-200">
              <a href="https://portal.carrothost.com/submitticket.php" target="_blank" rel="noopener noreferrer">
                <HelpCircle className="h-4.5 w-4.5 mr-2 text-brand-green" /> Contact Support
              </a>
            </Button>
          </div>

          {/* Quick Shortcuts Grid */}
          <div className="mt-16 w-full text-left">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest text-center mb-6">
              Productive Pathways
            </h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  icon: Globe,
                  title: "Shared Hosting",
                  desc: "LiteSpeed & NVMe Optimized",
                  to: "/hosting",
                },
                {
                  icon: Server,
                  title: "BDIX Cloud VPS",
                  desc: "Low Latency Dhaka VPS",
                  to: "/bdix-cloud-vps",
                },
                {
                  icon: Cpu,
                  title: "Xeon Cloud VPS",
                  desc: "High Compute Nodes",
                  to: "/xeon-cloud-vps",
                },
                {
                  icon: Database,
                  title: "Domain Portal",
                  desc: "Register & Manage Domains",
                  href: "https://portal.carrothost.com/cart.php?a=add&domain=register",
                },
              ].map((path) => {
                const CardInner = () => (
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl bg-brand-orange/10 flex items-center justify-center text-brand-orange shrink-0 group-hover:bg-gradient-brand group-hover:text-primary-foreground transition-all duration-300">
                      <path.icon className="h-5 w-5" strokeWidth={1.5} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-bold text-sm text-foreground flex items-center gap-1 group-hover:text-brand-orange transition-colors">
                        {path.title}
                        <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200" />
                      </h3>
                      <p className="text-xs text-muted-foreground leading-snug">{path.desc}</p>
                    </div>
                  </div>
                );

                if (path.to) {
                  return (
                    <Link
                      key={path.title}
                      to={path.to}
                      className="group p-5 rounded-2xl border border-border bg-card/60 backdrop-blur-sm shadow-soft hover:shadow-elegant hover:border-brand-orange/40 hover:-translate-y-0.5 transition-all duration-300"
                    >
                      <CardInner />
                    </Link>
                  );
                } else {
                  return (
                    <a
                      key={path.title}
                      href={path.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group p-5 rounded-2xl border border-border bg-card/60 backdrop-blur-sm shadow-soft hover:shadow-elegant hover:border-brand-orange/40 hover:-translate-y-0.5 transition-all duration-300"
                    >
                      <CardInner />
                    </a>
                  );
                }
              })}
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
