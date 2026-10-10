import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  try {
    const auth = JSON.parse(localStorage.getItem("fieldwork-auth") || "null");
    if (auth?.token) {
      config.headers.Authorization = `Bearer ${auth.token}`;
    }
  } catch {
    localStorage.removeItem("fieldwork-auth");
  }
  return config;
});

export default api;
