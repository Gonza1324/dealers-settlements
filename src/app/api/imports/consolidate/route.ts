import { NextResponse } from "next/server";
import { consolidateImportRows } from "@/features/imports/server/import-service";
import { consolidateRowsSchema } from "@/features/deals/schema";
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

export async function POST(request: Request) {
  try {
    const authError = await requireImportAdmin();

    if (authError) {
      return authError;
    }

    const body = await request.json();
    const parsed = consolidateRowsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid payload." },
        { status: 400 },
      );
    }

    const result = await consolidateImportRows(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
