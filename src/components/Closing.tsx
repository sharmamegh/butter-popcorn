export function Closing() {
  return (
    <section className="relative overflow-hidden bg-night">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(240,196,58,0.14),transparent_50%)]" />
      </div>

      <div className="relative mx-auto flex max-w-4xl flex-col items-center px-6 py-28 text-center sm:px-10 sm:py-36">
        <p className="font-display text-[clamp(2.5rem,8vw,5rem)] leading-[0.95] font-bold tracking-tight text-cream uppercase">
          Save some
          <span className="block text-butter">for the credits.</span>
        </p>
        <p className="mt-6 max-w-md text-lg text-cream/60">
          Built for the joy of a good pop — share it with whoever sits next to
          you in the dark.
        </p>
        <a
          href="#top"
          className="mt-10 inline-flex h-12 items-center justify-center bg-cream px-8 font-display text-sm font-bold tracking-[0.14em] text-night uppercase transition hover:bg-butter-hot focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-butter"
        >
          Pop again
        </a>
      </div>

      <footer className="border-t border-cream/10 px-6 py-8 text-center sm:px-10">
        <p className="font-display text-xs tracking-[0.24em] text-cream/40 uppercase">
          Butter Popcorn · An interactive snack for the web
        </p>
      </footer>
    </section>
  );
}
