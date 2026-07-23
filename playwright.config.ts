import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  // 실제 Remotion 렌더링(Mock 기준 약 20~50초)이 끝나는 것까지 기다리는 테스트가 있다.
  // 채팅 왕복 + 페이지 전환까지 합치면 렌더링 대기만으로 90초를 다 써버릴 수 있어서 넉넉하게 잡는다.
  timeout: 150_000,
  // renderJobStore가 프로세스 전역 인메모리 싱글턴이라(ADR-020) 여러 테스트가 동시에 렌더링을
  // 시작하면 서로 다른 잡을 헷갈릴 위험이 있다 — 병렬 실행하지 않는다.
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "pnpm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
