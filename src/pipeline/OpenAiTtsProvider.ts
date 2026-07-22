import type { GenerateNarrationInput, GeneratedAudio, TtsProvider } from "./TtsProvider";

/**
 * OpenAI TTS API(tts-1)를 호출하는 실제 Provider.
 *
 * 한계(TODO):
 * - 실제 API 키로 라이브 호출을 검증한 적이 없다(개발 환경에 키가 없음). 요청/응답 형식은
 *   공개 문서를 기준으로 작성했으며, 실제 배포 전에 진짜 키로 최소 1회 수동 검증이 필요하다.
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
        response_format: "mp3",
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`TTS API 호출 실패 (HTTP ${response.status}): ${errorBody}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    return { dataUri: `data:audio/mp3;base64,${base64}` };
  }
}
