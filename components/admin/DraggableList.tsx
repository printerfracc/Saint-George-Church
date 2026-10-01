"use client";

import { useEffect, useId, useMemo, useRef, type ReactNode } from "react";
import {
  DndContext,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  closestCenter,
  useDndContext,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
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

const measuring = {
  droppable: {
    strategy: MeasuringStrategy.Always,
    frequency: 50,
  },
};

const collisionDetection: CollisionDetection = (args) =>
  closestCenter({
    ...args,
    droppableContainers: args.droppableContainers.filter(
      (container) => container.id !== args.active.id,
    ),
  });

function RemeasureOnScroll() {
  const { active, measureDroppableContainers } = useDndContext();

  useEffect(() => {
    if (!active) {
      return;
    }

    let frame = 0;

    function schedule() {
      if (frame) {
        return;
      }

      frame = window.requestAnimationFrame(() => {
        frame = 0;
        measureDroppableContainers([]);
      });
    }

    window.addEventListener("scroll", schedule, true);
    return () => {
      window.removeEventListener("scroll", schedule, true);
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [active, measureDroppableContainers]);

  return null;
}

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
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? undefined : transition,
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
  const itemsRef = useRef(items);
  const lastOverId = useRef<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const ids = useMemo(() => items.map((item) => item.id), [items]);
  itemsRef.current = items;

  function rememberOver(event: DragOverEvent) {
    if (!event.over || event.over.id === event.active.id) {
      return;
    }

    lastOverId.current = String(event.over.id);
  }

  function handleDragEnd(event: DragEndEvent) {
    const activeId = String(event.active.id);
    const overId =
      event.over && String(event.over.id) !== activeId
        ? String(event.over.id)
        : lastOverId.current;

    lastOverId.current = null;

    if (!overId || overId === activeId) {
      return;
    }

    const currentItems = itemsRef.current;
    const oldIndex = currentItems.findIndex((item) => item.id === activeId);
    const newIndex = currentItems.findIndex((item) => item.id === overId);

    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) {
      return;
    }

    onReorder(arrayMove(currentItems, oldIndex, newIndex));
  }

  function handleDragCancel() {
    lastOverId.current = null;
  }

  if (items.length === 0) {
    return <AdminEmptyState>{emptyLabel}</AdminEmptyState>;
  }

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      measuring={measuring}
      collisionDetection={collisionDetection}
      onDragOver={rememberOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <RemeasureOnScroll />
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
