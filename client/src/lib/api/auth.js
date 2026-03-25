import { apiRequest } from "./http";

export async function loginRequest(email, password) {
const data = await apiRequest("/auth/login", {
method: "POST",
body: JSON.stringify({ email, password }),
});

localStorage.setItem("token", data.token);
localStorage.setItem("user", JSON.stringify(data.user));

return data;
}

export async function registerRequest(name, email, password) {
return apiRequest("/auth/register", {
method: "POST",
body: JSON.stringify({ name, email, password }),
});
}

export function logout() {
localStorage.removeItem("token");
localStorage.removeItem("user");
}

export function getStoredUser() {
const raw = localStorage.getItem("user");
return raw ? JSON.parse(raw) : null;
}

export function getStoredToken() {
return localStorage.getItem("token");
}