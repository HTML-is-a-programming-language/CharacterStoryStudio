import type { GeneratedAudio } from "./TtsProvider";
import type { StoryConcept } from "./types";

export interface GenerateMusicInput {
  tone: StoryConcept["tone"];
  durationInFrames: number;
  fps: number;
}

export type { GeneratedAudio };

/**
 * 배경음악을 만드는 AI 파이프라인의 추상화. 지금은 MockMusicProvider만 존재한다 — 실제 음악
 * 생성 API(Suno 등)는 대부분 비동기 잡 제출→폴링 방식이라 이번 범위에서는 연동하지 않는다
 * (ADR-019).
 */
export interface MusicProvider {
  generateMusic(input: GenerateMusicInput): Promise<GeneratedAudio>;
}
