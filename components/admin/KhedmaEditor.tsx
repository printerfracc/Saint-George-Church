"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  assignServant,
  deleteKhedma,
  removeServantAssignment,
  updateCategoryLabel,
  type BuilderCategory,
  type BuilderKhedma,
  type ServantSearchHit,
} from "@/actions/tawze3a-admin";
import ServantSearchDialog from "@/components/admin/ServantSearchDialog";
import { adminActionOutline } from "@/components/admin/admin-ui";

export default function KhedmaEditor({
  tawze3a,
  initialKhedma,
}: {
  tawze3a: { id: string; title: string };
  initialKhedma: BuilderKhedma;
}) {
  const router = useRouter();
  const [khedma, setKhedma] = useState(initialKhedma);
  const [searchCategoryId, setSearchCategoryId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setKhedma(initialKhedma);
  }, [initialKhedma]);

  const searchCategory = khedma.categories.find((category) => category.id === searchCategoryId);

  function updateCategory(
    categoryId: string,
    updater: (category: BuilderCategory) => BuilderCategory,
  ) {
    setKhedma((current) => ({
      ...current,
      categories: current.categories.map((category) =>
        category.id === categoryId ? updater(category) : category,
      ),
    }));
  }

  async function handleAssign(servant: ServantSearchHit) {
    if (!searchCategoryId) return false;

    const categoryId = searchCategoryId;
    const tempId = `temp-${servant.id}`;
    setError("");

    updateCategory(categoryId, (category) => ({
      ...category,
      assignments: [...category.assignments, { id: tempId, servant }],
    }));

    const result = await assignServant(categoryId, servant.id);

    if (!result.success) {
      updateCategory(categoryId, (category) => ({
        ...category,
        assignments: category.assignments.filter((assignment) => assignment.id !== tempId),
      }));
      setError(result.error);
      return false;
    }

    updateCategory(categoryId, (category) => ({
      ...category,
      assignments: category.assignments.map((assignment) =>
        assignment.id === tempId ? result.assignment : assignment,
      ),
    }));

    return true;
  }

  async function handleRemoveAssignment(categoryId: string, assignmentId: string) {
    if (assignmentId.startsWith("temp-")) {
      return;
    }

    const category = khedma.categories.find((item) => item.id === categoryId);
    const previous = category?.assignments ?? [];

    setError("");
    updateCategory(categoryId, (item) => ({
      ...item,
      assignments: item.assignments.filter((assignment) => assignment.id !== assignmentId),
    }));

    const result = await removeServantAssignment(assignmentId);

    if (!result.success) {
      updateCategory(categoryId, (item) => ({ ...item, assignments: previous }));
      setError(result.error);
    }
  }

  async function handleDeleteKhedma() {
    if (!window.confirm(`هل تريد حذف خدمة "${khedma.name}" وجميع التعيينات التابعة لها؟`)) {
      return;
    }

    setDeleting(true);
    setError("");
    const result = await deleteKhedma(khedma.id);
    setDeleting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    router.push(`/admin/tawze3a/${tawze3a.id}`);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-coptic-gold-main/40 bg-white/80 p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <Link
              href={`/admin/tawze3a/${tawze3a.id}`}
              className="text-sm font-bold text-coptic-gold-dark hover:text-deep-red"
            >
              العودة إلى الخدمات
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-deep-red md:text-3xl">{khedma.name}</h1>
            <p className="mt-1 text-sm text-deep-red/70">{tawze3a.title}</p>
          </div>
          <button
            type="button"
            disabled={deleting}
            className={`${adminActionOutline} text-deep-red`}
            onClick={() => void handleDeleteKhedma()}
          >
            {deleting ? "جاري الحذف..." : "حذف الخدمة"}
          </button>
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-sm font-medium text-deep-red">
          {error}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {khedma.categories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            onLabelSave={async (label) => {
              const previous = category.label;
              updateCategory(category.id, (item) => ({ ...item, label }));
              const result = await updateCategoryLabel(category.id, label);

              if (!result.success) {
                updateCategory(category.id, (item) => ({ ...item, label: previous }));
                setError(result.error);
              }
            }}
            onAddServant={() => setSearchCategoryId(category.id)}
            onRemoveAssignment={(assignmentId) =>
              void handleRemoveAssignment(category.id, assignmentId)
            }
          />
        ))}
      </div>

      <ServantSearchDialog
        open={Boolean(searchCategoryId)}
        assignedServantIds={searchCategory?.assignments.map((assignment) => assignment.servant.id) ?? []}
        onClose={() => setSearchCategoryId(null)}
        onSelect={(servant) => handleAssign(servant)}
      />
    </div>
  );
}

function CategoryCard({
  category,
  onLabelSave,
  onAddServant,
  onRemoveAssignment,
}: {
  category: BuilderCategory;
  onLabelSave: (label: string) => Promise<void>;
  onAddServant: () => void;
  onRemoveAssignment: (assignmentId: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(category.label);

  useEffect(() => {
    setLabel(category.label);
  }, [category.label]);

  async function saveLabel() {
    const next = label.trim();
    setEditing(false);

    if (!next || next === category.label) {
      setLabel(category.label);
      return;
    }

    await onLabelSave(next);
  }

  return (
    <article className="rounded-xl border border-coptic-gold-main/30 bg-cream/80 p-4">
      {editing ? (
        <input
          value={label}
          autoFocus
          onChange={(event) => setLabel(event.target.value)}
          onBlur={() => void saveLabel()}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void saveLabel();
            }

            if (event.key === "Escape") {
              setLabel(category.label);
              setEditing(false);
            }
          }}
          aria-label="تعديل اسم التصنيف"
          className="w-full rounded-lg border border-deep-red/20 bg-white px-3 py-2 text-center text-sm font-bold text-coptic-red-main outline-none focus:ring-2 focus:ring-gold"
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="block w-full text-center text-sm font-bold text-coptic-red-main hover:text-coptic-gold-dark"
          title="اضغط لتعديل الاسم"
        >
          {category.label}
        </button>
      )}

      <div className="mt-3 flex min-h-11 flex-wrap gap-2">
        {category.assignments.length === 0 ? (
          <p className="text-xs text-deep-red/60">لا يوجد خدام معيّنون</p>
        ) : (
          category.assignments.map((assignment) => (
            <span
              key={assignment.id}
              className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1 text-sm text-gray-900 shadow-sm"
            >
              {assignment.servant.name}
              <button
                type="button"
                aria-label={`إزالة ${assignment.servant.name}`}
                disabled={assignment.id.startsWith("temp-")}
                className="text-base leading-none text-gray-500 hover:text-deep-red disabled:opacity-40"
                onClick={() => onRemoveAssignment(assignment.id)}
              >
                ×
              </button>
            </span>
          ))
        )}
      </div>

      <button
        type="button"
        onClick={onAddServant}
        className="mt-4 w-full rounded-full border border-coptic-gold-main py-2 text-sm font-bold text-coptic-gold-main hover:bg-coptic-gold-main/10"
      >
        إضافة خادم
      </button>
    </article>
  );
}
