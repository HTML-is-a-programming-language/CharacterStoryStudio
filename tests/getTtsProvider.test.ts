import { describe, expect, it, vi } from "vitest";
import { getTtsProvider } from "../src/pipeline/getTtsProvider";
import { MockTtsProvider } from "../src/pipeline/MockTtsProvider";
import { OpenAiTtsProvider } from "../src/pipeline/OpenAiTtsProvider";

describe("getTtsProvider", () => {
  it("환경변수가 없으면 MockTtsProvider를 반환한다", () => {
    expect(getTtsProvider({})).toBe(MockTtsProvider);
  });

  it("TTS_PROVIDER=real 이어도 키가 없으면 경고 후 MockTtsProvider로 폴백한다", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const provider = getTtsProvider({ TTS_PROVIDER: "real" });

    expect(provider).toBe(MockTtsProvider);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("키만 있고 TTS_PROVIDER가 지정되지 않으면 여전히 MockTtsProvider를 쓴다", () => {
    const provider = getTtsProvider({ OPENAI_API_KEY: "sk-test" });
    expect(provider).toBe(MockTtsProvider);
  });

  it("TTS_PROVIDER=real 이고 키가 있으면 OpenAiTtsProvider를 반환한다", () => {
    const provider = getTtsProvider({ TTS_PROVIDER: "real", OPENAI_API_KEY: "sk-test" });
    expect(provider).toBeInstanceOf(OpenAiTtsProvider);
  });
});
