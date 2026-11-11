"use client";

import { useEffect } from "react";

export default function NetlifyBadgeRemover() {
  useEffect(() => {
    const nukeBadge = () => {
      const badgeElements = document.querySelectorAll(
        'netlify-badge, iframe[title*="Netlify"], div[id*="netlify-badge"]',
      );
      badgeElements.forEach((el) => el.remove());
    };

    nukeBadge();

    const observer = new MutationObserver(() => {
      nukeBadge();
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
