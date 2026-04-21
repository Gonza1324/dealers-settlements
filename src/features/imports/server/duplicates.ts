import type {
  DuplicateDetectionRecord,
  NormalizedImportRow,
} from "@/features/imports/server/types";

export interface DuplicateSummary {
  rows: Array<
    NormalizedImportRow & {
      duplicateStatus: "unique" | "possible_duplicate" | "duplicate";
      duplicateGroup: string | null;
    }
  >;
  duplicateRows: number;
}

export function detectDuplicates(params: {
  rows: NormalizedImportRow[];
  existingRows: DuplicateDetectionRecord[];
}): DuplicateSummary {
  const exactCounts = new Map<string, number>();
  const possibleCounts = new Map<string, number>();
  const existingExactKeys = new Set(
    params.existingRows.map((row) => row.exactDuplicateKey),
  );
  const existingPossibleKeys = new Set(
    params.existingRows.map((row) => row.possibleDuplicateKey),
  );

  params.rows.forEach((row) => {
    exactCounts.set(
      row.exactDuplicateKey,
      (exactCounts.get(row.exactDuplicateKey) ?? 0) + 1,
    );
    possibleCounts.set(
      row.possibleDuplicateKey,
      (possibleCounts.get(row.possibleDuplicateKey) ?? 0) + 1,
    );
  });

  let duplicateRows = 0;

  const rows = params.rows.map((row) => {
    const exactInFile = (exactCounts.get(row.exactDuplicateKey) ?? 0) > 1;
    const exactInHistory = existingExactKeys.has(row.exactDuplicateKey);
    const possibleInFile =
      (possibleCounts.get(row.possibleDuplicateKey) ?? 0) > 1;
    const possibleInHistory = existingPossibleKeys.has(row.possibleDuplicateKey);

    const duplicateStatus: "unique" | "possible_duplicate" | "duplicate" =
      exactInFile || exactInHistory
        ? "duplicate"
        : possibleInFile || possibleInHistory
          ? "possible_duplicate"
          : "unique";

    if (duplicateStatus !== "unique") {
      duplicateRows += 1;
    }

    return {
      ...row,
      duplicateStatus,
      duplicateGroup:
        duplicateStatus === "duplicate"
          ? row.exactDuplicateKey
          : duplicateStatus === "possible_duplicate"
            ? row.possibleDuplicateKey
            : null,
    };
  });

  return {
    rows,
    duplicateRows,
  };
}
