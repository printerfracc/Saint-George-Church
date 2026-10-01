"use client";

import Image from "next/image";
import { extractYouTubeVideoId, youtubeThumbnailUrl } from "@/lib/youtube";

export function YouTubePlayOverlay({ compact = false }: { compact?: boolean }) {
  return (
    <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <span
        className={`flex items-center justify-center rounded-full bg-deep-red/90 text-cream shadow-lg ${
          compact ? "h-8 w-8 md:h-12 md:w-12" : "h-12 w-12"
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          className={`ms-0.5 fill-current ${compact ? "h-4 w-4 md:h-6 md:w-6" : "h-6 w-6"}`}
          aria-hidden
        >
          <path d="M8 5.14v13.72L19.5 12 8 5.14Z" />
        </svg>
      </span>
    </span>
  );
}

export function YouTubeEmbedFrame({
  videoId,
  title,
}: {
  videoId: string;
  title: string;
}) {
  return (
    <div className="relative aspect-video w-full bg-black">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="absolute inset-0 h-full w-full border-0"
      />
    </div>
  );
}

export function YouTubeMediaCard({
  url,
  title = "مشاهدة الفيديو على يوتيوب",
}: {
  url: string;
  title?: string;
}) {
  const videoId = extractYouTubeVideoId(url);
  const thumbnail = youtubeThumbnailUrl(url);

  if (!videoId || !thumbnail) {
    return null;
  }

  return (
    <a
      href={`https://www.youtube.com/watch?v=${videoId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block aspect-video w-full overflow-hidden bg-[#1A0A10] text-right"
      aria-label={title}
    >
      <Image
        src={thumbnail}
        alt={title}
        fill
        unoptimized
        className="object-cover transition duration-300 group-hover:scale-105"
      />
      <YouTubePlayOverlay />
    </a>
  );
}
