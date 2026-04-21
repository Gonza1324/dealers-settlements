import { NextResponse } from "next/server";
import { getImportReview } from "@/features/imports/server/import-service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ importFileId: string }> },
) {
  try {
    const { importFileId } = await context.params;
    const payload = await getImportReview(importFileId);

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

