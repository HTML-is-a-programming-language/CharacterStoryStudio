import { SceneSchema, StoryPlanSchema, type Scene, type StoryPlan } from "../schema";
import { MockMusicProvider } from "./MockMusicProvider";
import { getImageProvider } from "./getImageProvider";
import { getTtsProvider } from "./getTtsProvider";
import type { StoryProvider } from "./StoryProvider";
import { ConversationAnalysisEmptyError, type Conversation, type ConversationAnalysis, type StoryConcept } from "./types";
import { distributeDurationFrames, pickFromCycle } from "./utils";

/**
 * 실제 LLM 없이 규칙 기반으로 동작하는 Mock Provider.
 *
 * 한계(의도적 단순화, TODO): 감정적으로 의미 있는 메시지를 "키워드 포함 여부"로만 판별한다.
 * 이 방식은 특정 대화 톤(로맨스 장르, 한국어 구어체)에 맞춰 고른 키워드 목록에 의존하므로
 * 일반적인 대화에는 잘 맞지 않을 수 있다. 실제 Provider(LLM 기반)로 교체할 때는 이 부분을
 * 프롬프트 기반 분석으로 대체해야 한다.
 *
 * 이름은 "Mock"이지만 씬 이미지/나레이션 생성은 각각 getImageProvider()/getTtsProvider()가
 * 환경변수(IMAGE_PROVIDER/TTS_PROVIDER, OPENAI_API_KEY)에 따라 실제 Provider로 바꿔치기할 수
 * 있다(ADR-012, ADR-019). 배경음악은 MockMusicProvider만 존재한다(ADR-019). 대화 분석/컨셉/
 * 스토리보드 로직 자체는 여전히 규칙 기반이라 이름은 그대로 유지한다.
 */
const EVENT_KEYWORDS = ["비", "설레", "좋아", "예쁘다", "우산"];

type Gradient = { from: string; to: string };

const TONE_PALETTES: Record<StoryConcept["tone"], readonly Gradient[]> = {
  calm: [
    { from: "#0f1b3d", to: "#2b3a67" },
    { from: "#16233f", to: "#3d5075" },
    { from: "#122036", to: "#2f4d5e" },
  ],
  romantic: [
    { from: "#2a1a3d", to: "#5b3a66" },
    { from: "#3a1f3d", to: "#7a4a63" },
    { from: "#33163f", to: "#8a3f6b" },
  ],
  bittersweet: [
    { from: "#1c1533", to: "#3b2a5c" },
    { from: "#241326", to: "#5c2a4a" },
    { from: "#1a1229", to: "#4a2a4f" },
  ],
};

const CONCEPT_DEFS: ReadonlyArray<{
  id: string;
  title: string;
  tone: StoryConcept["tone"];
  logline: (characterName: string) => string;
}> = [
  {
    id: "concept-calm",
    title: "잔잔한 하루",
    tone: "calm",
    logline: (name) => `${name}와(과) 나눈 평범한 하루가 사실은 특별했다는 이야기.`,
  },
  {
    id: "concept-romantic",
    title: "설레는 고백",
    tone: "romantic",
    logline: (name) => `${name}가 오래 망설이던 마음을 꺼내놓는 순간.`,
  },
  {
    id: "concept-bittersweet",
    title: "여운이 남는 밤",
    tone: "bittersweet",
    logline: (name) => `비가 그친 뒤에도 오래 남는, ${name}와(과)의 장면들.`,
  },
];

const TARGET_TOTAL_SECONDS = 28;
const FPS = 30;
const WIDTH = 1080;
const HEIGHT = 1920;

