import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import autoFont from "./plugins/vite-plugin-auto-font";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    autoFont({
      // 폰트 디렉토리 (public 기준)
      fontDir: "fonts/Example",

      // CSS font-family 이름
      fontFamily: "CustomFont",

      // 언어별 설정 (폴더명, weight 범위)
      languages: {
        korean: { folder: "Korean", minWeight: 200, maxWeight: 700 },
        english: { folder: "English", minWeight: 200, maxWeight: 800 },
      },

      // Unicode Range로 한글/영어 자동 분리 (lang 속성 불필요!)
      useUnicodeRange: true,

      // 생성된 CSS 파일 위치
      outputPath: "src/styles/auto-fonts.css",

      // 디버그 모드 (콘솔에 상세 로그)
      debug: true,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
