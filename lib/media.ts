import type { MediaFileType } from "@/lib/cloudinary";
import { isYouTubeUrl, youtubeThumbnailUrl } from "@/lib/youtube";

export type { MediaFileType };

/** Vercel serverless request body limit for Server Actions (4.5 MB). */
export const VERCEL_UPLOAD_LIMIT_BYTES = 4_500_000;

/** Keep a single upload under the platform body limit, including form overhead. */
export const LIBRARY_DIRECT_UPLOAD_LIMIT_BYTES = 3_500_000;

/** Each production request stays under the 4.5 MB platform body limit. */
export const LIBRARY_UPLOAD_CHUNK_BYTES = 3_000_000;

/** Cloudinary free-plan upload cap used for direct browser uploads. */
export const CLOUDINARY_UPLOAD_LIMIT_BYTES = 10 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const WORD_TYPES = new Set([
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export function detectLibraryFileType(file: File): MediaFileType | null {
  const name = file.name.toLowerCase();

  if (ALLOWED_IMAGE_TYPES.has(file.type) || /\.(jpe?g|png|webp|gif)$/.test(name)) {
    return "image";
  }

  if (file.type === "application/pdf" || name.endsWith(".pdf")) {
    return "pdf";
  }

  if (WORD_TYPES.has(file.type) || /\.(docx?)$/.test(name)) {
    return "word";
  }

  return null;
}

export function mediaFileTypeLabel(type: string) {
  if (type === "pdf") return "ملف PDF";
  if (type === "word") return "ملف Word";
  if (type === "youtube") return "يوتيوب";
  if (type === "link") return "رابط";
  return "صورة";
}

export function normalizeExternalUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(candidate);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    return url.href;
  } catch {
    return null;
  }
}

export function mediaExternalLinkLabel(label?: string | null, href?: string | null) {
  const trimmed = label?.trim() ?? "";
  if (trimmed) {
    return trimmed;
  }

  return isYouTubeUrl(href) ? "اضغط للمشاهدة" : "اضغط هنا";
}

export function directMediaUrl(fileUrl: string) {
  const trimmed = fileUrl.trim();

  try {
    return encodeURI(decodeURIComponent(trimmed));
  } catch {
    return trimmed;
  }
}

export function mediaOpenUrl(fileUrl: string, _fileType?: string | null) {
  return directMediaUrl(fileUrl);
}

export function officePreviewUrl(fileUrl: string) {
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(directMediaUrl(fileUrl))}`;
}

export function pdfEmbedUrl(fileUrl: string) {
  return directMediaUrl(fileUrl);
}

export function mediaGalleryImage(item: {
  thumbnail?: string | null;
  fileUrl?: string | null;
  fileType?: string | null;
  link?: string | null;
}) {
  const thumbnail = item.thumbnail?.trim();
  if (thumbnail) {
    return thumbnail;
  }

  if (item.fileType === "image" && item.fileUrl) {
    return item.fileUrl;
  }

  return youtubeThumbnailUrl(item.link) ?? youtubeThumbnailUrl(item.fileUrl);
}

export function mediaDownloadFileName(
  fileName?: string | null,
  fileType?: string | null,
) {
  const extension =
    fileType === "pdf"
      ? ".pdf"
      : fileType === "word"
        ? ".docx"
        : fileType === "image"
          ? ".jpg"
          : "";

  const raw = (fileName || "file").replace(/[/\\?%*:|"<>]/g, " ").trim() || "file";
  const hasExtension = /\.(pdf|docx?|jpe?g|png|webp|gif)$/i.test(raw);

  return hasExtension ? raw : `${raw}${extension}`;
}

export function mediaDownloadUrl(
  fileUrl: string,
  fileName?: string | null,
  fileType?: string | null,
) {
  const params = new URLSearchParams({
    url: directMediaUrl(fileUrl),
  });

  if (fileName) {
    params.set("name", fileName);
  }

  if (fileType) {
    params.set("type", fileType);
  }

  return `/api/media/download?${params.toString()}`;
}
