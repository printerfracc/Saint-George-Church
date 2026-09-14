"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  removeLibraryCollection,
  saveLibraryCollection,
} from "@/actions/media";
import ImageUpload from "@/components/admin/ImageUpload";
import SlideOver from "@/components/admin/SlideOver";

export type MediaCollectionRow = {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  itemCount: number;
};

const emptyForm = {
  title: "",
  description: "",
  imageUrl: "",
};

export default function MediaCollectionManager({
  collections,
}: {
  collections: MediaCollectionRow[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MediaCollectionRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setOpen(true);
  }

  function openEdit(collection: MediaCollectionRow) {
    setEditing(collection);
    setForm({
      title: collection.title,
      description: collection.description,
      imageUrl: collection.imageUrl ?? "",
    });
    setError("");
    setOpen(true);
  }

  async function handleSave() {
    setIsSaving(true);
    setError("");

    const result = await saveLibraryCollection({
      id: editing?.id,
      title: form.title,
      description: form.description,
      imageUrl: form.imageUrl,
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
    if (!window.confirm("هل تريد حذف هذا القسم وكل محتوياته؟")) {
      return;
    }

    const result = await removeLibraryCollection(id);
    if (!result.success) {
      window.alert(result.error);
      return;
    }

    router.refresh();
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-deep-red md:text-3xl">
          إدارة الوسائط والمكتبة
        </h1>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex min-h-11 items-center rounded-xl bg-linear-to-r from-coptic-gold-light to-coptic-gold-dark px-4 text-sm font-bold text-black"
        >
          إضافة قسم
        </button>
      </div>

      <p className="mb-6 text-sm leading-7 text-deep-red/75">
        أضف أقساماً مثل معرض الصور أو موسوعة الكتب، ثم افتح القسم لإضافة الملفات
        داخله.
      </p>

      <div className="overflow-x-auto rounded-2xl border border-coptic-gold-main/40 bg-white/80">
        <table className="min-w-full text-right text-sm">
          <thead className="bg-gray-900 text-coptic-gold-main">
            <tr>
              <th className="px-4 py-3">الغلاف</th>
              <th className="px-4 py-3">القسم</th>
              <th className="px-4 py-3">عدد الملفات</th>
              <th className="px-4 py-3">الإجراء</th>
            </tr>
          </thead>
          <tbody>
            {collections.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-deep-red/70">
                  لا توجد أقسام بعد. أضف معرض الصور أو الكتب من الزر أعلاه.
                </td>
              </tr>
            ) : (
              collections.map((collection) => (
                <tr key={collection.id} className="border-t border-coptic-gold-main/20">
                  <td className="px-4 py-3">
                    {collection.imageUrl ? (
                      <Image
                        src={collection.imageUrl}
                        alt={collection.title}
                        width={64}
                        height={48}
                        unoptimized
                        className="h-12 w-16 rounded-md object-cover"
                      />
                    ) : (
                      <span className="text-deep-red/50">بدون غلاف</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-bold text-deep-red">{collection.title}</p>
                    <p className="line-clamp-2 text-deep-red/70">
                      {collection.description || "—"}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-bold text-coptic-gold-dark">
                    {collection.itemCount}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/media/${collection.id}`}
                        className="rounded-full bg-gray-900 px-3 py-1 text-xs font-bold text-coptic-gold-main"
                      >
                        الملفات
                      </Link>
                      <button
                        type="button"
                        onClick={() => openEdit(collection)}
                        className="inline-flex min-h-11 items-center rounded-full border border-coptic-gold-main px-3 text-xs font-bold text-coptic-gold-dark"
                      >
                        تعديل
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(collection.id)}
                        className="inline-flex min-h-11 items-center rounded-full bg-coptic-gold-main/15 px-3 text-xs font-bold text-coptic-gold-dark"
                      >
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <SlideOver
        open={open}
        title={editing ? "تعديل قسم" : "إضافة قسم"}
        onClose={() => setOpen(false)}
      >
        <div className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-bold text-deep-red">اسم القسم</span>
            <input
              type="text"
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
              className="w-full rounded-xl border border-coptic-gold-main/40 bg-white px-3 py-2 text-deep-red outline-none focus:ring-2 focus:ring-coptic-gold-main"
              aria-label="اسم القسم"
              placeholder="مثال: معرض الصور"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-bold text-deep-red">الوصف (اختياري)</span>
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              rows={4}
              className="w-full rounded-xl border border-coptic-gold-main/40 bg-white px-3 py-2 text-sm leading-7 text-deep-red outline-none focus:ring-2 focus:ring-coptic-gold-main"
              aria-label="الوصف"
            />
          </label>

          <ImageUpload
            value={form.imageUrl}
            onChange={(url) =>
              setForm((current) => ({ ...current, imageUrl: url }))
            }
            label="صورة الغلاف (اختياري)"
            preview="wide"
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
