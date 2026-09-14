"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import ImageUpload, {
  type ImagePreviewVariant,
} from "@/components/admin/ImageUpload";
import SlideOver from "@/components/admin/SlideOver";

export type NamedItemRow = {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
};

type ActionResult = { success: true } | { success: false; error: string };

type NamedItemManagerProps = {
  title: string;
  addLabel: string;
  emptyLabel: string;
  deleteConfirm: string;
  items: NamedItemRow[];
  onCreate: (data: {
    name: string;
    description: string;
    imageUrl?: string | null;
  }) => Promise<ActionResult>;
  onUpdate: (
    id: string,
    data: {
      name: string;
      description: string;
      imageUrl?: string | null;
    },
  ) => Promise<ActionResult>;
  onDelete: (id: string) => Promise<ActionResult>;
  preview?: ImagePreviewVariant;
};

const emptyForm = {
  name: "",
  description: "",
  imageUrl: "",
};

export default function NamedItemManager({
  title,
  addLabel,
  emptyLabel,
  deleteConfirm,
  items,
  onCreate,
  onUpdate,
  onDelete,
  preview = "wide",
}: NamedItemManagerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<NamedItemRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setOpen(true);
  }

  function openEdit(item: NamedItemRow) {
    setEditing(item);
    setForm({
      name: item.name,
      description: item.description,
      imageUrl: item.imageUrl ?? "",
    });
    setError("");
    setOpen(true);
  }

  async function handleSave() {
    setIsSaving(true);
    setError("");

    const data = {
      name: form.name,
      description: form.description,
      imageUrl: form.imageUrl,
    };

    const result = editing
      ? await onUpdate(editing.id, data)
      : await onCreate(data);

    setIsSaving(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setOpen(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!window.confirm(deleteConfirm)) {
      return;
    }

    const result = await onDelete(id);
    if (!result.success) {
      window.alert(result.error);
      return;
    }

    router.refresh();
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-deep-red md:text-3xl">{title}</h1>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex min-h-11 items-center rounded-xl bg-linear-to-r from-coptic-gold-light to-coptic-gold-dark px-4 text-sm font-bold text-black"
        >
          {addLabel}
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
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-deep-red/70">
                  {emptyLabel}
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-t border-coptic-gold-main/20">
                  <td className="px-4 py-3">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        width={96}
                        height={72}
                        unoptimized
                        className={
                          preview === "activity"
                            ? "h-16 w-24 rounded-2xl object-cover"
                            : "h-16 w-[5.3rem] rounded-3xl object-cover"
                        }
                      />
                    ) : (
                      <span className="text-deep-red/50">بدون صورة</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-bold text-deep-red">{item.name}</td>
                  <td className="max-w-xs px-4 py-3 text-deep-red/80">
                    <p className="line-clamp-2">{item.description}</p>
                  </td>
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
              ))
            )}
          </tbody>
        </table>
      </div>

      <SlideOver
        open={open}
        title={editing ? "تعديل العنصر" : addLabel}
        onClose={() => setOpen(false)}
      >
        <div className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-bold text-deep-red">الاسم</span>
            <input
              type="text"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              className="w-full rounded-xl border border-coptic-gold-main/40 bg-white px-3 py-2 text-deep-red outline-none focus:ring-2 focus:ring-coptic-gold-main"
              aria-label="الاسم"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-bold text-deep-red">الوصف</span>
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              rows={6}
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
            preview={preview}
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
