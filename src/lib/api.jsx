import axios from "axios";

/**
 * JWT 토큰 저장 유틸
 */
const tokenStore = {
  getAccessToken() {
    return localStorage.getItem("accessToken");
  },
  getRefreshToken() {
    return localStorage.getItem("refreshToken");
  },
  setTokens({ accessToken, refreshToken }) {
    if (accessToken) localStorage.setItem("accessToken", accessToken);
    if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
  },
  clear() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  },
};

const api = axios.create({
  baseURL: "/", // Vercel rewrite 사용
  withCredentials: true, // 있어도 무방 (refresh를 쿠키로 쓰는 구조에도 대응)
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * 요청 인터셉터
 * → accessToken 자동 첨부
 */
api.interceptors.request.use(
  (config) => {
    const accessToken = tokenStore.getAccessToken();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * 응답 인터셉터
 * → 401 발생 시 refreshToken으로 재발급 후 원요청 재시도
 */
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, newAccessToken = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(newAccessToken);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!error.response || originalRequest._retry) {
      return Promise.reject(error);
    }

    const status = error.response.status;
    const url = originalRequest.url || "";

    const isAuthApi =
      url.startsWith("/auth/login") ||
      url.startsWith("/auth/register") ||
      url.startsWith("/auth/refresh");

    if (status !== 401 || isAuthApi) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          },
          reject,
        });
      });
    }

    isRefreshing = true;

    try {
      const refreshToken = tokenStore.getRefreshToken();
      if (!refreshToken) throw new Error("No refresh token");

      // 백엔드 refresh API 경로에 맞게 수정 필요
      const res = await axios.post(
        "/auth/refresh",
        { refreshToken },
        { headers: { "Content-Type": "application/json" } }
      );

      const { accessToken, refreshToken: newRefreshToken } = res.data;
      tokenStore.setTokens({ accessToken, refreshToken: newRefreshToken });

      processQueue(null, accessToken);

      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api(originalRequest);
    } catch (err) {
      processQueue(err, null);
      tokenStore.clear();
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
