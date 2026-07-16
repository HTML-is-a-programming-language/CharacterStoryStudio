import React from "react";
import { Composition } from "remotion";
import { StoryComposition } from "./StoryComposition";
import { StoryPlanSchema, type StoryPlan } from "./schema";
import sampleStory from "./data/sample-story.json";

const defaultStory = StoryPlanSchema.parse(sampleStory);

function totalDurationInFrames(story: StoryPlan): number {
  return story.scenes.reduce((sum, scene) => sum + scene.durationInFrames, 0);
}

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="StoryComposition"
      component={StoryComposition}
      durationInFrames={totalDurationInFrames(defaultStory)}
      fps={defaultStory.fps}
      width={defaultStory.width}
      height={defaultStory.height}
      defaultProps={{ story: defaultStory }}
      calculateMetadata={({ props }) => {
        // --props로 다른 StoryPlan JSON(예: Phase 2 생성 결과)이 들어와도
        // 그 값 기준으로 재생시간/해상도/fps를 다시 계산한다.
        const story = StoryPlanSchema.parse(props.story);
        return {
          durationInFrames: totalDurationInFrames(story),
          fps: story.fps,
          width: story.width,
          height: story.height,
          props: { story },
        };
      }}
    />
  );
};
