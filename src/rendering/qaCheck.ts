import { execFileSync, spawnSync } from "node:child_process";
import ffmpeg from "@ffmpeg-installer/ffmpeg";
import ffprobe from "@ffprobe-installer/ffprobe";

/**
 * 오디오 트랙이 "있는지"만으로는 부족하다 — Remotion의 renderMedia는 <Audio> 요소가 하나도
 * 없어도 무음 오디오 스트림을 컨테이너에 그대로 채워 넣는다(ADR-021에서 실제로 겪은 버그가
 * 정확히 이 모양이었다: 스트림은 있는데 처음부터 끝까지 완전 무음). 그래서 ffmpeg의
 * silencedetect 필터로 실제 무음 구간 길이를 재서, 재생시간 전체가 무음으로 덮이는지 확인한다.
 * @ffprobe-installer/ffprobe는 probe 전용이라 필터를 못 쓰므로 별도로 @ffmpeg-installer/ffmpeg를
 * 쓴다(Remotion이 내부적으로 쓰는 ffmpeg 바이너리는 --disable-filters로 빌드되어 있어
 * silencedetect는 되지만 공개 API로 노출된 경로가 아니라 의존하기엔 불안정하다).
 */
const SILENCE_NOISE_THRESHOLD_DB = "-50dB";
const SILENCE_MIN_DURATION_SECONDS = 0.5;
const SILENCE_TOLERANCE_SECONDS = 0.5;

/**
 * 의도적으로 "server-only"를 붙이지 않는다. 이 모듈은 렌더 라우트(app/story/.../render/route.ts)뿐
 * 아니라 plain tsx로 실행되는 scripts/qa-check.ts에서도 그대로 import한다. "server-only" 패키지는
 * Next.js 번들러의 "react-server" 조건부 export가 있을 때만 안전한 no-op으로 resolve되고, 그 외
 * 환경(plain tsx, vitest 등)에서는 무조건 throw한다(vitest.config.ts가 이 패키지를 스텁으로 alias해둔
 * 것과 같은 이유). 클라이언트 번들에서 이 모듈에 닿을 경로가 없으므로 붙이지 않아도 안전하다.
 */

export interface QaCheckItem {
  name: string;
  pass: boolean;
  detail: string;
}

export interface QaCheckResult {
  passed: boolean;
  checks: QaCheckItem[];
}

interface FfprobeStream {
  codec_type: string;
  width?: number;
  height?: number;
}

interface FfprobeResult {
  format: { duration: string };
  streams: FfprobeStream[];
}

function probeVideo(filePath: string): FfprobeResult {
  const output = execFileSync(
    ffprobe.path,
    ["-v", "error", "-print_format", "json", "-show_format", "-show_streams", filePath],
    { encoding: "utf-8" },
  );
  return JSON.parse(output) as FfprobeResult;
}

/** silencedetect 로그(stderr)에 찍히는 모든 silence_duration 값을 더해 총 무음 초를 구한다. */
function measureSilentSeconds(filePath: string): number {
  const result = spawnSync(
    ffmpeg.path,
    [
      "-i",
      filePath,
      "-vn",
      "-af",
      `silencedetect=noise=${SILENCE_NOISE_THRESHOLD_DB}:d=${SILENCE_MIN_DURATION_SECONDS}`,
      "-f",
      "null",
      "-",
    ],
    { encoding: "utf-8" },
  );
  const stderr = result.stderr ?? "";
  let total = 0;
  for (const match of stderr.matchAll(/silence_duration:\s*(-?\d+(?:\.\d+)?)/g)) {
    total += Number(match[1]);
  }
  return total;
}

export function runQaCheck(
  filePath: string,
  probeImpl: (filePath: string) => FfprobeResult = probeVideo,
  measureSilentSecondsImpl: (filePath: string) => number = measureSilentSeconds,
): QaCheckResult {
  const result = probeImpl(filePath);
  const videoStream = result.streams.find((stream) => stream.codec_type === "video");

  if (!videoStream || videoStream.width === undefined || videoStream.height === undefined) {
    return {
      passed: false,
      checks: [{ name: "영상 스트림 감지", pass: false, detail: "영상 스트림을 찾을 수 없습니다." }],
    };
  }

  const durationSeconds = Number(result.format.duration);
  const { width, height } = videoStream;
  const hasAudioStream = result.streams.some((stream) => stream.codec_type === "audio");

  const checks: QaCheckItem[] = [
    {
      name: "해상도 1080x1920 (9:16 세로형)",
      pass: width === 1080 && height === 1920,
      detail: `${width}x${height}`,
    },
    {
      name: "재생시간 20~40초 범위",
      pass: durationSeconds >= 20 && durationSeconds <= 40,
      detail: `${durationSeconds.toFixed(2)}s`,
    },
    {
      name: "오디오 스트림 존재",
      pass: hasAudioStream,
      detail: hasAudioStream ? "감지됨" : "오디오 스트림을 찾을 수 없습니다.",
    },
  ];

  if (hasAudioStream) {
    const silentSeconds = measureSilentSecondsImpl(filePath);
    const isFullySilent = silentSeconds >= durationSeconds - SILENCE_TOLERANCE_SECONDS;
    checks.push({
      name: "오디오 무음 아님",
      pass: !isFullySilent,
      detail: `무음 ${silentSeconds.toFixed(2)}s / 전체 ${durationSeconds.toFixed(2)}s`,
    });
  }

  return { passed: checks.every((check) => check.pass), checks };
}
