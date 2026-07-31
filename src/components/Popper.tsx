"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

type FlyingKernel = {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  spin: number;
  size: number;
  buttered: boolean;
};

type PanKernel = {
  id: number;
  x: number;
  y: number;
};

const BATCH_SIZE = 24;

function createBatch(startId: number): PanKernel[] {
  return Array.from({ length: BATCH_SIZE }, (_, i) => ({
    id: startId + i,
    x: 18 + (i % 8) * 8 + (i % 3) * 2,
    y: 42 + Math.floor(i / 8) * 10 + (i % 2) * 3,
  }));
}

export function Popper() {
  const [pan, setPan] = useState<PanKernel[]>(() => createBatch(0));
  const [flying, setFlying] = useState<FlyingKernel[]>([]);
  const [popped, setPopped] = useState(0);
  const [butterMode, setButterMode] = useState(true);
  const [heating, setHeating] = useState(false);
  const nextId = useRef(BATCH_SIZE);
  const audioCtx = useRef<AudioContext | null>(null);

  useEffect(() => {
    return () => {
      void audioCtx.current?.close();
    };
  }, []);

  const ensureAudio = useCallback(() => {
    if (!audioCtx.current) {
      audioCtx.current = new AudioContext();
    }
    return audioCtx.current;
  }, []);

  const playPop = useCallback(() => {
    try {
      const ctx = ensureAudio();
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(180 + Math.random() * 220, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);

      filter.type = "bandpass";
      filter.frequency.value = 900 + Math.random() * 600;
      filter.Q.value = 1.2;

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.18, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.16);
    } catch {
      // Audio may be blocked; visual pop still works.
    }
  }, [ensureAudio]);

  const panRef = useRef(pan);
  const butterRef = useRef(butterMode);

  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  useEffect(() => {
    butterRef.current = butterMode;
  }, [butterMode]);

  const popRandom = useCallback(() => {
    const current = panRef.current;
    if (current.length === 0) return;

    const idx = Math.floor(Math.random() * current.length);
    const kernel = current[idx];
    panRef.current = current.filter((k) => k.id !== kernel.id);
    setPan(panRef.current);

    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.4;
    const distance = 90 + Math.random() * 140;
    const flyingKernel: FlyingKernel = {
      id: kernel.id,
      x: kernel.x,
      y: kernel.y,
      dx: Math.cos(angle) * distance,
      dy: Math.sin(angle) * distance - 40,
      spin: (Math.random() > 0.5 ? 1 : -1) * (120 + Math.random() * 200),
      size: 22 + Math.random() * 14,
      buttered: butterRef.current,
    };

    playPop();
    setHeating(true);
    setFlying((prev) => [...prev, flyingKernel]);
    setPopped((n) => n + 1);
    window.setTimeout(() => setHeating(false), 280);
  }, [playPop]);

  const refill = useCallback(() => {
    const start = nextId.current;
    nextId.current += BATCH_SIZE;
    const batch = createBatch(start);
    panRef.current = batch;
    setPan(batch);
    setFlying([]);
  }, []);

  const remaining = pan.length;
  const progress = Math.min(100, (popped / (popped + remaining || 1)) * 100);

  return (
    <section
      id="popper"
      className="relative mx-auto w-full max-w-5xl px-5 py-20 sm:px-8 sm:py-28"
    >
      <div className="mb-10 max-w-xl">
        <p className="font-[family-name:var(--font-display)] text-sm font-bold tracking-[0.2em] text-butter-deep uppercase">
          The Popper
        </p>
        <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
          Heat. Shake. Pop.
        </h2>
        <p className="mt-3 text-lg text-ink-soft">
          Tap the pan to set kernels free. Butter mode optional — but strongly
          encouraged.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
        <div className="relative">
          <div
            className="relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-gradient-to-b from-[#3d2a18] via-[#2a1c10] to-[#1a120c] shadow-[0_40px_80px_-30px_rgba(21,34,56,0.55)]"
            role="application"
            aria-label="Interactive popcorn popper. Click the pan to pop kernels."
          >
            {/* Steam */}
            <div className="pointer-events-none absolute inset-x-[30%] top-[18%] flex justify-center gap-6" aria-hidden>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="animate-steam h-10 w-3 rounded-full bg-white/25 blur-[2px]"
                  style={{ animationDelay: `${i * 0.45}s` }}
                />
              ))}
            </div>

            {/* Burner glow */}
            <div
              className="pointer-events-none absolute bottom-[12%] left-1/2 h-8 w-40 -translate-x-1/2 rounded-full bg-[#ff6b2c]/50 blur-xl animate-sizzle"
              aria-hidden
            />

            {/* Pan */}
            <button
              type="button"
              onClick={popRandom}
              disabled={remaining === 0}
              className={`absolute bottom-[16%] left-1/2 w-[72%] max-w-md -translate-x-1/2 cursor-pointer border-0 bg-transparent p-0 disabled:cursor-default ${
                heating ? "animate-shake-pan" : ""
              }`}
              aria-label={
                remaining > 0
                  ? `Pop a kernel. ${remaining} left in the pan.`
                  : "Pan is empty. Refill to keep popping."
              }
            >
              <svg viewBox="0 0 320 160" className="h-auto w-full drop-shadow-2xl">
                <ellipse cx="160" cy="118" rx="130" ry="18" fill="#1a120c" opacity="0.45" />
                <path
                  d="M30 70c0-18 58-32 130-32s130 14 130 32v28c0 18-58 32-130 32S30 116 30 98V70z"
                  fill="#4a5568"
                />
                <path
                  d="M40 72c0-14 54-26 120-26s120 12 120 26v22c0 14-54 26-120 26S40 108 40 94V72z"
                  fill="#2d3748"
                />
                <ellipse cx="160" cy="72" rx="120" ry="26" fill="#1a202c" />
                <ellipse cx="160" cy="70" rx="108" ry="20" fill="#718096" opacity="0.35" />
                <rect x="270" y="62" width="48" height="14" rx="6" fill="#4a5568" />
                <rect x="310" y="58" width="10" height="22" rx="4" fill="#2d3748" />
              </svg>

              {/* Kernels in pan */}
              <div className="pointer-events-none absolute inset-0">
                {pan.map((k) => (
                  <span
                    key={k.id}
                    className="absolute block transition-transform duration-150"
                    style={{
                      left: `${k.x}%`,
                      top: `${k.y}%`,
                      width: 14,
                      height: 18,
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    <RawKernel />
                  </span>
                ))}
              </div>
            </button>

            {/* Flying popped kernels */}
            <div className="pointer-events-none absolute inset-0 overflow-visible">
              {flying.map((k) => (
                <span
                  key={k.id}
                  className="pop-kernel absolute"
                  style={
                    {
                      left: `${k.x}%`,
                      top: `${k.y}%`,
                      width: k.size,
                      height: k.size * 0.9,
                      "--dx": `${k.dx}px`,
                      "--dy": `${k.dy}px`,
                      "--spin": `${k.spin}deg`,
                    } as CSSProperties
                  }
                >
                  <PoppedKernel buttered={k.buttered} />
                  {k.buttered && (
                    <span
                      className="animate-butter-drip absolute left-1/2 top-0 h-4 w-2 -translate-x-1/2 rounded-full bg-butter opacity-80"
                      aria-hidden
                    />
                  )}
                </span>
              ))}
            </div>

            {remaining === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#1a120c]/55 backdrop-blur-[2px]">
                <button
                  type="button"
                  onClick={refill}
                  className="rounded-xl bg-butter px-6 py-3 font-[family-name:var(--font-display)] text-lg font-bold text-ink transition hover:bg-butter-glow"
                >
                  Pour another batch
                </button>
              </div>
            )}
          </div>
        </div>

        <aside className="flex flex-col gap-6">
          <div>
            <p className="text-sm font-semibold tracking-wide text-ink-soft uppercase">
              Kernels liberated
            </p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-6xl font-extrabold tabular-nums tracking-tight text-ink">
              {popped}
            </p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-salt">
              <div
                className="h-full rounded-full bg-butter transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-ink-soft">
              {remaining} still waiting in the pan
            </p>
          </div>

          <label className="flex cursor-pointer items-center gap-3 select-none">
            <button
              type="button"
              role="switch"
              aria-checked={butterMode}
              onClick={() => setButterMode((v) => !v)}
              className={`relative h-8 w-14 rounded-full transition-colors ${
                butterMode ? "bg-butter" : "bg-salt"
              }`}
            >
              <span
                className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-ink transition-transform ${
                  butterMode ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
            <span className="font-semibold text-ink">
              Butter drizzle {butterMode ? "on" : "off"}
            </span>
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={popRandom}
              disabled={remaining === 0}
              className="rounded-xl bg-ink px-5 py-3 font-semibold text-sky-low transition hover:bg-ink-soft disabled:opacity-40"
            >
              Pop one
            </button>
            <button
              type="button"
              onClick={() => {
                const n = Math.min(5, remaining);
                for (let i = 0; i < n; i++) {
                  window.setTimeout(popRandom, i * 90);
                }
              }}
              disabled={remaining === 0}
              className="rounded-xl border-2 border-ink/15 bg-transparent px-5 py-3 font-semibold text-ink transition hover:border-ink/40 disabled:opacity-40"
            >
              Burst ×5
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}

function RawKernel() {
  return (
    <svg viewBox="0 0 24 28" className="h-full w-full drop-shadow">
      <ellipse cx="12" cy="16" rx="7" ry="10" fill="#c4a35a" />
      <ellipse cx="12" cy="14" rx="5" ry="7" fill="#d4b86a" />
      <ellipse cx="10" cy="12" rx="2" ry="2.5" fill="#8b6914" opacity="0.4" />
    </svg>
  );
}

function PoppedKernel({ buttered }: { buttered: boolean }) {
  return (
    <svg viewBox="0 0 32 28" className="h-full w-full drop-shadow-md">
      <path
        d="M16 4c3 0 5 2 6 4 2-1 5 0 6 3 2 1 3 4 2 6 2 2 1 5-1 7-1 3-4 4-6 4-1 2-4 3-7 2-3 1-6 0-7-3-3 0-5-3-4-6-2-2-1-5 1-7 0-3 3-5 6-5 1-2 3-5 4-5z"
        fill={buttered ? "#fff3c4" : "#fff8e7"}
        stroke="#f0d9a0"
        strokeWidth="0.8"
      />
      <ellipse
        cx="14"
        cy="14"
        rx="3.5"
        ry="2.8"
        fill={buttered ? "#ffc933" : "#ffe08a"}
        opacity="0.65"
      />
    </svg>
  );
}
