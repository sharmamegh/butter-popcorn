import { Suspense } from "react";
import { CinemaShell } from "@/components/CinemaShell";
import { RoomStatus } from "@/components/RoomStatus";
import RoomClient from "./RoomClient";

export default function Page({ params }: { params: Promise<{ code: string }> }) {
  return (
    <Suspense
      fallback={
        <CinemaShell>
          <RoomStatus kind="loading" />
        </CinemaShell>
      }
    >
      <RoomClient params={params} />
    </Suspense>
  );
}
