import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // mode = "development" | "production" 등 실행 모드
  // 세 번째 인자(prefixFilter) → '' 로 두면 전체 다 로드
  // eslint-disable-next-line no-undef
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    server: {
      proxy: {
        "^/chat": {
          target: env.VITE_API_BASE,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/chat/, "/api/chat"),
        },
      },
    },
  };
});
