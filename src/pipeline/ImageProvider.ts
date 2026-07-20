import type { StoryConcept } from "./types";

export interface GenerateSceneImageInput {
  sceneId: string;
  tone: StoryConcept["tone"];
  /** 0 = 최초 생성, 1 이상 = 재생성 횟수. 같은 입력이면 같은 이미지가 나와야 한다(결정론적). */
  variant: number;
  /** 이미지에 다양성을 주기 위한 시드 텍스트(보통 씬 대사). 이미지 생성에 실제로 쓰이지는 않고 시드로만 쓰인다. */
  seedText: string;
}

export interface GeneratedSceneImage {
  /** data: URI (예: data:image/svg+xml;base64,...) */
  dataUri: string;
  altText: string;
}

/**
 * 씬 이미지를 만드는 AI 파이프라인의 추상화. Mock 구현(MockImageProvider)은 실제 이미지
 * 생성 API 없이 절차적으로 그림을 만든다. 이후 실제 이미지 생성 Provider(FAL, OpenAI 등)로
 * 교체할 때도 이 인터페이스를 그대로 구현하면 된다.
 */
export interface ImageProvider {
  generateSceneImage(input: GenerateSceneImageInput): Promise<GeneratedSceneImage>;
}
