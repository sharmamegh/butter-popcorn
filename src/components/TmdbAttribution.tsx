/**
 * TMDB attribution required by their API terms.
 * @see https://www.themoviedb.org/about/logos-attribution
 * @see https://developer.themoviedb.org/docs/faq
 */
export function TmdbAttribution() {
  return (
    <footer className="mt-auto w-full max-w-md pt-8 text-center">
      <p className="text-[10px] uppercase tracking-[0.2em] text-stone-600 mb-3">
        Credits
      </p>
      <a
        href="https://www.themoviedb.org/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex flex-col items-center gap-2 text-stone-500 hover:text-stone-300 transition-colors"
        aria-label="The Movie Database (TMDB)"
      >
        {/* Official logo colors/shape; keep smaller than Butter Popcorn brand mark */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/tmdb-logo.svg"
          alt="The Movie Database (TMDB)"
          width={72}
          height={52}
          className="h-8 w-auto opacity-80"
        />
        <span className="text-[11px] leading-snug text-stone-600 max-w-[16rem]">
          This product uses the TMDB API but is not endorsed or certified by
          TMDB.
        </span>
      </a>
    </footer>
  );
}
