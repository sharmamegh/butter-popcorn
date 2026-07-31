"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

type Kernel = {
  id: number;
  x: number;
  y: number;
  size: number;
  rotation: number;
  delay: number;
};

function createKernels(count: number): Kernel[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 320,
    y: -(Math.random() * 280 + 80),
    size: Math.random() * 10 + 6,
    rotation: Math.random() * 720 - 360,
    delay: Math.random() * 0.15,
  }));
}

export function PopcornBurst({ active }: { active: boolean }) {
  const kernels = useMemo(() => createKernels(24), [active]);

  if (!active) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible"
      aria-hidden="true"
    >
      {kernels.map((k) => (
        <motion.span
          key={k.id}
          className="absolute rounded-full bg-gradient-to-br from-butter-200 to-butter-500"
          style={{ width: k.size, height: k.size }}
          initial={{ x: 0, y: 0, scale: 0.3, opacity: 1, rotate: 0 }}
          animate={{
            x: k.x,
            y: k.y,
            scale: [0.3, 1.2, 0.8],
            opacity: [1, 1, 0],
            rotate: k.rotation,
          }}
          transition={{
            duration: 1.1,
            delay: k.delay,
            ease: [0.22, 1, 0.36, 1],
          }}
        />
      ))}
    </div>
  );
}
