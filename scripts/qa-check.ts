import { execFileSync } from "node:child_process";
import path from "node:path";
import ffprobe from "@ffprobe-installer/ffprobe";

interface FfprobeStream {
  codec_type: string;
  width?: number;
  height?: number;
}

interface FfprobeResult {
  format: { duration: string };
  streams: FfprobeStream[];
}

function probe(filePath: string): FfprobeResult {
  const output = execFileSync(
    ffprobe.path,
    ["-v", "error", "-print_format", "json", "-show_format", "-show_streams", filePath],
    { encoding: "utf-8" },
  );
  return JSON.parse(output) as FfprobeResult;
}

function main(): void {
  const target = process.argv[2];
  if (!target) {
    console.error("사용법: pnpm run qa <mp4 경로>  (예: pnpm run qa out/story.mp4)");
    process.exitCode = 1;
    return;
  }

  const filePath = path.resolve(target);
  const result = probe(filePath);

  const videoStream = result.streams.find((stream) => stream.codec_type === "video");
  if (!videoStream || videoStream.width === undefined || videoStream.height === undefined) {
    console.error("✗ 영상 스트림을 찾을 수 없습니다.");
    process.exitCode = 1;
    return;
  }

  const durationSeconds = Number(result.format.duration);
  const { width, height } = videoStream;

  const checks = [
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

  for (const check of checks) {
    console.log(`${check.pass ? "✓" : "✗"} ${check.name} — ${check.detail}`);
  }

  const failed = checks.some((check) => !check.pass);
  if (failed) {
    process.exitCode = 1;
  }
}

main();
