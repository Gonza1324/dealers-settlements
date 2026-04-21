import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/profile";
import {
  getImportTemplates,
  processImportUpload,
} from "@/features/imports/server/import-service";

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

export async function GET() {
  try {
    const authError = await requireImportAdmin();
    if (authError) {
      return authError;
    }

    const templates = await getImportTemplates();

    return NextResponse.json({ templates });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const authError = await requireImportAdmin();
    if (authError) {
      return authError;
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const sourceMonth = formData.get("sourceMonth");
    const templateId = formData.get("templateId");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required." }, { status: 400 });
    }

    if (typeof sourceMonth !== "string" || !sourceMonth) {
      return NextResponse.json(
        { error: "Source month is required." },
        { status: 400 },
      );
    }

    if (typeof templateId !== "string" || !templateId) {
      return NextResponse.json(
        { error: "Template is required." },
        { status: 400 },
      );
    }

    const result = await processImportUpload({
      file,
      sourceMonth,
      templateId,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
