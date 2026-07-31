import { Flavors } from "@/components/Flavors";
import { Hero } from "@/components/Hero";
import { Popper } from "@/components/Popper";

export default function Home() {
  return (
    <div className="flex min-h-full flex-col bg-sky-low">
      <Hero />
      <main>
        <Popper />
        <div className="mx-auto h-px w-full max-w-5xl bg-ink/10 px-5" />
        <Flavors />
      </main>
      <footer className="mt-auto border-t border-ink/10 px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-[family-name:var(--font-display)] text-lg font-extrabold text-ink">
            Butter Popcorn
          </p>
          <p className="text-sm text-ink-soft">
            Built for movie nights that take snacks seriously.
          </p>
        </div>
      </footer>
    </div>
  );
}
