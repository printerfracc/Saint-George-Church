"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

const EMOJI_COUNT = 36;

export default function CelebrationEmojis() {
  const pieces = useMemo(
    () =>
      Array.from({ length: EMOJI_COUNT }, (_, id) => ({
        id,
        left: `${((id * 17) % 100) + (id % 3) - 1}%`,
        delay: (id * 0.38) % 11,
        duration: 4.5 + (id % 5) * 0.7,
        size: 22 + (id % 7) * 5,
        drift: ((id % 9) - 4) * 36,
        rotate: id % 2 === 0 ? 420 : -380,
      })),
    [],
  );

  return (
    <div
      className="pointer-events-none fixed inset-0 z-110 overflow-hidden"
      aria-hidden
    >
      {pieces.map((piece) => (
        <motion.span
          key={piece.id}
          className="absolute bottom-[-12%] select-none"
          style={{ left: piece.left, fontSize: piece.size }}
          initial={{ y: 0, x: 0, opacity: 0, rotate: 0, scale: 0.7 }}
          animate={{
            y: "-125vh",
            x: [0, piece.drift, piece.drift * -0.4],
            opacity: [0, 1, 1, 0],
            rotate: piece.rotate,
            scale: [0.7, 1.1, 1],
          }}
          transition={{
            duration: piece.duration,
            delay: piece.delay,
            ease: "easeOut",
            repeat: Infinity,
            repeatDelay: 0.8,
          }}
        >
          🎉
        </motion.span>
      ))}
    </div>
  );
}
