"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  createService,
  deleteService,
  updateService,
} from "@/actions/admin-actions";
import ImageUpload from "@/components/admin/ImageUpload";
import SlideOver from "@/components/admin/SlideOver";

export type ServiceRow = {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
};

const emptyForm = {
  title: "",
  description: "",
  imageUrl: "",
};

export default function ServiceManager({ services }: { services: ServiceRow[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setOpen(true);
  }

  function openEdit(service: ServiceRow) {
    setEditing(service);
    setForm({
      title: service.title,
      description: service.description,
      imageUrl: service.imageUrl ?? "",
    });
    setError("");
    setOpen(true);
  }

  async function handleSave() {
    setIsSaving(true);
    setError("");

    const data = {
      title: form.title,
      description: form.description,
      imageUrl: form.imageUrl,
    };

    const result = editing
      ? await updateService(editing.id, data)
      : await createService(data);

    setIsSaving(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setOpen(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!window.confirm("هل تريد حذف هذا القطاع؟")) {
      return;
    }

    const result = await deleteService(id);
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
          إدارة قطاعات الخدمات
        </h1>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex min-h-11 items-center rounded-xl bg-linear-to-r from-coptic-gold-light to-coptic-gold-dark px-4 text-sm font-bold text-black"
        >
          إضافة قطاع
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-coptic-gold-main/40 bg-white/80">
        <table className="min-w-full text-right text-sm">
          <thead className="bg-gray-900 text-coptic-gold-main">
            <tr>
              <th className="px-4 py-3">الصورة</th>
              <th className="px-4 py-3">الاسم</th>
              <th className="px-4 py-3">الوصف</th>
              <th className="px-4 py-3">الإجراء</th>
            </tr>
          </thead>
          <tbody>
            {services.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-deep-red/70">
                  لا توجد قطاعات بعد. أضف القطاع من الزر أعلاه.
                </td>
              </tr>
            ) : (
              services.map((service) => (
                <tr key={service.id} className="border-t border-coptic-gold-main/20">
                  <td className="px-4 py-3">
                    {service.imageUrl ? (
                      <Image
                        src={service.imageUrl}
                        alt={service.title}
                        width={64}
                        height={48}
                        unoptimized
                        className="h-12 w-16 rounded-md object-cover"
                      />
                    ) : (
                      <span className="text-deep-red/50">بدون صورة</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-bold text-deep-red">
                    {service.title}
                  </td>
                  <td className="max-w-xs px-4 py-3 text-deep-red/80">
                    <p className="line-clamp-2">{service.description || "—"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(service)}
                        className="inline-flex min-h-11 items-center rounded-full border border-coptic-gold-main px-3 text-xs font-bold text-coptic-gold-dark"
                      >
                        تعديل
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(service.id)}
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
        title={editing ? "تعديل قطاع" : "إضافة قطاع"}
        onClose={() => setOpen(false)}
      >
        <div className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-bold text-deep-red">اسم القطاع</span>
            <input
              type="text"
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
              className="w-full rounded-xl border border-coptic-gold-main/40 bg-white px-3 py-2 text-deep-red outline-none focus:ring-2 focus:ring-coptic-gold-main"
              aria-label="اسم القطاع"
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
              rows={5}
              className="w-full rounded-xl border border-coptic-gold-main/40 bg-white px-3 py-2 text-sm leading-7 text-deep-red outline-none focus:ring-2 focus:ring-coptic-gold-main"
              aria-label="الوصف"
            />
          </label>

          <ImageUpload
            value={form.imageUrl}
            onChange={(url) =>
              setForm((current) => ({ ...current, imageUrl: url }))
            }
            label="الصورة"
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
