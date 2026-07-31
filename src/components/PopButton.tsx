"use client";

import { motion } from "framer-motion";
import { PopcornBurst } from "./PopcornBurst";

export function PopButton({
  onClick,
  isPopping,
  disabled,
}: {
  onClick: () => void;
  isPopping: boolean;
  disabled: boolean;
}) {
  return (
    <div className="relative">
      <PopcornBurst active={isPopping} />

      <motion.button
        type="button"
        onClick={onClick}
        disabled={disabled}
        whileHover={disabled ? {} : { scale: 1.05 }}
        whileTap={disabled ? {} : { scale: 0.95 }}
        className={`
          relative z-10 rounded-full px-10 py-5 text-xl font-bold tracking-wide
          transition-shadow duration-300 cursor-pointer
          disabled:opacity-60 disabled:cursor-not-allowed
          bg-gradient-to-b from-butter-300 via-butter-400 to-butter-600
          text-cinema-900 shadow-lg
          hover:shadow-[0_0_40px_rgba(245,200,66,0.4)]
          border-2 border-butter-200/50
        `}
      >
        <motion.span
          animate={isPopping ? { scale: [1, 1.3, 1] } : {}}
          transition={{ duration: 0.3 }}
          className="inline-flex items-center gap-2"
        >
          <span className="text-2xl">🍿</span>
          {isPopping ? "POPPING..." : "POP IT!"}
        </motion.span>
      </motion.button>
    </div>
  );
}
