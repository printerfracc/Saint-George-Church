"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createTawze3a,
  togglePublishTawze3a,
  type Tawze3aListItem,
} from "@/actions/tawze3a-admin";
import {
  AdminEmptyState,
  AdminMobileCard,
  AdminResponsiveTable,
  adminActionGold,
  adminActionOutline,
} from "@/components/admin/admin-ui";

export default function Tawze3aListManager({
  items,
}: {
  items: Tawze3aListItem[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCreating(true);
    setError("");

    const result = await createTawze3a(title);

    setIsCreating(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setTitle("");
    router.push(`/admin/tawze3a/${result.id}`);
  }

  async function handleToggle(id: string) {
    setPublishingId(id);
    setError("");

    const result = await togglePublishTawze3a(id);

    setPublishingId(null);

    if (!result.success) {
      setError(result.error);
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleCreate}
        className="rounded-2xl border border-coptic-gold-main/40 bg-white/80 p-5 shadow-sm"
      >
        <h2 className="text-lg font-bold text-deep-red">توزيعة جديدة</h2>
        <p className="mt-2 text-sm leading-7 text-deep-red/75">
          اكتب اسم التوزيعة.
        </p>

        <label className="mt-4 block text-sm font-bold text-deep-red" htmlFor="tawze3a-title">
          عنوان التوزيعة
        </label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <input
            id="tawze3a-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            placeholder="توزيع الخدام لعيد 6 أكتوبر 2026"
            className="w-full rounded-xl border border-deep-red/20 bg-cream px-4 py-3 text-deep-red outline-none focus:ring-2 focus:ring-gold"
          />
          <button
            type="submit"
            disabled={isCreating}
            className="inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-xl bg-linear-to-r from-coptic-gold-light to-coptic-gold-dark px-5 text-sm font-bold text-black disabled:opacity-60 sm:w-auto"
          >
            {isCreating ? "جاري الإنشاء..." : "إنشاء توزيعة"}
          </button>
        </div>
      </form>

      {error ? (
        <p role="alert" className="text-sm font-medium text-deep-red">
          {error}
        </p>
      ) : null}

      {items.length === 0 ? (
        <AdminEmptyState>لا توجد توزيعات</AdminEmptyState>
      ) : (
        <AdminResponsiveTable
          empty={false}
          emptyLabel="لا توجد توزيعات بعد"
          colSpan={5}
          head={
            <>
              <th className="px-4 py-3 font-bold">العنوان</th>
              <th className="px-4 py-3 font-bold">تاريخ الإنشاء</th>
              <th className="px-4 py-3 font-bold">الحالة</th>
              <th className="px-4 py-3 font-bold">الخدمات</th>
              <th className="px-4 py-3 font-bold">الإجراء</th>
            </>
          }
          cards={items.map((item) => (
            <AdminMobileCard key={item.id}>
              <p className="font-bold text-deep-red">{item.title}</p>
              <p className="mt-1 text-sm text-deep-red/80">{item.createdAtLabel}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <PublishBadge published={item.isPublished} />
                <span className="text-xs text-deep-red/70">{item.khedmaCount} خدمة</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <PublishToggle
                  published={item.isPublished}
                  disabled={publishingId === item.id}
                  onClick={() => void handleToggle(item.id)}
                />
                <Link href={`/admin/tawze3a/${item.id}`} className={adminActionGold}>
                  فتح
                </Link>
              </div>
            </AdminMobileCard>
          ))}
          rows={items.map((item) => (
            <tr key={item.id} className="border-t border-coptic-gold-main/20">
              <td className="px-4 py-3 font-bold text-deep-red">{item.title}</td>
              <td className="px-4 py-3 text-deep-red/80">{item.createdAtLabel}</td>
              <td className="px-4 py-3">
                <PublishBadge published={item.isPublished} />
              </td>
              <td className="px-4 py-3 text-deep-red/80">{item.khedmaCount}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <PublishToggle
                    published={item.isPublished}
                    disabled={publishingId === item.id}
                    onClick={() => void handleToggle(item.id)}
                  />
                  <Link href={`/admin/tawze3a/${item.id}`} className={adminActionGold}>
                    فتح
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        />
      )}
    </div>
  );
}

function PublishBadge({ published }: { published: boolean }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${
        published ? "bg-green-100 text-green-800" : "bg-coptic-gold-main/20 text-coptic-gold-dark"
      }`}
    >
      {published ? "منشور" : "مسودة"}
    </span>
  );
}

function PublishToggle({
  published,
  disabled,
  onClick,
}: {
  published: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className={adminActionOutline}>
      {disabled ? "جاري التحديث..." : published ? "إلغاء النشر" : "نشر"}
    </button>
  );
}
