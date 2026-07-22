import { describe, expect, it, vi } from "vitest";
import { OpenAiTtsProvider } from "../src/pipeline/OpenAiTtsProvider";

/**
 * 실제 API 호출 자체는 별도로 라이브 검증했다(OpenAiTtsProvider.ts 상단 주석 참고).
 * 여기서는 fetch를 가짜로 주입해 "요청을 올바르게 보내는지"와 "응답을 올바르게
 * 해석하는지"만 검증한다.
 */

function audioResponse(bytes: number[], ok = true, status = 200): Response {
  return {
    ok,
    status,
    arrayBuffer: async () => new Uint8Array(bytes).buffer,
    text: async () => "error body",
  } as Response;
}

describe("OpenAiTtsProvider", () => {
  it("올바른 엔드포인트/헤더/바디로 요청을 보낸다", async () => {
    const fetchMock = vi.fn().mockResolvedValue(audioResponse([1, 2, 3]));
    const provider = new OpenAiTtsProvider("sk-test", fetchMock);

    await provider.generateNarration({
      sceneId: "scene-1",
      text: "안녕하세요",
      durationInFrames: 150,
      fps: 30,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.openai.com/v1/audio/speech");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer sk-test");

    const body = JSON.parse(init.body as string) as { model: string; input: string };
    expect(body.model).toBe("tts-1");
    expect(body.input).toBe("안녕하세요");
  });

  it("응답 바이트를 wav data URI로 변환한다", async () => {
    const fetchMock = vi.fn().mockResolvedValue(audioResponse([1, 2, 3, 4]));
    const provider = new OpenAiTtsProvider("sk-test", fetchMock);

    const result = await provider.generateNarration({
      sceneId: "scene-1",
      text: "대사",
      durationInFrames: 90,
      fps: 30,
    });

    expect(result.dataUri.startsWith("data:audio/wav;base64,")).toBe(true);
  });

  it("response_format으로 wav를 요청한다", async () => {
    const fetchMock = vi.fn().mockResolvedValue(audioResponse([1, 2, 3]));
    const provider = new OpenAiTtsProvider("sk-test", fetchMock);

    await provider.generateNarration({
      sceneId: "scene-1",
      text: "대사",
      durationInFrames: 90,
      fps: 30,
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string) as { response_format: string };
    expect(body.response_format).toBe("wav");
  });

  it("응답이 실패(non-2xx)면 명확한 에러를 던진다", async () => {
    const fetchMock = vi.fn().mockResolvedValue(audioResponse([], false, 401));
    const provider = new OpenAiTtsProvider("sk-invalid", fetchMock);

    await expect(
      provider.generateNarration({ sceneId: "scene-1", text: "대사", durationInFrames: 90, fps: 30 }),
    ).rejects.toThrow(/401/);
  });
});
