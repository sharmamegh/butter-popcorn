const FLAVORS = [
  {
    name: "Classic Butter",
    note: "Cinema gold. Salt crystals catching the light.",
    accent: "#ffc933",
  },
  {
    name: "Caramel Crunch",
    note: "Slow-cooked sugar lacquer. Sticky in the best way.",
    accent: "#c4783a",
  },
  {
    name: "Midnight Salt",
    note: "Charcoal kettle finish with a clean ocean bite.",
    accent: "#2a3d5c",
  },
] as const;

export function Flavors() {
  return (
    <section
      id="flavors"
      className="relative mx-auto w-full max-w-5xl px-5 py-20 sm:px-8 sm:py-28"
    >
      <div className="max-w-xl">
        <p className="font-[family-name:var(--font-display)] text-sm font-bold tracking-[0.2em] text-butter-deep uppercase">
          Flavors
        </p>
        <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
          Three moods. One ritual.
        </h2>
        <p className="mt-3 text-lg text-ink-soft">
          Pick a vibe for tonight&apos;s screening. Every batch starts with the
          same airy kernel.
        </p>
      </div>

      <ul className="mt-14 space-y-0 divide-y divide-ink/10">
        {FLAVORS.map((flavor) => (
          <li
            key={flavor.name}
            className="flex flex-col gap-2 py-8 sm:flex-row sm:items-baseline sm:justify-between sm:gap-10"
          >
            <div className="flex items-baseline gap-4">
              <span
                className="mt-2 inline-block h-3 w-3 shrink-0 rounded-full"
                style={{ background: flavor.accent }}
                aria-hidden
              />
              <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                {flavor.name}
              </h3>
            </div>
            <p className="max-w-md pl-7 text-base leading-relaxed text-ink-soft sm:pl-0 sm:text-right">
              {flavor.note}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
