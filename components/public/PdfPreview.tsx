"use client";

import { useState } from "react";
import { cloudinaryPdfPageImage, pdfEmbedUrl } from "@/lib/media";

export default function PdfPreview({
  title,
  fileUrl,
}: {
  title: string;
  fileUrl: string;
}) {
  const [showEmbed, setShowEmbed] = useState(true);
  const pageImage = cloudinaryPdfPageImage(fileUrl);

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

  if (pageImage) {
    return (
      <div className="flex h-[32rem] items-center justify-center bg-[#f7f3e9]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={pageImage}
          alt={title}
          className="max-h-full max-w-full object-contain"
        />
      </div>
    );
  }

  return (
    <div className="flex h-48 items-center justify-center bg-[#f7f3e9] text-sm font-bold text-deep-red/70">
      تعذر عرض المعاينة. استخدم زر الفتح.
    </div>
  );
}
