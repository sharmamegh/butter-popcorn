import Link from "next/link";

/** Compact brand that always leads home — escape hatch from room flows. */
export function BrandMark({
  href = "/",
  size = "compact",
}: {
  href?: string;
  size?: "compact" | "hero";
}) {
  const isHero = size === "hero";

  return (
    <Link
      href={href}
      className="group block text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-butter-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-cinema-900 rounded-lg"
    >
      <p
        className={`uppercase tracking-[0.35em] text-butter-600 ${
          isHero ? "mb-3 text-xs" : "mb-1.5 text-[10px]"
        }`}
      >
        Watch together
      </p>
      <span
        className={`font-bold shimmer-text transition-opacity group-hover:opacity-90 ${
          isHero ? "text-4xl sm:text-6xl" : "text-xl sm:text-2xl"
        }`}
        style={{ fontFamily: "var(--font-display)" }}
      >
        Butter Popcorn
      </span>
    </Link>
  );
}
