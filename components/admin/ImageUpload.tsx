"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { uploadMedia } from "@/actions/upload-media";
import type { CloudinaryUploadResult } from "@/lib/cloudinary";
import { VERCEL_UPLOAD_LIMIT_BYTES } from "@/lib/media";

type UploadStatus = "idle" | "uploading" | "success" | "error";

export type ImagePreviewVariant =
  | "circle"
  | "story"
  | "relic"
  | "activity"
  | "hero"
  | "wide"
  | "portrait"
  | "square";

type ImageUploadProps = {
  value?: string;
  onChange?: (url: string) => void;
  label?: string;
  hint?: string | null;
  preview?: ImagePreviewVariant;
  uploadFile?: (formData: FormData) => Promise<CloudinaryUploadResult>;
};

const statusMessages: Record<Exclude<UploadStatus, "idle">, string> = {
  uploading: "جاري الرفع...",
  success: "تم الرفع بنجاح",
  error: "فشل الرفع",
};

const previewFrames: Record<
  ImagePreviewVariant,
  { frame: string; drop: string; image: string }
> = {
  circle: {
    frame:
      "relative mx-auto h-28 w-28 overflow-hidden rounded-full border-4 border-coptic-gold-main bg-cream",
    drop: "mx-auto flex h-28 w-28 cursor-pointer flex-col items-center justify-center rounded-full border-4 border-dashed px-3 text-center",
    image: "object-cover",
  },
  story: {
    frame:
      "relative aspect-4/3 overflow-hidden rounded-3xl border border-coptic-gold-main/40 bg-white/70 shadow-sm",
    drop: "flex aspect-4/3 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed px-4 text-center",
    image: "object-cover",
  },
  relic: {
    frame:
      "relative aspect-4/3 overflow-hidden rounded-3xl border border-coptic-gold-main/40 bg-black/25",
    drop: "flex aspect-4/3 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed px-4 text-center",
    image: "object-cover",
  },
  activity: {
    frame:
      "relative aspect-16/10 overflow-hidden rounded-2xl border border-coptic-gold-main/50 bg-cream",
    drop: "flex aspect-16/10 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 text-center",
    image: "object-cover",
  },
  hero: {
    frame: "relative aspect-video overflow-hidden bg-[#1A0A10]",
    drop: "flex aspect-video cursor-pointer flex-col items-center justify-center border-2 border-dashed px-4 text-center",
    image: "object-cover",
  },
  wide: {
    frame:
      "relative aspect-video overflow-hidden rounded-2xl border border-gold/50 bg-white",
    drop: "flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-8 text-center sm:min-h-56",
    image: "object-cover",
  },
  portrait: {
    frame:
      "relative mx-auto aspect-[450/730] w-full max-w-[225px] overflow-hidden rounded-2xl border border-gold/50 bg-white",
    drop: "flex aspect-[450/730] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 text-center",
    image: "object-cover",
  },
  square: {
    frame:
      "relative mx-auto aspect-square w-full max-w-52 overflow-hidden rounded-2xl border border-coptic-gold-main/50 bg-white",
    drop: "mx-auto flex aspect-square w-full max-w-52 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 text-center",
    image: "object-contain",
  },
};

export default function ImageUpload({
  value = "",
  onChange,
  label = "رفع صورة",
  hint = "المعاينة بنفس شكل الصورة على الموقع. غيّر الصورة إن لم تكن القصّة مناسبة.",
  preview = "wide",
  uploadFile = uploadMedia,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uncontrolledUrl, setUncontrolledUrl] = useState(value);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const frame = previewFrames[preview];
  const isControlled = typeof onChange === "function";
  const previewUrl = isControlled ? value : uncontrolledUrl;

  function updatePreview(url: string) {
    if (!isControlled) {
      setUncontrolledUrl(url);
    }
    onChange?.(url);
  }

  async function handleFile(file: File | undefined) {
    if (!file) {
      return;
    }

    if (file.size > VERCEL_UPLOAD_LIMIT_BYTES) {
      setStatus("error");
      setErrorMessage("حجم الملف يتخطى 4.5 ميجابايت. يرجى ضغط الملف.");
      return;
    }

    setStatus("uploading");
    setErrorMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const result = await uploadFile(formData);

      if (!result.success) {
        setStatus("error");
        setErrorMessage(result.error);
        return;
      }

      updatePreview(result.url);
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage(
        "فشل رفع الملف. قد يكون حجم الملف كبيراً جداً (الحد الأقصى 4.5 ميجابايت).",
      );
    }
  }

  function handleRemove() {
    updatePreview("");
    setStatus("idle");
    setErrorMessage("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <div className="w-full space-y-3">
      <p className="text-sm font-bold text-deep-red">{label}</p>
      {hint ? <p className="text-xs text-deep-red/65">{hint}</p> : null}

      {previewUrl ? (
        <div className={preview === "circle" ? "relative mx-auto mb-10 w-28" : "relative"}>
          <div className={frame.frame}>
            <Image
              src={previewUrl}
              alt={label}
              fill
              unoptimized
              className={frame.image}
            />
            {preview === "hero" ? (
              <div className="absolute inset-0 bg-black/60" />
            ) : null}
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className={`absolute z-10 min-h-11 rounded-full bg-coptic-gold-main px-3 text-xs font-bold text-black shadow-md transition hover:bg-coptic-gold-dark hover:text-cream ${
              preview === "circle"
                ? "top-full left-1/2 mt-2 -translate-x-1/2"
                : "top-3 right-3"
            }`}
            aria-label="إزالة الصورة"
          >
            إزالة
          </button>
        </div>
      ) : (
        <label
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setIsDragging(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            void handleFile(event.dataTransfer.files[0]);
          }}
          className={`${frame.drop} ${
            isDragging
              ? "border-gold bg-gold/10"
              : "border-deep-red/30 bg-white/70 hover:border-gold hover:bg-gold/5"
          } ${status === "uploading" ? "pointer-events-none opacity-70" : ""}`}
        >
          <span className={`font-bold text-deep-red ${preview === "circle" ? "text-[10px] leading-4" : "text-base"}`}>
            {preview === "circle" ? "رفع" : "اسحب الصورة هنا أو اضغط للاختيار"}
          </span>
          {preview === "circle" ? null : (
            <span className="mt-2 text-sm text-deep-red/70">
              JPG أو PNG أو WEBP بحد أقصى 4.5 ميجابايت
            </span>
          )}
          <input
            ref={inputRef}
            type="file"
            name="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            aria-label="اختيار صورة"
            disabled={status === "uploading"}
            onChange={(event) => {
              void handleFile(event.target.files?.[0]);
            }}
          />
        </label>
      )}

      {status !== "idle" ? (
        <p
          role="status"
          aria-live="polite"
          className={`text-sm font-medium ${
            status === "success"
              ? "text-green-700"
              : status === "error"
                ? "text-coptic-gold-dark"
                : "text-deep-red"
          }`}
        >
          {status === "error" && errorMessage
            ? errorMessage
            : statusMessages[status]}
        </p>
      ) : null}
    </div>
  );
}
