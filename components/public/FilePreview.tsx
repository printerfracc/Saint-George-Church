import Image from "next/image";
import PdfPreview from "@/components/public/PdfPreview";
import { mediaFileTypeLabel, officePreviewUrl, pdfEmbedUrl } from "@/lib/media";

export default function FilePreview({
  title,
  fileUrl,
  fileType,
}: {
  title: string;
  fileUrl: string;
  fileType: string;
}) {
  const openUrl = fileType === "pdf" ? pdfEmbedUrl(fileUrl) : fileUrl;

  return (
    <article className="overflow-hidden rounded-2xl border border-coptic-gold-main/40 bg-white/85 shadow-sm">
      {fileType === "image" ? (
        <div className="relative aspect-video bg-black/5">
          <Image
            src={fileUrl}
            alt={title}
            fill
            unoptimized
            className="object-cover"
          />
        </div>
      ) : fileType === "pdf" ? (
        <PdfPreview title={title} fileUrl={fileUrl} />
      ) : (
        <iframe
          src={officePreviewUrl(fileUrl)}
          title={title}
          className="h-128 w-full bg-white"
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <h3 className="font-bold text-deep-red">{title}</h3>
          <p className="text-xs font-bold text-coptic-gold-dark">
            {mediaFileTypeLabel(fileType)}
          </p>
        </div>
        <a
          href={openUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center rounded-full border border-coptic-gold-main px-4 text-xs font-bold text-coptic-gold-dark"
        >
          فتح الملف
        </a>
      </div>
    </article>
  );
}
