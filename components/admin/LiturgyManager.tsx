"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  createLiturgyEntry,
  deleteLiturgyEntry,
  updateLiturgyEntry,
} from "@/actions/liturgies";
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
import {
  ADMIN_LITURGY_SECTIONS,
  type AdminLiturgySectionKey,
  type LiturgySectionKey,
} from "@/lib/liturgies";

export type LiturgyRow = {
  id: string;
  section: LiturgySectionKey;
  title: string;
  description: string;
  detail: string | null;
  imageUrl: string | null;
};

const emptyForm = {
  title: "",
  description: "",
  detail: "",
  imageUrl: "",
};

export default function LiturgyManager({ entries }: { entries: LiturgyRow[] }) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<AdminLiturgySectionKey>("SCHEDULE");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LiturgyRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const grouped = useMemo(() => {
    return Object.fromEntries(
      ADMIN_LITURGY_SECTIONS.map((section) => [
        section.key,
        entries.filter((entry) => entry.section === section.key),
      ]),
    ) as Record<AdminLiturgySectionKey, LiturgyRow[]>;
  }, [entries]);

  const current = ADMIN_LITURGY_SECTIONS.find((section) => section.key === activeSection)!;
  const items = grouped[activeSection] ?? [];
  const isSchedule = activeSection === "SCHEDULE";

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setOpen(true);
  }

  function openEdit(item: LiturgyRow) {
    setEditing(item);
    setForm({
      title: item.title,
      description: item.description,
      detail: item.detail ?? "",
      imageUrl: item.imageUrl ?? "",
    });
    setError("");
    setOpen(true);
  }

  async function handleSave() {
    setIsSaving(true);
    setError("");

    const data = {
      section: activeSection,
      title: form.title,
      description: isSchedule ? "" : form.description,
      detail: form.detail,
      imageUrl: isSchedule ? "" : form.imageUrl,
    };

    const result = editing
      ? await updateLiturgyEntry(editing.id, data)
      : await createLiturgyEntry(data);

    setIsSaving(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setOpen(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!window.confirm("هل تريد حذف هذا العنصر؟")) {
      return;
    }

    const result = await deleteLiturgyEntry(id);
    if (!result.success) {
      window.alert(result.error);
      return;
    }

    router.refresh();
  }

  return (
    <>
      <AdminPageHeader
        title="إدارة صلوات الكنيسة"
        action={
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-linear-to-r from-coptic-gold-light to-coptic-gold-dark px-4 text-sm font-bold text-black sm:w-auto"
          >
            {current.addLabel}
          </button>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {ADMIN_LITURGY_SECTIONS.map((section) => {
          const count = grouped[section.key]?.length ?? 0;
          const isActive = section.key === activeSection;

          return (
            <button
              key={section.key}
              type="button"
              onClick={() => setActiveSection(section.key)}
              className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-bold transition ${
                isActive
                  ? "bg-gray-900 text-coptic-gold-main"
                  : "border border-coptic-gold-main/40 bg-white text-deep-red hover:border-coptic-gold-main"
              }`}
            >
              {section.label} ({count})
            </button>
          );
        })}
      </div>

      <AdminResponsiveTable
        empty={items.length === 0}
        emptyLabel={`لا توجد عناصر في ${current.label} بعد`}
        colSpan={isSchedule ? 3 : 5}
        head={
          <>
            {isSchedule ? null : <th className="px-4 py-3">الصورة</th>}
            <th className="px-4 py-3">العنوان</th>
            {isSchedule ? null : <th className="px-4 py-3">الوصف</th>}
            <th className="px-4 py-3">الموعد / الملاحظة</th>
            <th className="px-4 py-3">الإجراء</th>
          </>
        }
        cards={items.map((item) => (
          <AdminMobileCard key={item.id}>
            <div className="flex gap-3">
              {isSchedule ? null : item.imageUrl ? (
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
                <p className="font-bold text-deep-red">{item.title || "—"}</p>
                {isSchedule ? null : (
                  <p className="mt-1 line-clamp-2 text-sm text-deep-red/80">
                    {item.description || "—"}
                  </p>
                )}
                <p className="mt-1 text-sm text-coptic-gold-dark">
                  {item.detail || "—"}
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
        ))}
        rows={items.map((item) => (
          <tr key={item.id} className="border-t border-coptic-gold-main/20">
            {isSchedule ? null : (
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
            )}
            <td className="px-4 py-3 font-bold text-deep-red">{item.title || "—"}</td>
            {isSchedule ? null : (
              <td className="max-w-xs px-4 py-3 text-deep-red/80">
                <p className="line-clamp-2">{item.description || "—"}</p>
              </td>
            )}
            <td className="px-4 py-3 text-coptic-gold-dark">{item.detail || "—"}</td>
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
        ))}
      />

      <SlideOver
        open={open}
        title={editing ? `تعديل ${current.label}` : current.addLabel}
        onClose={() => setOpen(false)}
      >
        <div className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-bold text-deep-red">العنوان (اختياري)</span>
            <input
              type="text"
              value={form.title}
              onChange={(event) =>
                setForm((currentForm) => ({ ...currentForm, title: event.target.value }))
              }
              className="w-full rounded-xl border border-coptic-gold-main/40 bg-white px-3 py-2 text-deep-red outline-none focus:ring-2 focus:ring-coptic-gold-main"
              aria-label="العنوان"
            />
          </label>

          {isSchedule ? null : (
            <label className="block space-y-2">
              <span className="text-sm font-bold text-deep-red">الوصف (اختياري)</span>
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    description: event.target.value,
                  }))
                }
                rows={5}
                className="w-full rounded-xl border border-coptic-gold-main/40 bg-white px-3 py-2 text-sm leading-7 text-deep-red outline-none focus:ring-2 focus:ring-coptic-gold-main"
                aria-label="الوصف"
              />
            </label>
          )}

          <label className="block space-y-2">
            <span className="text-sm font-bold text-deep-red">
              {isSchedule ? "الموعد (اختياري)" : "الموعد أو الملاحظة (اختياري)"}
            </span>
            <input
              type="text"
              value={form.detail}
              onChange={(event) =>
                setForm((currentForm) => ({ ...currentForm, detail: event.target.value }))
              }
              className="w-full rounded-xl border border-coptic-gold-main/40 bg-white px-3 py-2 text-deep-red outline-none focus:ring-2 focus:ring-coptic-gold-main"
              aria-label="الموعد"
            />
          </label>

          {isSchedule ? null : (
            <ImageUpload
              value={form.imageUrl}
              onChange={(url) =>
                setForm((currentForm) => ({ ...currentForm, imageUrl: url }))
              }
              label="الصورة (اختياري)"
              preview="wide"
            />
          )}

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
