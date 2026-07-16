import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { Scene, StoryPlan } from "./schema";

const SceneView: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 200 } });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const dialogueOffsetY = interpolate(enter, [0, 1], [30, 0]);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(160deg, ${scene.background.from}, ${scene.background.to})`,
        justifyContent: "flex-end",
        padding: 80,
        fontFamily: "'Pretendard', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif",
      }}
    >
      {scene.caption !== undefined && (
        <div
          style={{
            position: "absolute",
            top: 100,
            left: 80,
            color: "rgba(255,255,255,0.6)",
            fontSize: 32,
            letterSpacing: 2,
            opacity,
          }}
        >
          {scene.caption}
        </div>
      )}
      <div style={{ opacity, transform: `translateY(${dialogueOffsetY}px)` }}>
        <div style={{ color: "#f5c8d9", fontSize: 28, marginBottom: 12 }}>
          {scene.speaker}
        </div>
        <div style={{ color: "white", fontSize: 52, fontWeight: 700, lineHeight: 1.4 }}>
          {scene.dialogue}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const StoryComposition: React.FC<{ story: StoryPlan }> = ({ story }) => {
  let startFrame = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {story.scenes.map((scene) => {
        const from = startFrame;
        startFrame += scene.durationInFrames;
        return (
          <Sequence key={scene.id} from={from} durationInFrames={scene.durationInFrames}>
            <SceneView scene={scene} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
