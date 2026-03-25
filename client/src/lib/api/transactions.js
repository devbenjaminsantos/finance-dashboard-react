import { apiRequest } from "./http";

export function getTransactions() {
return apiRequest("/transactions");
}

export function createTransaction(transaction) {
return apiRequest("/transactions", {
method: "POST",
body: JSON.stringify(transaction),
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