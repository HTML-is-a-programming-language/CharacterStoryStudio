import { describe, expect, it } from "vitest";
import { sendChatMessage } from "../app/chat/actions";
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
  });

  it("대본 마지막 교환 이후에는 characterReply/nextSuggestedLine이 모두 null이다", async () => {
    const conversationBeforeLastLine = script.slice(0, -1);
    const result = await sendChatMessage(conversationBeforeLastLine, "아무 말이나");

    expect(result.characterReply).toBeNull();
    expect(result.nextSuggestedLine).toBeNull();
  });
});
