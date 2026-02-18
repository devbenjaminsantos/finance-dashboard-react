export function formatBRDate(isoDate) {
  if (!isoDate) return "";
  const [y, m, d] = String(isoDate).split("-");
  return `${d}/${m}/${y}`;
}