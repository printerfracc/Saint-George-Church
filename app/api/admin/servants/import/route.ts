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

function issueDetails(error: { issues: Array<{ path: PropertyKey[]; message: string }> }) {
  return error.issues
    .slice(0, 5)
    .map((issue) => {
      const field = issue.path.length > 0 ? issue.path.map(String).join(".") : "row";
      return `${field}: ${issue.message}`;
    })
    .join(" | ");
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTawze3aAdmin();

    if (!session) {
      return NextResponse.json({ error: "غير مصرح لك بتنفيذ هذه العملية" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsedBody = servantImportRequestSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: `أرسل مصفوفة صفوف بحد أقصى ${SERVANT_IMPORT_CHUNK_SIZE} سجل.`,
          details: issueDetails(parsedBody.error),
        },
        { status: 400 },
      );
    }

    const validRows: ServantImportRow[] = [];
    let skipped = 0;
    const skippedDetails: string[] = [];

    for (const [index, row] of parsedBody.data.rows.entries()) {
      const parsedRow = servantImportRowSchema.safeParse(row);

      if (!parsedRow.success) {
        skipped += 1;
        skippedDetails.push(`صف ${index + 1}: ${issueDetails(parsedRow.error)}`);
        continue;
      }

      validRows.push(parsedRow.data);
    }

    const result = await importServantChunk(validRows);
    const details = [result.details, skippedDetails.slice(0, 5).join(" | ")]
      .filter(Boolean)
      .join(" | ");

    return NextResponse.json({
      imported: result.imported,
      skipped: skipped + result.skipped,
      failed: result.failed,
      ...(details ? { details } : {}),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "تعذر حفظ هذه الدفعة";
    console.error("servant import chunk failed", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
