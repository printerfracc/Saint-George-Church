"use client";

import { useRef, useState, type ChangeEvent } from "react";
import Image from "next/image";
import {
  abortLibraryUpload,
  completeLibraryUpload,
  uploadLibraryChunk,
  uploadLibraryMedia,
} from "@/actions/upload-media";
import {
  CLOUDINARY_UPLOAD_LIMIT_BYTES,
  detectLibraryFileType,
  LIBRARY_DIRECT_UPLOAD_LIMIT_BYTES,
  LIBRARY_UPLOAD_CHUNK_BYTES,
  mediaFileTypeLabel,
  type MediaFileType,
} from "@/lib/media";

const toast = {
  error(message: string, show: (value: string) => void) {
    show(message);
  },
};

export type UploadedLibraryFile = {
  url: string;
  fileName: string;
  fileType: MediaFileType;
};

type FileUploadProps = {
  label?: string;
  multiple?: boolean;
  current?: UploadedLibraryFile | null;
  onUploaded: (files: UploadedLibraryFile[]) => void;
  onClear?: () => void;
};

export default function FileUpload({
  label = "رفع ملفات",
  multiple = true,
  current = null,
  onUploaded,
  onClear,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  async function uploadOneFile(file: File, onProgress: (message: string) => void) {
    if (file.size <= LIBRARY_DIRECT_UPLOAD_LIMIT_BYTES) {
      const formData = new FormData();
      formData.append("file", file);
      return uploadLibraryMedia(formData);
    }

    const uploadId = crypto.randomUUID();
    const total = Math.ceil(file.size / LIBRARY_UPLOAD_CHUNK_BYTES);

    try {
      for (let index = 0; index < total; index += 1) {
        const start = index * LIBRARY_UPLOAD_CHUNK_BYTES;
        const chunk = file.slice(
          start,
          Math.min(file.size, start + LIBRARY_UPLOAD_CHUNK_BYTES),
        );
        const formData = new FormData();
        formData.append("chunk", chunk, file.name);
        formData.append("uploadId", uploadId);
        formData.append("index", String(index));
        formData.append("total", String(total));
        onProgress(`جاري الرفع... ${index + 1} من ${total}`);

        const part = await uploadLibraryChunk(formData);
        if (!part.success) {
          await abortLibraryUpload(uploadId, total);
          return part;
        }
      }

      return completeLibraryUpload({
        uploadId,
        total,
        fileName: file.name,
        contentType: file.type,
      });
    } catch (error) {
      await abortLibraryUpload(uploadId, total);
      throw error;
    }
  }

function showError(message: string) {
    toast.error(message, setError);
    setStatus("");
  }

  function resetFileInput() {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function isOverCloudinaryLimit(file: File) {
    return file.size > CLOUDINARY_UPLOAD_LIMIT_BYTES;
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file && isOverCloudinaryLimit(file)) {
      showError("حجم الملف يتخطى 10 ميجابايت. يرجى ضغط الملف.");
      resetFileInput();
      return;
    }

    void handleFiles(event.target.files);
  }

  async function handleFiles(fileList: FileList | null) {
    const files = Array.from(fileList ?? []);
    if (files.length === 0) {
      return;
    }

    const oversized = files.find(isOverCloudinaryLimit);
    if (oversized) {
      showError("حجم الملف يتخطى 10 ميجابايت. يرجى ضغط الملف.");
      resetFileInput();
      return;
    }

    const unsupported = files.find((file) => !detectLibraryFileType(file));
    if (unsupported) {
      showError("يُسمح برفع الصور أو ملفات PDF أو Word فقط");
      resetFileInput();
      return;
    }

    setIsUploading(true);
    setError("");
    setStatus("جاري الرفع...");

    const uploaded: UploadedLibraryFile[] = [];

    try {
      for (const file of files) {
        const fileType = detectLibraryFileType(file);
        if (!fileType) {
          showError("نوع الملف غير مدعوم");
          setIsUploading(false);
          return;
        }

        const result = await uploadOneFile(file, setStatus);

        if (!result.success) {
          showError(result.error);
          setIsUploading(false);
          return;
        }

        uploaded.push({
          url: result.url,
          fileName: result.fileName,
          fileType: result.fileType,
        });
      }

      onUploaded(uploaded);
      setStatus(
        uploaded.length === 1
          ? `تم رفع ${mediaFileTypeLabel(uploaded[0].fileType)}`
          : `تم رفع ${uploaded.length} ملفات`,
      );
    } catch {
      setIsUploading(false);
      toast.error("فشل رفع الملف. حاول مرة أخرى.", setError);
      setStatus("");
    } finally {
      setIsUploading(false);
      resetFileInput();
    }
  }

  const dropClasses = `flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-8 text-center ${
    isDragging
      ? "border-coptic-gold-main bg-coptic-gold-light/15"
      : "border-deep-red/30 bg-white/70 hover:border-coptic-gold-main"
  } ${isUploading ? "pointer-events-none opacity-70" : ""}`;

  return (
    <div className="space-y-3">
      <p className="text-sm font-bold text-deep-red">{label}</p>

      {current ? (
        <div className="overflow-hidden rounded-2xl border border-coptic-gold-main/40 bg-white/80">
          {current.fileType === "image" ? (
            <div className="relative aspect-4/3 bg-[#1A0A10]">
              <Image
                src={current.url}
                alt={current.fileName || "الملف الحالي"}
                fill
                unoptimized
                className="object-contain"
              />
            </div>
          ) : (
            <div className="flex min-h-40 flex-col items-center justify-center bg-gray-900 px-4 py-8 text-center">
              <p className="text-sm font-bold text-coptic-gold-light">
                {mediaFileTypeLabel(current.fileType)}
              </p>
              <a
                href={current.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 rounded-full border border-coptic-gold-main px-4 py-1.5 text-xs font-bold text-coptic-gold-light"
              >
                فتح الملف
              </a>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3">
            <p className="text-xs font-bold text-deep-red">
              {current.fileName || mediaFileTypeLabel(current.fileType)}
            </p>
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex min-h-11 cursor-pointer items-center rounded-full border border-coptic-gold-main px-3 text-xs font-bold text-coptic-gold-dark">
                تغيير الملف
                <input
                  ref={inputRef}
                  type="file"
                  multiple={multiple}
                  accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,.pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="sr-only"
                  aria-label="تغيير الملف"
                  disabled={isUploading}
                  onChange={handleInputChange}
                />
              </label>
              {onClear ? (
                <button
                  type="button"
                  onClick={onClear}
                  className="inline-flex min-h-11 items-center rounded-full bg-coptic-gold-main/15 px-3 text-xs font-bold text-coptic-gold-dark"
                >
                  إزالة الملف
                </button>
              ) : null}
            </div>
          </div>
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
            void handleFiles(event.dataTransfer.files);
          }}
          className={dropClasses}
        >
          <span className="font-bold text-deep-red">
            اسحب الملفات هنا أو اضغط للاختيار
          </span>
          <span className="mt-2 text-sm text-deep-red/70">
            صور أو PDF أو Word بحد أقصى 10 ميجابايت لكل ملف
          </span>
          <input
            ref={inputRef}
            type="file"
            multiple={multiple}
            accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,.pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="sr-only"
            aria-label="اختيار ملفات"
            disabled={isUploading}
            onChange={handleInputChange}
          />
        </label>
      )}
      {status ? <p className="text-sm font-medium text-green-700">{status}</p> : null}
      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-deep-red/30 bg-deep-red/10 px-3 py-2 text-sm font-bold text-deep-red"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
