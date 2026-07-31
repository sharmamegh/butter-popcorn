"use client";

import { AmbientKernels } from "./AmbientKernels";

export function Hero() {
  return (
    <header className="relative isolate min-h-[100svh] overflow-hidden drive-in-sky">
      <div className="screen-glow pointer-events-none absolute inset-0" aria-hidden />
      <AmbientKernels density={32} />

      {/* Soft cinema screen ellipse — dominant visual plane */}
      <div
        className="pointer-events-none absolute inset-x-[-10%] top-[12%] mx-auto h-[55vh] max-h-[520px] rounded-[50%] bg-gradient-to-b from-white/55 via-butter-glow/40 to-transparent blur-[1px]"
        aria-hidden
      />

      {/* Oversized popcorn silhouette as brand visual */}
      <div
        className="pointer-events-none absolute right-[-8%] bottom-[-6%] w-[min(70vw,520px)] opacity-90 sm:right-[2%] sm:bottom-[-2%]"
        aria-hidden
      >
        <HeroPopcornArt />
      </div>

      <nav className="relative z-10 flex items-center justify-between px-5 py-6 sm:px-10">
        <span className="font-[family-name:var(--font-display)] text-lg font-extrabold tracking-tight text-ink">
          Butter Popcorn
        </span>
        <a
          href="#popper"
          className="text-sm font-semibold text-ink-soft transition hover:text-ink"
        >
          Start popping
        </a>
      </nav>

      <div className="relative z-10 mx-auto flex min-h-[calc(100svh-5.5rem)] max-w-6xl flex-col justify-center px-5 pb-24 pt-6 sm:px-10">
        <div className="max-w-2xl">
          <h1
            className="animate-hero-rise font-[family-name:var(--font-display)] text-[clamp(3.25rem,12vw,7.5rem)] leading-[0.9] font-extrabold tracking-[-0.04em] text-ink"
            style={{ animationDelay: "0.05s" }}
          >
            Butter
            <br />
            Popcorn
          </h1>
          <p
            className="animate-hero-rise mt-6 max-w-md text-xl leading-relaxed text-ink-soft sm:text-2xl"
            style={{ animationDelay: "0.18s" }}
          >
            Cinema in a kernel — golden, fluffy, and dripping with the good
            stuff.
          </p>
          <div
            className="animate-hero-rise mt-10 flex flex-wrap items-center gap-4"
            style={{ animationDelay: "0.3s" }}
          >
            <a
              href="#popper"
              className="inline-flex items-center justify-center rounded-xl bg-ink px-7 py-3.5 text-base font-semibold text-sky-low transition hover:bg-ink-soft"
            >
              Pop a batch
            </a>
            <a
              href="#flavors"
              className="inline-flex items-center justify-center rounded-xl border-2 border-ink/20 bg-white/30 px-7 py-3.5 text-base font-semibold text-ink backdrop-blur-sm transition hover:border-ink/40"
            >
              Meet the flavors
            </a>
          </div>
        </div>
      </div>

      {/* Bottom fade into next section */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-sky-low to-transparent"
        aria-hidden
      />
    </header>
  );
}

function HeroPopcornArt() {
  return (
    <svg viewBox="0 0 420 480" className="h-auto w-full" fill="none">
      <defs>
        <linearGradient id="tub" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c4283a" />
          <stop offset="100%" stopColor="#8b1e2d" />
        </linearGradient>
        <linearGradient id="butter" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffe08a" />
          <stop offset="100%" stopColor="#ffc933" />
        </linearGradient>
      </defs>

      {/* Tub */}
      <path
        d="M95 220 L325 220 L300 450 L120 450 Z"
        fill="url(#tub)"
      />
      <path
        d="M110 240 L310 240 L295 420 L125 420 Z"
        fill="#fff8e7"
        opacity="0.12"
      />
      <text
        x="210"
        y="340"
        textAnchor="middle"
        fill="#fff8e7"
        fontFamily="var(--font-display), sans-serif"
        fontWeight="800"
        fontSize="28"
        letterSpacing="2"
        opacity="0.9"
      >
        BUTTER
      </text>
      <text
        x="210"
        y="372"
        textAnchor="middle"
        fill="#ffc933"
        fontFamily="var(--font-display), sans-serif"
        fontWeight="700"
        fontSize="18"
        letterSpacing="4"
        opacity="0.95"
      >
        POPCORN
      </text>

      {/* Mound of popcorn */}
      <Pop blob="M150 210c20-40 60-55 90-40 25-35 70-30 85 5 30-10 55 20 45 50 25 15 20 50-5 60-10 30-50 40-80 25-25 20-65 15-85-10-30 5-55-20-50-45-15-20-15-40 0-45z" />
      <Kernel cx={180} cy={170} r={28} butter />
      <Kernel cx={230} cy={145} r={32} />
      <Kernel cx={275} cy={175} r={26} butter />
      <Kernel cx={205} cy={200} r={24} />
      <Kernel cx={255} cy={205} r={22} butter />
      <Kernel cx={160} cy={205} r={20} />
      <Kernel cx={300} cy={205} r={18} />
      <Kernel cx={240} cy={115} r={20} butter />
    </svg>
  );
}

function Pop({ blob }: { blob: string }) {
  return <path d={blob} fill="#fff4d6" opacity="0.85" />;
}

function Kernel({
  cx,
  cy,
  r,
  butter,
}: {
  cx: number;
  cy: number;
  r: number;
  butter?: boolean;
}) {
  return (
    <g transform={`translate(${cx} ${cy})`}>
      <ellipse
        cx={0}
        cy={0}
        rx={r}
        ry={r * 0.85}
        fill={butter ? "#fff3c4" : "#fff8e7"}
        stroke="#f0d9a0"
        strokeWidth="1.5"
      />
      <ellipse
        cx={-r * 0.15}
        cy={-r * 0.1}
        rx={r * 0.35}
        ry={r * 0.28}
        fill={butter ? "url(#butter)" : "#ffe08a"}
        opacity="0.7"
      />
    </g>
  );
}
