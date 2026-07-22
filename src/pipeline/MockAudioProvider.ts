import type {
  AudioProvider,
  GenerateMusicInput,
  GenerateNarrationInput,
  GeneratedAudio,
} from "./AudioProvider";
import type { StoryConcept } from "./types";
import { hashSeed, seededRandom } from "./utils";
import { mixSamples, sineTone, toWavDataUri } from "./wavEncoder";

/**
 * 실제 음성 합성/작곡 API 없이, 절차적으로 소리를 만드는 Mock Provider.
 *
 * 한계(의도적 단순화, TODO): 실제 사람 목소리가 아니라 대사 길이/내용을 시드로 한 사인파
 * 톤(트레몰로로 말하는 리듬을 흉내)이고, 배경음악도 실제 작곡이 아니라 톤에 맞춘 화음
 * 두 개를 지속하는 것뿐이다. 실제 TTS/음악 생성 Provider로 교체할 때는 이 자리에 진짜
 * 음성 합성/작곡 호출이 들어가야 한다.
 */

const SAMPLE_RATE = 22050;
const NARRATION_AMPLITUDE = 0.18;
const MUSIC_AMPLITUDE = 0.06;

const TONE_CHORDS: Record<StoryConcept["tone"], [number, number]> = {
  calm: [110, 165], // 완전 5도 — 안정적
  romantic: [130.81, 164.81], // 장3도 — 따뜻함
  bittersweet: [110, 130.81], // 단3도 — 여운
};

function narrationFrequency(seed: number): number {
  // 사람 목소리 기본 주파수대와 비슷한 범위(150~220Hz)에서 시드로 고른다.
  return 150 + seededRandom(seed, 1) * 70;
}

export const MockAudioProvider: AudioProvider = {
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

  async generateMusic(input: GenerateMusicInput): Promise<GeneratedAudio> {
    const durationSeconds = input.durationInFrames / input.fps;
    const [root, interval] = TONE_CHORDS[input.tone];

    const samples = mixSamples([
      sineTone(durationSeconds, root, SAMPLE_RATE, MUSIC_AMPLITUDE),
      sineTone(durationSeconds, interval, SAMPLE_RATE, MUSIC_AMPLITUDE * 0.8),
    ]);

    return { dataUri: toWavDataUri(samples, SAMPLE_RATE) };
  },
};
