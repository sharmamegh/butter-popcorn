"use client";

import type { Mood } from "@/types/movie";
import { MOODS } from "@/types/movie";

export function MoodPicker({
  selected,
  onChange,
}: {
  selected: Mood;
  onChange: (mood: Mood) => void;
}) {
  return (
    <div className="space-y-2">
      <span className="text-sm text-stone-400 block">What kind of movies?</span>
      <div className="flex flex-wrap gap-2">
        {MOODS.map((mood) => (
          <button
            key={mood.id}
            type="button"
            onClick={() => onChange(mood.id)}
            className={`
              rounded-full px-3 py-1.5 text-sm border cursor-pointer transition-all
              ${
                selected === mood.id
                  ? "border-butter-400 bg-butter-400/15 text-butter-200"
                  : "border-cinema-600 text-stone-500 hover:border-butter-500/40"
              }
            `}
          >
            {mood.emoji} {mood.label}
          </button>
        ))}
      </div>
    </div>
  );
}
