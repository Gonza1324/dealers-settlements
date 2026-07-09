"use client";

import { useEffect, useState } from "react";

function supportsMonthInput() {
  const input = document.createElement("input");
  input.type = "month";
  input.value = "2026-07";
  return input.type === "month" && input.value === "2026-07";
}

function toDateValue(periodMonth: string) {
  return periodMonth ? `${periodMonth}-01` : "";
}

function toPeriodMonth(dateValue: string) {
  return dateValue.slice(0, 7);
}

export function MonthFilterField({ periodMonth }: { periodMonth: string }) {
  const [hasMonthInput, setHasMonthInput] = useState(true);
  const [fallbackDate, setFallbackDate] = useState(toDateValue(periodMonth));

  useEffect(() => {
    setHasMonthInput(supportsMonthInput());
  }, []);

  if (hasMonthInput) {
    return <input defaultValue={periodMonth} name="periodMonth" type="month" />;
  }

  return (
    <>
      <input name="periodMonth" type="hidden" value={toPeriodMonth(fallbackDate)} />
      <input
        aria-label="Period"
        type="date"
        value={fallbackDate}
        onChange={(event) => setFallbackDate(event.target.value)}
      />
    </>
  );
}
