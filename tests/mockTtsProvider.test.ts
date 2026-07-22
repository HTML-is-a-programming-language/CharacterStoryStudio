import { describe, expect, it } from "vitest";
import { MockTtsProvider } from "../src/pipeline/MockTtsProvider";

describe("MockTtsProvider", () => {
  it("유효한 WAV data URI를 만든다", async () => {
    const result = await MockTtsProvider.generateNarration({
      sceneId: "scene-1",
      text: "테스트 대사",
      durationInFrames: 150,
      fps: 30,
    });

    expect(result.dataUri.startsWith("data:audio/wav;base64,")).toBe(true);
  });

  it("같은 입력이면 항상 같은 나레이션을 만든다(결정론적)", async () => {
    const input = { sceneId: "scene-2", text: "같은 대사", durationInFrames: 90, fps: 30 };
    const first = await MockTtsProvider.generateNarration(input);
    const second = await MockTtsProvider.generateNarration(input);

    expect(first.dataUri).toBe(second.dataUri);
  });

  it("sceneId가 다르면(재생성 variant 포함) 다른 나레이션을 만든다", async () => {
    const base = { text: "대사", durationInFrames: 90, fps: 30 };
    const first = await MockTtsProvider.generateNarration({ ...base, sceneId: "scene-3:0" });
    const second = await MockTtsProvider.generateNarration({ ...base, sceneId: "scene-3:1" });

    expect(first.dataUri).not.toBe(second.dataUri);
  });
});
