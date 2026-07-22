import { describe, expect, it } from "vitest";
import { MockMusicProvider } from "../src/pipeline/MockMusicProvider";

describe("MockMusicProvider", () => {
  it("유효한 WAV data URI를 만든다", async () => {
    const result = await MockMusicProvider.generateMusic({ tone: "calm", durationInFrames: 300, fps: 30 });
    expect(result.dataUri.startsWith("data:audio/wav;base64,")).toBe(true);
  });

  it("톤에 따라 다른 배경음악을 만든다", async () => {
    const calm = await MockMusicProvider.generateMusic({ tone: "calm", durationInFrames: 300, fps: 30 });
    const romantic = await MockMusicProvider.generateMusic({
      tone: "romantic",
      durationInFrames: 300,
      fps: 30,
    });

    expect(calm.dataUri).not.toBe(romantic.dataUri);
  });

  it("같은 입력이면 항상 같은 배경음악을 만든다(결정론적)", async () => {
    const input = { tone: "bittersweet" as const, durationInFrames: 300, fps: 30 };
    const first = await MockMusicProvider.generateMusic(input);
    const second = await MockMusicProvider.generateMusic(input);

    expect(first.dataUri).toBe(second.dataUri);
  });
});
