import { describe, expect, it } from "vitest";
import { encodeWav, mixSamples, silence, sineTone, toWavDataUri } from "../src/pipeline/wavEncoder";

describe("wavEncoder", () => {
  it("encodeWav는 올바른 RIFF/WAVE 헤더와 데이터 크기를 만든다", () => {
    const samples = new Float32Array([0, 0.5, -0.5, 1, -1]);
    const buffer = encodeWav(samples, 8000);

    expect(buffer.toString("ascii", 0, 4)).toBe("RIFF");
    expect(buffer.toString("ascii", 8, 12)).toBe("WAVE");
    expect(buffer.toString("ascii", 36, 40)).toBe("data");
    expect(buffer.readUInt32LE(40)).toBe(samples.length * 2);
    expect(buffer.length).toBe(44 + samples.length * 2);
  });

  it("toWavDataUri는 data:audio/wav;base64, 로 시작한다", () => {
    const dataUri = toWavDataUri(new Float32Array([0, 0.1, -0.1]), 8000);
    expect(dataUri.startsWith("data:audio/wav;base64,")).toBe(true);
  });

  it("silence는 지정한 길이만큼 전부 0인 샘플을 만든다", () => {
    const samples = silence(0.5, 8000);
    expect(samples.length).toBe(4000);
    expect(samples.every((value) => value === 0)).toBe(true);
  });

  it("sineTone은 지정한 길이의 샘플을 만들고 amplitude를 넘지 않는다", () => {
    const samples = sineTone(0.2, 220, 8000, 0.3);
    expect(samples.length).toBe(1600);
    expect(Math.max(...samples)).toBeLessThanOrEqual(0.3 + 1e-6);
    expect(Math.min(...samples)).toBeGreaterThanOrEqual(-0.3 - 1e-6);
  });

  it("mixSamples는 여러 트랙을 합산하고 가장 긴 길이에 맞춘다", () => {
    const a = new Float32Array([0.1, 0.1, 0.1]);
    const b = new Float32Array([0.2, 0.2]);
    const mixed = mixSamples([a, b]);

    expect(mixed.length).toBe(3);
    expect(mixed[0]).toBeCloseTo(0.3);
    expect(mixed[2]).toBeCloseTo(0.1);
  });
});
