export const EXPENSE_TRANSACTION_CATEGORIES = [
  "Alimentacao",
  "Transporte",
  "Moradia",
  "Lazer",
  "Saude",
  "Educacao",
  "Assinaturas",
  "Outros",
];

export const INCOME_TRANSACTION_CATEGORIES = [
  "Salario",
  "Freelancer",
  "Comissao",
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
