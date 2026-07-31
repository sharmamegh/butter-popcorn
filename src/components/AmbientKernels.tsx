"use client";

import { useMemo, type CSSProperties } from "react";

type Kernel = {
  id: number;
  left: number;
  top: number;
  size: number;
  dur: number;
  delay: number;
  rot: number;
  popped: boolean;
};

function makeKernels(count: number): Kernel[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: 4 + ((i * 37) % 92),
    top: 8 + ((i * 53) % 78),
    size: 10 + (i % 5) * 4,
    dur: 3.2 + (i % 6) * 0.55,
    delay: (i % 8) * -0.4,
    rot: (i * 23) % 360,
    popped: i % 3 !== 0,
  }));
}

export function AmbientKernels({ density = 28 }: { density?: number }) {
  const kernels = useMemo(() => makeKernels(density), [density]);

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      {kernels.map((k) => (
        <span
          key={k.id}
          className="animate-float-kernel absolute block"
          style={
            {
              left: `${k.left}%`,
              top: `${k.top}%`,
              width: k.size,
              height: k.size * (k.popped ? 0.85 : 1.15),
              "--dur": `${k.dur}s`,
              "--delay": `${k.delay}s`,
              "--rot": `${k.rot}deg`,
              opacity: 0.22 + (k.id % 5) * 0.08,
            } as CSSProperties
          }
        >
          {k.popped ? <PoppedSvg /> : <RawSvg />}
        </span>
      ))}
    </div>
  );
}

function RawSvg() {
  return (
    <svg viewBox="0 0 24 28" className="h-full w-full" fill="none">
      <ellipse cx="12" cy="16" rx="7" ry="10" fill="#c4a35a" />
      <ellipse cx="12" cy="14" rx="5" ry="7" fill="#d4b86a" />
      <ellipse cx="10" cy="12" rx="2" ry="2.5" fill="#8b6914" opacity="0.35" />
    </svg>
  );
}

function PoppedSvg() {
  return (
    <svg viewBox="0 0 32 28" className="h-full w-full" fill="none">
      <path
        d="M16 4c3 0 5 2 6 4 2-1 5 0 6 3 2 1 3 4 2 6 2 2 1 5-1 7-1 3-4 4-6 4-1 2-4 3-7 2-3 1-6 0-7-3-3 0-5-3-4-6-2-2-1-5 1-7 0-3 3-5 6-5 1-2 3-5 4-5z"
        fill="#fff8e7"
        stroke="#f0d9a0"
        strokeWidth="0.8"
      />
      <ellipse cx="14" cy="14" rx="3" ry="2.5" fill="#ffe08a" opacity="0.55" />
    </svg>
  );
}
