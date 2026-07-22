import type { GenerateMusicInput, GeneratedAudio, MusicProvider } from "./MusicProvider";
import type { StoryConcept } from "./types";
import { mixSamples, sineTone, toWavDataUri } from "./wavEncoder";

/**
 * 실제 작곡 API 없이, 절차적으로 소리를 만드는 Mock Provider.
 *
 * 한계(의도적 단순화, TODO): 실제 작곡이 아니라 컨셉 톤에 맞춘 화음 두 개를 지속하는 것뿐이다.
 * 실제 음악 생성 API는 대부분 비동기 잡 제출→폴링 방식이라 이번 범위에서는 연동하지 않는다
 * (ADR-019) — Mock만 존재한다.
 */

const SAMPLE_RATE = 22050;
const MUSIC_AMPLITUDE = 0.06;

const TONE_CHORDS: Record<StoryConcept["tone"], [number, number]> = {
  calm: [110, 165], // 완전 5도 — 안정적
  romantic: [130.81, 164.81], // 장3도 — 따뜻함
  bittersweet: [110, 130.81], // 단3도 — 여운
};

export const MockMusicProvider: MusicProvider = {
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
