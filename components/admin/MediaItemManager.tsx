"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { removeLibraryItem, saveLibraryItem } from "@/actions/media";
import {
  AdminActions,
  AdminMobileCard,
  AdminPageHeader,
  AdminResponsiveTable,
  adminActionMuted,
  adminActionOutline,
} from "@/components/admin/admin-ui";
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
  fileUrl: string | null;
  fileName: string | null;
  fileType: MediaFileType;
  thumbnail: string | null;
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
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MediaItemRow | null>(null);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<UploadedLibraryFile | null>(null);
  const [thumbnail, setThumbnail] = useState("");
  const [link, setLink] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function resetForm() {
    setTitle("");
    setFile(null);
    setThumbnail("");
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

      <AdminResponsiveTable
        empty={items.length === 0}
        emptyLabel="لا توجد ملفات في هذا القسم بعد."
        colSpan={4}
        head={
          <>
            <th className="px-4 py-3">thumbnail</th>
            <th className="px-4 py-3">العنوان</th>
            <th className="px-4 py-3">النوع</th>
            <th className="px-4 py-3">الإجراء</th>
          </>
        }
        cards={items.map((item) => {
          const preview = mediaGalleryImage(item);

          return (
            <AdminMobileCard key={item.id}>
              <div className="flex gap-3">
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
              <div className="mt-3">
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
            </AdminMobileCard>
          );
        })}
        rows={items.map((item) => {
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
              </td>
            </tr>
          );
        })}
      />

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
            preview="story"
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
