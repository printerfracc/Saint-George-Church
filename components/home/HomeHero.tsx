"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { CHURCH_NAME } from "@/lib/church";

const DEFAULT_SUBTITLE =
  "نافذتك لمتابعة مواعيد القداسات، النهضات الروحية، وأخبار الخدمة لحظة بلحظة.";

export default function HomeHero({
  imageUrl,
  title,
  subtitle,
}: {
  imageUrl?: string | null;
  title?: string | null;
  subtitle?: string | null;
}) {
  const [showPhoto, setShowPhoto] = useState(Boolean(imageUrl));
  const heading = title?.trim() || CHURCH_NAME;
  const description = subtitle?.trim() || DEFAULT_SUBTITLE;

  return (
    <section className="relative h-screen overflow-hidden bg-[#1A0A10]">
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.28)_0%,transparent_52%),linear-gradient(180deg,#4A1A2A_0%,#1A0A10_55%,#0A0507_100%)]"
        animate={{ scale: [1, 1.15] }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "linear",
        }}
      >
        {showPhoto && imageUrl ? (
          <Image
            src={imageUrl}
            alt={heading}
            fill
            priority
            unoptimized
            className="object-cover"
            onError={() => setShowPhoto(false)}
          />
        ) : null}
      </motion.div>

      <div className="absolute inset-0 bg-black/60" />

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
        <h1 className="max-w-4xl bg-linear-to-r from-coptic-gold-light to-coptic-gold-dark bg-clip-text text-3xl font-bold leading-relaxed text-transparent sm:text-4xl md:text-6xl">
          {heading}
        </h1>
        <p className="mt-6 max-w-2xl text-base font-light leading-9 text-white sm:text-lg md:text-xl">
          {description}
        </p>
      </div>
    </section>
  );
}
