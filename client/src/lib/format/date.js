export function formatBRDate(isoDate) {
  if (!isoDate) return "";

  const normalized = String(isoDate).trim().slice(0, 10);
  const [y, m, d] = normalized.split("-");

  if (!y || !m || !d) {
    return "";
  }

  return `${d}/${m}/${y}`;
}
