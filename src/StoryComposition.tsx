import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { Scene, StoryPlan } from "./schema";
import { sceneBackgroundStyle } from "./sceneStyle";

/**
 * imageDataUri가 있으면 CSS background-image 대신 Remotion의 <Img>로 그린다. <Img>는
 * delayRender/continueRender를 내부에서 등록해 헤드리스 프레임 캡처가 실제 디코딩을
 * 기다리게 만든다 — 순수 CSS background-image는 이 보장이 없어서, 작은 Mock SVG는
 * 우연히 통과했지만 실제 API의 큰 PNG(~3MB)는 캡처 시점까지 디코딩이 끝나지 않아
 * 화면에 아예 안 보이는 버그가 있었다(ADR-021).
 */
const SceneBackground: React.FC<{ scene: Scene }> = ({ scene }) => {
  if (scene.imageDataUri) {
    return (
      <AbsoluteFill>
        <Img
          src={scene.imageDataUri}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>
    );
  }

  return <AbsoluteFill style={sceneBackgroundStyle(scene)} />;
};

const SceneView: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 200 } });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const dialogueOffsetY = interpolate(enter, [0, 1], [30, 0]);

  return (
    <AbsoluteFill>
      <SceneBackground scene={scene} />
      {scene.audioDataUri !== undefined && <Audio src={scene.audioDataUri} />}
      <AbsoluteFill
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65), rgba(0,0,0,0) 55%)" }}
      />
      <AbsoluteFill
        style={{
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
    </AbsoluteFill>
  );
};

export const StoryComposition: React.FC<{ story: StoryPlan }> = ({ story }) => {
  let startFrame = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {story.musicDataUri !== undefined && <Audio src={story.musicDataUri} />}
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
