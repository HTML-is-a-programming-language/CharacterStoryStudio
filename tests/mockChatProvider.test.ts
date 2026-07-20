import { describe, expect, it } from "vitest";
import { MockChatProvider, getScriptCharacter, getSuggestedUserLine } from "../src/pipeline/MockChatProvider";
import { ConversationSchema, type ConversationMessage } from "../src/pipeline/types";
import sampleConversation from "../src/pipeline/data/sample-conversation.json";

const script = ConversationSchema.parse(sampleConversation).messages;

describe("MockChatProvider", () => {
  it("대화가 비어있으면 대본의 첫 사용자 대사를 제안한다", () => {
    expect(getSuggestedUserLine([])).toBe(script[0]?.content);
  });

  it("사용자가 첫 메시지를 보내면 대본의 다음(캐릭터) 대사로 답한다", async () => {
    const firstUser = script[0];
    if (!firstUser) {
      throw new Error("테스트 준비 실패: 대본이 비어있습니다.");
    }

    const reply = await MockChatProvider.replyTo([firstUser]);

    expect(reply?.role).toBe("character");
    expect(reply?.content).toBe(script[1]?.content);
  });

  it("사용자가 실제로 뭐라고 입력했든 답장은 대본을 따른다(내용을 이해하지 않는다)", async () => {
    const arbitrary: ConversationMessage = {
      id: "local-1",
      role: "user",
      content: "이건 대본에 없는 완전히 임의의 문장입니다.",
      timestamp: new Date().toISOString(),
    };

    const reply = await MockChatProvider.replyTo([arbitrary]);
    expect(reply?.content).toBe(script[1]?.content);
  });

  it("대본이 끝나면 null을 반환한다", async () => {
    const reply = await MockChatProvider.replyTo([...script]);
    expect(reply).toBeNull();
  });

  it("getScriptCharacter는 대본의 캐릭터 정보를 반환한다", () => {
    const character = getScriptCharacter();
    expect(character.name.length).toBeGreaterThan(0);
  });
});
