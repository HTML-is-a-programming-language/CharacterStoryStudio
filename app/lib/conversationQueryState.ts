import "server-only";

import { ConversationSchema, type Conversation } from "../../src/pipeline/types";

/**
 * 채팅에서 만들어진 대화 전체를 URL 쿼리로 실어 나르기 위한 인코딩/디코딩.
 * DB 없이 URL이 곧 상태라는 이 프로젝트의 원칙(ADR-010, ADR-013)을 채팅에도 그대로 적용한다.
 *
 * base64url을 쓰는 이유: 한국어 텍스트를 그냥 encodeURIComponent하면 퍼센트 인코딩 팽창이 커서
 * (한글 1자가 %XX%XX%XX 9자로 늘어남) URL이 과도하게 길어진다. 실측(14턴 샘플 대화 기준)으로
 * base64url이 약 38% 더 짧았다.
 */

export const CONVERSATION_QUERY_PARAM = "conversation";

/** 이 길이를 넘는 토큰은 URL에 싣지 않고 고정 샘플로 폴백한다(무한정 긴 채팅 방지용 방어적 상한). */
export const MAX_CONVERSATION_TOKEN_LENGTH = 6000;

export function encodeConversation(conversation: Conversation): string {
  const json = JSON.stringify(ConversationSchema.parse(conversation));
  return Buffer.from(json, "utf-8").toString("base64url");
}

/** 실패하면(빈 값/길이초과/디코딩 실패/스키마 불일치) 예외 없이 undefined를 반환한다(조용한 폴백). */
export function decodeConversation(token: string | undefined): Conversation | undefined {
  if (!token || token.length > MAX_CONVERSATION_TOKEN_LENGTH) {
    return undefined;
  }

  try {
    const json = Buffer.from(token, "base64url").toString("utf-8");
    const parsed = ConversationSchema.safeParse(JSON.parse(json));
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}

/** 토큰이 상한을 넘으면 무쿼리 홈("/")으로 폴백한다. */
export function buildHomeHref(conversation: Conversation): string {
  const token = encodeConversation(conversation);
  if (token.length > MAX_CONVERSATION_TOKEN_LENGTH) {
    return "/";
  }
  return `/?${CONVERSATION_QUERY_PARAM}=${token}`;
}
