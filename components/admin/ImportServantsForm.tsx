"use client";

import { useState } from "react";
import type { Tawze3aExcelRow } from "@/lib/tawze3a-excel";
import {
  columnExists,
  excelRowToImportPayload,
  isImportableServantRow,
  SERVANT_IMPORT_CHUNK_SIZE,
  SERVANT_NAME_COLUMNS,
  type ServantImportPayload,
} from "@/lib/servant-import-schema";

type ImportProgress = {
  done: number;
  total: number;
  label: string;
};

type ChunkErrorBody = {
  message?: string;
  details?: string;
};

type ChunkResponse = {
  imported?: number;
  skipped?: number;
  failed?: number;
  error?: string | ChunkErrorBody;
  message?: string;
  details?: string;
};

function chunkErrorText(payload: ChunkResponse | null, raw: string, status: number) {
  const errorField = payload?.error;
  const message =
    typeof errorField === "string"
      ? errorField
      : errorField?.message || payload?.message || "";
  const details =
    (typeof errorField === "object" ? errorField?.details : undefined) || payload?.details || "";
  const exact = [message, details].filter(Boolean).join(" — ");

  if (exact) {
    return exact;
  }

  const body = raw.trim();

  if (body && !body.startsWith("<")) {
    return body.slice(0, 500);
  }

  return `تعذر حفظ هذه الدفعة (${status}).`;
}

function chunkPayloads(rows: ServantImportPayload[], size: number) {
  const chunks: ServantImportPayload[][] = [];

  for (let index = 0; index < rows.length; index += size) {
    chunks.push(rows.slice(index, index + size));
  }

  return chunks;
}

