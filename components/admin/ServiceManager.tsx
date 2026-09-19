"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createService,
  deleteService,
  updateService,
} from "@/actions/admin-actions";
import ImageDisplayModeField from "@/components/admin/ImageDisplayModeField";
import type { ImageDisplayMode } from "@/lib/image-display";
import { updateItemOrder } from "@/actions/reorder";
import DraggableList from "@/components/admin/DraggableList";
import ImageUpload from "@/components/admin/ImageUpload";
import SlideOver from "@/components/admin/SlideOver";
import {
  AdminActions,
  AdminPageHeader,
  adminActionGold,
  adminActionMuted,
  adminActionOutline,
} from "@/components/admin/admin-ui";

export type ServiceRow = {
  id: string;
  title: string;
  description: string;
  slug: string | null;
  imageUrl: string | null;
  parentId: string | null;
  childCount: number;
  imageDisplayMode: ImageDisplayMode;
};

export type ServiceParentOption = {
  id: string;
  title: string;
  depth: number;
};

const emptyForm = {
  title: "",
  description: "",
  slug: "",
  imageUrl: "",
  parentId: "",
  imageDisplayMode: "NORMAL" as ImageDisplayMode,
};

export default function ServiceManager({
  services,
  parentOptions,
  currentParent = null,
  backHref = "/admin/services",
  backLabel = "العودة إلى القطاعات",
}: {
  services: ServiceRow[];
  parentOptions: ServiceParentOption[];
  currentParent?: { id: string; title: string } | null;
  backHref?: string;
  backLabel?: string;
}) {
  const router = useRouter();
  const [rows, setRows] = useState(services);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setRows(services);
  }, [services]);

  function handleReorder(next: ServiceRow[]) {
    const previous = rows;
    setRows(next);
    void updateItemOrder(
      "Service",
      next.map((service, index) => ({ id: service.id, order: index })),
    ).then((result) => {
      if (!result.success) {
        setRows(previous);
        window.alert(result.error);
      }
    });
  }

  function openCreate() {
    setEditing(null);
    setForm({
      ...emptyForm,
      parentId: currentParent?.id ?? "",
    });
    setError("");
    setOpen(true);
  }

  function openEdit(service: ServiceRow) {
    setEditing(service);
    setForm({
      title: service.title,
      description: service.description,
      slug: service.slug ?? "",
      imageUrl: service.imageUrl ?? "",
      parentId: service.parentId ?? "",
      imageDisplayMode: service.imageDisplayMode,
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
      slug: form.slug,
      imageUrl: form.imageUrl,
      parentId: form.parentId || null,
      imageDisplayMode: form.imageDisplayMode,
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
    if (!window.confirm("هل تريد حذف هذا القطاع وجميع الأقسام التابعة له؟")) {
      return;
    }

    const result = await deleteService(id);
    if (!result.success) {
      window.alert(result.error);
      return;
    }

    router.refresh();
  }

  const dropdownOptions = parentOptions.filter((option) => option.id !== editing?.id);

  return (
    <>
      <AdminPageHeader
        title={currentParent ? currentParent.title : "إدارة قطاعات الخدمات"}
        description={
          currentParent ? (
            <p className="mt-2">
              <Link
                href={backHref}
                className="text-sm font-bold text-coptic-gold-dark hover:text-deep-red"
              >
                {backLabel}
              </Link>
            </p>
          ) : undefined
        }
        action={
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-linear-to-r from-coptic-gold-light to-coptic-gold-dark px-4 text-sm font-bold text-black sm:w-auto"
          >
            إضافة قطاع
          </button>
        }
      />

      <DraggableList
        items={rows}
        onReorder={handleReorder}
        emptyLabel={
          currentParent
            ? "لا توجد أقسام فرعية بعد. أضف قسماً من الزر أعلاه."
            : "لا توجد قطاعات بعد. أضف القطاع من الزر أعلاه."
        }
      >
        {(service) => (
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex min-w-0 flex-1 gap-3">
              {service.imageUrl ? (
                <Image
                  src={service.imageUrl}
                  alt={service.title}
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
                <p className="font-bold text-deep-red">{service.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-deep-red/80">
                  {service.description || "—"}
                </p>
                {service.childCount > 0 ? (
                  <p className="mt-1 text-xs font-bold text-coptic-gold-dark">
                    {service.childCount} قسم فرعي
                  </p>
                ) : null}
              </div>
            </div>
            <AdminActions>
              <Link href={`/admin/services/${service.id}`} className={adminActionGold}>
                فتح
              </Link>
              <button
                type="button"
                onClick={() => openEdit(service)}
                className={adminActionOutline}
              >
                تعديل
              </button>
              <button
                type="button"
                onClick={() => void handleDelete(service.id)}
                className={adminActionMuted}
              >
                حذف
              </button>
            </AdminActions>
          </div>
        )}
      </DraggableList>

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
            <span className="text-sm font-bold text-deep-red">رابط الصفحة بالإنجليزية</span>
            <input
              type="text"
              dir="ltr"
              value={form.slug}
              onChange={(event) =>
                setForm((current) => ({ ...current, slug: event.target.value }))
              }
              className="w-full rounded-xl border border-coptic-gold-main/40 bg-white px-3 py-2 text-left text-deep-red outline-none focus:ring-2 focus:ring-coptic-gold-main"
              aria-label="رابط الصفحة بالإنجليزية"
              placeholder="youth-meeting"
            />
            <span className="block text-xs leading-6 text-deep-red/70">
              مثال: youth-meeting. إذا تُرك فارغاً سيتم إنشاؤه تلقائياً.
            </span>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-bold text-deep-red">القسم الرئيسي (اختياري)</span>
            <select
              value={form.parentId}
              onChange={(event) =>
                setForm((current) => ({ ...current, parentId: event.target.value }))
              }
              className="w-full rounded-xl border border-coptic-gold-main/40 bg-white px-3 py-2 text-deep-red outline-none focus:ring-2 focus:ring-coptic-gold-main"
              aria-label="القسم الرئيسي"
            >
              <option value="">بدون قسم رئيسي (قطاع أساسي)</option>
              {dropdownOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {`${"— ".repeat(option.depth)}${option.title}`}
                </option>
              ))}
            </select>
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
            preview={form.imageDisplayMode === "PORTRAIT_450_730" ? "portrait" : "wide"}
          />
          <ImageDisplayModeField
            value={form.imageDisplayMode}
            onChange={(imageDisplayMode) =>
              setForm((current) => ({ ...current, imageDisplayMode }))
            }
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
