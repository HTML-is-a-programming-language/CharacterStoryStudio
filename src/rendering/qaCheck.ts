import { execFileSync } from "node:child_process";
import ffprobe from "@ffprobe-installer/ffprobe";

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

export function runQaCheck(
  filePath: string,
  probeImpl: (filePath: string) => FfprobeResult = probeVideo,
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
  ];

  return { passed: checks.every((check) => check.pass), checks };
}
