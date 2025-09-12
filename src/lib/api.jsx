import axios from "axios";

const rawBase = import.meta.env.DEV
  ? "/api"
  : import.meta.env.VITE_API_BASE || "";

const baseURL = rawBase.replace(/\/+$/, "");

const api = axios.create({
  baseURL,
  withCredentials: false,
});

export default api;
