"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createSermon,
  deleteSermon,
  updateSermon,
} from "@/actions/admin-actions";
import ImageUpload from "@/components/admin/ImageUpload";
import SlideOver from "@/components/admin/SlideOver";
import { formatAdminDate, toDateInputValue } from "@/lib/admin-labels";

export type SermonRow = {
  id: string;
  title: string;
  mediaUrl: string;
  date: string;
  priestId: string;
  priestName: string;
};

export type PriestOption = {
  id: string;
  name: string;
};

const emptyForm = {
  title: "",
  mediaUrl: "",
  date: "",
  priestId: "",
};

export default function SermonManager({
  sermons,
  priests,
}: {
  sermons: SermonRow[];
  priests: PriestOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SermonRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, priestId: priests[0]?.id ?? "" });
    setError("");
    setOpen(true);
  }

  function openEdit(sermon: SermonRow) {
    setEditing(sermon);
    setForm({
      title: sermon.title,
      mediaUrl: sermon.mediaUrl,
      date: toDateInputValue(sermon.date),
      priestId: sermon.priestId,
    });
    setError("");
    setOpen(true);
  }

  async function handleSave() {
    setIsSaving(true);
    setError("");

    const formData = new FormData();
    formData.set("title", form.title);
    formData.set("mediaUrl", form.mediaUrl);
    formData.set("date", form.date);
    formData.set("priestId", form.priestId);

    const result = editing
      ? await updateSermon(editing.id, formData)
      : await createSermon(formData);

    setIsSaving(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setOpen(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!window.confirm("هل تريد حذف هذه العظة؟")) {
      return;
    }

    const result = await deleteSermon(id);
    if (!result.success) {
      window.alert(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-deep-red">إدارة العظات</h1>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex min-h-11 items-center rounded-xl bg-linear-to-r from-coptic-gold-light to-coptic-gold-dark px-4 text-sm font-bold text-black"
        >
          إضافة عظة
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gold/40 bg-white/80">
        <table className="min-w-full text-right text-sm">
          <thead className="bg-gray-900 text-coptic-gold-main">
            <tr>
              <th className="px-4 py-3">العنوان</th>
              <th className="px-4 py-3">الكاهن</th>
              <th className="px-4 py-3">التاريخ</th>
              <th className="px-4 py-3">الإجراء</th>
            </tr>
          </thead>
          <tbody>
            {sermons.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-deep-red/70">
                  لا توجد بيانات
                </td>
              </tr>
            ) : (
              sermons.map((sermon) => (
                <tr key={sermon.id} className="border-t border-gold/20">
                  <td className="px-4 py-3 font-bold">{sermon.title}</td>
                  <td className="px-4 py-3">{sermon.priestName}</td>
                  <td className="px-4 py-3">{formatAdminDate(sermon.date)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(sermon)}
                        className="inline-flex min-h-11 items-center rounded-full border border-coptic-gold-main px-3 text-xs font-bold text-coptic-gold-dark"
                      >
                        تعديل
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(sermon.id)}
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
        title={editing ? "تعديل عظة" : "إضافة عظة"}
        onClose={() => setOpen(false)}
      >
        <div className="space-y-4">
          <ImageUpload
            label="صورة أو غلاف العظة"
            preview="wide"
            value={form.mediaUrl}
            onChange={(url) => setForm((current) => ({ ...current, mediaUrl: url }))}
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
            رابط الوسائط
            <input
              value={form.mediaUrl}
              onChange={(event) =>
                setForm((current) => ({ ...current, mediaUrl: event.target.value }))
              }
              placeholder="رابط يوتيوب أو صورة مرفوعة"
              className="mt-2 w-full rounded-xl border border-deep-red/20 bg-white px-4 py-3"
            />
          </label>
          <label className="block text-sm font-bold">
            التاريخ
            <input
              type="date"
              value={form.date}
              onChange={(event) =>
                setForm((current) => ({ ...current, date: event.target.value }))
              }
              className="mt-2 w-full rounded-xl border border-deep-red/20 bg-white px-4 py-3"
            />
          </label>
          <label className="block text-sm font-bold">
            الكاهن
            <select
              value={form.priestId}
              onChange={(event) =>
                setForm((current) => ({ ...current, priestId: event.target.value }))
              }
              className="mt-2 w-full rounded-xl border border-deep-red/20 bg-white px-4 py-3"
            >
              <option value="">اختر الكاهن</option>
              {priests.map((priest) => (
                <option key={priest.id} value={priest.id}>
                  {priest.name}
                </option>
              ))}
            </select>
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
