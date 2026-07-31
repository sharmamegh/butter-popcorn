import { TmdbAttribution } from "@/components/TmdbAttribution";

export function CinemaShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-dvh overflow-x-hidden">
      <div
        className="pointer-events-none fixed top-0 left-0 z-10 h-full w-6 bg-gradient-to-r from-curtain/80 to-transparent sm:w-12"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed top-0 right-0 z-10 h-full w-6 bg-gradient-to-l from-curtain/80 to-transparent sm:w-12"
        aria-hidden="true"
      />
      <div className="cinema-glow pointer-events-none fixed inset-0" />
      {/* my-auto centers short pages; tall ranking pages scroll instead of clipping */}
      <div className="relative z-20 mx-auto flex min-h-dvh w-full max-w-6xl flex-col items-center px-4 py-10 sm:px-6 sm:py-12">
        <div className="my-auto flex w-full flex-col items-center gap-6">
          {children}
          <TmdbAttribution />
        </div>
      </div>
    </main>
  );
}
