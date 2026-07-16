import { describe, expect, it } from "vitest";
import { StoryPlanSchema } from "../src/schema";
import sampleStory from "../src/data/sample-story.json";

describe("StoryPlanSchema", () => {
  it("validates the sample story", () => {
    const result = StoryPlanSchema.safeParse(sampleStory);
    expect(result.success).toBe(true);
  });

  it("keeps total scene duration within the 25-35s target range", () => {
    const story = StoryPlanSchema.parse(sampleStory);
    const totalFrames = story.scenes.reduce((sum, scene) => sum + scene.durationInFrames, 0);
    const totalSeconds = totalFrames / story.fps;

    expect(totalSeconds).toBeGreaterThanOrEqual(25);
    expect(totalSeconds).toBeLessThanOrEqual(35);
  });

  it("rejects a scene with a non-hex background color", () => {
    const invalid = {
      ...sampleStory,
      scenes: [
        {
          ...(sampleStory as { scenes: Array<Record<string, unknown>> }).scenes[0],
          background: { from: "blue", to: "#000000" },
        },
      ],
    };

    const result = StoryPlanSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
