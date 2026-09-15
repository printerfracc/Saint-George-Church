"use client";

import { useState } from "react";
import Image from "next/image";
import { createPriest, deletePriest, updatePriest } from "@/actions/priests";
import ImageUpload from "@/components/admin/ImageUpload";
import PartialDateInput from "@/components/admin/PartialDateInput";
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
  composePartialDate,
  emptyPartialDate,
  formatPartialDate,
  parseContactNumbers,
  parsePartialDate,
  type PartialDateParts,
} from "@/lib/admin-labels";

export type PriestRow = {
  id: string;
  name: string;
  cloudinaryImageUrl: string | null;
  ordinationDate: string;
  confessionSchedule: string;
  bio: string | null;
  qommosiyaDegree: string | null;
  deathDate: string | null;
  contactNumbers: string | null;
};

const emptyForm = {
  name: "",
  cloudinaryImageUrl: "",
  ordinationDate: emptyPartialDate(),
  confessionSchedule: "",
  bio: "",
  qommosiyaDegree: "",
  deathDate: emptyPartialDate(),
  phones: [""],
};

export default function PriestManager({ priests }: { priests: PriestRow[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PriestRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setOpen(true);
  }

  function openEdit(priest: PriestRow) {
    setEditing(priest);
    setForm({
      name: priest.name,
      cloudinaryImageUrl: priest.cloudinaryImageUrl ?? "",
      ordinationDate: parsePartialDate(priest.ordinationDate),
      confessionSchedule: priest.confessionSchedule,
      bio: priest.bio ?? "",
      qommosiyaDegree: priest.qommosiyaDegree ?? "",
      deathDate: parsePartialDate(priest.deathDate),
      phones: parseContactNumbers(priest.contactNumbers).length
        ? parseContactNumbers(priest.contactNumbers)
        : [""],
    });
    setError("");
    setOpen(true);
  }

  async function handleSave() {
    setIsSaving(true);
    setError("");

    try {
      const ordinationDate = composePartialDate(
        form.ordinationDate,
        true,
        "الرسامة",
      );
      const deathDate = composePartialDate(form.deathDate, false, "الوفاة");

      const data = {
        name: form.name,
        cloudinaryImageUrl: form.cloudinaryImageUrl,
        ordinationDate: ordinationDate ?? "",
        confessionSchedule: form.confessionSchedule,
        bio: form.bio,
        qommosiyaDegree: form.qommosiyaDegree,
        deathDate,
        contactNumbers: form.phones
          .map((phone) => phone.trim())
          .filter(Boolean)
          .join("\n"),
      };

      const result = editing
        ? await updatePriest(editing.id, data)
        : await createPriest(data);

      setIsSaving(false);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setOpen(false);
    } catch (error) {
      setIsSaving(false);
      setError(error instanceof Error ? error.message : "تعذر حفظ بيانات الكاهن");
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("هل تريد حذف هذا الكاهن؟")) {
      return;
    }

    const result = await deletePriest(id);

    if (!result.success) {
      window.alert(result.error);
    }
  }

  return (
    <>
      <AdminPageHeader
        title={
          <h1 className="bg-linear-to-r from-coptic-gold-dark to-coptic-gold-main bg-clip-text text-2xl font-bold text-transparent">
            إدارة الكهنة
          </h1>
        }
        action={
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-linear-to-r from-coptic-gold-light to-coptic-gold-dark px-4 text-sm font-bold text-black sm:w-auto"
          >
            إضافة كاهن جديد
          </button>
        }
      />

      <AdminResponsiveTable
        empty={priests.length === 0}
        emptyLabel="لا توجد بيانات"
        colSpan={6}
        head={
          <>
            <th className="px-4 py-3">الاسم</th>
            <th className="px-4 py-3">تاريخ الرسامة</th>
            <th className="px-4 py-3">مواعيد الاعترافات</th>
            <th className="px-4 py-3">نبذه عن الكاهن</th>
            <th className="px-4 py-3">أرقام التواصل</th>
            <th className="px-4 py-3">الإجراءات</th>
          </>
        }
        cards={priests.map((priest) => (
          <AdminMobileCard key={priest.id}>
            <div className="flex gap-3">
              {priest.cloudinaryImageUrl ? (
                <Image
                  src={priest.cloudinaryImageUrl}
                  alt={priest.name}
                  width={72}
                  height={72}
                  unoptimized
                  className="h-16 w-16 shrink-0 rounded-full border-2 border-coptic-gold-main object-cover"
                />
              ) : (
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-coptic-gold-main/40 bg-cream text-xs font-bold text-coptic-gold-dark">
                  بدون
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-bold text-coptic-gold-dark">{priest.name}</p>
                <p className="mt-1 text-xs text-coptic-gold-dark/80">
                  الرسامة: {formatPartialDate(priest.ordinationDate)}
                </p>
                {priest.qommosiyaDegree ? (
                  <p className="mt-1 text-sm text-coptic-gold-dark/80">
                    درجة القمصية: {priest.qommosiyaDegree}
                  </p>
                ) : null}
                {priest.deathDate ? (
                  <p className="mt-1 text-sm text-coptic-gold-dark/80">
                    تاريخ الوفاة: {formatPartialDate(priest.deathDate)}
                  </p>
                ) : null}
                <p className="mt-1 text-sm text-coptic-gold-dark/80">
                  {priest.confessionSchedule}
                </p>
              </div>
            </div>
            {priest.bio ? (
              <p className="mt-3 line-clamp-3 text-sm text-coptic-gold-dark/80">
                {priest.bio}
              </p>
            ) : null}
            <p className="mt-2 text-sm text-coptic-gold-dark/80" dir="ltr">
              {parseContactNumbers(priest.contactNumbers).join(" · ") || "—"}
            </p>
            <div className="mt-3">
              <AdminActions>
                <button
                  type="button"
                  onClick={() => openEdit(priest)}
                  className={adminActionOutline}
                >
                  تعديل
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(priest.id)}
                  className={adminActionMuted}
                >
                  حذف
                </button>
              </AdminActions>
            </div>
          </AdminMobileCard>
        ))}
        rows={priests.map((priest) => (
          <tr key={priest.id} className="border-t border-coptic-gold-main/20">
            <td className="px-4 py-3">
              <div className="flex items-center gap-3">
                {priest.cloudinaryImageUrl ? (
                  <Image
                    src={priest.cloudinaryImageUrl}
                    alt={priest.name}
                    width={80}
                    height={80}
                    unoptimized
                    className="h-20 w-20 rounded-full border-4 border-coptic-gold-main object-cover"
                  />
                ) : (
                  <span className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-coptic-gold-main/40 bg-cream text-sm font-bold text-coptic-gold-dark">
                    بدون
                  </span>
                )}
                <span className="font-bold text-coptic-gold-dark">{priest.name}</span>
              </div>
            </td>
            <td className="px-4 py-3 text-coptic-gold-dark/80">
              {formatPartialDate(priest.ordinationDate)}
              {priest.qommosiyaDegree ? (
                <p className="mt-1">درجة القمصية: {priest.qommosiyaDegree}</p>
              ) : null}
              {priest.deathDate ? (
                <p className="mt-1">تاريخ الوفاة: {formatPartialDate(priest.deathDate)}</p>
              ) : null}
            </td>
            <td className="px-4 py-3 text-coptic-gold-dark/80">
              {priest.confessionSchedule}
            </td>
            <td className="max-w-xs px-4 py-3 text-coptic-gold-dark/80">
              {priest.bio ? (
                <p className="line-clamp-3">{priest.bio}</p>
              ) : (
                <span className="text-coptic-gold-dark/40">—</span>
              )}
            </td>
            <td className="px-4 py-3 text-coptic-gold-dark/80" dir="ltr">
              {parseContactNumbers(priest.contactNumbers).join(" · ") || (
                <span className="text-coptic-gold-dark/40">—</span>
              )}
            </td>
            <td className="px-4 py-3">
              <AdminActions>
                <button
                  type="button"
                  onClick={() => openEdit(priest)}
                  className={adminActionOutline}
                >
                  تعديل
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(priest.id)}
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
        title={editing ? "تعديل كاهن" : "إضافة كاهن جديد"}
        onClose={() => setOpen(false)}
      >
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSave();
          }}
        >
          <ImageUpload
            label="صورة الكاهن"
            preview="circle"
            value={form.cloudinaryImageUrl}
            onChange={(url) =>
              setForm((current) => ({ ...current, cloudinaryImageUrl: url }))
            }
          />
          <label className="block text-sm font-bold text-coptic-gold-dark">
            الاسم
            <input
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              required
              className="mt-2 w-full rounded-xl border border-coptic-gold-main/40 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-coptic-gold-main"
            />
          </label>
          <label className="block text-sm font-bold text-coptic-gold-dark">
            نبذه عن الكاهن
            <textarea
              value={form.bio}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  bio: event.target.value,
                }))
              }
              rows={4}
              placeholder="اختياري"
              className="mt-2 w-full rounded-xl border border-coptic-gold-main/40 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-coptic-gold-main"
            />
          </label>
          <label className="block text-sm font-bold text-coptic-gold-dark">
            درجة القمصية (اختياري)
            <input
              type="text"
              value={form.qommosiyaDegree}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  qommosiyaDegree: event.target.value,
                }))
              }
              className="mt-2 w-full rounded-xl border border-coptic-gold-main/40 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-coptic-gold-main"
            />
          </label>
          <PartialDateInput
            label="تاريخ الرسامة"
            required
            value={form.ordinationDate}
            onChange={(ordinationDate: PartialDateParts) =>
              setForm((current) => ({ ...current, ordinationDate }))
            }
          />
          <PartialDateInput
            label="تاريخ الوفاة"
            value={form.deathDate}
            onChange={(deathDate: PartialDateParts) =>
              setForm((current) => ({ ...current, deathDate }))
            }
          />
          <label className="block text-sm font-bold text-coptic-gold-dark">
            مواعيد الاعترافات (اختياري)
            <textarea
              value={form.confessionSchedule}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  confessionSchedule: event.target.value,
                }))
              }
              rows={4}
              className="mt-2 w-full rounded-xl border border-coptic-gold-main/40 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-coptic-gold-main"
            />
          </label>
          <div>
            <p className="mb-2 text-sm font-bold text-coptic-gold-dark">
              أرقام التواصل
            </p>
            <div className="space-y-2">
              {form.phones.map((phone, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        phones: current.phones.map((item, phoneIndex) =>
                          phoneIndex === index ? event.target.value : item,
                        ),
                      }))
                    }
                    placeholder="01xxxxxxxxx"
                    dir="ltr"
                    className="w-full rounded-xl border border-coptic-gold-main/40 bg-white px-4 py-3 text-left outline-none focus:ring-2 focus:ring-coptic-gold-main"
                  />
                  {form.phones.length > 1 ? (
                    <button
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          phones: current.phones.filter(
                            (_, phoneIndex) => phoneIndex !== index,
                          ),
                        }))
                      }
                      className="inline-flex min-h-11 items-center rounded-xl border border-coptic-gold-main/50 px-3 text-xs font-bold text-coptic-gold-dark"
                      aria-label="حذف الرقم"
                    >
                      حذف
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  phones: [...current.phones, ""],
                }))
              }
              className="mt-2 text-sm font-bold text-coptic-gold-dark transition-colors hover:text-coptic-gold-main"
            >
              + إضافة رقم آخر
            </button>
          </div>
          {error ? (
            <p className="text-sm font-medium text-coptic-gold-dark">{error}</p>
          ) : null}
          <button
            type="submit"
            disabled={isSaving}
            className="w-full min-h-11 rounded-xl bg-linear-to-r from-coptic-gold-light to-coptic-gold-dark py-3 text-sm font-bold text-black disabled:opacity-60"
          >
            {isSaving ? "جاري الحفظ..." : "حفظ"}
          </button>
        </form>
      </SlideOver>
    </>
  );
}
