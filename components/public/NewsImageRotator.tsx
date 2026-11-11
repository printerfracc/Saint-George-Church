"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import OptionalImage from "@/components/public/OptionalImage";

const ROTATE_MS = 2500;

export default function NewsImageRotator({
  images,
  alt,
  frameClassName,
}: {
  images: string[];
  alt: string;
  frameClassName: string;
}) {
  const urls = images.map((url) => url.trim()).filter(Boolean);
  const reducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [held, setHeld] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [hidden, setHidden] = useState(false);
  const deadlineRef = useRef(0);
  const indexRef = useRef(0);
  const paused = held || hovered || hidden;
  const count = urls.length;
  const currentIndex = count === 0 ? 0 : index % count;
  const current = urls[currentIndex];

  useEffect(() => {
    function onVisibility() {
      setHidden(document.hidden);
    }

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    if (count < 2) {
      return;
    }

    if (indexRef.current !== index) {
      indexRef.current = index;
      deadlineRef.current = 0;
    }

    if (paused) {
      return;
    }

    if (deadlineRef.current === 0) {
      deadlineRef.current = Date.now() + ROTATE_MS;
    }

    const delay = Math.max(0, deadlineRef.current - Date.now());
    const timer = window.setTimeout(() => {
      deadlineRef.current = 0;
      setIndex((value) => (value + 1) % count);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [count, index, paused]);

  if (!current) {
    return null;
  }

  if (count === 1) {
    return (
      <OptionalImage
        src={current}
        alt={alt}
        fill
        frameClassName={frameClassName}
        className="object-cover"
      />
    );
  }

  function goTo(nextIndex: number) {
    setIndex((nextIndex + count) % count);
  }

  const position = `${(currentIndex + 1).toLocaleString("ar-EG")} / ${count.toLocaleString("ar-EG")}`;

  return (
    <div
      className={`${frameClassName} group`}
      role="group"
      aria-label={`${alt}، معرض من ${count.toLocaleString("ar-EG")} صور يتبدل كل ٢٫٥ ثانية`}
      onMouseEnter={() => {
        if (window.matchMedia("(hover: hover)").matches) {
          setHovered(true);
        }
      }}
      onMouseLeave={() => setHovered(false)}
    >
      <AnimatePresence initial={false}>
        <motion.div
          key={current}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.75, ease: "easeInOut" }}
        >
          <motion.div
            className="absolute inset-0"
            initial={{ scale: reducedMotion ? 1 : 1.06 }}
            animate={{ scale: 1 }}
            transition={{ duration: reducedMotion ? 0 : ROTATE_MS / 1000, ease: "linear" }}
          >
            <Image
              src={current}
              alt={`${alt} — الصورة ${position}`}
              fill
              unoptimized
              className="object-cover"
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24 bg-linear-to-t from-black/60 via-black/25 to-transparent" />

      <p className="absolute top-3 right-3 z-20 rounded-full bg-black/45 px-3 py-1 text-xs font-bold text-cream shadow-sm backdrop-blur-sm">
        {position}
      </p>

      <button
        type="button"
        onClick={() => setHeld((value) => !value)}
        className="absolute top-3 left-3 z-20 inline-flex h-11 min-w-11 items-center justify-center rounded-full bg-white/90 px-3 text-coptic-gold-dark shadow-md transition hover:bg-coptic-gold-main hover:text-black"
        aria-pressed={held}
        aria-label={held ? "استئناف عرض الصور" : "إيقاف عرض الصور"}
      >
        {held ? (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
            <path d="M8 5.5v13l11-6.5-11-6.5z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
            <path d="M7 5h3.2v14H7V5zm6.8 0H17v14h-3.2V5z" />
          </svg>
        )}
      </button>

      <button
        type="button"
        onClick={() => goTo(currentIndex + 1)}
        className="absolute top-1/2 left-3 z-20 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-coptic-gold-dark shadow-md transition hover:bg-coptic-gold-main hover:text-black md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
        aria-label="الصورة التالية"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
          <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => goTo(currentIndex - 1)}
        className="absolute top-1/2 right-3 z-20 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-coptic-gold-dark shadow-md transition hover:bg-coptic-gold-main hover:text-black md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
        aria-label="الصورة السابقة"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
          <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className="absolute inset-x-0 bottom-0 z-20">
        <div className="flex items-center justify-center gap-1.5 px-14 pb-3">
          {urls.map((url, dotIndex) => (
            <button
              key={`${url}-${dotIndex}`}
              type="button"
              aria-label={`عرض الصورة ${(dotIndex + 1).toLocaleString("ar-EG")}`}
              aria-current={dotIndex === currentIndex ? "true" : undefined}
              onClick={() => goTo(dotIndex)}
              className="inline-flex h-11 items-center justify-center px-0.5"
            >
              <span
                className={`block h-2 rounded-full transition-all duration-300 ${
                  dotIndex === currentIndex
                    ? "w-6 bg-coptic-gold-main shadow-[0_0_0_1px_rgba(0,0,0,0.25)]"
                    : "w-2 bg-white/80"
                }`}
              />
            </button>
          ))}
        </div>
        <div className="h-1 overflow-hidden bg-black/30" aria-hidden>
          <span
            key={currentIndex}
            className="block h-full origin-right bg-linear-to-l from-coptic-gold-light to-coptic-gold-main"
            style={{
              animationName: "news-image-progress",
              animationDuration: `${ROTATE_MS}ms`,
              animationTimingFunction: "linear",
              animationFillMode: "forwards",
              animationPlayState: paused ? "paused" : "running",
            }}
          />
        </div>
      </div>
    </div>
  );
}
