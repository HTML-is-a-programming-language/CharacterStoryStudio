import "server-only";

import { MockChatProvider, getScriptCharacter, getSuggestedUserLine } from "./MockChatProvider";
import type { ConversationMessage } from "./types";

/** UI(Server Action)가 MockChatProvider를 직접 호출하지 않도록 감싸는 유일한 진입점. */
export async function getCharacterReply(
  conversationSoFar: ConversationMessage[],
): Promise<ConversationMessage | null> {
  return MockChatProvider.replyTo(conversationSoFar);
}

export function getNextSuggestedUserLine(conversationSoFar: ConversationMessage[]): string | null {
  return getSuggestedUserLine(conversationSoFar);
}

export function getChatCharacter(): { id: string; name: string } {
  return getScriptCharacter();
}
