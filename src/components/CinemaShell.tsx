export function CinemaShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-dvh overflow-hidden">
      <div
        className="fixed top-0 left-0 h-full w-6 sm:w-12 bg-gradient-to-r from-curtain/80 to-transparent z-10"
        aria-hidden="true"
      />
      <div
        className="fixed top-0 right-0 h-full w-6 sm:w-12 bg-gradient-to-l from-curtain/80 to-transparent z-10"
        aria-hidden="true"
      />
      <div className="cinema-glow fixed inset-0 pointer-events-none" />
      <div className="relative z-20 mx-auto flex min-h-dvh max-w-3xl flex-col items-center justify-center gap-6 px-4 py-10 sm:px-6 sm:py-12">
        {children}
      </div>
    </main>
  );
}
