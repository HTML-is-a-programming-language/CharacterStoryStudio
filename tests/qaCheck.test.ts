import { describe, expect, it } from "vitest";
import { runQaCheck } from "../src/rendering/qaCheck";

function fakeProbe(overrides: {
  width?: number;
  height?: number;
  duration?: string;
  noVideoStream?: boolean;
  hasAudio?: boolean;
}) {
  return () => ({
    format: { duration: overrides.duration ?? "28.05" },
    streams: overrides.noVideoStream
      ? [{ codec_type: "audio" }]
      : [
          { codec_type: "video", width: overrides.width ?? 1080, height: overrides.height ?? 1920 },
          ...(overrides.hasAudio ?? true ? [{ codec_type: "audio" }] : []),
        ],
  });
}

describe("runQaCheck", () => {
  it("모든 체크가 통과하면 passed: true를 반환한다", () => {
    const result = runQaCheck(
      "dummy.mp4",
      fakeProbe({ width: 1080, height: 1920, duration: "28.05" }),
      () => 2, // 28.05초 중 2초만 무음 — 정상
    );

    expect(result.passed).toBe(true);
    expect(result.checks).toEqual([
      { name: "해상도 1080x1920 (9:16 세로형)", pass: true, detail: "1080x1920" },
      { name: "재생시간 20~40초 범위", pass: true, detail: "28.05s" },
      { name: "오디오 스트림 존재", pass: true, detail: "감지됨" },
      { name: "오디오 무음 아님", pass: true, detail: "무음 2.00s / 전체 28.05s" },
    ]);
  });

  it("해상도가 다르면 해당 체크만 실패한다", () => {
    const result = runQaCheck(
      "dummy.mp4",
      fakeProbe({ width: 1920, height: 1080, duration: "28.05" }),
      () => 0,
    );

    expect(result.passed).toBe(false);
    expect(result.checks[0]).toEqual({
      name: "해상도 1080x1920 (9:16 세로형)",
      pass: false,
      detail: "1920x1080",
    });
    expect(result.checks[1]?.pass).toBe(true);
    expect(result.checks[2]?.pass).toBe(true);
  });

  it("재생시간이 범위를 벗어나면 해당 체크만 실패한다", () => {
    const result = runQaCheck("dummy.mp4", fakeProbe({ duration: "10.00" }), () => 0);

    expect(result.passed).toBe(false);
    expect(result.checks[0]?.pass).toBe(true);
    expect(result.checks[1]).toEqual({ name: "재생시간 20~40초 범위", pass: false, detail: "10.00s" });
    expect(result.checks[2]?.pass).toBe(true);
  });

  it("오디오 스트림이 없으면 해당 체크만 실패하고 무음 검사는 건너뛴다", () => {
    const measureSilent = () => {
      throw new Error("오디오 스트림이 없으면 무음 검사를 호출하면 안 된다");
    };
    const result = runQaCheck("dummy.mp4", fakeProbe({ hasAudio: false }), measureSilent);

    expect(result.passed).toBe(false);
    expect(result.checks).toHaveLength(3);
    expect(result.checks[2]).toEqual({
      name: "오디오 스트림 존재",
      pass: false,
      detail: "오디오 스트림을 찾을 수 없습니다.",
    });
  });

  it("오디오 스트림은 있지만 전체 구간이 무음이면 실패한다(ADR-021과 같은 증상)", () => {
    const result = runQaCheck(
      "dummy.mp4",
      fakeProbe({ duration: "28.05" }),
      () => 28.05, // 전체가 무음
    );

    expect(result.passed).toBe(false);
    expect(result.checks[3]).toEqual({
      name: "오디오 무음 아님",
      pass: false,
      detail: "무음 28.05s / 전체 28.05s",
    });
  });

  it("영상 스트림이 없으면 단일 실패 체크를 반환한다", () => {
    const result = runQaCheck("dummy.mp4", fakeProbe({ noVideoStream: true }));

    expect(result.passed).toBe(false);
    expect(result.checks).toEqual([
      { name: "영상 스트림 감지", pass: false, detail: "영상 스트림을 찾을 수 없습니다." },
    ]);
  });
});
