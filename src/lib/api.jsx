import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE, // 절대 URL
  withCredentials: false, // 쿠키 세션이면 true
});

export default api;
