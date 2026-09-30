"use client";

import { useEffect, useState } from "react";

export function useLiveStreamStatus() {
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    void fetch("/api/live", { signal: controller.signal, cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!controller.signal.aborted) {
          setIsLive(Boolean(data && data.ok === true && data.isLive === true));
        }
      })
      .catch((error) => {
        if (controller.signal.aborted) {
          return;
        }

        console.error("Failed to read live stream status", error);
        setIsLive(false);
      });

    return () => controller.abort();
  }, []);

  return isLive;
}
