import React from "react";
import { Composition } from "remotion";
import { StoryComposition } from "./StoryComposition";
import { StoryPlanSchema } from "./schema";
import sampleStory from "./data/sample-story.json";

const story = StoryPlanSchema.parse(sampleStory);
const totalDurationInFrames = story.scenes.reduce(
  (sum, scene) => sum + scene.durationInFrames,
  0,
);

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="StoryComposition"
      component={StoryComposition}
      durationInFrames={totalDurationInFrames}
      fps={story.fps}
      width={story.width}
      height={story.height}
      defaultProps={{ story }}
    />
  );
};
