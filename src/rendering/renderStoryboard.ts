import "server-only";

import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import type { StoryPlan } from "../schema";

/**
 * Remotion 번들은 웹팩 빌드라 만드는 데 시간이 걸린다. 요청마다 다시 번들링하지 않도록
 * 서버 프로세스 생명주기 동안 한 번만 만들어 재사용한다.
 *
 * 한계(TODO): 이 캐시는 메모리에만 있어 서버 재시작 시 사라지고, 동시에 여러 렌더링
 * 요청이 들어오면 첫 요청이 번들링을 끝낼 때까지 뒤 요청들이 기다리지 않고 각자 번들링을
 * 시작할 수 있다(경쟁 상태). 지금은 로컬 데모 용도라 문제되지 않지만, 실제 다중 사용자
 * 서비스로 키우려면 요청 큐잉이나 서버 시작 시 사전 번들링이 필요하다.
 */
let bundleLocationPromise: Promise<string> | null = null;

function getBundleLocation(): Promise<string> {
  if (!bundleLocationPromise) {
    bundleLocationPromise = bundle({
      entryPoint: path.resolve(process.cwd(), "src/index.ts"),
    });
  }
  return bundleLocationPromise;
}

export async function renderStoryboardToFile(story: StoryPlan, outputPath: string): Promise<void> {
  const serveUrl = await getBundleLocation();

  const composition = await selectComposition({
    serveUrl,
    id: "StoryComposition",
    inputProps: { story },
  });

  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation: outputPath,
    inputProps: { story },
  });
}
