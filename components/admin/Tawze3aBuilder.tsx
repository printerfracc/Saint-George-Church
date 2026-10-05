"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  addKhedma,
  reorderKhedmat,
  togglePublishTawze3a,
  updateKhedma,
  type BuilderKhedma,
  type BuilderTawze3a,
} from "@/actions/tawze3a-admin";
import DraggableList from "@/components/admin/DraggableList";
import { adminActionGold, adminActionOutline } from "@/components/admin/admin-ui";

type LogoFormState =
  | { mode: "create" }
  | { mode: "edit"; khedma: Pick<BuilderKhedma, "id" | "name" | "logoUrl"> };

function orderKey(khedmat: { id: string }[]) {
  return khedmat.map((khedma) => khedma.id).join("\n");
}

function sameMembers(left: string, right: string) {
  return left.split("\n").sort().join("\n") === right.split("\n").sort().join("\n");
}

export default function Tawze3aBuilder({
  initialTawze3a,
  selectedYear,
}: {
  initialTawze3a: BuilderTawze3a;
  selectedYear: number;
}) {
  const [tawze3a, setTawze3a] = useState(initialTawze3a);
  const [logoForm, setLogoForm] = useState<LogoFormState | null>(null);
  const [isSavingKhedma, setIsSavingKhedma] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const savedOrderKey = useRef<string | null>(null);

  useEffect(() => {
    const incomingKey = orderKey(initialTawze3a.khedmat);
    const savedKey = savedOrderKey.current;

    if (savedKey && incomingKey !== savedKey && sameMembers(incomingKey, savedKey)) {
      return;
    }

    savedOrderKey.current = null;
    setTawze3a(initialTawze3a);
  }, [initialTawze3a]);

  async function handleTogglePublish() {
    const previous = tawze3a.isPublished;
    setPublishing(true);
    setError("");
    setTawze3a((current) => ({ ...current, isPublished: !current.isPublished }));

    const result = await togglePublishTawze3a(tawze3a.id);
    setPublishing(false);

    if (!result.success) {
      setTawze3a((current) => ({ ...current, isPublished: previous }));
      setError(result.error);
    }
  }

  async function handleSaveKhedma(formData: FormData) {
    if (!logoForm) return;

    setIsSavingKhedma(true);
    setError("");

    const result =
      logoForm.mode === "create"
        ? await addKhedma(tawze3a.id, formData)
        : await updateKhedma(logoForm.khedma.id, formData);

    setIsSavingKhedma(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setTawze3a((current) => ({
      ...current,
      khedmat:
        logoForm.mode === "create"
          ? [...current.khedmat, result.khedma]
          : current.khedmat.map((khedma) =>
              khedma.id === result.khedma.id
                ? { ...khedma, logoUrl: result.khedma.logoUrl }
                : khedma,
            ),
    }));
    setLogoForm(null);
  }

  function handleReorder(next: BuilderTawze3a["khedmat"]) {
    const previous = tawze3a.khedmat;
    const ordered = next.map((khedma, index) => ({ ...khedma, order: index }));
    savedOrderKey.current = orderKey(ordered);
    setTawze3a((current) => ({ ...current, khedmat: ordered }));
    setError("");

    void reorderKhedmat(
      tawze3a.id,
      ordered.map((khedma) => ({ id: khedma.id, order: khedma.order })),
    ).then((result) => {
      if (!result.success) {
        savedOrderKey.current = null;
        setTawze3a((current) => ({ ...current, khedmat: previous }));
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-coptic-gold-main/40 bg-white/80 p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <Link
              href="/admin/tawze3a"
              className="text-sm font-bold text-coptic-gold-dark hover:text-deep-red"
            >
              العودة إلى التوزيعات
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-deep-red md:text-3xl">{tawze3a.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  tawze3a.isPublished
                    ? "bg-green-100 text-green-800"
                    : "bg-coptic-gold-main/20 text-coptic-gold-dark"
                }`}
              >
                {tawze3a.isPublished ? "منشور" : "مسودة"}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={tawze3a.isPublished}
                aria-label="تبديل حالة النشر"
                disabled={publishing}
                onClick={() => void handleTogglePublish()}
                className="inline-flex items-center gap-2 text-sm font-bold text-deep-red disabled:opacity-60"
              >
                <span
                  className={`relative h-7 w-12 rounded-full transition-colors ${
                    tawze3a.isPublished ? "bg-green-600" : "bg-coptic-gold-main/40"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-[inset-inline-start] ${
                      tawze3a.isPublished ? "inset-s-6" : "inset-s-1"
                    }`}
                  />
                </span>
                {tawze3a.isPublished ? "إلغاء النشر" : "نشر التوزيعة"}
              </button>
            </div>
          </div>

          <button
            type="button"
            className={adminActionGold}
            onClick={() => {
              setError("");
              setLogoForm({ mode: "create" });
            }}
          >
            إضافة خدمة
          </button>
        </div>
      </div>

      {error && !logoForm ? (
        <p role="alert" className="text-sm font-medium text-deep-red">
          {error}
        </p>
      ) : null}

      <DraggableList
        items={tawze3a.khedmat}
        onReorder={handleReorder}
        emptyLabel="لا توجد خدمات. أضف خدمة الأول."
      >
        {(khedma) => (
          <div className="flex min-h-11 items-center justify-between gap-3">
            <Link
              href={`/admin/tawze3a/${tawze3a.id}/khedma/${khedma.id}?year=${selectedYear}`}
              className="flex min-w-0 flex-1 items-center gap-3"
            >
              {khedma.logoUrl ? (
                <Image
                  src={khedma.logoUrl}
                  alt=""
                  width={40}
                  height={40}
                  className="h-10 w-10 shrink-0 rounded-full object-cover"
                />
              ) : null}
              <h2 className="truncate text-lg font-bold text-deep-red">{khedma.name}</h2>
              <span className="ms-auto shrink-0 text-sm font-bold text-coptic-gold-dark" aria-hidden>
                ←
              </span>
            </Link>
            <button
              type="button"
              className={adminActionOutline}
              onClick={() => {
                setError("");
                setLogoForm({
                  mode: "edit",
                  khedma: { id: khedma.id, name: khedma.name, logoUrl: khedma.logoUrl },
                });
              }}
            >
              اللوجو
            </button>
          </div>
        )}
      </DraggableList>

      {logoForm ? (
        <KhedmaLogoModal
          key={logoForm.mode === "edit" ? logoForm.khedma.id : "create"}
          form={logoForm}
          saving={isSavingKhedma}
          error={error}
          onClose={() => {
            if (!isSavingKhedma) setLogoForm(null);
          }}
          onSubmit={(formData) => void handleSaveKhedma(formData)}
        />
      ) : null}
    </div>
  );
}

function KhedmaLogoModal({
  form,
  saving,
  error,
  onClose,
  onSubmit,
}: {
  form: LogoFormState;
  saving: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
}) {
  const existingLogo = form.mode === "edit" ? form.khedma.logoUrl : null;
  const [preview, setPreview] = useState<string | null>(existingLogo);
  const objectUrl = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    };
  }, []);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (objectUrl.current) {
      URL.revokeObjectURL(objectUrl.current);
      objectUrl.current = null;
    }

    if (!file) {
      setPreview(existingLogo);
      return;
    }

    const url = URL.createObjectURL(file);
    objectUrl.current = url;
    setPreview(url);
  }

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/40"
        aria-label="إغلاق"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="khedma-logo-title"
        className="fixed inset-x-4 top-[12vh] z-50 mx-auto w-auto max-w-md rounded-2xl bg-cream p-5 shadow-2xl"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 id="khedma-logo-title" className="text-lg font-bold text-deep-red">
            {form.mode === "create" ? "إضافة خدمة" : "اللوجو"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-bold text-coptic-gold-dark hover:bg-coptic-gold-main/15"
          >
            إغلاق
          </button>
        </div>

        <form
          className="mt-4 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(new FormData(event.currentTarget));
          }}
        >
          {form.mode === "create" ? (
            <label className="block text-sm font-bold text-deep-red" htmlFor="khedma-name">
              اسم الخدمة
              <input
                id="khedma-name"
                name="name"
                required
                autoFocus
                placeholder="اسم الخدمة"
                className="mt-2 w-full rounded-xl border border-deep-red/20 bg-white px-4 py-3 text-sm font-normal text-deep-red outline-none focus:ring-2 focus:ring-gold"
              />
            </label>
          ) : (
            <p className="text-sm font-bold text-deep-red">{form.khedma.name}</p>
          )}

          <div className="flex items-center gap-4">
            {preview ? (
              preview.startsWith("blob:") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="" className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <Image
                  src={preview}
                  alt=""
                  width={64}
                  height={64}
                  className="h-16 w-16 rounded-full object-cover"
                />
              )
            ) : (
              <span className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-deep-red/30 text-xs text-deep-red/50">
                1:1
              </span>
            )}
            <label className="block min-w-0 flex-1 text-sm font-bold text-deep-red" htmlFor="khedma-logo">
              اللوجو
              <input
                id="khedma-logo"
                name="logo"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="mt-2 block w-full text-sm font-normal text-deep-red file:me-3 file:rounded-lg file:border-0 file:bg-coptic-gold-main/20 file:px-3 file:py-2"
              />
            </label>
          </div>

          {error ? (
            <p role="alert" className="text-sm font-medium text-deep-red">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={saving} className={adminActionGold}>
              {saving ? "جاري الحفظ..." : "حفظ"}
            </button>
            <button type="button" className={adminActionOutline} onClick={onClose} disabled={saving}>
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
