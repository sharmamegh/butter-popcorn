"use client";

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
import { MoviePickCard } from "./MoviePickCard";

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
    <div ref={setNodeRef} style={style} className="flex items-center gap-2">
      <button
        type="button"
        className="text-stone-600 hover:text-butter-400 cursor-grab active:cursor-grabbing px-1 touch-none"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        ⠿
      </button>
      <div className="flex-1">
        <MoviePickCard
          movie={movie}
          rank={rank}
          onClick={onRemove}
          disabled={disabled}
          compact
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
}: {
  movies: Movie[];
  rankings: string[];
  onChange: (rankings: string[]) => void;
  disabled?: boolean;
}) {
  const unranked = movies.filter((m) => !rankings.includes(m.id));
  const ranked = rankings
    .map((id) => movies.find((m) => m.id === id))
    .filter((m): m is Movie => !!m);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const addMovie = (id: string) => {
    if (disabled || rankings.includes(id)) return;
    onChange([...rankings, id]);
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
  const done = rankings.length === movies.length;

  return (
    <div className="w-full max-w-lg space-y-6">
      <div className="text-center">
        <p className="text-sm uppercase tracking-[0.25em] text-butter-500 mb-1">
          Your picks
        </p>
        <h2 className="text-2xl font-bold text-stone-100">
          {done ? "All ranked! Ready to submit." : `Tap your #${nextRank} pick`}
        </h2>
        <p className="text-stone-500 mt-1">
          Drag to reorder · {rankings.length}/{movies.length} ranked
        </p>
      </div>

      {ranked.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wider text-stone-500 px-1">
            Your ranking
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
              {ranked.map((movie, index) => (
                <SortableRankedCard
                  key={movie.id}
                  movie={movie}
                  rank={index + 1}
                  onRemove={() => removeMovie(movie.id)}
                  disabled={disabled}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}

      {unranked.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wider text-stone-500 px-1">
            {ranked.length === 0 ? "Tonight's options" : "Still to rank"}
          </p>
          <div className="grid gap-2">
            {unranked.map((movie) => (
              <MoviePickCard
                key={movie.id}
                movie={movie}
                onClick={() => addMovie(movie.id)}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function WaitingForOthers({ names }: { names: string[] }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center space-y-4 py-12"
    >
      <div className="text-5xl animate-pulse">🍿</div>
      <h2 className="text-2xl font-bold text-stone-100">Rankings locked in!</h2>
      <p className="text-stone-400">
        Waiting for {names.join(", ")} to finish...
      </p>
    </motion.div>
  );
}
