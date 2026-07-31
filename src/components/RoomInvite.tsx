"use client";

import QRCode from "react-qr-code";

export function RoomInvite({
  code,
  onCopy,
  copied,
}: {
  code: string;
  onCopy: () => void;
  copied: boolean;
}) {
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/room/${code}`
      : `/room/${code}`;

  return (
    <div className="w-full space-y-4">
      <div className="text-center">
        <p className="text-sm uppercase tracking-widest text-butter-500 mb-2">
          Room code
        </p>
        <p className="text-5xl font-mono font-bold text-butter-300 tracking-[0.15em]">
          {code}
        </p>
      </div>

      <div className="flex justify-center rounded-2xl bg-white p-4">
        <QRCode value={url} size={160} />
      </div>

      <button
        type="button"
        onClick={onCopy}
        className="w-full rounded-xl border border-cinema-600 py-3 text-stone-300 hover:border-butter-400/50 cursor-pointer"
      >
        {copied ? "Link copied!" : "Copy invite link"}
      </button>
    </div>
  );
}
