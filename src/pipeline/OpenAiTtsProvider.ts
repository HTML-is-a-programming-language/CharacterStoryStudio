import type { GenerateNarrationInput, GeneratedAudio, TtsProvider } from "./TtsProvider";

/**
 * OpenAI TTS API(tts-1)를 호출하는 실제 Provider.
 *
 * 한계(TODO):
 * - `response_format`을 `wav`로 요청한다. 처음엔 렌더링 결과 오디오가 통째로 무음이길래
 *   `mp3`의 비표준 MIME(`audio/mp3`, 표준은 `audio/mpeg`)이 원인이라고 의심해 WAV로
 *   바꿨는데, 실제 원인은 따로 있었다(스크립트 props 형태 불일치, ADR-021) — 원인을 고친
 *   뒤 다시 확인해보니 mp3도 정상 재생됐다. 그래도 이 파이프라인에서 실측 검증된 유일한
 *   오디오 포맷(ADR-018 스파이크, Mock도 WAV)으로 통일해두는 게 안전해 WAV는 그대로
 *   유지했다. 실제 렌더링 결과물에서 이미지·오디오가 모두 정상 출력되는 것까지 라이브로
 *   검증했다.
 * - OpenAI TTS는 대사 텍스트의 자연스러운 발화 속도로 음성을 만들 뿐, 씬의
 *   `durationInFrames`에 맞춰 길이를 조절해주지 않는다. Remotion의 <Audio>는 씬 Sequence
 *   길이를 넘는 오디오는 그 지점에서 잘리고, 짧으면 남는 시간은 무음으로 재생된다 —
 *   완벽한 립싱크/싱크는 보장하지 않는다(Mock Provider는 반대로 길이를 정확히 맞추지만
 *   실제 목소리가 아니다). 실제 서비스로 발전시키려면 오디오 길이에 맞춰 씬 길이를
 *   재계산하는 별도 로직이 필요하다.
 */
export class OpenAiTtsProvider implements TtsProvider {
  constructor(
    private readonly apiKey: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async generateNarration(input: GenerateNarrationInput): Promise<GeneratedAudio> {
    const response = await this.fetchImpl("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "tts-1",
        voice: "alloy",
        input: input.text,
        response_format: "wav",
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`TTS API 호출 실패 (HTTP ${response.status}): ${errorBody}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    return { dataUri: `data:audio/wav;base64,${base64}` };
  }
}
