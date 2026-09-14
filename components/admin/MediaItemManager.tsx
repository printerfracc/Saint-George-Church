"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { removeLibraryItem, saveLibraryItem } from "@/actions/media";
import FileUpload, {
  type UploadedLibraryFile,
} from "@/components/admin/FileUpload";
import ImageUpload from "@/components/admin/ImageUpload";
import SlideOver from "@/components/admin/SlideOver";
import type { MediaFileType } from "@/lib/cloudinary";
import { mediaFileTypeLabel, mediaGalleryImage } from "@/lib/media";

export type MediaItemRow = {
  id: string;
  title: string;
  fileUrl: string;
  fileName: string | null;
  fileType: MediaFileType;
  thumbnail: string | null;
};

export default function MediaItemManager({
  collectionId,
  collectionTitle,
  items,
}: {
  collectionId: string;
  collectionTitle: string;
  items: MediaItemRow[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MediaItemRow | null>(null);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<UploadedLibraryFile | null>(null);
  const [thumbnail, setThumbnail] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function openCreate() {
    setEditing(null);
    setTitle("");
    setFile(null);
    setThumbnail("");
    setError("");
    setOpen(true);
  }

  function openEdit(item: MediaItemRow) {
    setEditing(item);
    setTitle(item.title);
    setFile({
      url: item.fileUrl,
      fileName: item.fileName ?? item.title,
      fileType: item.fileType,
    });
    setThumbnail(item.thumbnail ?? "");
    setError("");
    setOpen(true);
  }

  async function handleUploaded(files: UploadedLibraryFile[]) {
    if (editing || files.length === 1) {
      setFile(files[0]);
      return;
    }

    setIsSaving(true);
    setError("");

    for (const uploaded of files) {
      const result = await saveLibraryItem({
        collectionId,
        title: "",
        fileUrl: uploaded.url,
        fileName: uploaded.fileName,
        fileType: uploaded.fileType,
        thumbnail: null,
      });

      if (!result.success) {
        setIsSaving(false);
        setError(result.error);
        return;
      }
    }

    setIsSaving(false);
    setOpen(false);
    router.refresh();
  }

  async function handleSave() {
    if (!file) {
      setError("يرجى رفع ملف");
      return;
    }

    setIsSaving(true);
    setError("");

    const result = await saveLibraryItem({
      id: editing?.id,
      collectionId,
      title,
      fileUrl: file.url,
      fileName: file.fileName,
      fileType: file.fileType,
      thumbnail,
    });

    setIsSaving(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setOpen(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!window.confirm("هل تريد حذف هذا الملف؟")) {
      return;
    }

    const result = await removeLibraryItem(id, collectionId);
    if (!result.success) {
      window.alert(result.error);
      return;
    }

    router.refresh();
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/admin/media"
            className="text-sm font-bold text-coptic-gold-dark"
          >
            العودة إلى الأقسام
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-deep-red md:text-3xl">
            {collectionTitle}
          </h1>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex min-h-11 items-center rounded-xl bg-linear-to-r from-coptic-gold-light to-coptic-gold-dark px-4 text-sm font-bold text-black"
        >
          إضافة ملفات
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-coptic-gold-main/40 bg-white/80">
        <table className="min-w-full text-right text-sm">
          <thead className="bg-gray-900 text-coptic-gold-main">
            <tr>
              <th className="px-4 py-3">Thumbnail</th>
              <th className="px-4 py-3">العنوان</th>
              <th className="px-4 py-3">النوع</th>
              <th className="px-4 py-3">الإجراء</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-deep-red/70">
                  لا توجد ملفات في هذا القسم بعد.
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const preview = mediaGalleryImage(item);

                return (
                  <tr key={item.id} className="border-t border-coptic-gold-main/20">
                    <td className="px-4 py-3">
                      {preview ? (
                        <Image
                          src={preview}
                          alt={item.title.trim() || mediaFileTypeLabel(item.fileType)}
                          width={64}
                          height={48}
                          unoptimized
                          className="h-12 w-16 rounded-md object-cover"
                        />
                      ) : (
                        <span className="text-xs font-bold text-coptic-gold-dark">
                          {mediaFileTypeLabel(item.fileType)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-bold text-deep-red">
                      {item.title.trim() || "—"}
                    </td>
                    <td className="px-4 py-3">{mediaFileTypeLabel(item.fileType)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="inline-flex min-h-11 items-center rounded-full border border-coptic-gold-main px-3 text-xs font-bold text-coptic-gold-dark"
                        >
                          تعديل
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(item.id)}
                          className="inline-flex min-h-11 items-center rounded-full bg-coptic-gold-main/15 px-3 text-xs font-bold text-coptic-gold-dark"
                        >
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <SlideOver
        open={open}
        title={editing ? "تعديل ملف" : "إضافة ملفات"}
        onClose={() => setOpen(false)}
      >
        <div className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-bold text-deep-red">
              العنوان (اختياري)
            </span>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-xl border border-coptic-gold-main/40 bg-white px-3 py-2 text-deep-red outline-none focus:ring-2 focus:ring-coptic-gold-main"
              aria-label="عنوان الملف"
            />
          </label>

          <FileUpload
            key={editing ? `file-${editing.id}` : "file-new"}
            label="الملف"
            multiple={!editing}
            current={file}
            onUploaded={(files) => void handleUploaded(files)}
          />

          <ImageUpload
            key={editing ? `thumbnail-${editing.id}` : "thumbnail-new"}
            value={thumbnail}
            onChange={setThumbnail}
            label="Thumbnail"
            hint={null}
            preview="story"
          />

          {error ? <p className="text-sm font-bold text-coptic-gold-dark">{error}</p> : null}

          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving}
            className="w-full min-h-11 rounded-xl bg-linear-to-r from-coptic-gold-light to-coptic-gold-dark px-4 text-sm font-bold text-black disabled:opacity-60"
          >
            {isSaving ? "جاري الحفظ..." : "حفظ"}
          </button>
        </div>
      </SlideOver>
    </>
  );
}
