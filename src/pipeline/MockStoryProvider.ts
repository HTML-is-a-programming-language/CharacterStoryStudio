import { StoryPlanSchema, type StoryPlan } from "../schema";
import type { StoryProvider } from "./StoryProvider";
import type { Conversation, ConversationAnalysis, StoryConcept } from "./types";
import { distributeDurationFrames, pickFromCycle } from "./utils";

/**
 * 실제 LLM 없이 규칙 기반으로 동작하는 Mock Provider.
 *
 * 한계(의도적 단순화, TODO): 감정적으로 의미 있는 메시지를 "키워드 포함 여부"로만 판별한다.
 * 이 방식은 특정 대화 톤(로맨스 장르, 한국어 구어체)에 맞춰 고른 키워드 목록에 의존하므로
 * 일반적인 대화에는 잘 맞지 않을 수 있다. 실제 Provider(LLM 기반)로 교체할 때는 이 부분을
 * 프롬프트 기반 분석으로 대체해야 한다.
 */
const EVENT_KEYWORDS = ["비", "설레", "좋아", "예쁘다", "우산"];

type Gradient = { from: string; to: string };

const TONE_PALETTES: Record<StoryConcept["tone"], readonly Gradient[]> = {
  calm: [
    { from: "#0f1b3d", to: "#2b3a67" },
    { from: "#16233f", to: "#3d5075" },
  ],
  romantic: [
    { from: "#2a1a3d", to: "#5b3a66" },
    { from: "#3a1f3d", to: "#7a4a63" },
  ],
  bittersweet: [
    { from: "#1c1533", to: "#3b2a5c" },
    { from: "#241326", to: "#5c2a4a" },
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
      throw new Error(
        "분석 가능한 감정적 이벤트를 찾지 못했습니다. 대화 내용을 확인하거나 다른 대화를 선택해주세요.",
      );
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

    const scenes = analysis.events.map((event, index) => {
      const message = messageById.get(event.sourceMessageId);
      if (!message) {
        throw new Error(`원본 메시지를 찾을 수 없습니다: ${event.sourceMessageId}`);
      }

      const durationInFrames = durations[index];
      if (durationInFrames === undefined) {
        throw new Error("씬 길이를 계산하지 못했습니다.");
      }

      return {
        id: `scene-${index + 1}`,
        durationInFrames,
        background: pickFromCycle(palette, index),
        speaker: message.role === "character" ? conversation.character.name : "나",
        dialogue: message.content,
        caption: concept.title,
        sourceMessageIds: [event.sourceMessageId],
      };
    });

    return StoryPlanSchema.parse({
      title: concept.title,
      fps: FPS,
      width: WIDTH,
      height: HEIGHT,
      scenes,
    });
  },
};
