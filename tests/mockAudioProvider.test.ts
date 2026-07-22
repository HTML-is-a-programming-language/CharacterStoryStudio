import { describe, expect, it } from "vitest";
import { MockAudioProvider } from "../src/pipeline/MockAudioProvider";

describe("MockAudioProvider", () => {
  it("generateNarration은 유효한 WAV data URI를 만든다", async () => {
    const result = await MockAudioProvider.generateNarration({
      sceneId: "scene-1",
      text: "테스트 대사",
      durationInFrames: 150,
      fps: 30,
    });

    expect(result.dataUri.startsWith("data:audio/wav;base64,")).toBe(true);
  });

  it("같은 입력이면 항상 같은 나레이션을 만든다(결정론적)", async () => {
    const input = { sceneId: "scene-2", text: "같은 대사", durationInFrames: 90, fps: 30 };
    const first = await MockAudioProvider.generateNarration(input);
    const second = await MockAudioProvider.generateNarration(input);

    expect(first.dataUri).toBe(second.dataUri);
  });

  it("sceneId가 다르면(재생성 variant 포함) 다른 나레이션을 만든다", async () => {
    const base = { text: "대사", durationInFrames: 90, fps: 30 };
    const first = await MockAudioProvider.generateNarration({ ...base, sceneId: "scene-3:0" });
    const second = await MockAudioProvider.generateNarration({ ...base, sceneId: "scene-3:1" });

    expect(first.dataUri).not.toBe(second.dataUri);
  });

  it("generateMusic은 톤에 따라 다른 배경음악을 만든다", async () => {
    const calm = await MockAudioProvider.generateMusic({ tone: "calm", durationInFrames: 300, fps: 30 });
    const romantic = await MockAudioProvider.generateMusic({
      tone: "romantic",
      durationInFrames: 300,
      fps: 30,
    });

    expect(calm.dataUri.startsWith("data:audio/wav;base64,")).toBe(true);
    expect(calm.dataUri).not.toBe(romantic.dataUri);
  });
});
