"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useOpeningTransition } from "@/components/opening/OpeningExperience";

export default function Template({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isRevealingHome } = useOpeningTransition();
  const [fromOpening] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("opening-reveal") === "1";
  });

  if (pathname === "/opening" || isRevealingHome || fromOpening) {
    return <>{children}</>;
  }

  return (
    <motion.main
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-1 flex-col"
    >
      {children}
    </motion.main>
  );
}
