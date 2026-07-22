"use server";

import { getCharacterReply, getChatCharacter, getNextSuggestedUserLine } from "../../src/pipeline/chatPipeline";
import type { ConversationMessage } from "../../src/pipeline/types";
import { buildHomeHref } from "../lib/conversationQueryState";

export interface SendChatMessageResult {
  userMessage: ConversationMessage;
  characterReply: ConversationMessage | null;
  nextSuggestedLine: string | null;
  /** 이번 턴에 대화가 끝났을 때만 값이 채워진다 — 이 대화를 실제 분석 파이프라인으로 넘기는 링크. */
  conversationHref: string | null;
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
  const nextSuggestedLine = getNextSuggestedUserLine(afterReply);

  const finished = !characterReply || nextSuggestedLine === null;
  const conversationHref = finished
    ? buildHomeHref({ character: getChatCharacter(), messages: afterReply })
    : null;

  return { userMessage, characterReply, nextSuggestedLine, conversationHref };
}
