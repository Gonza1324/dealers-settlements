import type { NormalizedImportRow } from "@/features/imports/server/types";

export interface DuplicateSummary {
  rows: Array<
    NormalizedImportRow & {
      isDuplicate: boolean;
      duplicateGroup: string | null;
    }
  >;
  duplicateRows: number;
}

export function detectDuplicates(params: {
  rows: NormalizedImportRow[];
  existingKeys: string[];
}): DuplicateSummary {
  const existingKeySet = new Set(params.existingKeys);
  const counts = new Map<string, number>();

  params.rows.forEach((row) => {
    counts.set(row.duplicateKey, (counts.get(row.duplicateKey) ?? 0) + 1);
  });

  let duplicateRows = 0;

  const rows = params.rows.map((row) => {
    const repeatedInFile = (counts.get(row.duplicateKey) ?? 0) > 1;
    const repeatedInHistory = existingKeySet.has(row.duplicateKey);
    const isDuplicate = repeatedInFile || repeatedInHistory;
    const duplicateGroup = isDuplicate ? row.duplicateKey : null;

    if (isDuplicate) {
      duplicateRows += 1;
    }

    return {
      ...row,
      isDuplicate,
      duplicateGroup,
    };
  });

  return {
    rows,
    duplicateRows,
  };
}

