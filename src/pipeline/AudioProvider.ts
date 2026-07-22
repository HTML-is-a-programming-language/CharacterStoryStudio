import type { StoryConcept } from "./types";

export interface GenerateNarrationInput {
  sceneId: string;
  text: string;
  durationInFrames: number;
  fps: number;
}

export interface GenerateMusicInput {
  tone: StoryConcept["tone"];
  durationInFrames: number;
  fps: number;
}

export interface GeneratedAudio {
  /** data: URI (예: data:audio/wav;base64,...) */
  dataUri: string;
}

/**
 * 씬 나레이션과 배경음악을 만드는 AI 파이프라인의 추상화. Mock 구현(MockAudioProvider)은
 * 실제 음성 합성/작곡 없이 절차적으로 소리를 만든다. 이후 실제 TTS/음악 생성 Provider로
 * 교체할 때도 이 인터페이스를 그대로 구현하면 된다.
 */
export interface AudioProvider {
  generateNarration(input: GenerateNarrationInput): Promise<GeneratedAudio>;
  generateMusic(input: GenerateMusicInput): Promise<GeneratedAudio>;
}
