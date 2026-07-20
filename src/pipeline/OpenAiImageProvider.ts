import type { GenerateSceneImageInput, GeneratedSceneImage, ImageProvider } from "./ImageProvider";

/**
 * OpenAI Images API(gpt-image-1)를 호출하는 실제 Provider.
 *
 * 한계(TODO): 실제 API 키로 라이브 호출을 검증한 적이 없다(개발 환경에 키가 없음).
 * 요청/응답 형식은 공개 문서를 기준으로 작성했으며, 실제 배포 전에 진짜 키로 최소 1회
 * 수동 검증이 필요하다.
 */

const TONE_STYLE_HINT: Record<GenerateSceneImageInput["tone"], string> = {
  calm: "soft, quiet mood, pastel color palette, gentle natural lighting",
  romantic: "warm, intimate mood, soft pink and purple tones, dreamy lighting",
  bittersweet: "melancholic mood, deep purple and muted tones, rain-soaked atmosphere",
};

function buildPrompt(input: GenerateSceneImageInput): string {
  return [
    "A vertical Korean webtoon-style motion comic panel illustration, no photorealistic humans.",
    TONE_STYLE_HINT[input.tone],
    `Emotional cue from the scene: "${input.seedText}"`,
    "Do not include any text, letters, or watermarks in the image. Do not depict real people or copyrighted characters.",
  ].join(" ");
}

interface OpenAiImagesResponse {
  data?: Array<{ b64_json?: string; url?: string }>;
}

export class OpenAiImageProvider implements ImageProvider {
  constructor(
    private readonly apiKey: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async generateSceneImage(input: GenerateSceneImageInput): Promise<GeneratedSceneImage> {
    const response = await this.fetchImpl("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt: buildPrompt(input),
        size: "1024x1536",
        n: 1,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`이미지 생성 API 호출 실패 (HTTP ${response.status}): ${errorBody}`);
    }

    const payload = (await response.json()) as OpenAiImagesResponse;
    const image = payload.data?.[0];
    if (!image) {
      throw new Error("이미지 생성 API 응답에 이미지 데이터가 없습니다.");
    }

    const altText = `AI가 생성한 씬 이미지 (${input.sceneId})`;

    if (image.b64_json) {
      return { dataUri: `data:image/png;base64,${image.b64_json}`, altText };
    }
    if (image.url) {
      return { dataUri: image.url, altText };
    }

    throw new Error("이미지 생성 API 응답 형식을 해석할 수 없습니다 (b64_json/url 모두 없음).");
  }
}
