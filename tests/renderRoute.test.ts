import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { GET } from "../app/story/[conceptId]/render/route";

/**
 * 실제 렌더링(20~30초, Remotion 번들링 포함)은 여기서 검증하지 않는다 — 두 분기(존재하지
 * 않는 컨셉/미승인 씬) 모두 renderStoryboardToFile 호출 이전에 반환되므로 빠르게
 * 테스트할 수 있다. 실제 렌더링 성공 경로는 dev 서버 + curl로 수동 검증했다(PORTFOLIO.md 참고).
 */
describe("GET /story/[conceptId]/render", () => {
  it("존재하지 않는 컨셉이면 404를 반환한다", async () => {
    const request = new NextRequest("http://localhost/story/does-not-exist/render");
    const response = await GET(request, { params: { conceptId: "does-not-exist" } });

    expect(response.status).toBe(404);
  });

  it("승인되지 않은 씬이 있으면 400을 반환한다", async () => {
    const request = new NextRequest("http://localhost/story/concept-calm/render");
    const response = await GET(request, { params: { conceptId: "concept-calm" } });

    expect(response.status).toBe(400);
  });
});
