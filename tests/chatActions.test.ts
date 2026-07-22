import { describe, expect, it } from "vitest";
import { sendChatMessage } from "../app/chat/actions";
import { decodeConversation } from "../app/lib/conversationQueryState";
import { ConversationSchema } from "../src/pipeline/types";
import sampleConversation from "../src/pipeline/data/sample-conversation.json";

const script = ConversationSchema.parse(sampleConversation).messages;

describe("sendChatMessage", () => {
  it("사용자 메시지를 만들고 캐릭터 답장과 다음 제안 대사를 함께 반환한다", async () => {
    const firstUserLine = script[0]?.content;
    if (!firstUserLine) {
      throw new Error("테스트 준비 실패: 대본이 비어있습니다.");
    }

    const result = await sendChatMessage([], firstUserLine);

    expect(result.userMessage.role).toBe("user");
    expect(result.userMessage.content).toBe(firstUserLine);
    expect(result.characterReply?.content).toBe(script[1]?.content);
    expect(result.nextSuggestedLine).toBe(script[2]?.content ?? null);
    expect(result.conversationHref).toBeNull();
  });

  it("대본 마지막 교환 이후에는 characterReply/nextSuggestedLine이 모두 null이고 conversationHref가 채워진다", async () => {
    const conversationBeforeLastLine = script.slice(0, -1);
    const result = await sendChatMessage(conversationBeforeLastLine, "아무 말이나");

    expect(result.characterReply).toBeNull();
    expect(result.nextSuggestedLine).toBeNull();
    expect(result.conversationHref).toMatch(/^\/\?conversation=/);
  });

  it("conversationHref를 디코딩하면 실제로 주고받은 메시지 전체와 일치한다", async () => {
    // 대본의 마지막 사용자 턴(msg-13)까지 실제로 보내면, 캐릭터의 마지막 대사(msg-14)까지
    // 포함된 완전한 대화가 conversationHref에 담겨야 한다.
    const conversationBeforeFinalTurn = script.slice(0, -2);
    const finalUserLine = script.at(-2)?.content;
    if (!finalUserLine) {
      throw new Error("테스트 준비 실패: 대본이 비어있습니다.");
    }

    const result = await sendChatMessage(conversationBeforeFinalTurn, finalUserLine);

    const token = result.conversationHref?.replace("/?conversation=", "");
    const decoded = decodeConversation(token);

    expect(decoded?.messages).toHaveLength(script.length);
    expect(decoded?.messages.at(-1)?.content).toBe(script.at(-1)?.content);
  });
});
