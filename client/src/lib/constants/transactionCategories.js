export const EXPENSE_TRANSACTION_CATEGORIES = [
  "Alimenta\u00e7\u00e3o",
  "Transporte",
  "Moradia",
  "Lazer",
  "Sa\u00fade",
  "Educa\u00e7\u00e3o",
  "Assinaturas",
  "Outros",
];

export const INCOME_TRANSACTION_CATEGORIES = [
  "Sal\u00e1rio",
  "Freelancer",
  "Comiss\u00e3o",
  "Investimentos",
  "Reembolso",
  "Vendas",
  "Outros",
];

export const TRANSACTION_CATEGORIES = EXPENSE_TRANSACTION_CATEGORIES;

export function getTransactionCategories(type) {
  return type === "income"
    ? INCOME_TRANSACTION_CATEGORIES
    : EXPENSE_TRANSACTION_CATEGORIES;
}
