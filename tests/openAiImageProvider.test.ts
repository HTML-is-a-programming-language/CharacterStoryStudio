import { describe, expect, it, vi } from "vitest";
import { OpenAiImageProvider } from "../src/pipeline/OpenAiImageProvider";

/**
 * 실제 OpenAI API 키가 없어 라이브 호출은 검증하지 못한다. 여기서는 fetch를 가짜로
 * 주입해 "요청을 올바르게 보내는지"와 "응답을 올바르게 해석하는지"만 검증한다.
 * 진짜 API와의 통합 검증은 실제 키를 가진 환경에서 별도로 필요하다.
 */

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as Response;
}

describe("OpenAiImageProvider", () => {
  it("올바른 엔드포인트/헤더/바디로 요청을 보낸다", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: [{ b64_json: "AAAA" }] }));
    const provider = new OpenAiImageProvider("sk-test", fetchMock);

    await provider.generateSceneImage({
      sceneId: "scene-1",
      tone: "romantic",
      variant: 0,
      seedText: "테스트 대사",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.openai.com/v1/images/generations");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer sk-test");

    const body = JSON.parse(init.body as string) as { model: string; prompt: string };
    expect(body.model).toBe("gpt-image-1");
    expect(body.prompt).toContain("테스트 대사");
  });

  it("b64_json 응답을 data URI로 변환한다", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: [{ b64_json: "AAAA" }] }));
    const provider = new OpenAiImageProvider("sk-test", fetchMock);

    const result = await provider.generateSceneImage({
      sceneId: "scene-1",
      tone: "calm",
      variant: 0,
      seedText: "대사",
    });

    expect(result.dataUri).toBe("data:image/png;base64,AAAA");
  });

  it("url 응답도 처리한다", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ data: [{ url: "https://example.com/image.png" }] }));
    const provider = new OpenAiImageProvider("sk-test", fetchMock);

    const result = await provider.generateSceneImage({
      sceneId: "scene-1",
      tone: "calm",
      variant: 0,
      seedText: "대사",
    });

    expect(result.dataUri).toBe("https://example.com/image.png");
  });

  it("응답이 실패(non-2xx)면 명확한 에러를 던진다", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ error: "invalid api key" }, false, 401));
    const provider = new OpenAiImageProvider("sk-invalid", fetchMock);

    await expect(
      provider.generateSceneImage({ sceneId: "scene-1", tone: "calm", variant: 0, seedText: "대사" }),
    ).rejects.toThrow(/401/);
  });

  it("이미지 데이터가 없는 응답이면 에러를 던진다", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: [] }));
    const provider = new OpenAiImageProvider("sk-test", fetchMock);

    await expect(
      provider.generateSceneImage({ sceneId: "scene-1", tone: "calm", variant: 0, seedText: "대사" }),
    ).rejects.toThrow();
  });
});
