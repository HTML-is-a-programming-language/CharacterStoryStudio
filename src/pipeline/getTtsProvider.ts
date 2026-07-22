import { MockTtsProvider } from "./MockTtsProvider";
import { OpenAiTtsProvider } from "./OpenAiTtsProvider";
import type { TtsProvider } from "./TtsProvider";

/**
 * 실제 TTS Provider는 "TTS_PROVIDER=real" + "OPENAI_API_KEY" 두 가지가 모두 있어야 켜진다
 * (이중 opt-in, ADR-012와 같은 패턴). 키만 환경에 있고 TTS_PROVIDER를 지정하지 않으면 여전히
 * Mock을 쓴다 — 비용이 발생하는 호출을 조용히 자동 실행하지 않기 위함이다.
 *
 * TTS_PROVIDER=real인데 키가 없으면 에러를 던지는 대신 Mock으로 안전하게 폴백한다(Demo Mode
 * 보장, ADR-002). image Provider와 같은 OPENAI_API_KEY를 재사용한다(같은 OpenAI 계정의
 * 다른 엔드포인트일 뿐이라 별도 키를 요구하지 않는다).
 */
export function getTtsProvider(env: NodeJS.ProcessEnv = process.env): TtsProvider {
  if (env.TTS_PROVIDER !== "real") {
    return MockTtsProvider;
  }

  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn(
      "[TtsProvider] TTS_PROVIDER=real이지만 OPENAI_API_KEY가 없어 MockTtsProvider로 대체합니다.",
    );
    return MockTtsProvider;
  }

  return new OpenAiTtsProvider(apiKey);
}
