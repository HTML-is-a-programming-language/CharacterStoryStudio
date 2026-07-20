import type { CSSProperties } from "react";
import type { Scene } from "./schema";

/**
 * Remotion(StoryComposition)과 Next.js UI(SceneCard)가 같은 방식으로 씬 배경을 렌더링하도록
 * 공유하는 순수 함수. ImageProvider가 만든 이미지가 있으면 그걸 쓰고, 없으면(예: Phase 1의
 * 손으로 쓴 고정 샘플처럼 이미지가 없는 경우) 그라디언트로 대체한다.
 */
export function sceneBackgroundStyle(scene: Scene): CSSProperties {
  if (scene.imageDataUri) {
    return {
      backgroundImage: `url(${scene.imageDataUri})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }

  return {
    backgroundImage: `linear-gradient(160deg, ${scene.background.from}, ${scene.background.to})`,
  };
}
