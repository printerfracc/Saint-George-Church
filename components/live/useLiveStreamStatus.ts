"use client";

import { useEffect, useState } from "react";

let cachedIsLive: boolean | null = null;
let inflight: Promise<boolean> | null = null;

async function readLiveStatus(signal?: AbortSignal) {
  if (cachedIsLive !== null) {
    return cachedIsLive;
  }

  if (!inflight) {
    inflight = fetch("/api/live", { signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        cachedIsLive = Boolean(data && data.ok === true && data.isLive === true);
        return cachedIsLive;
      })
      .catch(() => {
        cachedIsLive = false;
        return false;
      })
      .finally(() => {
        inflight = null;
      });
  }

  return inflight;
}

export function useLiveStreamStatus() {
  const [isLive, setIsLive] = useState(cachedIsLive ?? false);

  useEffect(() => {
    const controller = new AbortController();

    void readLiveStatus(controller.signal).then(setIsLive);

    return () => controller.abort();
  }, []);

  return isLive;
}