export default function ImportServantsForm() {
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const file = new FormData(form).get("file");

    setMessage("");
    setIsError(false);
    setProgress(null);

    if (!(file instanceof File) || file.size === 0) {
      setIsError(true);
      setMessage("يرجى اختيار ملف Excel صالح");
      return;
    }

    const fileName = file.name.toLowerCase();

    if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
      setIsError(true);
      setMessage("يُسمح فقط بملفات Excel ذات الامتداد xlsx أو xls");
      return;
    }

    setIsImporting(true);
    setProgress({ done: 0, total: 0, label: "جاري قراءة الملف..." });

    try {
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheetName =
        workbook.SheetNames.find((name) => name.trim().toLowerCase() === "twze3a") ??
        workbook.SheetNames[0];

      if (!sheetName) {
        setIsError(true);
        setProgress(null);
        setMessage("الملف لا يحتوي على أي ورقة عمل");
        return;
      }

      const rows = XLSX.utils.sheet_to_json<Tawze3aExcelRow>(workbook.Sheets[sheetName], {
        blankrows: false,
        defval: "",
        raw: false,
      });

      if (rows.length === 0) {
        setIsError(true);
        setProgress(null);
        setMessage("لا توجد صفوف في ورقة العمل");
        return;
      }

      if (!columnExists(rows, SERVANT_NAME_COLUMNS)) {
        setIsError(true);
        setProgress(null);
        setMessage("يجب أن يحتوي الملف على عمود ServantName. الرتبة والخدمة وباقي الأعمدة اختيارية.");
        return;
      }

      const payloads = rows
        .map((row) => excelRowToImportPayload(row))
        .filter(isImportableServantRow);

      if (payloads.length === 0) {
        setIsError(true);
        setProgress(null);
        setMessage("لا توجد صفوف صالحة في الملف");
        return;
      }

      const chunks = chunkPayloads(payloads, SERVANT_IMPORT_CHUNK_SIZE);
      const total = payloads.length;
      let saved = 0;
      let imported = 0;
      let skipped = 0;
      let failed = 0;
      const failureDetails: string[] = [];

      for (const chunk of chunks) {
        const target = saved + chunk.length;
        setProgress({
          done: target,
          total,
          label: `جاري الاستيراد: ${target} من ${total}`,
        });

        let response: Response;

        try {
          response = await fetch("/api/admin/servants/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({ rows: chunk }),
          });
        } catch (error) {
          const detail = error instanceof Error ? error.message : "تعذر الاتصال بالخادم";
          setIsError(true);
          setProgress({
            done: saved,
            total,
            label: `جاري الاستيراد: ${saved} من ${total}`,
          });
          setMessage(
            saved > 0 ? `توقف الاستيراد بعد معالجة ${saved} من ${total}. ${detail}` : detail,
          );
          return;
        }

        const raw = await response.text();
        let payload: ChunkResponse | null = null;

        try {
          payload = raw ? (JSON.parse(raw) as ChunkResponse) : null;
        } catch {
          payload = null;
        }

        if (!response.ok) {
          const error = chunkErrorText(payload, raw, response.status);

          setIsError(true);
          setProgress({
            done: saved,
            total,
            label: `جاري الاستيراد: ${saved} من ${total}`,
          });
          setMessage(
            saved > 0 ? `توقف الاستيراد بعد معالجة ${saved} من ${total}. ${error}` : error,
          );
          return;
        }

        saved = target;
        imported += payload?.imported ?? 0;
        skipped += payload?.skipped ?? 0;
        failed += payload?.failed ?? 0;

        if (payload?.details) {
          failureDetails.push(payload.details);
        }
      }

      setProgress({
        done: total,
        total,
        label: `جاري الاستيراد: ${total} من ${total}`,
      });
      const summary = [`تم استيراد ${imported} خادم بنجاح.`];

      if (skipped > 0) {
        summary.push(`تم تخطي ${skipped} صف مكرر أو غير مكتمل.`);
      }

      if (failed > 0) {
        summary.push(`تعذر حفظ ${failed} صف.`);
      }

      if (failureDetails.length > 0) {
        summary.push(failureDetails.join(" | "));
      }

      setIsError(failed > 0);
      setMessage(summary.join(" "));
      form.reset();
    } catch {
      setIsError(true);
      setProgress(null);
      setMessage("تعذر قراءة ملف Excel. تأكد من صحة الملف ثم حاول مرة أخرى.");
    } finally {
      setIsImporting(false);
    }
  }

  const percent =
    progress && progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="rounded-2xl border border-coptic-gold-main/40 bg-white/80 p-5 shadow-sm"
    >
      <h2 className="text-lg font-bold text-deep-red">رفع ملف Excel</h2>
      <p className="mt-2 text-sm leading-7 text-deep-red/75">
        العمود المطلوب: ServantName. الأعمدة الاختيارية: Role و ServantPhone و ServantNationalID و 5edma.
        إذا تُركت الرتبة فارغة يُسجَّل الخادم برتبة «خادم غير مسجل» دون خدمة. الملفات الكبيرة تُرسل على دفعات.
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
        disabled={isImporting}
        className="mt-2 w-full rounded-xl border border-deep-red/20 bg-cream px-4 py-3 text-sm text-deep-red outline-none focus:ring-2 focus:ring-gold disabled:opacity-60"
      />

      <div className="mt-4">
        <button
          type="submit"
          disabled={isImporting}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-linear-to-r from-coptic-gold-light to-coptic-gold-dark px-5 text-sm font-bold text-black disabled:opacity-60 sm:w-auto"
        >
          {isImporting ? "جاري الاستيراد..." : "إضافة الخدام"}
        </button>
      </div>

      {progress ? (
        <div className="mt-4">
          <div
            className="h-2 overflow-hidden rounded-full bg-deep-red/10"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={progress.total || 1}
            aria-valuenow={progress.done}
            aria-label="تقدم استيراد الخدام"
          >
            <div
              className="h-full rounded-full bg-linear-to-r from-coptic-gold-light to-coptic-gold-dark transition-[width] duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="mt-2 text-sm font-medium text-deep-red" role="status">
            {progress.label}
          </p>
        </div>
      ) : null}

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
