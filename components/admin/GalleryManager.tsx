"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { addGalleryImages, addGalleryYouTube, deleteGalleryMedia } from "@/actions/gallery";
import { uploadMedia } from "@/actions/upload-media";
import {
  AdminEmptyState,
  AdminPageHeader,
  adminActionDanger,
  adminActionGold,
} from "@/components/admin/admin-ui";
import { GALLERY_MEDIA_IMAGE, GALLERY_MEDIA_YOUTUBE } from "@/lib/eed-constants";
import { formatAdminDate } from "@/lib/admin-labels";
import { VERCEL_UPLOAD_LIMIT_BYTES } from "@/lib/media";
import { youtubeThumbnailUrl } from "@/lib/youtube";

export type GalleryAdminItem = {
  id: string;
  type: string;
  url: string;
  createdAt: string;
};

function typeLabel(type: string) {
  if (type === GALLERY_MEDIA_YOUTUBE) {
    return "يوتيوب";
  }
  return "صورة";
}

export default function GalleryManager({ items }: { items: GalleryAdminItem[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [pending, setPending] = useState<"image" | "youtube" | string | null>(null);

  async function handleFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (list.length === 0 || pending !== null) {
      return;
    }

    setPending("image");
    setError("");
    setNotice("");
    const uploaded: string[] = [];
    const failures: string[] = [];

    for (const [index, file] of list.entries()) {
      setUploadProgress(`جاري رفع الصور (${index + 1} من ${list.length})...`);

      if (file.size > VERCEL_UPLOAD_LIMIT_BYTES) {
        failures.push("أحد الملفات يتخطى 4.5 ميجابايت. يرجى ضغط الملف.");
        continue;
      }

      const formData = new FormData();
      formData.append("file", file);

      try {
        const result = await uploadMedia(formData);
        if (!result.success) {
          failures.push(result.error);
          continue;
        }
        uploaded.push(result.url);
      } catch {
        failures.push("فشل رفع أحد الملفات. يرجى المحاولة مرة أخرى.");
      }
    }

    if (uploaded.length > 0) {
      const saved = await addGalleryImages(uploaded);
      if (!saved.success) {
        failures.unshift(saved.error);
      } else {
        setNotice(uploaded.length === 1 ? "تمت إضافة الصورة" : `تمت إضافة ${uploaded.length} صور`);
        router.refresh();
      }
    }

    setError(failures[0] ?? "");
    setUploadProgress("");
    setPending(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function handleAddYouTube() {
    setPending("youtube");
    setError("");
    setNotice("");
    const result = await addGalleryYouTube(youtubeUrl);
    setPending(null);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setYoutubeUrl("");
    setNotice("تمت إضافة الفيديو");
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!window.confirm("هل تريد حذف هذه الوسائط من معرض الصور؟")) {
      return;
    }

    setPending(id);
    setError("");
    setNotice("");
    const result = await deleteGalleryMedia(id);
    setPending(null);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setNotice("تم الحذف");
    router.refresh();
  }

  return (
    <div>
      <AdminPageHeader
        title="إدارة الصور"
        description={
          <p className="mt-2 text-sm leading-7 text-deep-red/70">
            أضف صور وفيديوهات يوم عيد الخدام. تظهر للخدام بعد تسجيل الدخول، وذلك بعد نشر التوزيعة.
          </p>
        }
      />

      <section className="grid gap-6 rounded-2xl border border-coptic-gold-main/40 bg-white/80 p-5 shadow-sm lg:grid-cols-2 md:p-7">
        <div className="space-y-3">
          <p className="text-sm font-bold text-deep-red">رفع الصور</p>
          <p className="text-xs leading-6 text-deep-red/65">
            يمكن اختيار أكثر من صورة مرة واحدة. تُنشر الصور فور اكتمال الرفع.
          </p>
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
            className={`flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-8 text-center ${
              isDragging
                ? "border-gold bg-gold/10"
                : "border-deep-red/30 bg-white/70 hover:border-gold hover:bg-gold/5"
            } ${pending === "image" ? "pointer-events-none opacity-70" : ""}`}
          >
            <span className="font-bold text-deep-red">اسحب الصور هنا أو اضغط للاختيار</span>
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
              disabled={pending !== null}
              onChange={(event) => {
                if (event.target.files) {
                  void handleFiles(event.target.files);
                }
              }}
            />
          </label>
          {uploadProgress ? (
            <p role="status" className="text-sm font-medium text-deep-red">
              {uploadProgress}
            </p>
          ) : null}
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-bold text-deep-red">رابط يوتيوب</span>
            <input
              type="url"
              value={youtubeUrl}
              onChange={(event) => setYoutubeUrl(event.target.value)}
              dir="ltr"
              placeholder="https://www.youtube.com/watch?v="
              className="mt-2 w-full rounded-xl border border-coptic-gold-main/40 bg-white px-3 py-2 text-left text-deep-red outline-none focus:ring-2 focus:ring-coptic-gold-main"
            />
          </label>
          <button
            type="button"
            className={adminActionGold}
            disabled={pending !== null || !youtubeUrl.trim()}
            onClick={() => void handleAddYouTube()}
          >
            {pending === "youtube" ? "جاري الإضافة..." : "إضافة الفيديو"}
          </button>
        </div>
      </section>

      {error ? (
        <p role="alert" className="mt-4 text-sm font-bold text-deep-red">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="mt-4 text-sm font-bold text-green-700">
          {notice}
        </p>
      ) : null}

      <section className="mt-8">
        {items.length === 0 ? (
          <AdminEmptyState>لا توجد وسائط في المعرض بعد</AdminEmptyState>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => {
              const preview =
                item.type === GALLERY_MEDIA_YOUTUBE
                  ? youtubeThumbnailUrl(item.url)
                  : item.type === GALLERY_MEDIA_IMAGE
                    ? item.url
                    : null;

              return (
                <li
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-coptic-gold-main/40 bg-white/80 shadow-sm"
                >
                  {preview ? (
                    <div className="relative aspect-video bg-[#1A0A10]">
                      <Image
                        src={preview}
                        alt={typeLabel(item.type)}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-video items-center justify-center bg-cream text-sm text-deep-red/70">
                      لا توجد معاينة
                    </div>
                  )}
                  <div className="space-y-3 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold text-deep-red">{typeLabel(item.type)}</p>
                      <p className="text-xs text-deep-red/60">
                        {formatAdminDate(item.createdAt)}
                      </p>
                    </div>
                    <button
                      type="button"
                      className={adminActionDanger}
                      disabled={pending !== null}
                      onClick={() => void handleDelete(item.id)}
                    >
                      {pending === item.id ? "جاري الحذف..." : "حذف"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
