import { ImportReviewTable } from "@/components/imports/import-review-table";
import { ImportSummaryCards } from "@/components/imports/import-summary-cards";
import { getImportReview } from "@/features/imports/server/import-service";
import { requireAdminAccess } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function ImportReviewPage({
  params,
}: {
  params: Promise<{ importFileId: string }>;
}) {
  await requireAdminAccess();
  const { importFileId } = await params;
  const review = await getImportReview(importFileId);

  return (
    <>
      <ImportSummaryCards summary={review.summary} />

      {review.summary.criticalErrors.length > 0 && (
        <section className="panel" style={{ marginBottom: 24 }}>
          <p className="eyebrow">Critical errors</p>
          <ul className="inline-issues">
            {review.summary.criticalErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </section>
      )}

      <ImportReviewTable importFileId={importFileId} initialRows={review.rows} />
    </>
  );
}
