"use client";

import { useState, type ReactNode } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import type { Movie } from "@/types/movie";
import {
  MovieDetailSheet,
  MoviePickCard,
  MoviePosterTile,
} from "./MoviePickCard";

function SortableRankedCard({
  movie,
  rank,
  onRemove,
  disabled,
}: {
  movie: Movie;
  rank: number;
  onRemove: () => void;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: movie.id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-1.5">
      <button
        type="button"
        className="touch-none px-1 text-stone-600 hover:text-butter-400 cursor-grab active:cursor-grabbing"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        ⠿
      </button>
      <div className="min-w-0 flex-1">
        <MoviePickCard
          movie={movie}
          rank={rank}
          onClick={onRemove}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

export function MovieRanker({
  movies,
  rankings,
  onChange,
  disabled,
  action,
}: {
  movies: Movie[];
  rankings: string[];
  onChange: (rankings: string[]) => void;
  disabled?: boolean;
  action?: ReactNode;
}) {
  const [detailId, setDetailId] = useState<string | null>(null);

  const unranked = movies.filter((m) => !rankings.includes(m.id));
  const ranked = rankings
    .map((id) => movies.find((m) => m.id === id))
    .filter((m): m is Movie => !!m);
  const detailMovie = detailId
    ? movies.find((m) => m.id === detailId) ?? null
    : null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const addMovie = (id: string) => {
    if (disabled || rankings.includes(id)) return;
    onChange([...rankings, id]);
    setDetailId(null);
  };

  const removeMovie = (id: string) => {
    if (disabled) return;
    onChange(rankings.filter((r) => r !== id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = rankings.indexOf(String(active.id));
    const newIndex = rankings.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    onChange(arrayMove(rankings, oldIndex, newIndex));
  };

  const nextRank = rankings.length + 1;
  const hasPicks = rankings.length > 0;
  const allRanked = rankings.length === movies.length;

  return (
    <div className="w-full space-y-5">
      <div className="mx-auto max-w-lg text-center">
        <p className="mb-1 text-sm uppercase tracking-[0.25em] text-butter-500">
          Your list
        </p>
        <h2 className="text-2xl font-bold text-stone-100">
          {hasPicks
            ? allRanked
              ? "Looking good. Lock it in when you're ready."
              : "Happy with your top picks? Lock them in anytime."
            : "What are you most in the mood for?"}
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          {hasPicks
            ? `${rankings.length} favorite${rankings.length === 1 ? "" : "s"}${
                ranked.length > 0 ? " · drag to reorder" : ""
              }`
            : `Pick a few favorites from ${movies.length}`}
        </p>
      </div>

      {ranked.length > 0 && (
        <div className="mx-auto w-full max-w-lg space-y-2">
          <p className="px-1 text-xs uppercase tracking-wider text-stone-500">
            Your favorites
          </p>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={ranked.map((m) => m.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1.5">
                {ranked.map((movie, index) => (
                  <SortableRankedCard
                    key={movie.id}
                    movie={movie}
                    rank={index + 1}
                    onRemove={() => removeMovie(movie.id)}
                    disabled={disabled}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {action}

      {unranked.length > 0 && (
        <div className="space-y-3">
          <p className="px-1 text-xs uppercase tracking-wider text-stone-500">
            {ranked.length === 0 ? "Your options" : "Also on the table"}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {unranked.map((movie, i) => (
              <motion.div
                key={movie.id}
                className="min-w-0 w-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: Math.min(i * 0.04, 0.24) }}
              >
                <MoviePosterTile
                  movie={movie}
                  onOpen={() => setDetailId(movie.id)}
                  disabled={disabled}
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {detailMovie && (
        <MovieDetailSheet
          movie={detailMovie}
          nextRank={nextRank}
          onPick={() => addMovie(detailMovie.id)}
          onClose={() => setDetailId(null)}
          disabled={disabled}
        />
      )}
    </div>
  );
}

export function WaitingForOthers({
  names,
  action,
}: {
  names: string[];
  action?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4 py-12 text-center"
    >
      <div className="animate-pulse text-5xl">🍿</div>
      <h2 className="text-2xl font-bold text-stone-100">You're all set</h2>
      <p className="text-stone-400">Waiting on {names.join(", ")}.</p>
      {action}
    </motion.div>
  );
}
