import { apiRequest } from "./http";

export function getPublicDashboardSettings() {
  return apiRequest("/profile/public-dashboard");
}

export function updatePublicDashboardSettings(enabled) {
  return apiRequest("/profile/public-dashboard", {
    method: "PUT",
    body: JSON.stringify({ enabled }),
  });
}

export function getPublicDashboard(token) {
  return apiRequest(`/public-dashboard/${token}`);
}
