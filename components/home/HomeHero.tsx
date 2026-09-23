"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useLiveStreamStatus } from "@/components/live/useLiveStreamStatus";
import OptionalImage from "@/components/public/OptionalImage";
import { CHURCH_NAME } from "@/lib/church";
import { hasImageSrc } from "@/lib/optional-image";

const DEFAULT_SUBTITLE =
  "نافذتك لمتابعة مواعيد القداسات، النهضات الروحية، وأخبار الخدمة لحظة بلحظة.";

const HERO_FALLBACK =
  "bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.28)_0%,transparent_52%),linear-gradient(180deg,#4A1A2A_0%,#1A0A10_55%,#0A0507_100%)]";

export default function HomeHero({
  imageUrl,
  title,
  subtitle,
}: {
  imageUrl?: string | null;
  title?: string | null;
  subtitle?: string | null;
}) {
  const isLive = useLiveStreamStatus();
  const heading = title?.trim() || CHURCH_NAME;
  const description = subtitle?.trim() || DEFAULT_SUBTITLE;
  const showImage = hasImageSrc(imageUrl);

  return (
    <section className="relative w-full shrink-0 overflow-x-hidden bg-[#1A0A10]">
      <div className="relative flex min-h-dvh w-full flex-col">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <motion.div
            className={`absolute inset-0 overflow-hidden ${HERO_FALLBACK}`}
            animate={{ scale: [1, 1.15] }}
            transition={{
              duration: 20,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "linear",
            }}
          >
            {showImage ? (
              <OptionalImage
                src={imageUrl}
                alt={heading}
                fill
                priority
                sizes="100vw"
                className="object-cover object-center"
                frameClassName="absolute inset-0 overflow-hidden"
              />
            ) : null}
          </motion.div>
          <div className="absolute inset-0 bg-black/60" />
        </div>

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-28 text-center sm:py-32">
          {isLive ? (
            <Link
              href="/live"
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-red-400/50 bg-red-600/90 px-4 py-1.5 text-sm font-bold text-white shadow-[0_0_18px_rgba(220,38,38,0.45)]"
              aria-label="مشاهدة البث المباشر الآن"
            >
              <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
              </span>
              بث مباشر الآن
            </Link>
          ) : null}
          <h1 className="max-w-4xl bg-linear-to-r from-coptic-gold-light to-coptic-gold-dark bg-clip-text text-3xl font-bold leading-relaxed text-transparent sm:text-4xl md:text-6xl">
            {heading}
          </h1>
          <p className="mt-6 max-w-2xl whitespace-pre-line text-base font-light leading-9 text-white sm:text-lg md:text-xl">
            {description}
          </p>
        </div>
      </div>
    </section>
  );
}
