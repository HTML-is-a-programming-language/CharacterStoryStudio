import path from "node:path";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "server-only": path.resolve(__dirname, "tests/stubs/server-only.ts"),
    },
  },
  test: {
    // e2e/는 Playwright 전용이다 — vitest 기본 include 패턴(**/*.spec.ts)이 그대로 집어가면
    // 실제 dev 서버 없이 vitest가 Playwright 테스트를 실행하려다 실패한다.
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
});
