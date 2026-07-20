"use server";

import { getCharacterReply, getNextSuggestedUserLine } from "../../src/pipeline/chatPipeline";
import type { ConversationMessage } from "../../src/pipeline/types";

export interface SendChatMessageResult {
  userMessage: ConversationMessage;
  characterReply: ConversationMessage | null;
  nextSuggestedLine: string | null;
}

export async function sendChatMessage(
  conversationSoFar: ConversationMessage[],
  userText: string,
): Promise<SendChatMessageResult> {
  const userMessage: ConversationMessage = {
    id: `local-${conversationSoFar.length + 1}`,
    role: "user",
    content: userText,
    timestamp: new Date().toISOString(),
  };

  const afterUserMessage = [...conversationSoFar, userMessage];
  const characterReply = await getCharacterReply(afterUserMessage);
  const afterReply = characterReply ? [...afterUserMessage, characterReply] : afterUserMessage;

  return {
    userMessage,
    characterReply,
    nextSuggestedLine: getNextSuggestedUserLine(afterReply),
  };
}
