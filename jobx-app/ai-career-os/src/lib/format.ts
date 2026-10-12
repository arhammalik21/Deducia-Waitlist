export function formatMonthYear(date: Date | string | null | undefined) {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatRange(
  start: Date | string | null | undefined,
  end: Date | string | null | undefined,
  isCurrent?: boolean,
) {
  const a = formatMonthYear(start);
  const b = isCurrent ? "Present" : formatMonthYear(end);
  if (!a && !b) return null;
  if (a && b) return `${a} – ${b}`;
  return a || b;
}
