export interface GenerateNarrationInput {
  sceneId: string;
  text: string;
  durationInFrames: number;
  fps: number;
}

export interface GeneratedAudio {
  /** data: URI (예: data:audio/wav;base64,...) — WAV로 통일한다(ADR-021). */
  dataUri: string;
}

/**
 * 씬 나레이션(음성)을 만드는 AI 파이프라인의 추상화. Mock 구현(MockTtsProvider)은 실제 음성
 * 합성 없이 절차적으로 소리를 만들고, OpenAiTtsProvider는 실제 TTS API를 호출한다.
 */
export interface TtsProvider {
  generateNarration(input: GenerateNarrationInput): Promise<GeneratedAudio>;
}
