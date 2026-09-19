"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { removeLibraryItem, saveLibraryItem } from "@/actions/media";
import { updateItemOrder } from "@/actions/reorder";
import {
  AdminActions,
  AdminPageHeader,
  adminActionMuted,
  adminActionOutline,
} from "@/components/admin/admin-ui";
import DraggableList from "@/components/admin/DraggableList";
import FileUpload, {
  type UploadedLibraryFile,
} from "@/components/admin/FileUpload";
import ImageDisplayModeField from "@/components/admin/ImageDisplayModeField";
import ImageUpload from "@/components/admin/ImageUpload";
import SlideOver from "@/components/admin/SlideOver";
import type { MediaFileType } from "@/lib/cloudinary";
import type { ImageDisplayMode } from "@/lib/image-display";
import { mediaFileTypeLabel, mediaGalleryImage } from "@/lib/media";

export type MediaItemRow = {
  id: string;
  title: string;
  fileUrl: string | null;
  fileName: string | null;
  fileType: MediaFileType;
  thumbnail: string | null;
  imageDisplayMode: ImageDisplayMode;
  link: string | null;
  linkLabel: string | null;
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
  const [rows, setRows] = useState(items);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MediaItemRow | null>(null);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<UploadedLibraryFile | null>(null);
  const [thumbnail, setThumbnail] = useState("");
  const [imageDisplayMode, setImageDisplayMode] =
    useState<ImageDisplayMode>("NORMAL");
  const [link, setLink] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setRows(items);
  }, [items]);

  function handleReorder(next: MediaItemRow[]) {
    const previous = rows;
    setRows(next);
    void updateItemOrder(
      "MediaItem",
      next.map((item, index) => ({ id: item.id, order: index })),
    ).then((result) => {
      if (!result.success) {
        setRows(previous);
        window.alert(result.error);
      }
    });
  }

  function resetForm() {
    setTitle("");
    setFile(null);
    setThumbnail("");
    setImageDisplayMode("NORMAL");
    setLink("");
    setLinkLabel("");
    setError("");
  }

  function openCreate() {
    setEditing(null);
    resetForm();
    setOpen(true);
  }

  function openEdit(item: MediaItemRow) {
    setEditing(item);
    setTitle(item.title);
    setFile(
      item.fileUrl
        ? {
            url: item.fileUrl,
            fileName: item.fileName ?? item.title,
            fileType: item.fileType === "link" ? "image" : item.fileType,
          }
        : null,
    );
    setThumbnail(item.thumbnail ?? "");
    setImageDisplayMode(item.imageDisplayMode ?? "NORMAL");
    setLink(item.link ?? "");
    setLinkLabel(item.linkLabel ?? "");
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
        imageDisplayMode: "NORMAL",
        link: null,
        linkLabel: null,
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
    setIsSaving(true);
    setError("");

    const result = await saveLibraryItem({
      id: editing?.id,
      collectionId,
      title,
      fileUrl: file?.url ?? null,
      fileName: file?.fileName ?? null,
      fileType: file?.fileType ?? "link",
      thumbnail,
      imageDisplayMode,
      link,
      linkLabel,
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
      <AdminPageHeader
        title={
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
        }
        action={
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-linear-to-r from-coptic-gold-light to-coptic-gold-dark px-4 text-sm font-bold text-black sm:w-auto"
          >
            إضافة ملفات
          </button>
        }
      />

      <DraggableList
        items={rows}
        onReorder={handleReorder}
        emptyLabel="لا توجد ملفات في هذا القسم بعد."
      >
        {(item) => {
          const preview = mediaGalleryImage(item);

          return (
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="flex min-w-0 flex-1 gap-3">
                {preview ? (
                  <Image
                    src={preview}
                    alt={item.title.trim() || mediaFileTypeLabel(item.fileType)}
                    width={72}
                    height={56}
                    unoptimized
                    className="h-14 w-16 shrink-0 rounded-md object-cover"
                  />
                ) : (
                  <span className="flex h-14 w-16 shrink-0 items-center justify-center rounded-md bg-cream text-center text-xs font-bold text-coptic-gold-dark">
                    {mediaFileTypeLabel(item.fileType)}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-deep-red">
                    {item.title.trim() || "—"}
                  </p>
                  <p className="mt-1 text-xs font-bold text-coptic-gold-dark">
                    {mediaFileTypeLabel(item.fileType)}
                  </p>
                </div>
              </div>
              <AdminActions>
                <button
                  type="button"
                  onClick={() => openEdit(item)}
                  className={adminActionOutline}
                >
                  تعديل
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(item.id)}
                  className={adminActionMuted}
                >
                  حذف
                </button>
              </AdminActions>
            </div>
          );
        }}
      </DraggableList>

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
            label="الملف (اختياري)"
            multiple={!editing}
            current={file}
            onUploaded={(files) => void handleUploaded(files)}
            onClear={() => setFile(null)}
          />

          <ImageUpload
            key={editing ? `thumbnail-${editing.id}` : "thumbnail-new"}
            value={thumbnail}
            onChange={setThumbnail}
            label="thumbnail"
            hint={null}
            preview={imageDisplayMode === "PORTRAIT_450_730" ? "portrait" : "story"}
          />
          <ImageDisplayModeField
            value={imageDisplayMode}
            onChange={setImageDisplayMode}
          />

          <label className="block space-y-2">
            <span className="text-sm font-bold text-deep-red">
              الرابط (اختياري)
            </span>
            <input
              type="url"
              dir="ltr"
              value={link}
              onChange={(event) => setLink(event.target.value)}
              placeholder="https://example.com"
              className="w-full rounded-xl border border-coptic-gold-main/40 bg-white px-3 py-2 text-left text-deep-red outline-none focus:ring-2 focus:ring-coptic-gold-main"
              aria-label="رابط الملف"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-bold text-deep-red">
              تسمية الرابط (اختياري)
            </span>
            <input
              type="text"
              value={linkLabel}
              onChange={(event) => setLinkLabel(event.target.value)}
              placeholder="مثال: اقرأ المزيد"
              className="w-full rounded-xl border border-coptic-gold-main/40 bg-white px-3 py-2 text-deep-red outline-none focus:ring-2 focus:ring-coptic-gold-main"
              aria-label="تسمية الرابط"
            />
          </label>

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
