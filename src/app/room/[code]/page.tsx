import { Suspense } from "react";
import RoomClient from "./RoomClient";

export default function Page({ params }: { params: Promise<{ code: string }> }) {
  return (
    <Suspense
      fallback={
        <main className="min-h-dvh flex items-center justify-center text-stone-500">
          Loading room...
        </main>
      }
    >
      <RoomClient params={params} />
    </Suspense>
  );
}
