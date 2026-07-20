import type { GenerateSceneImageInput, GeneratedSceneImage, ImageProvider } from "./ImageProvider";
import type { StoryConcept } from "./types";

/**
 * 실제 이미지 생성 API 없이, 씬 정보를 시드로 한 결정론적 절차적 SVG를 만드는 Mock Provider.
 *
 * 한계(의도적 단순화, TODO): 실제 캐릭터 일러스트가 아니라 톤을 표현하는 추상적인 그라디언트+
 * 도형 조합이다. 실제 이미지 생성 Provider로 교체할 때는 이 자리에 캐릭터 일관성 프롬프트
 * (PROJECT_BRIEF.md §12) 기반의 실제 이미지 생성 호출이 들어가야 한다.
 */

const TONE_COLORS: Record<StoryConcept["tone"], { background: [string, string]; accents: string[] }> = {
  calm: {
    background: ["#0f1b3d", "#2b3a67"],
    accents: ["#6fa8c9", "#a8c8e0", "#3d5075"],
  },
  romantic: {
    background: ["#2a1a3d", "#5b3a66"],
    accents: ["#e08fb0", "#c96fa0", "#7a4a63"],
  },
  bittersweet: {
    background: ["#1c1533", "#3b2a5c"],
    accents: ["#8a6fa8", "#c97aa0", "#4a2a4f"],
  },
};

const TONE_LABEL: Record<StoryConcept["tone"], string> = {
  calm: "잔잔함",
  romantic: "설렘",
  bittersweet: "여운",
};

const VIEWBOX_WIDTH = 200;
const VIEWBOX_HEIGHT = 356;

function hashSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function seededRandom(seed: number, salt: number): number {
  const value = Math.sin(seed + salt) * 10000;
  return value - Math.floor(value);
}

function buildSvg(tone: StoryConcept["tone"], seed: number): string {
  const colors = TONE_COLORS[tone];

  const circles = [1, 2, 3]
    .map((i) => {
      const cx = (seededRandom(seed, i * 7) * (VIEWBOX_WIDTH - 40) + 20).toFixed(1);
      const cy = (seededRandom(seed, i * 13) * (VIEWBOX_HEIGHT - 80) + 40).toFixed(1);
      const r = (seededRandom(seed, i * 19) * 30 + 25).toFixed(1);
      const color = colors.accents[i % colors.accents.length];
      const opacity = (seededRandom(seed, i * 29) * 0.2 + 0.15).toFixed(2);
      return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" opacity="${opacity}" filter="url(#soften)" />`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${colors.background[0]}" />
      <stop offset="100%" stop-color="${colors.background[1]}" />
    </linearGradient>
    <filter id="soften"><feGaussianBlur stdDeviation="14" /></filter>
  </defs>
  <rect width="${VIEWBOX_WIDTH}" height="${VIEWBOX_HEIGHT}" fill="url(#bg)" />
  ${circles}
</svg>`;
}

function toDataUri(svg: string): string {
  const base64 = Buffer.from(svg, "utf-8").toString("base64");
  return `data:image/svg+xml;base64,${base64}`;
}

export const MockImageProvider: ImageProvider = {
  async generateSceneImage(input: GenerateSceneImageInput): Promise<GeneratedSceneImage> {
    const seed = hashSeed(`${input.sceneId}:${input.tone}:${input.variant}:${input.seedText}`);
    const svg = buildSvg(input.tone, seed);

    return {
      dataUri: toDataUri(svg),
      altText: `${TONE_LABEL[input.tone]} 분위기를 표현한 추상 일러스트 (씬 ${input.sceneId})`,
    };
  },
};
