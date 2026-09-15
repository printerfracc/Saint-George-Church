import type { MediaFileType } from "@/lib/cloudinary";
import { getAppUrl } from "@/lib/app-url";

export type { MediaFileType };

export function mediaFileTypeLabel(type: string) {
  if (type === "pdf") return "ملف PDF";
  if (type === "word") return "ملف Word";
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

export function mediaExternalLinkLabel(label?: string | null) {
  const trimmed = label?.trim() ?? "";
  return trimmed || "رابط";
}

export function mediaPreviewUrl(fileUrl: string, fileType?: string | null) {
  const params = new URLSearchParams({ url: fileUrl });

  if (fileType) {
    params.set("type", fileType);
  }

  return `/api/media/preview?${params.toString()}`;
}

export function mediaOpenUrl(fileUrl: string, fileType?: string | null) {
  if (fileType === "image") {
    return fileUrl;
  }

  return mediaPreviewUrl(fileUrl, fileType);
}

export function officePreviewUrl(fileUrl: string) {
  const source = `${getAppUrl()}${mediaPreviewUrl(fileUrl, "word")}`;
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(source)}`;
}

export function pdfEmbedUrl(fileUrl: string) {
  return mediaPreviewUrl(fileUrl, "pdf");
}

export function cloudinaryPdfPageImage(fileUrl: string) {
  if (!fileUrl.includes("res.cloudinary.com")) {
    return null;
  }

  if (fileUrl.includes("/raw/upload/")) {
    return fileUrl.replace(
      "/raw/upload/",
      "/image/upload/f_jpg,pg_1,q_auto,w_1400/",
    );
  }

  if (fileUrl.includes("/image/upload/")) {
    return fileUrl.replace(
      "/image/upload/",
      "/image/upload/f_jpg,pg_1,q_auto,w_1400/",
    );
  }

  return null;
}

export function mediaGalleryImage(item: {
  thumbnail?: string | null;
  fileUrl?: string | null;
  fileType?: string | null;
}) {
  if (item.thumbnail) {
    return item.thumbnail;
  }

  if (!item.fileUrl) {
    return null;
  }

  if (item.fileType === "image") {
    return item.fileUrl;
  }

  return cloudinaryPdfPageImage(item.fileUrl);
}

export function isCloudinaryUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
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
  const params = new URLSearchParams({ url: fileUrl });

  if (fileName) {
    params.set("name", fileName);
  }

  if (fileType) {
    params.set("type", fileType);
  }

  return `/api/media/download?${params.toString()}`;
}
