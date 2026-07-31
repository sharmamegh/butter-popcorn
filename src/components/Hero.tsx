"use client";

import { useState } from "react";
import { PopcornCanvas } from "./PopcornCanvas";

export function Hero() {
  const [score, setScore] = useState(0);
  const [scoreKey, setScoreKey] = useState(0);

  const handlePop = (total: number) => {
    setScore(total);
    setScoreKey((k) => k + 1);
  };

  return (
    <section className="relative isolate min-h-[100svh] overflow-hidden bg-night">
      {/* Atmosphere — full-bleed visual plane */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_120%,rgba(180,83,9,0.35),transparent_55%),radial-gradient(ellipse_at_20%_10%,rgba(240,196,58,0.08),transparent_40%),radial-gradient(ellipse_at_80%_0%,rgba(255,243,209,0.05),transparent_35%)]" />
        <div className="heat-glow absolute bottom-[-18%] left-1/2 h-[42vh] w-[70vw] max-w-4xl rounded-full bg-[radial-gradient(circle,rgba(240,196,58,0.28),rgba(180,83,9,0.12),transparent_70%)] blur-3xl" />
        <div className="steam absolute bottom-[18%] left-[28%] h-24 w-16 rounded-full bg-[radial-gradient(circle,rgba(255,243,209,0.2),transparent_70%)] blur-xl" />
        <div
          className="steam absolute bottom-[22%] left-[58%] h-28 w-20 rounded-full bg-[radial-gradient(circle,rgba(255,243,209,0.16),transparent_70%)] blur-xl"
          style={{ animationDelay: "1.4s" }}
        />
        <div
          className="steam absolute bottom-[16%] left-[46%] h-20 w-14 rounded-full bg-[radial-gradient(circle,rgba(255,214,102,0.14),transparent_70%)] blur-lg"
          style={{ animationDelay: "2.6s" }}
        />
      </div>

      <PopcornCanvas onPop={handlePop} />

      <div className="pointer-events-none relative z-10 flex min-h-[100svh] flex-col">
        <header className="flex items-center justify-between px-6 pt-6 sm:px-10">
          <p className="font-display text-sm font-semibold tracking-[0.22em] text-cream/70 uppercase">
            Est. forever
          </p>
          <div
            key={scoreKey}
            className={`font-display text-sm tracking-wide text-butter ${score > 0 ? "animate-score" : ""}`}
            aria-live="polite"
          >
            {score > 0 ? `${score} popped` : "ready when you are"}
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-6 pb-28 pt-10 text-center sm:px-10">
          <p className="animate-brand font-display text-[clamp(3.25rem,12vw,8.5rem)] leading-[0.9] font-bold tracking-[0.04em] text-cream uppercase">
            Butter
            <span className="block bg-linear-to-b from-butter-hot to-butter bg-clip-text text-transparent">
              Popcorn
            </span>
          </p>

          <h1
            className="animate-rise mt-8 max-w-xl font-display text-[clamp(1.35rem,3.4vw,2.15rem)] font-semibold tracking-tight text-cream/95"
            style={{ animationDelay: "0.2s" }}
          >
            Hot. Buttery. Loud.
          </h1>

          <p
            className="animate-rise mt-4 max-w-md text-base leading-relaxed text-cream/65 sm:text-lg"
            style={{ animationDelay: "0.35s" }}
          >
            Click anywhere — kernels erupt, butter glows, the theater comes
            alive.
          </p>

          <div
            className="animate-rise pointer-events-auto mt-10 flex flex-wrap items-center justify-center gap-3"
            style={{ animationDelay: "0.5s" }}
          >
            <a
              href="#craft"
              className="inline-flex h-12 items-center justify-center bg-butter px-7 font-display text-sm font-bold tracking-[0.14em] text-night uppercase transition hover:bg-butter-hot focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-butter"
            >
              Taste the craft
            </a>
            <button
              type="button"
              className="inline-flex h-12 items-center justify-center border border-cream/25 px-7 font-display text-sm font-semibold tracking-[0.14em] text-cream/90 uppercase transition hover:border-butter/60 hover:text-butter focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-butter"
              onClick={() => {
                const canvas = document.querySelector("canvas");
                if (!canvas) return;
                const rect = canvas.getBoundingClientRect();
                canvas.dispatchEvent(
                  new PointerEvent("pointerdown", {
                    bubbles: true,
                    clientX: rect.left + rect.width * 0.5,
                    clientY: rect.top + rect.height * 0.72,
                  }),
                );
              }}
            >
              Pop a batch
            </button>
          </div>
        </div>

        <p className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 font-display text-[0.7rem] tracking-[0.28em] text-cream/35 uppercase">
          Tap the heat
        </p>
      </div>
    </section>
  );
}
