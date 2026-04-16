import { apiRequest } from "./http";

export function getFinancialAccounts() {
  return apiRequest("/financialaccounts");
}

export function createFinancialAccount(payload) {
  return apiRequest("/financialaccounts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function syncFinancialAccount(id) {
  return apiRequest(`/financialaccounts/${id}/sync`, {
    method: "POST",
  });
}
