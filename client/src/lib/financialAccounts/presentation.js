export function formatFinancialAccountLabel(account) {
  if (!account) {
    return "";
  }

  const name = account.accountName || account.institutionName || "Conta";
  const suffix = account.accountMask ? `• final ${account.accountMask}` : "";

  return [name, suffix].filter(Boolean).join(" ");
}