export const MockStoryProvider: StoryProvider = {
  async analyzeConversation(conversation: Conversation): Promise<ConversationAnalysis> {
    const events = conversation.messages
      .filter((message) => EVENT_KEYWORDS.some((keyword) => message.content.includes(keyword)))
      .map((message) => ({
        sourceMessageId: message.id,
        description: message.content,
      }));

    if (events.length === 0) {
      throw new ConversationAnalysisEmptyError();
    }

    return {
      characterName: conversation.character.name,
      summary: `${conversation.character.name}와(과)의 대화에서 감정적으로 의미 있는 장면 ${events.length}개를 찾았습니다.`,
      emotionalArc: "잔잔함 → 설렘 → 고백 → 여운",
      events,
      safetyFlag: false,
    };
  },

  async generateConcepts(analysis: ConversationAnalysis): Promise<StoryConcept[]> {
    return CONCEPT_DEFS.map((def) => ({
      id: def.id,
      title: def.title,
      tone: def.tone,
      logline: def.logline(analysis.characterName),
    }));
  },

  async generateStoryboard(
    concept: StoryConcept,
    analysis: ConversationAnalysis,
    conversation: Conversation,
  ): Promise<StoryPlan> {
    const messageById = new Map(conversation.messages.map((message) => [message.id, message]));
    const palette = TONE_PALETTES[concept.tone];
    const durations = distributeDurationFrames(TARGET_TOTAL_SECONDS * FPS, analysis.events.length);

    const scenes = await Promise.all(
      analysis.events.map(async (event, index) => {
        const message = messageById.get(event.sourceMessageId);
        if (!message) {
          throw new Error(`원본 메시지를 찾을 수 없습니다: ${event.sourceMessageId}`);
        }

        const durationInFrames = durations[index];
        if (durationInFrames === undefined) {
          throw new Error("씬 길이를 계산하지 못했습니다.");
        }

        const sceneId = `scene-${index + 1}`;
        const image = await getImageProvider().generateSceneImage({
          sceneId,
          tone: concept.tone,
          variant: 0,
          seedText: message.content,
        });
        const narration = await getTtsProvider().generateNarration({
          sceneId,
          text: message.content,
          durationInFrames,
          fps: FPS,
        });

        return {
          id: sceneId,
          durationInFrames,
          background: pickFromCycle(palette, index),
          speaker: message.role === "character" ? conversation.character.name : "나",
          dialogue: message.content,
          caption: concept.title,
          sourceMessageIds: [event.sourceMessageId],
          imageDataUri: image.dataUri,
          imageAlt: image.altText,
          audioDataUri: narration.dataUri,
        };
      }),
    );

    const totalDurationInFrames = durations.reduce((sum, value) => sum + value, 0);
    const music = await MockMusicProvider.generateMusic({
      tone: concept.tone,
      durationInFrames: totalDurationInFrames,
      fps: FPS,
    });

    return StoryPlanSchema.parse({
      title: concept.title,
      fps: FPS,
      width: WIDTH,
      height: HEIGHT,
      scenes,
      musicDataUri: music.dataUri,
    });
  },

  async regenerateScene(
    scene: Scene,
    sceneIndex: number,
    concept: StoryConcept,
    variant: number,
  ): Promise<Scene> {
    if (variant <= 0) {
      return scene;
    }

    // 대사(speaker/dialogue/sourceMessageIds)는 원본 대화에서 나온 사실이므로 재생성 대상이
    // 아니다 — 여기서 바꾸는 건 연출(배경 팔레트 + 이미지 + 나레이션 톤)뿐이다. 실제 LLM/이미지/
    // 음성 Provider로 교체하더라도 이 불변식(대사 불변)은 유지해야 한다.
    const palette = TONE_PALETTES[concept.tone];
    const background = pickFromCycle(palette, sceneIndex + variant);
    const image = await getImageProvider().generateSceneImage({
      sceneId: scene.id,
      tone: concept.tone,
      variant,
      seedText: scene.dialogue,
    });
    const narration = await getTtsProvider().generateNarration({
      sceneId: `${scene.id}:${variant}`,
      text: scene.dialogue,
      durationInFrames: scene.durationInFrames,
      fps: FPS,
    });

    return SceneSchema.parse({
      ...scene,
      background,
      imageDataUri: image.dataUri,
      imageAlt: image.altText,
      audioDataUri: narration.dataUri,
    });
  },
};
