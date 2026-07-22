import { describe, expect, it } from "vitest";
import {
  MAX_CONVERSATION_TOKEN_LENGTH,
  buildHomeHref,
  decodeConversation,
  encodeConversation,
} from "../app/lib/conversationQueryState";
import { ConversationSchema, type Conversation } from "../src/pipeline/types";
import sampleConversation from "../src/pipeline/data/sample-conversation.json";

const sample = ConversationSchema.parse(sampleConversation);

describe("conversationQueryState", () => {
  it("인코딩→디코딩 라운드트립이 원본과 동일하다", () => {
    const token = encodeConversation(sample);
    const decoded = decodeConversation(token);

    expect(decoded).toEqual(sample);
  });

  it("undefined/빈 문자열은 undefined를 반환한다", () => {
    expect(decodeConversation(undefined)).toBeUndefined();
    expect(decodeConversation("")).toBeUndefined();
  });

  it("base64가 아닌 문자열이나 손상된 토큰은 예외 없이 undefined를 반환한다", () => {
    expect(decodeConversation("not-valid-base64!!!")).toBeUndefined();
    expect(decodeConversation("YWJj")).toBeUndefined(); // "abc"를 디코딩하면 JSON 파싱 실패
  });

  it("스키마에 맞지 않는 JSON은 undefined를 반환한다", () => {
    const invalidJson = JSON.stringify({ not: "a conversation" });
    const token = Buffer.from(invalidJson, "utf-8").toString("base64url");
    expect(decodeConversation(token)).toBeUndefined();
  });

  it("길이 상한을 넘는 토큰은 undefined를 반환한다", () => {
    const huge: Conversation = {
      character: sample.character,
      messages: sample.messages.map((message) => ({
        ...message,
        content: message.content.repeat(50),
      })),
    };
    const token = encodeConversation(huge);
    expect(token.length).toBeGreaterThan(MAX_CONVERSATION_TOKEN_LENGTH);
    expect(decodeConversation(token)).toBeUndefined();
  });

  it("buildHomeHref는 정상 크기면 conversation 쿼리를 붙이고, 상한을 넘으면 무쿼리로 폴백한다", () => {
    const normalHref = buildHomeHref(sample);
    expect(normalHref.startsWith("/?conversation=")).toBe(true);

    const huge: Conversation = {
      character: sample.character,
      messages: sample.messages.map((message) => ({
        ...message,
        content: message.content.repeat(50),
      })),
    };
    expect(buildHomeHref(huge)).toBe("/");
  });
});
