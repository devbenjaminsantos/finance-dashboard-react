export function formatBRDate(isoDate) {
  if (!isoDate) return "";

  const normalized = String(isoDate).trim().slice(0, 10);
  const [y, m, d] = normalized.split("-");

  if (!y || !m || !d) {
    return "";
  }

  return `${d}/${m}/${y}`;
}

export function formatDateTimeBR(isoDateTime) {
  if (!isoDateTime) {
    return "";
  }

  const date = new Date(isoDateTime);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}
