import { describe, expect, it } from "vitest";
import { MockImageProvider } from "../src/pipeline/MockImageProvider";

function decodeSvg(dataUri: string): string {
  const base64 = dataUri.replace("data:image/svg+xml;base64,", "");
  return Buffer.from(base64, "base64").toString("utf-8");
}

describe("MockImageProvider", () => {
  it("data:image/svg+xml;base64, 로 시작하는 유효한 SVG를 만든다", async () => {
    const image = await MockImageProvider.generateSceneImage({
      sceneId: "scene-1",
      tone: "romantic",
      variant: 0,
      seedText: "테스트 대사",
    });

    expect(image.dataUri.startsWith("data:image/svg+xml;base64,")).toBe(true);
    expect(decodeSvg(image.dataUri)).toContain("<svg");
    expect(image.altText.length).toBeGreaterThan(0);
  });

  it("같은 입력이면 항상 같은 이미지를 만든다(결정론적)", async () => {
    const input = { sceneId: "scene-2", tone: "calm" as const, variant: 1, seedText: "같은 대사" };
    const first = await MockImageProvider.generateSceneImage(input);
    const second = await MockImageProvider.generateSceneImage(input);

    expect(first.dataUri).toBe(second.dataUri);
  });

  it("variant가 다르면 다른 이미지를 만든다", async () => {
    const base = { sceneId: "scene-3", tone: "bittersweet" as const, seedText: "대사" };
    const variantZero = await MockImageProvider.generateSceneImage({ ...base, variant: 0 });
    const variantOne = await MockImageProvider.generateSceneImage({ ...base, variant: 1 });

    expect(variantZero.dataUri).not.toBe(variantOne.dataUri);
  });
});
