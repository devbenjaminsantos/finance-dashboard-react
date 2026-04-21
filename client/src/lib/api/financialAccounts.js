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

export function updateFinancialAccount(id, payload) {
  return apiRequest(`/financialaccounts/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteFinancialAccount(id) {
  return apiRequest(`/financialaccounts/${id}`, {
    method: "DELETE",
  });
}

export function syncFinancialAccount(id) {
  return apiRequest(`/financialaccounts/${id}/sync`, {
    method: "POST",
  });
}

export function createFinancialAccountConnectToken(id) {
  return apiRequest(`/financialaccounts/${id}/connect-token`, {
    method: "POST",
  });
}

export function linkFinancialAccountItem(id, payload) {
  return apiRequest(`/financialaccounts/${id}/link-item`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
