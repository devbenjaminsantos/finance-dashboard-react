const API_URL = "http://localhost:5278/api";

export async function apiRequest(path, options = {}) {
const token = localStorage.getItem("token");

const headers = {
"Content-Type": "application/json",
...(token && { Authorization: `Bearer ${token}` }),
...options.headers,
};

const response = await fetch(`${API_URL}${path}`, {
...options,
headers,
});

if (!response.ok) {
throw new Error("Erro na requisição");
}

return response.json();
}