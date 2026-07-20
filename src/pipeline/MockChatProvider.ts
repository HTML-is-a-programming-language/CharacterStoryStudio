import type { ChatProvider } from "./ChatProvider";
import { ConversationSchema, type ConversationMessage } from "./types";
import sampleConversation from "./data/sample-conversation.json";

/**
 * 실제 LLM 없이 고정 대본을 순서대로 재생하는 Mock Provider.
 *
 * 한계(의도적 단순화, TODO): 사용자가 실제로 입력한 텍스트 내용을 전혀 이해하지 않는다.
 * "지금까지 온 메시지 개수"로만 다음 캐릭터 대사를 결정한다 — 즉 사용자가 무엇을 입력하든
 * 캐릭터의 답장은 항상 같다(ADR-015). 실제 Provider(LLM 기반)로 교체할 때는 이 자리에
 * 진짜 대화 이해/생성 로직이 들어가야 한다.
 */
const SCRIPT: readonly ConversationMessage[] = ConversationSchema.parse(sampleConversation).messages;

export const MockChatProvider: ChatProvider = {
  async replyTo(conversationSoFar: ConversationMessage[]): Promise<ConversationMessage | null> {
    const nextLine = SCRIPT[conversationSoFar.length];
    if (!nextLine || nextLine.role !== "character") {
      return null;
    }
    return nextLine;
  },
};

/** 채팅 UI가 사용자 입력창에 기본값으로 채워줄, 대본상의 다음 사용자 대사(있으면). */
export function getSuggestedUserLine(conversationSoFar: ConversationMessage[]): string | null {
  const nextLine = SCRIPT[conversationSoFar.length];
  if (!nextLine || nextLine.role !== "user") {
    return null;
  }
  return nextLine.content;
}

export function getScriptCharacter(): { id: string; name: string } {
  return ConversationSchema.parse(sampleConversation).character;
}
