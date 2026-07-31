"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Movie } from "@/data/movies";
import { MoodBadge } from "./MoodSelector";

export function MovieCard({ movie }: { movie: Movie | null }) {
  return (
    <AnimatePresence mode="wait">
      {movie ? (
        <motion.article
          key={movie.title}
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="popcorn-shadow relative w-full max-w-lg rounded-2xl border border-butter-400/20 bg-cinema-800/90 backdrop-blur-sm p-8 text-center"
        >
          <motion.div
            className="text-6xl mb-4"
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }}
          >
            {movie.emoji}
          </motion.div>

          <p className="text-xs uppercase tracking-[0.25em] text-butter-500 mb-2">
            Tonight&apos;s Pick
          </p>

          <h2
            className="text-3xl sm:text-4xl font-bold text-butter-100 mb-1"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {movie.title}
          </h2>

          <p className="text-stone-400 text-sm mb-4">
            {movie.year} · {movie.director} · {movie.runtime}
          </p>

          <p className="text-lg text-stone-300 italic mb-6 leading-relaxed">
            &ldquo;{movie.tagline}&rdquo;
          </p>

          <div className="flex flex-wrap justify-center gap-2">
            {movie.mood.map((m) => (
              <MoodBadge key={m} mood={m} />
            ))}
          </div>
        </motion.article>
      ) : (
        <motion.div
          key="placeholder"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="w-full max-w-lg rounded-2xl border border-dashed border-cinema-600 bg-cinema-800/40 p-12 text-center"
        >
          <div className="text-5xl mb-4 float">🍿</div>
          <p className="text-stone-500 text-lg">
            Hit the button and let the popcorn decide your fate.
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
