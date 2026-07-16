import type { StoryPlan } from "../schema";
import type { Conversation, ConversationAnalysis, StoryConcept } from "./types";

/**
 * 대화 → 분석 → 컨셉 제안 → 스토리보드로 이어지는 AI 파이프라인의 추상화.
 * Mock 구현(MockStoryProvider)과 이후 추가될 실제 LLM 기반 구현이 이 인터페이스를 공유한다.
 */
export interface StoryProvider {
  analyzeConversation(conversation: Conversation): Promise<ConversationAnalysis>;
  generateConcepts(analysis: ConversationAnalysis): Promise<StoryConcept[]>;
  generateStoryboard(
    concept: StoryConcept,
    analysis: ConversationAnalysis,
    conversation: Conversation,
  ): Promise<StoryPlan>;
}
