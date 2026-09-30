import { NextRequest, NextResponse } from "next/server";
import { requireTawze3aAdmin } from "@/lib/require-admin";
import { importServantChunk } from "@/lib/servant-import";
import {
  SERVANT_IMPORT_CHUNK_SIZE,
  servantImportRequestSchema,
  servantImportRowSchema,
  type ServantImportRow,
} from "@/lib/servant-import-schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const session = await requireTawze3aAdmin();

  if (!session) {
    return NextResponse.json({ error: "غير مصرح لك بتنفيذ هذه العملية" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsedBody = servantImportRequestSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: `أرسل مصفوفة صفوف بحد أقصى ${SERVANT_IMPORT_CHUNK_SIZE} سجل.` },
      { status: 400 },
    );
  }

  const validRows: ServantImportRow[] = [];
  let skipped = 0;

  for (const row of parsedBody.data.rows) {
    const parsedRow = servantImportRowSchema.safeParse(row);

    if (!parsedRow.success) {
      skipped += 1;
      continue;
    }

    validRows.push(parsedRow.data);
  }

  try {
    const result = await importServantChunk(validRows);

    return NextResponse.json({
      imported: result.imported,
      skipped: skipped + result.skipped,
      failed: result.failed,
    });
  } catch (error) {
    console.error("servant import chunk failed", error);
    return NextResponse.json(
      { error: "تعذر حفظ هذه الدفعة. حاول مرة أخرى." },
      { status: 500 },
    );
  }
}
