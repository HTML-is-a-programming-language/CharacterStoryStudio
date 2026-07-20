import type { ImageProvider } from "./ImageProvider";
import { MockImageProvider } from "./MockImageProvider";
import { OpenAiImageProvider } from "./OpenAiImageProvider";

/**
 * 실제 이미지 Provider는 "IMAGE_PROVIDER=real" + "OPENAI_API_KEY" 두 가지가 모두 있어야
 * 켜진다(이중 opt-in). 키만 환경에 있고 IMAGE_PROVIDER를 지정하지 않으면 여전히 Mock을
 * 쓴다 — 비용이 발생하는 호출을 조용히 자동 실행하지 않기 위함이다(CLAUDE.md 정책, ADR-012).
 *
 * IMAGE_PROVIDER=real인데 키가 없으면 에러를 던지는 대신 Mock으로 안전하게 폴백한다.
 * API 키가 없어도 전체 흐름(Demo Mode)이 항상 동작해야 하기 때문이다(ADR-002).
 */
export function getImageProvider(env: NodeJS.ProcessEnv = process.env): ImageProvider {
  if (env.IMAGE_PROVIDER !== "real") {
    return MockImageProvider;
  }

  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn(
      "[ImageProvider] IMAGE_PROVIDER=real이지만 OPENAI_API_KEY가 없어 MockImageProvider로 대체합니다.",
    );
    return MockImageProvider;
  }

  return new OpenAiImageProvider(apiKey);
}
