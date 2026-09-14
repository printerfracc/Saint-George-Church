"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import ChurchLogo from "@/components/ChurchLogo";
import { CHURCH_NAME } from "@/lib/church";

export type HeroSlide = {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
};

export default function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const hasSlides = slides.length > 0;
  const current = hasSlides ? slides[index] : null;

  useEffect(() => {
    if (slides.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setIndex((currentIndex) => (currentIndex + 1) % slides.length);
    }, 6500);

    return () => window.clearInterval(timer);
  }, [slides.length]);

  return (
    <section
      aria-label="الشريط العلوي"
      className="relative overflow-hidden bg-deep-red text-cream"
    >
      <div className="relative min-h-112 w-full sm:min-h-128 md:min-h-144">
        <AnimatePresence mode="wait">
          <motion.div
            key={current?.id ?? "welcome"}
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            {current?.imageUrl ? (
              <Image
                src={current.imageUrl}
                alt={current.title}
                fill
                priority
                unoptimized
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-deep-red">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.28),transparent_55%)]" />
              </div>
            )}
            <div className="absolute inset-0 bg-linear-to-t from-deep-red via-deep-red/70 to-deep-red/30" />
          </motion.div>
        </AnimatePresence>

        <div className="relative z-10 mx-auto flex min-h-112 max-w-6xl flex-col items-center justify-center px-4 py-16 text-center sm:min-h-128 md:min-h-144 md:px-6">
          <div className="mb-5 overflow-hidden rounded-2xl bg-cream p-2 shadow-lg">
            <ChurchLogo size={160} priority className="h-20 w-20 sm:h-24 sm:w-24 md:h-32 md:w-32" />
          </div>
          <p className="text-xs font-bold tracking-[0.3em] text-gold sm:text-sm">
            الشريط العلوي
          </p>
          <h1 className="mt-3 max-w-3xl text-2xl font-bold leading-relaxed sm:text-4xl md:text-5xl">
            {current?.title ?? `مرحباً بكم في ${CHURCH_NAME}`}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-8 text-cream/90 sm:text-base md:text-lg">
            {current?.description ??
              "تابعوا أخبار الكنيسة، القداسات، والنهضات الروحية من هنا."}
          </p>

          {slides.length > 1 ? (
            <div className="mt-8 flex items-center gap-2">
              {slides.map((slide, slideIndex) => (
                <button
                  key={slide.id}
                  type="button"
                  aria-label={`الشريحة ${slideIndex + 1}`}
                  onClick={() => setIndex(slideIndex)}
                  className={`h-2.5 rounded-full transition-all ${
                    slideIndex === index
                      ? "w-8 bg-gold"
                      : "w-2.5 bg-cream/50 hover:bg-gold/70"
                  }`}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
