"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { upsertContent } from "@/actions/content";
import ImageUpload from "@/components/admin/ImageUpload";
import SlideOver from "@/components/admin/SlideOver";
import { HOME_SECTIONS, type HomeSectionKey } from "@/lib/content";
import { formatAdminDate } from "@/lib/admin-labels";

export type ContentRow = {
  id: string;
  sectionKey: string;
  title: string;
  content: string;
  imageUrl: string | null;
  updatedAt: string;
};

type FormState = {
  title: string;
  content: string;
  imageUrl: string;
};

function emptyForm(sectionKey: HomeSectionKey): FormState {
  const section = HOME_SECTIONS.find((item) => item.key === sectionKey);

  return {
    title: section?.defaultTitle ?? "",
    content: section?.defaultContent ?? "",
    imageUrl: "",
  };
}

function formFromRecord(sectionKey: HomeSectionKey, record?: ContentRow): FormState {
  const base = emptyForm(sectionKey);

  if (!record) {
    return base;
  }

  return {
    title: record.title,
    content: record.content,
    imageUrl: record.imageUrl ?? "",
  };
}

export default function ContentManager({ records }: { records: ContentRow[] }) {
  const router = useRouter();
  const recordsByKey = useMemo(
    () => new Map(records.map((record) => [record.sectionKey, record])),
    [records],
  );
  const [open, setOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<HomeSectionKey | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm("church_story"));
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function openEdit(sectionKey: HomeSectionKey) {
    setEditingKey(sectionKey);
    setForm(formFromRecord(sectionKey, recordsByKey.get(sectionKey)));
    setError("");
    setOpen(true);
  }

  async function handleSave() {
    if (!editingKey) {
      return;
    }

    setIsSaving(true);
    setError("");

    const result = await upsertContent(editingKey, {
      title: form.title,
      content: form.content,
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

  const editingLabel = HOME_SECTIONS.find((item) => item.key === editingKey)?.label;

  return (
    <>
      <h1 className="text-2xl font-bold text-deep-red md:text-3xl">
        إدارة محتوى الصفحات
      </h1>
      <p className="mt-2 mb-8 text-sm leading-7 text-coptic-gold-dark/80">
        حدّث صورة الواجهة وقصة الكنيسة الظاهرة في الصفحة الرئيسية.
      </p>

      <ul className="space-y-4">
        {HOME_SECTIONS.map((section) => {
          const record = recordsByKey.get(section.key);

          return (
            <li
              key={section.key}
              className="overflow-hidden rounded-2xl border border-coptic-gold-main/40 bg-white/80 shadow-sm"
            >
              <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                {record?.imageUrl ? (
                  <div
                    className={`relative w-full shrink-0 overflow-hidden sm:w-40 ${
                      section.key === "hero"
                        ? "aspect-video bg-[#1A0A10]"
                        : "aspect-4/3 rounded-3xl border border-coptic-gold-main/40"
                    }`}
                  >
                    <Image
                      src={record.imageUrl}
                      alt={record.title}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                    {section.key === "hero" ? (
                      <div className="absolute inset-0 bg-black/60" />
                    ) : null}
                  </div>
                ) : (
                  <div
                    className={`flex w-full shrink-0 items-center justify-center border border-dashed border-coptic-gold-main/50 bg-cream text-xs font-bold text-coptic-gold-dark sm:w-40 ${
                      section.key === "hero"
                        ? "aspect-video"
                        : "aspect-4/3 rounded-3xl"
                    }`}
                  >
                    بدون صورة
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-coptic-gold-dark">
                    {section.label}
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-deep-red">
                    {record?.title ?? section.defaultTitle}
                  </h2>
                  <p className="mt-1 text-sm text-deep-red/70">
                    {record
                      ? `آخر تحديث: ${formatAdminDate(record.updatedAt)}`
                      : "لم يُنشر محتوى لهذا القسم بعد"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => openEdit(section.key)}
                  className="inline-flex min-h-11 items-center rounded-xl bg-linear-to-r from-coptic-gold-light to-coptic-gold-dark px-4 text-sm font-bold text-black"
                >
                  تعديل
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <SlideOver
        open={open}
        title={editingLabel ? `تعديل ${editingLabel}` : "تعديل المحتوى"}
        onClose={() => setOpen(false)}
      >
        <div className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-bold text-deep-red">
              {editingKey === "hero" ? "العنوان الرئيسي" : "العنوان"}
            </span>
            <input
              type="text"
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
              className="w-full rounded-xl border border-coptic-gold-main/40 bg-white px-3 py-2 text-deep-red outline-none focus:ring-2 focus:ring-coptic-gold-main"
              aria-label={editingKey === "hero" ? "العنوان الرئيسي" : "عنوان القسم"}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-bold text-deep-red">
              {editingKey === "hero" ? "النص الفرعي" : "المحتوى"}
            </span>
            <textarea
              value={form.content}
              onChange={(event) =>
                setForm((current) => ({ ...current, content: event.target.value }))
              }
              rows={editingKey === "hero" ? 4 : 8}
              className="w-full rounded-xl border border-coptic-gold-main/40 bg-white px-3 py-2 text-sm leading-7 text-deep-red outline-none focus:ring-2 focus:ring-coptic-gold-main"
              aria-label={editingKey === "hero" ? "النص الفرعي" : "نص القسم"}
            />
          </label>

          <ImageUpload
            value={form.imageUrl}
            onChange={(url) =>
              setForm((current) => ({ ...current, imageUrl: url }))
            }
            label={editingKey === "hero" ? "صورة الخلفية" : "صورة القسم"}
            preview={editingKey === "hero" ? "hero" : "story"}
          />

          {error ? <p className="text-sm font-bold text-coptic-gold-dark">{error}</p> : null}

          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving}
            className="w-full min-h-11 rounded-xl bg-linear-to-r from-coptic-gold-light to-coptic-gold-dark px-4 text-sm font-bold text-black disabled:opacity-60"
          >
            {isSaving ? "جاري الحفظ..." : "حفظ المحتوى"}
          </button>
        </div>
      </SlideOver>
    </>
  );
}
