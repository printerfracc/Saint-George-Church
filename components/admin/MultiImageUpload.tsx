"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { uploadMedia } from "@/actions/upload-media";
import { VERCEL_UPLOAD_LIMIT_BYTES } from "@/lib/media";

export default function MultiImageUpload({
  values,
  onChange,
  label = "الصور",
  hint = "يمكن رفع أكثر من صورة. ستظهر على الموقع بأسهم للتنقل بينها.",
}: {
  values: string[];
  onChange: (urls: string[]) => void;
  label?: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (list.length === 0) {
      return;
    }

    setIsUploading(true);
    setErrorMessage("");
    const uploaded: string[] = [];

    try {
      for (const file of list) {
        if (file.size > VERCEL_UPLOAD_LIMIT_BYTES) {
          setErrorMessage("أحد الملفات يتخطى 4.5 ميجابايت. يرجى ضغط الملف.");
          continue;
        }

        const formData = new FormData();
        formData.append("file", file);
        const result = await uploadMedia(formData);

        if (!result.success) {
          setErrorMessage(result.error);
          continue;
        }

        uploaded.push(result.url);
      }

      if (uploaded.length > 0) {
        onChange([...values, ...uploaded.filter((url) => !values.includes(url))]);
      }
    } catch {
      setErrorMessage("فشل رفع أحد الملفات. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <div className="w-full space-y-3">
      <p className="text-sm font-bold text-deep-red">{label}</p>
      {hint ? <p className="text-xs text-deep-red/65">{hint}</p> : null}

      {values.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3">
          {values.map((url, index) => (
            <li key={`${url}-${index}`} className="relative overflow-hidden rounded-2xl border border-coptic-gold-main/40">
              <div className="relative aspect-video bg-cream">
                <Image src={url} alt={`${label} ${index + 1}`} fill unoptimized className="object-cover" />
              </div>
              <button
                type="button"
                onClick={() => onChange(values.filter((item) => item !== url))}
                className="absolute top-2 left-2 min-h-11 rounded-full bg-coptic-gold-main px-3 text-xs font-bold text-black shadow-md"
                aria-label={`إزالة الصورة ${index + 1}`}
              >
                إزالة
              </button>
            </li>
          ))}
        </ul>
      ) : null}

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
          void uploadFiles(event.dataTransfer.files);
        }}
        className={`flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-6 text-center ${
          isDragging
            ? "border-gold bg-gold/10"
            : "border-deep-red/30 bg-white/70 hover:border-gold hover:bg-gold/5"
        } ${isUploading ? "pointer-events-none opacity-70" : ""}`}
      >
        <span className="font-bold text-deep-red">
          {values.length > 0 ? "إضافة صور أخرى" : "اسحب الصور هنا أو اضغط للاختيار"}
        </span>
        <span className="mt-2 text-sm text-deep-red/70">
          JPG أو PNG أو WEBP بحد أقصى 4.5 ميجابايت للصورة
        </span>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="sr-only"
          aria-label="اختيار صور"
          disabled={isUploading}
          onChange={(event) => {
            if (event.target.files) {
              void uploadFiles(event.target.files);
            }
          }}
        />
      </label>

      {isUploading ? (
        <p className="text-sm font-medium text-deep-red">جاري الرفع...</p>
      ) : null}
      {errorMessage ? (
        <p className="text-sm font-medium text-coptic-gold-dark">{errorMessage}</p>
      ) : null}
    </div>
  );
}
