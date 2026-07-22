import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { POST } from "../app/story/[conceptId]/render/route";

/**
 * 실제 렌더링 성공 경로(202 응답 + 백그라운드 렌더링)는 여기서 검증하지 않는다 — 성공
 * 시 실제 Remotion 렌더링이 fire-and-forget으로 시작되기 때문에, vitest 안에서 트리거하면
 * 테스트 프로세스가 끝난 뒤에도 렌더링이 계속 실행되는 문제가 생긴다. 아래 두 분기(존재하지
 * 않는 컨셉/미승인 씬)는 모두 작업을 만들기 이전에 반환되므로 빠르게 테스트할 수 있다.
 * 202/상태 폴링/다운로드로 이어지는 전체 흐름은 dev 서버 + curl로 수동 검증했다
 * (docs/PORTFOLIO.md 참고).
 */
describe("POST /story/[conceptId]/render", () => {
  it("존재하지 않는 컨셉이면 404를 반환한다", async () => {
    const request = new NextRequest("http://localhost/story/does-not-exist/render", { method: "POST" });
    const response = await POST(request, { params: { conceptId: "does-not-exist" } });

    expect(response.status).toBe(404);
  });

  it("승인되지 않은 씬이 있으면 400을 반환한다", async () => {
    const request = new NextRequest("http://localhost/story/concept-calm/render", { method: "POST" });
    const response = await POST(request, { params: { conceptId: "concept-calm" } });

    expect(response.status).toBe(400);
  });
});
