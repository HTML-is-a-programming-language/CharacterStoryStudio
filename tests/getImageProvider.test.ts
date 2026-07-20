import { describe, expect, it, vi } from "vitest";
import { getImageProvider } from "../src/pipeline/getImageProvider";
import { MockImageProvider } from "../src/pipeline/MockImageProvider";
import { OpenAiImageProvider } from "../src/pipeline/OpenAiImageProvider";

describe("getImageProvider", () => {
  it("환경변수가 없으면 MockImageProvider를 반환한다", () => {
    expect(getImageProvider({})).toBe(MockImageProvider);
  });

  it("IMAGE_PROVIDER=real 이어도 키가 없으면 경고 후 MockImageProvider로 폴백한다", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const provider = getImageProvider({ IMAGE_PROVIDER: "real" });

    expect(provider).toBe(MockImageProvider);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("키만 있고 IMAGE_PROVIDER가 지정되지 않으면 여전히 MockImageProvider를 쓴다", () => {
    const provider = getImageProvider({ OPENAI_API_KEY: "sk-test" });
    expect(provider).toBe(MockImageProvider);
  });

  it("IMAGE_PROVIDER=real 이고 키가 있으면 OpenAiImageProvider를 반환한다", () => {
    const provider = getImageProvider({ IMAGE_PROVIDER: "real", OPENAI_API_KEY: "sk-test" });
    expect(provider).toBeInstanceOf(OpenAiImageProvider);
  });
});
