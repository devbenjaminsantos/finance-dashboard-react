export function filterTransactionsByFinancialAccount(transactions, accountFilter) {
  const list = Array.isArray(transactions) ? transactions : [];

  if (accountFilter === "unassigned") {
    return list.filter((transaction) => transaction.financialAccountId == null);
  }

  if (accountFilter && accountFilter !== "all") {
    return list.filter(
      (transaction) => String(transaction.financialAccountId) === String(accountFilter)
    );
  }

  return list;
}

export function getFinancialAccountScopeLabel(accountFilter, accounts = []) {
  if (accountFilter === "all") {
    return "Saldo global em todas as contas";
  }

  if (accountFilter === "unassigned") {
    return "Movimentacoes sem conta vinculada";
  }

  return (
    accounts.find((account) => String(account.id) === String(accountFilter))?.label ||
    "Conta selecionada"
  );
}
