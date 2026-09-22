"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import CelebrationEmojis from "@/components/opening/CelebrationEmojis";

const WHITE_FLASH_TIME = 7.5;
const AUDIO_FADE_START = 7;
const AUDIO_FADE_MS = 1800;
const OVERLAY_FADE_S = 1.6;
const CELEBRATION_MS = 15000;

type OpeningTransitionValue = {
  isRevealingHome: boolean;
};

const OpeningTransitionContext = createContext<OpeningTransitionValue>({
  isRevealingHome: false,
});

export function useOpeningTransition() {
  return useContext(OpeningTransitionContext);
}

function clampVolume(value: number) {
  return Math.min(1, Math.max(0, value));
}

function setDocumentScrollLock(locked: boolean) {
  const html = document.documentElement;
  const body = document.body;
  html.classList.toggle("overflow-hidden", locked);
  body.classList.toggle("overflow-hidden", locked);
  html.style.overflow = locked ? "hidden" : "";
  body.style.overflow = locked ? "hidden" : "";
}

function fadeVideoVolume(video: HTMLVideoElement, durationMs: number) {
  const startVolume = clampVolume(video.volume);
  const startTime = performance.now();

  const step = (now: number) => {
    const progress = Math.min(1, Math.max(0, (now - startTime) / durationMs));
    video.volume = clampVolume(startVolume * (1 - progress));
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      video.pause();
    }
  };

  requestAnimationFrame(step);
}

export default function OpeningExperience({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const pendingPlay = useRef(false);
  const audioFadeStarted = useRef(false);
  const transitionStarted = useRef(false);
  const celebrationTimer = useRef<number | null>(null);

  const [showOverlay, setShowOverlay] = useState(pathname === "/opening");
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const [isRevealingHome, setIsRevealingHome] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const resetIntro = useCallback(() => {
    audioFadeStarted.current = false;
    transitionStarted.current = false;
    pendingPlay.current = false;
    setIsReady(false);
    setIsPlaying(false);
    setIsFading(false);
    setIsRevealingHome(false);
    setShowCelebration(false);
  }, []);

  useEffect(() => {
    if (pathname === "/opening") {
      resetIntro();
      setShowOverlay(true);
      router.prefetch("/");
    }
  }, [pathname, resetIntro, router]);

  useEffect(() => {
    const shouldLock = showOverlay && !isFading && pathname === "/opening";
    setDocumentScrollLock(shouldLock);
    return () => setDocumentScrollLock(false);
  }, [isFading, pathname, showOverlay]);

  useEffect(() => {
    return () => {
      if (celebrationTimer.current) window.clearTimeout(celebrationTimer.current);
      setDocumentScrollLock(false);
    };
  }, []);

  const playVideo = useCallback(async () => {
    const video = videoRef.current;
    if (!video || isPlaying || isFading) return;

    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      pendingPlay.current = true;
      return;
    }

    video.muted = false;
    video.volume = clampVolume(1);
    try {
      await video.play();
      setIsPlaying(true);
      router.prefetch("/");
    } catch {
      pendingPlay.current = true;
      setIsPlaying(false);
    }
  }, [isFading, isPlaying, router]);

  const markReady = useCallback(() => {
    setIsReady(true);
    if (pendingPlay.current) {
      pendingPlay.current = false;
      void playVideo();
    }
  }, [playVideo]);

  const beginAudioFade = useCallback(() => {
    if (audioFadeStarted.current) return;
    const video = videoRef.current;
    if (!video) return;
    audioFadeStarted.current = true;
    fadeVideoVolume(video, AUDIO_FADE_MS);
  }, []);

  const beginHomeReveal = useCallback(() => {
    if (transitionStarted.current) return;
    transitionStarted.current = true;
    beginAudioFade();
    sessionStorage.setItem("opening-reveal", "1");
    setDocumentScrollLock(false);
    setIsRevealingHome(true);
    setIsFading(true);
    setShowCelebration(true);
    void router.push("/");

    window.setTimeout(() => {
      setShowOverlay(false);
      sessionStorage.removeItem("opening-reveal");
    }, OVERLAY_FADE_S * 1000);

    celebrationTimer.current = window.setTimeout(() => {
      setShowCelebration(false);
      setIsRevealingHome(false);
    }, CELEBRATION_MS);
  }, [beginAudioFade, router]);

  useEffect(() => {
    const video = videoRef.current;
    if (showOverlay && video && video.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
      markReady();
    }
  }, [markReady, showOverlay]);

  const contextValue = useMemo(
    () => ({ isRevealingHome }),
    [isRevealingHome],
  );

  return (
    <OpeningTransitionContext.Provider value={contextValue}>
      {children}
      <AnimatePresence>
        {showOverlay ? (
          <motion.div
            key="opening-overlay"
            className={`fixed inset-0 z-100 overflow-hidden bg-white ${
              isFading ? "pointer-events-none" : ""
            }`}
            style={{ pointerEvents: isFading ? "none" : "auto" }}
            initial={{ opacity: 1 }}
            animate={{ opacity: isFading ? 0 : 1 }}
            exit={{ opacity: 0, pointerEvents: "none" }}
            transition={{ duration: OVERLAY_FADE_S, ease: "easeInOut" }}
            onAnimationComplete={() => {
              if (isFading) {
                setShowOverlay(false);
                setDocumentScrollLock(false);
                sessionStorage.removeItem("opening-reveal");
              }
            }}
          >
            {!isReady ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white">
                <span
                  className="h-5 w-5 animate-spin rounded-full border-2 border-gold/30 border-t-gold"
                  aria-hidden
                />
                <span className="sr-only">جاري التحميل</span>
              </div>
            ) : null}
            {!isPlaying && !isFading ? (
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
                const video = videoRef.current;
                if (!video) return;
                if (video.currentTime > AUDIO_FADE_START) beginAudioFade();
                if (video.currentTime > WHITE_FLASH_TIME) beginHomeReveal();
              }}
              onEnded={beginHomeReveal}
              className="h-screen w-screen object-cover"
              aria-hidden
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
      {showCelebration ? <CelebrationEmojis /> : null}
    </OpeningTransitionContext.Provider>
  );
}
