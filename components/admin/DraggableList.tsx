"use client";

import { useId, useMemo, type ReactNode } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AdminEmptyState } from "@/components/admin/admin-ui";

export type DraggableListItem = {
  id: string;
};

type DraggableListProps<T extends DraggableListItem> = {
  items: T[];
  onReorder: (items: T[]) => void;
  children: (item: T) => ReactNode;
  emptyLabel?: string;
};

function SortableRow({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      dir="ltr"
      className={`flex items-stretch gap-3 rounded-2xl border border-coptic-gold-main/40 bg-white/80 p-3 shadow-sm md:p-4 ${
        isDragging ? "z-10 opacity-80 shadow-lg ring-2 ring-coptic-gold-main" : ""
      }`}
    >
      <button
        type="button"
        className="inline-flex min-h-11 min-w-11 shrink-0 cursor-grab touch-none items-center justify-center self-center rounded-xl border border-coptic-gold-main/40 text-lg font-bold leading-none text-coptic-gold-dark"
        aria-label="سحب لإعادة الترتيب"
        {...attributes}
        {...listeners}
      >
        ≡
      </button>
      <div dir="rtl" className="min-w-0 flex-1">
        {children}
      </div>
    </div>
  );
}

export default function DraggableList<T extends DraggableListItem>({
  items,
  onReorder,
  children,
  emptyLabel = "لا توجد بيانات",
}: DraggableListProps<T>) {
  const dndId = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const ids = useMemo(() => items.map((item) => item.id), [items]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);

    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    onReorder(arrayMove(items, oldIndex, newIndex));
  }

  if (items.length === 0) {
    return <AdminEmptyState>{emptyLabel}</AdminEmptyState>;
  }

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {items.map((item) => (
            <SortableRow key={item.id} id={item.id}>
              {children(item)}
            </SortableRow>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
