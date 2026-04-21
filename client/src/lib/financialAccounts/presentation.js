export function formatFinancialAccountLabel(
  account,
  { fallbackName = "", endingLabel = "final" } = {}
) {
  if (!account) {
    return "";
  }

  const name = account.accountName || account.institutionName || fallbackName;
  const suffix = account.accountMask ? `- ${endingLabel} ${account.accountMask}` : "";

  return [name, suffix].filter(Boolean).join(" ");
}
