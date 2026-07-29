import { ReadinessDashboard } from "@/components/readiness/readiness-dashboard";
import { getReadinessPageData } from "@/features/readiness/queries";
import { readinessFiltersSchema } from "@/features/readiness/schema";
import { requireAdminAccess } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function ReadinessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminAccess();
  const rawSearchParams = await searchParams;
  const filters = readinessFiltersSchema.parse({
    periodMonth:
      typeof rawSearchParams.periodMonth === "string"
        ? rawSearchParams.periodMonth
        : "",
  });
  const data = await getReadinessPageData({
    periodMonth: filters.periodMonth,
  });

  return <ReadinessDashboard data={data} />;
}
