import { apiRequest } from "./http";

export function getTransactions() {
  return apiRequest("/transactions");
}

export function getInstallmentPlans() {
  return apiRequest("/transactions/installment-plans");
}

export function getRecurringRules() {
  return apiRequest("/transactions/recurring-rules");
}

export function createTransaction(transaction) {
  return apiRequest("/transactions", {
    method: "POST",
    body: JSON.stringify(transaction),
  });
}

export function importTransactions({ transactions, importFormat }) {
  return apiRequest("/transactions/import", {
    method: "POST",
    body: JSON.stringify({ transactions, importFormat }),
  });
}

export function updateTransaction(id, transaction) {
  return apiRequest(`/transactions/${id}`, {
    method: "PUT",
    body: JSON.stringify(transaction),
  });
}

export function deleteTransaction(id) {
  return apiRequest(`/transactions/${id}`, {
    method: "DELETE",
  });
}

export function deleteInstallmentGroup(installmentGroupId) {
  return apiRequest(`/transactions/installment-groups/${installmentGroupId}`, {
    method: "DELETE",
  });
}

export function updateInstallmentGroup(installmentGroupId, payload) {
  return apiRequest(`/transactions/installment-groups/${installmentGroupId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
