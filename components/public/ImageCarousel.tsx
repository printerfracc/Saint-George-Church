"use client";

import { useState } from "react";
import OptionalImage from "@/components/public/OptionalImage";

export default function ImageCarousel({
  images,
  alt,
  frameClassName,
}: {
  images: string[];
  alt: string;
  frameClassName: string;
}) {
  const [index, setIndex] = useState(0);
  const urls = images.map((url) => url.trim()).filter(Boolean);

  if (urls.length === 0) {
    return null;
  }

  const currentIndex = Math.min(index, urls.length - 1);
  const current = urls[currentIndex] ?? urls[0];

  function goTo(nextIndex: number) {
    setIndex((nextIndex + urls.length) % urls.length);
  }

  const controls =
    urls.length > 1 ? (
      <>
        <button
          type="button"
          onClick={() => goTo(currentIndex + 1)}
          className="absolute top-1/2 left-2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-coptic-gold-dark shadow-md transition hover:bg-coptic-gold-main hover:text-black"
          aria-label="الصورة التالية"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
            <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => goTo(currentIndex - 1)}
          className="absolute top-1/2 right-2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-coptic-gold-dark shadow-md transition hover:bg-coptic-gold-main hover:text-black"
          aria-label="الصورة السابقة"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
            <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center gap-1.5">
          {urls.map((url, dotIndex) => (
            <button
              key={`${url}-${dotIndex}`}
              type="button"
              aria-label={`عرض الصورة ${dotIndex + 1}`}
              aria-current={dotIndex === currentIndex ? "true" : undefined}
              onClick={() => setIndex(dotIndex)}
              className={`h-2.5 rounded-full transition ${
                dotIndex === currentIndex ? "w-6 bg-coptic-gold-main" : "w-2.5 bg-white/80"
              }`}
            />
          ))}
        </div>
      </>
    ) : null;

  return (
    <OptionalImage
      src={current}
      alt={alt}
      fill
      frameClassName={`${frameClassName} overflow-hidden`}
      className="object-cover"
    >
      {controls}
    </OptionalImage>
  );
}
