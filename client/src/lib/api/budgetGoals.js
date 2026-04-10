import { apiRequest } from "./http";

export function getBudgetGoals(month) {
  const query = month ? `?month=${encodeURIComponent(month)}` : "";
  return apiRequest(`/budgetgoals${query}`);
}

export function createBudgetGoal(payload) {
  return apiRequest("/budgetgoals", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateBudgetGoal(id, payload) {
  return apiRequest(`/budgetgoals/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteBudgetGoal(id) {
  return apiRequest(`/budgetgoals/${id}`, {
    method: "DELETE",
  });
}
