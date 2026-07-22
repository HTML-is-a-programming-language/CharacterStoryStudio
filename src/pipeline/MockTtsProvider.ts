import type { GenerateNarrationInput, GeneratedAudio, TtsProvider } from "./TtsProvider";
import { hashSeed, seededRandom } from "./utils";
import { sineTone, toWavDataUri } from "./wavEncoder";

/**
 * 실제 음성 합성 API 없이, 절차적으로 소리를 만드는 Mock TTS Provider.
 *
 * 한계(의도적 단순화, TODO): 실제 사람 목소리가 아니라 대사 내용을 시드로 한 사인파 톤에
 * 트레몰로(진폭 변조)를 입혀 말하는 리듬만 흉내낸다. 실제 TTS Provider(OpenAiTtsProvider)로
 * 교체할 때 이 자리를 대체한다.
 */

const SAMPLE_RATE = 22050;
const NARRATION_AMPLITUDE = 0.18;

function narrationFrequency(seed: number): number {
  // 사람 목소리 기본 주파수대와 비슷한 범위(150~220Hz)에서 시드로 고른다.
  return 150 + seededRandom(seed, 1) * 70;
}

export const MockTtsProvider: TtsProvider = {
  async generateNarration(input: GenerateNarrationInput): Promise<GeneratedAudio> {
    const durationSeconds = input.durationInFrames / input.fps;
    const seed = hashSeed(`${input.sceneId}:${input.text}`);
    const frequency = narrationFrequency(seed);

    // 트레몰로(진폭을 빠르게 오르내리게)로 사람이 말하는 듯한 리듬감을 흉내낸다.
    const tremoloHz = 3 + seededRandom(seed, 2) * 2;
    const envelope = (t: number) => 0.6 + 0.4 * Math.abs(Math.sin(2 * Math.PI * tremoloHz * t));

    const samples = sineTone(durationSeconds, frequency, SAMPLE_RATE, NARRATION_AMPLITUDE, envelope);
    return { dataUri: toWavDataUri(samples, SAMPLE_RATE) };
  },
};
