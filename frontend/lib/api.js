import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
});

export const register = (data) => api.post("/register", data);
export const login = (data) => api.post("/login", data);
export const getNotes = (token) =>
  api.get("/notes", { headers: { Authorization: token } });
export const createNote = (token, data) =>
  api.post("/notes", data, { headers: { Authorization: token } });

export default api;
