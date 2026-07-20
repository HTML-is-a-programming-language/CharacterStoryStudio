import { describe, expect, it } from "vitest";
import { sceneBackgroundStyle } from "../src/sceneStyle";
import type { Scene } from "../src/schema";

const baseScene: Scene = {
  id: "scene-1",
  durationInFrames: 150,
  background: { from: "#111111", to: "#222222" },
  speaker: "하람",
  dialogue: "테스트 대사",
};

describe("sceneBackgroundStyle", () => {
  it("imageDataUri가 있으면 이미지를 배경으로 쓴다", () => {
    const scene: Scene = { ...baseScene, imageDataUri: "data:image/svg+xml;base64,AAAA" };
    const style = sceneBackgroundStyle(scene);

    expect(style.backgroundImage).toBe("url(data:image/svg+xml;base64,AAAA)");
    expect(style.backgroundSize).toBe("cover");
  });

  it("imageDataUri가 없으면 그라디언트로 대체한다", () => {
    const style = sceneBackgroundStyle(baseScene);
    expect(style.backgroundImage).toBe("linear-gradient(160deg, #111111, #222222)");
  });
});
