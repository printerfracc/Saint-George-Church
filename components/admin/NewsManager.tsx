"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  createNewsEvent,
  deleteNewsEvent,
  updateNewsEvent,
} from "@/actions/admin-actions";
import ImageUpload from "@/components/admin/ImageUpload";
import SlideOver from "@/components/admin/SlideOver";
import {
  AdminActions,
  AdminMobileCard,
  AdminPageHeader,
  AdminResponsiveTable,
  adminActionMuted,
  adminActionOutline,
} from "@/components/admin/admin-ui";

export type NewsRow = {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  isActive: boolean;
};

const emptyForm = {
  title: "",
  description: "",
  imageUrl: "",
  isActive: true,
};

export default function NewsManager({ news }: { news: NewsRow[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<NewsRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setOpen(true);
  }

  function openEdit(item: NewsRow) {
    setEditing(item);
    setForm({
      title: item.title,
      description: item.description,
      imageUrl: item.imageUrl ?? "",
      isActive: item.isActive,
    });
    setError("");
    setOpen(true);
  }

  async function handleSave() {
    setIsSaving(true);
    setError("");

    const formData = new FormData();
    formData.set("title", form.title);
    formData.set("description", form.description);
    formData.set("imageUrl", form.imageUrl);
    formData.set("isActive", form.isActive ? "true" : "false");

    const result = editing
      ? await updateNewsEvent(editing.id, formData)
      : await createNewsEvent(formData);

    setIsSaving(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setOpen(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!window.confirm("هل تريد حذف هذا الخبر؟")) {
      return;
    }

    const result = await deleteNewsEvent(id);
    if (!result.success) {
      window.alert(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <>
      <AdminPageHeader
        title="إدارة الأخبار"
        action={
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-linear-to-r from-coptic-gold-light to-coptic-gold-dark px-4 text-sm font-bold text-black sm:w-auto"
          >
            إضافة خبر
          </button>
        }
      />

      <AdminResponsiveTable
        empty={news.length === 0}
        emptyLabel="لا توجد بيانات"
        colSpan={4}
        head={
          <>
            <th className="px-4 py-3">الصورة</th>
            <th className="px-4 py-3">العنوان</th>
            <th className="px-4 py-3">الحالة</th>
            <th className="px-4 py-3">الإجراء</th>
          </>
        }
        cards={news.map((item) => (
          <AdminMobileCard key={item.id}>
            <div className="flex gap-3">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  width={64}
                  height={48}
                  unoptimized
                  className="h-12 w-16 shrink-0 rounded-md object-cover"
                />
              ) : (
                <span className="flex h-12 w-16 shrink-0 items-center justify-center rounded-md bg-cream text-xs font-bold text-deep-red/50">
                  بدون
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-bold text-deep-red">{item.title}</p>
                <p className="mt-1 text-xs font-bold text-coptic-gold-dark">
                  {item.isActive ? "منشور" : "مخفي"}
                </p>
              </div>
            </div>
            <div className="mt-3">
              <AdminActions>
                <button type="button" onClick={() => openEdit(item)} className={adminActionOutline}>
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
        ))}
        rows={news.map((item) => (
          <tr key={item.id} className="border-t border-gold/20">
            <td className="px-4 py-3">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  width={64}
                  height={48}
                  unoptimized
                  className="h-12 w-16 rounded-md object-cover"
                />
              ) : (
                <span className="text-deep-red/50">بدون صورة</span>
              )}
            </td>
            <td className="px-4 py-3 font-bold">{item.title}</td>
            <td className="px-4 py-3">{item.isActive ? "منشور" : "مخفي"}</td>
            <td className="px-4 py-3">
              <AdminActions>
                <button type="button" onClick={() => openEdit(item)} className={adminActionOutline}>
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
        ))}
      />

      <SlideOver
        open={open}
        title={editing ? "تعديل خبر" : "إضافة خبر"}
        onClose={() => setOpen(false)}
      >
        <div className="space-y-4">
          <ImageUpload
            label="صورة الخبر"
            preview="wide"
            value={form.imageUrl}
            onChange={(url) => setForm((current) => ({ ...current, imageUrl: url }))}
          />
          <label className="block text-sm font-bold">
            العنوان
            <input
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
              className="mt-2 w-full rounded-xl border border-deep-red/20 bg-white px-4 py-3"
            />
          </label>
          <label className="block text-sm font-bold">
            الوصف
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              rows={5}
              className="mt-2 w-full rounded-xl border border-deep-red/20 bg-white px-4 py-3"
            />
          </label>
          <label className="flex items-center gap-2 text-sm font-bold">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  isActive: event.target.checked,
                }))
              }
            />
            منشور على الموقع
          </label>
          {error ? <p className="text-sm font-medium text-coptic-gold-dark">{error}</p> : null}
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving}
            className="w-full min-h-11 rounded-xl bg-linear-to-r from-coptic-gold-light to-coptic-gold-dark py-3 text-sm font-bold text-black disabled:opacity-60"
          >
            {isSaving ? "جاري الحفظ..." : "حفظ"}
          </button>
        </div>
      </SlideOver>
    </>
  );
}
