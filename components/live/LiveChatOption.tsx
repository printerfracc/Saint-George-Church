"use client";

import { useState } from "react";

export default function LiveChatOption({
  videoId,
  embedDomain,
}: {
  videoId: string;
  embedDomain: string;
}) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const chatUrl = `https://www.youtube.com/live_chat?v=${videoId}&embed_domain=${embedDomain}`;

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setIsChatOpen((open) => !open)}
          className="inline-flex min-h-11 items-center rounded-full border border-coptic-gold-main bg-white px-4 text-sm font-bold text-coptic-gold-dark transition-colors hover:bg-coptic-gold-light/15 hover:text-coptic-gold-main"
        >
          {isChatOpen ? "إخفاء الدردشة المباشرة" : "عرض الدردشة المباشرة"}
        </button>
        <a
          href={watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center text-sm font-bold text-coptic-gold-dark underline decoration-coptic-gold-main underline-offset-4 transition-colors hover:text-coptic-gold-main"
        >
          فتح البث على يوتيوب
        </a>
      </div>

      {isChatOpen ? (
        <div className="mt-4 overflow-hidden rounded-2xl border border-gold/40 bg-white">
          <iframe
            src={chatUrl}
            title="الدردشة المباشرة"
            className="h-80 w-full"
          />
        </div>
      ) : null}
    </div>
  );
}
