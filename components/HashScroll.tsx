"use client";

import { useEffect } from "react";

function scrollToHashTarget() {
  const id = window.location.hash.replace(/^#/, "");
  if (!id) {
    return;
  }

  window.requestAnimationFrame(() => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

export default function HashScroll() {
  useEffect(() => {
    scrollToHashTarget();
    window.addEventListener("hashchange", scrollToHashTarget);
    return () => window.removeEventListener("hashchange", scrollToHashTarget);
  }, []);

  return null;
}
