"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const WHITE_FLASH_TIME = 7.5;

export default function OpeningPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasNavigated = useRef(false);
  const pendingPlay = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const goHome = useCallback(() => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;
    router.push("/");
  }, [router]);

  const playVideo = useCallback(async () => {
    const video = videoRef.current;
    if (!video || isPlaying) return;

    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      pendingPlay.current = true;
      return;
    }

    video.muted = false;
    video.volume = 1;
    try {
      await video.play();
      setIsPlaying(true);
    } catch {
      pendingPlay.current = true;
      setIsPlaying(false);
    }
  }, [isPlaying]);

  const markReady = useCallback(() => {
    setIsReady(true);
    if (pendingPlay.current) {
      pendingPlay.current = false;
      void playVideo();
    }
  }, [playVideo]);

  useEffect(() => {
    const video = videoRef.current;
    if (video && video.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
      markReady();
    }
  }, [markReady]);

  return (
    <div className="fixed inset-0 z-100 overflow-hidden bg-white">
      {!isReady ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white">
          <span
            className="h-5 w-5 animate-spin rounded-full border-2 border-gold/30 border-t-gold"
            aria-hidden
          />
          <span className="sr-only">جاري التحميل</span>
        </div>
      ) : null}
      {!isPlaying ? (
        <button
          type="button"
          onClick={() => void playVideo()}
          className="absolute inset-0 z-10 cursor-pointer bg-transparent"
          aria-label="تشغيل فيديو الافتتاح"
        />
      ) : null}
      <video
        ref={videoRef}
        src="/opening-video.mp4"
        playsInline
        preload="auto"
        onCanPlayThrough={markReady}
        onTimeUpdate={() => {
          if (videoRef.current && videoRef.current.currentTime > WHITE_FLASH_TIME) {
            goHome();
          }
        }}
        onEnded={goHome}
        className="h-screen w-screen object-cover"
        aria-hidden
      />
    </div>
  );
}
