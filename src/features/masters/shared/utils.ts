export function normalizeAlias(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s/-]/g, "")
    .toLowerCase();
}

export function toDateInput(value: string | null) {
  return value ?? "";
}

export function overlaps(params: {
  startA: string;
  endA: string | null;
  startB: string;
  endB: string | null;
}) {
  const endA = params.endA ?? "9999-12-31";
  const endB = params.endB ?? "9999-12-31";

  return params.startA <= endB && params.startB <= endA;
}

export function isDateActive(date: string, from: string, to: string | null) {
  return from <= date && (to === null || to >= date);
}
