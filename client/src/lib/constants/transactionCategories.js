export const EXPENSE_TRANSACTION_CATEGORIES = [
  "Alimentação",
  "Transporte",
  "Moradia",
  "Lazer",
  "Saúde",
  "Educação",
  "Assinaturas",
  "Outros",
];

export const INCOME_TRANSACTION_CATEGORIES = [
  "Salário",
  "Freelancer",
  "Comissão",
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
