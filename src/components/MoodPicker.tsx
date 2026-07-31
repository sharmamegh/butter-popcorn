"use client";

import type { Mood } from "@/types/movie";
import { MOODS } from "@/types/movie";

export function MoodPicker({
  selected,
  onChange,
}: {
  selected: Mood[];
  onChange: (moods: Mood[]) => void;
}) {
  const isAny = selected.length === 0 || selected.includes("any");

  const toggle = (id: Mood) => {
    if (id === "any") {
      onChange(["any"]);
      return;
    }

    const withoutAny = selected.filter((m) => m !== "any");
    const next = withoutAny.includes(id)
      ? withoutAny.filter((m) => m !== id)
      : [...withoutAny, id];

    onChange(next.length === 0 ? ["any"] : next);
  };

  return (
    <div className="space-y-2">
      <span className="text-sm text-stone-400 block">What kind of movies?</span>
      <p className="text-xs text-stone-600">Pick as many as you like.</p>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Movie moods">
        {MOODS.map((mood) => {
          const active =
            mood.id === "any" ? isAny : !isAny && selected.includes(mood.id);

          return (
            <button
              key={mood.id}
              type="button"
              onClick={() => toggle(mood.id)}
              aria-pressed={active}
              className={`
                rounded-full px-3 py-1.5 text-sm border cursor-pointer transition-all
                ${
                  active
                    ? "border-butter-400 bg-butter-400/15 text-butter-200"
                    : "border-cinema-600 text-stone-500 hover:border-butter-500/40"
                }
              `}
            >
              {mood.emoji} {mood.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
