import { NextResponse } from "next/server";
import {
  applyImportReviewAction,
  getImportReview,
} from "@/features/imports/server/import-service";
import { importReviewActionSchema } from "@/features/imports/server/review-schema";
import { getCurrentProfile } from "@/lib/auth/profile";

async function requireImportAdmin() {
  const profile = await getCurrentProfile();

  if (!profile) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (profile.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  return null;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ importFileId: string }> },
) {
  try {
    const authError = await requireImportAdmin();
    if (authError) {
      return authError;
    }

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

export async function PATCH(
  request: Request,
  context: { params: Promise<{ importFileId: string }> },
) {
  try {
    const authError = await requireImportAdmin();
    if (authError) {
      return authError;
    }

    const { importFileId } = await context.params;
    const body = await request.json();
    const parsed = importReviewActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid payload." },
        { status: 400 },
      );
    }

    await applyImportReviewAction({
      importFileId,
      action: parsed.data,
    });

    if (parsed.data.action === "discard_import") {
      return NextResponse.json({ success: true, discarded: true });
    }

    const payload = await getImportReview(importFileId);

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
