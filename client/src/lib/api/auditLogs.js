import { apiRequest } from "./http";

export function getAuditLogs(limit = 50) {
  return apiRequest(`/auditlogs?limit=${limit}`);
}
