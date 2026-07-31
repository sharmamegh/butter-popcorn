"use client";

import { motion } from "framer-motion";
import type { Mood } from "@/data/movies";
import { MOODS } from "@/data/movies";

export function MoodSelector({
  selected,
  onChange,
}: {
  selected: Mood;
  onChange: (mood: Mood) => void;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {MOODS.map((mood) => {
        const isActive = selected === mood.id;
        return (
          <button
            key={mood.id}
            type="button"
            onClick={() => onChange(mood.id)}
            className={`
              rounded-full px-4 py-2 text-sm font-medium transition-all duration-200
              border cursor-pointer
              ${
                isActive
                  ? "bg-butter-400/20 border-butter-400 text-butter-200 scale-105"
                  : "bg-cinema-700/60 border-cinema-600 text-stone-400 hover:border-butter-500/40 hover:text-stone-200"
              }
            `}
          >
            <span className="mr-1.5">{mood.emoji}</span>
            {mood.label}
          </button>
        );
      })}
    </div>
  );
}

export function MoodBadge({ mood }: { mood: Mood }) {
  const found = MOODS.find((m) => m.id === mood);
  if (!found || mood === "any") return null;

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="inline-flex items-center gap-1 rounded-full bg-butter-400/15 border border-butter-400/30 px-3 py-1 text-xs text-butter-300"
    >
      {found.emoji} {found.label}
    </motion.span>
  );
}
