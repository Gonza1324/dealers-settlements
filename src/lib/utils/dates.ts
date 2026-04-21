export function toMonthStart(input: Date | string) {
  const date = typeof input === "string" ? new Date(input) : input;

  return new Date(date.getFullYear(), date.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
}

