"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { importTawze3aExcel } from "@/actions/tawze3a-import";

type ToastState = {
  type: "loading" | "success" | "error";
  message: string;
} | null;

export default function Tawze3aExcelImportButton({
  tawze3aId,
}: {
  tawze3aId: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    inputRef.current?.click();
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("tawze3aId", tawze3aId);

    startTransition(async () => {
      const toast = {
        loading(message: string) {
          setToast({ type: "loading", message });
        },
        success(message: string) {
          setToast({ type: "success", message });
        },
        error(message: string) {
          setToast({ type: "error", message });
        },
      };

      toast.loading("جاري استيراد التوزيعة...");

      const result = await importTawze3aExcel(formData);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("تم رفع التوزيعة بنجاح");
      router.refresh();
    });
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx, .xls"
        className="hidden"
        aria-hidden
        tabIndex={-1}
        onChange={handleFileChange}
      />
      <button
        type="button"
        disabled={isPending}
        onClick={handleClick}
        className="inline-flex min-h-11 items-center justify-center rounded-full bg-green-600 px-4 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-60"
      >
        {isPending ? "جاري الاستيراد..." : "رفع ملف الإكسيل"}
      </button>
      <p className="mt-2 max-w-xs text-xs leading-6 text-deep-red/70">
        يجب أن يحتوي الملف على الأعمدة التالية في الصف الأول: ServantName, ServantPhone, ServantNationalID, 5edma, Role
      </p>
      {toast ? (
        <p
          role="status"
          className={`mt-2 rounded-xl px-3 py-2 text-center text-xs font-bold sm:absolute sm:inset-s-0 sm:top-full sm:mt-2 sm:w-max sm:max-w-xs ${
            toast.type === "error"
              ? "bg-deep-red text-white"
              : toast.type === "success"
                ? "bg-green-700 text-white"
                : "bg-gray-900 text-coptic-gold-main"
          }`}
        >
          {toast.message}
        </p>
      ) : null}
    </div>
  );
}
