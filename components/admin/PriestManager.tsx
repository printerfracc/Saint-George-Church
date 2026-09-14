"use client";

import { useState } from "react";
import Image from "next/image";
import { createPriest, deletePriest, updatePriest } from "@/actions/priests";
import ImageUpload from "@/components/admin/ImageUpload";
import SlideOver from "@/components/admin/SlideOver";
import {
  formatAdminDate,
  parseContactNumbers,
  toDateInputValue,
} from "@/lib/admin-labels";

export type PriestRow = {
  id: string;
  name: string;
  cloudinaryImageUrl: string | null;
  ordinationDate: string;
  confessionSchedule: string;
  bio: string | null;
  contactNumbers: string | null;
};

const emptyForm = {
  name: "",
  cloudinaryImageUrl: "",
  ordinationDate: "",
  confessionSchedule: "",
  bio: "",
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
      ordinationDate: toDateInputValue(priest.ordinationDate),
      confessionSchedule: priest.confessionSchedule,
      bio: priest.bio ?? "",
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

    const data = {
      name: form.name,
      cloudinaryImageUrl: form.cloudinaryImageUrl,
      ordinationDate: form.ordinationDate,
      confessionSchedule: form.confessionSchedule,
      bio: form.bio,
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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="bg-linear-to-r from-coptic-gold-dark to-coptic-gold-main bg-clip-text text-2xl font-bold text-transparent">
          إدارة الكهنة
        </h1>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex min-h-11 items-center rounded-xl bg-linear-to-r from-coptic-gold-light to-coptic-gold-dark px-4 text-sm font-bold text-black"
        >
          إضافة كاهن جديد
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-coptic-gold-main/40 bg-white/80">
        <table className="min-w-full text-right text-sm">
          <thead className="bg-gray-900 text-coptic-gold-main">
            <tr>
              <th className="px-4 py-3">الاسم</th>
              <th className="px-4 py-3">تاريخ الرسامة</th>
              <th className="px-4 py-3">مواعيد الاعترافات</th>
              <th className="px-4 py-3">نبذه عن الكاهن</th>
              <th className="px-4 py-3">أرقام التواصل</th>
              <th className="px-4 py-3">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {priests.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-coptic-gold-dark/70"
                >
                  لا توجد بيانات
                </td>
              </tr>
            ) : (
              priests.map((priest) => (
                <tr key={priest.id} className="border-t border-coptic-gold-main/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {priest.cloudinaryImageUrl ? (
                        <Image
                          src={priest.cloudinaryImageUrl}
                          alt={priest.name}
                          width={112}
                          height={112}
                          unoptimized
                          className="h-28 w-28 rounded-full border-4 border-coptic-gold-main object-cover"
                        />
                      ) : (
                        <span className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-coptic-gold-main/40 bg-cream text-sm font-bold text-coptic-gold-dark">
                          بدون
                        </span>
                      )}
                      <span className="font-bold text-coptic-gold-dark">
                        {priest.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-coptic-gold-dark/80">
                    {formatAdminDate(priest.ordinationDate)}
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
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(priest)}
                        className="inline-flex min-h-11 items-center rounded-full border border-coptic-gold-main px-3 text-xs font-bold text-coptic-gold-dark transition-colors hover:bg-coptic-gold-main/15"
                      >
                        تعديل
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(priest.id)}
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
            تاريخ الرسامة
            <input
              type="date"
              value={form.ordinationDate}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  ordinationDate: event.target.value,
                }))
              }
              required
              className="mt-2 w-full rounded-xl border border-coptic-gold-main/40 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-coptic-gold-main"
            />
          </label>
          <label className="block text-sm font-bold text-coptic-gold-dark">
            مواعيد الاعترافات
            <textarea
              value={form.confessionSchedule}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  confessionSchedule: event.target.value,
                }))
              }
              required
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
