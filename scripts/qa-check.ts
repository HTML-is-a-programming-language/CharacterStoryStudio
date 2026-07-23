import path from "node:path";
import { runQaCheck } from "../src/rendering/qaCheck";

function main(): void {
  const target = process.argv[2];
  if (!target) {
    console.error("사용법: pnpm run qa <mp4 경로>  (예: pnpm run qa out/story.mp4)");
    process.exitCode = 1;
    return;
  }

  const result = runQaCheck(path.resolve(target));

  for (const check of result.checks) {
    console.log(`${check.pass ? "✓" : "✗"} ${check.name} — ${check.detail}`);
  }

  if (!result.passed) {
    process.exitCode = 1;
  }
}

main();
