import type { ConversationMessage } from "./types";

/**
 * 캐릭터 채팅 응답을 만드는 AI 파이프라인의 추상화. Mock 구현(MockChatProvider)은 실제
 * 이해 없이 고정 대본을 재생하고, 이후 추가될 실제 LLM 기반 구현이 이 인터페이스를 공유한다.
 */
export interface ChatProvider {
  /**
   * @param conversationSoFar 지금까지의 전체 대화(사용자가 방금 보낸 메시지 포함).
   * @returns 다음 캐릭터 메시지. 대본이 끝나 더 만들 응답이 없으면 null.
   */
  replyTo(conversationSoFar: ConversationMessage[]): Promise<ConversationMessage | null>;
}
