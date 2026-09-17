"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { uploadServantsExcel } from "@/actions/import-servants";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-linear-to-r from-coptic-gold-light to-coptic-gold-dark px-5 text-sm font-bold text-black disabled:opacity-60 sm:w-auto"
    >
      {pending ? "جاري الإضافة..." : "إضافة الخدام"}
    </button>
  );
}

export default function ImportServantsForm() {
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function handleAction(formData: FormData) {
    const result = await uploadServantsExcel(formData);

    if ("error" in result) {
      setIsError(true);
      setMessage(result.error === "Unauthorized" ? "غير مصرح لك بتنفيذ هذه العملية" : result.error);
      return;
    }

    setIsError(false);
    setMessage(
      result.count > 0
        ? `تم إضافة ${result.count} خادم بنجاح. تم تجاهل الأرقام المكررة.`
        : "لم يتم إضافة سجلات جديدة. قد تكون الأرقام موجودة مسبقاً.",
    );
  }

  return (
    <form
      action={handleAction}
      className="rounded-2xl border border-coptic-gold-main/40 bg-white/80 p-5 shadow-sm"
    >
      <h2 className="text-lg font-bold text-deep-red">رفع ملف Excel</h2>
      <p className="mt-2 text-sm leading-7 text-deep-red/75">
        يجب أن يحتوي الملف على الأعمدة التالية في الصف الأول: Name، Phone، NationalID، Status، NewUser.
      </p>

      <label className="mt-4 block text-sm font-bold text-deep-red" htmlFor="servants-file">
        ملف الخدام
      </label>
      <input
        id="servants-file"
        type="file"
        name="file"
        accept=".xlsx, .xls"
        required
        className="mt-2 w-full rounded-xl border border-deep-red/20 bg-cream px-4 py-3 text-sm text-deep-red outline-none focus:ring-2 focus:ring-gold"
      />

      <div className="mt-4">
        <SubmitButton />
      </div>

      {message ? (
        <p
          role="status"
          className={`mt-3 text-sm font-medium ${isError ? "text-deep-red" : "text-green-700"}`}
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
