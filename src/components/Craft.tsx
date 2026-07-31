export function Craft() {
  return (
    <section
      id="craft"
      className="relative overflow-hidden border-t border-cream/10 bg-night-lift"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        aria-hidden="true"
        style={{
          backgroundImage:
            "radial-gradient(circle at 10% 20%, rgba(240,196,58,0.08), transparent 30%), radial-gradient(circle at 90% 80%, rgba(180,83,9,0.12), transparent 35%)",
        }}
      />

      <div className="relative mx-auto grid max-w-6xl gap-14 px-6 py-24 sm:px-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:gap-20 lg:py-32">
        <div>
          <p className="font-display text-xs font-semibold tracking-[0.28em] text-butter uppercase">
            The craft
          </p>
          <h2 className="mt-5 font-display text-[clamp(2rem,5vw,3.5rem)] leading-[1.05] font-bold tracking-tight text-cream">
            Kernels that leap.
            <span className="block text-butter">Butter that sings.</span>
          </h2>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-cream/65">
            Butter Popcorn is a tiny interactive theater snack — a canvas full
            of restless kernels waiting for your click. No menus. No queues.
            Just the pop.
          </p>
        </div>

        <ol className="space-y-8 border-l border-cream/15 pl-6">
          {[
            {
              step: "01",
              title: "Warm the bed",
              copy: "Raw kernels gather in the ember glow at the bottom of the frame.",
            },
            {
              step: "02",
              title: "Strike the heat",
              copy: "Click or tap — nearby kernels burst into buttery blooms.",
            },
            {
              step: "03",
              title: "Chase the score",
              copy: "Every pop counts. Keep going until the theater smells like heaven.",
            },
          ].map((item) => (
            <li key={item.step}>
              <p className="font-display text-xs tracking-[0.22em] text-butter/80 uppercase">
                {item.step}
              </p>
              <h3 className="mt-2 font-display text-xl font-semibold text-cream">
                {item.title}
              </h3>
              <p className="mt-2 max-w-sm text-base leading-relaxed text-cream/55">
                {item.copy}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
