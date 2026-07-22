import { z } from "zod";

export const ConversationMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "character"]),
  content: z.string().min(1),
  timestamp: z.string(),
});

export const ConversationSchema = z.object({
  character: z.object({
    id: z.string(),
    name: z.string(),
  }),
  messages: z.array(ConversationMessageSchema).min(1),
});

export const ConversationEventSchema = z.object({
  sourceMessageId: z.string(),
  description: z.string(),
});

export const ConversationAnalysisSchema = z.object({
  characterName: z.string(),
  summary: z.string(),
  emotionalArc: z.string(),
  events: z.array(ConversationEventSchema).min(1),
  safetyFlag: z.boolean(),
});

export const StoryConceptSchema = z.object({
  id: z.string(),
  title: z.string(),
  logline: z.string(),
  tone: z.enum(["calm", "romantic", "bittersweet"]),
});

export type ConversationMessage = z.infer<typeof ConversationMessageSchema>;
export type Conversation = z.infer<typeof ConversationSchema>;
export type ConversationEvent = z.infer<typeof ConversationEventSchema>;
export type ConversationAnalysis = z.infer<typeof ConversationAnalysisSchema>;
export type StoryConcept = z.infer<typeof StoryConceptSchema>;

/**
 * 대화에서 감정적으로 의미 있는 이벤트를 하나도 찾지 못했을 때 던지는 전용 에러.
 * 사용자가 채팅에서 대사를 과하게 수정해 분석 키워드가 사라지면 발생할 수 있는 "정상적인"
 * 케이스라, UI가 이 클래스만 구분해서 안내 화면을 보여줄 수 있게 일반 Error와 분리한다.
 * (다른 내부 불변식 에러까지 뭉뚱그려 숨기지 않기 위함)
 */
export class ConversationAnalysisEmptyError extends Error {
  constructor(message = "분석 가능한 감정적 이벤트를 찾지 못했습니다. 대화 내용을 확인하거나 다른 대화를 선택해주세요.") {
    super(message);
    this.name = "ConversationAnalysisEmptyError";
  }
}
