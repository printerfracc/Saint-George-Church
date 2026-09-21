"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { motion } from "framer-motion";
import { useOpeningTransition } from "@/components/opening/OpeningExperience";

export default function HomeFadeIn({ children }: { children: ReactNode }) {
  const { isRevealingHome } = useOpeningTransition();
  const [fromOpening] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("opening-reveal") === "1";
  });

  if (fromOpening || isRevealingHome) {
    return <div className="flex flex-1 flex-col">{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="flex flex-1 flex-col"
    >
      {children}
    </motion.div>
  );
}
