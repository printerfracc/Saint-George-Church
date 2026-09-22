"use client";

import { useState } from "react";
import { pdfEmbedUrl } from "@/lib/media";

export default function PdfPreview({
  title,
  fileUrl,
}: {
  title: string;
  fileUrl: string;
}) {
  const [showEmbed, setShowEmbed] = useState(true);

  if (showEmbed) {
    return (
      <iframe
        src={`${pdfEmbedUrl(fileUrl)}#toolbar=1&navpanes=0`}
        title={title}
        className="h-[32rem] w-full bg-white"
        onError={() => setShowEmbed(false)}
      />
    );
  }

  return (
    <div className="flex h-48 items-center justify-center bg-[#f7f3e9] text-sm font-bold text-deep-red/70">
      تعذر عرض المعاينة. استخدم زر الفتح.
    </div>
  );
}
