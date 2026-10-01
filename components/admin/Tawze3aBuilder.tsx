"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { addKhedma, reorderKhedmat, togglePublishTawze3a, type BuilderTawze3a } from "@/actions/tawze3a-admin";
import DraggableList from "@/components/admin/DraggableList";
import { adminActionGold, adminActionOutline } from "@/components/admin/admin-ui";

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
  const [khedmaName, setKhedmaName] = useState("");
  const [addingKhedma, setAddingKhedma] = useState(false);
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

  async function handleAddKhedma(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingKhedma(true);
    setError("");

    const result = await addKhedma(tawze3a.id, khedmaName);
    setIsSavingKhedma(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setTawze3a((current) => ({
      ...current,
      khedmat: [...current.khedmat, result.khedma],
    }));
    setKhedmaName("");
    setAddingKhedma(false);
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

          {addingKhedma ? (
            <form onSubmit={handleAddKhedma} className="flex w-full max-w-md flex-col gap-2 sm:flex-row">
              <input
                value={khedmaName}
                onChange={(event) => setKhedmaName(event.target.value)}
                autoFocus
                required
                placeholder="اسم الخدمة"
                className="w-full rounded-xl border border-deep-red/20 bg-cream px-4 py-3 text-sm text-deep-red outline-none focus:ring-2 focus:ring-gold"
              />
              <button type="submit" disabled={isSavingKhedma} className={adminActionGold}>
                {isSavingKhedma ? "جاري الإضافة..." : "حفظ"}
              </button>
              <button
                type="button"
                className={adminActionOutline}
                onClick={() => {
                  setAddingKhedma(false);
                  setKhedmaName("");
                }}
              >
                إلغاء
              </button>
            </form>
          ) : (
            <button type="button" className={adminActionGold} onClick={() => setAddingKhedma(true)}>
              إضافة خدمة
            </button>
          )}
        </div>
      </div>

      {error ? (
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
          <Link
            href={`/admin/tawze3a/${tawze3a.id}/khedma/${khedma.id}?year=${selectedYear}`}
            className="flex min-h-11 items-center justify-between gap-3"
          >
            <h2 className="truncate text-lg font-bold text-deep-red">{khedma.name}</h2>
            <span className="shrink-0 text-sm font-bold text-coptic-gold-dark" aria-hidden>
              ←
            </span>
          </Link>
        )}
      </DraggableList>
    </div>
  );
}
