import { describe, expect, it } from "vitest";
import { getConceptOptions, getStoryboardForConcept } from "../src/pipeline/conversationPipeline";
import { ConversationAnalysisEmptyError, type Conversation } from "../src/pipeline/types";
import { StoryPlanSchema } from "../src/schema";

const customConversation: Conversation = {
  character: { id: "character-test", name: "테스트캐릭터" },
  messages: [
    { id: "m1", role: "user", content: "안녕하세요", timestamp: "2026-01-01T00:00:00+09:00" },
    { id: "m2", role: "character", content: "사실 너를 좋아해왔어.", timestamp: "2026-01-01T00:01:00+09:00" },
  ],
};

describe("conversationPipeline", () => {
  it("인자를 생략하면 고정 샘플 대화로 폴백해 컨셉 3개를 반환한다", async () => {
    const options = await getConceptOptions();

    expect(options.concepts).toHaveLength(3);
    expect(new Set(options.concepts.map((concept) => concept.tone)).size).toBe(3);
    expect(options.characterName.length).toBeGreaterThan(0);
  });

  it("존재하는 컨셉 id로는 유효한 스토리보드를 반환한다", async () => {
    const options = await getConceptOptions();
    const firstConcept = options.concepts.at(0);
    if (!firstConcept) {
      throw new Error("테스트 준비 실패: 컨셉이 생성되지 않았습니다.");
    }

    const result = await getStoryboardForConcept(firstConcept.id);

    expect(result).toBeDefined();
    expect(result?.concept.id).toBe(firstConcept.id);
    expect(StoryPlanSchema.safeParse(result?.storyboard).success).toBe(true);
  });

  it("존재하지 않는 컨셉 id에는 undefined를 반환한다", async () => {
    const result = await getStoryboardForConcept("concept-does-not-exist");
    expect(result).toBeUndefined();
  });

  it("sceneVariants를 넘기면 해당 씬의 배경만 바뀌고 대사는 그대로다", async () => {
    const options = await getConceptOptions();
    const firstConcept = options.concepts.at(0);
    if (!firstConcept) {
      throw new Error("테스트 준비 실패: 컨셉이 생성되지 않았습니다.");
    }

    const base = await getStoryboardForConcept(firstConcept.id);
    const targetScene = base?.storyboard.scenes[0];
    if (!base || !targetScene) {
      throw new Error("테스트 준비 실패: 기준 스토리보드가 생성되지 않았습니다.");
    }

    const varied = await getStoryboardForConcept(firstConcept.id, { [targetScene.id]: 1 });
    const variedScene = varied?.storyboard.scenes[0];

    expect(variedScene?.dialogue).toBe(targetScene.dialogue);
    expect(variedScene?.background).not.toEqual(targetScene.background);
    expect(variedScene?.imageDataUri).not.toEqual(targetScene.imageDataUri);
    // 재생성 대상이 아닌 씬은 그대로 유지된다.
    expect(varied?.storyboard.scenes[1]).toEqual(base.storyboard.scenes[1]);
  });

  it("conversation을 넘기면 그 대화를 분석해 고정 샘플과 다른 결과를 만든다", async () => {
    const options = await getConceptOptions(customConversation);
    expect(options.characterName).toBe("테스트캐릭터");

    const concept = options.concepts.at(0);
    if (!concept) {
      throw new Error("테스트 준비 실패: 컨셉이 생성되지 않았습니다.");
    }

    const result = await getStoryboardForConcept(concept.id, {}, customConversation);
    expect(result?.storyboard.scenes[0]?.dialogue).toBe("사실 너를 좋아해왔어.");
    expect(result?.storyboard.scenes[0]?.sourceMessageIds).toEqual(["m2"]);
  });

  it("이벤트를 하나도 찾지 못하는 대화를 넘기면 ConversationAnalysisEmptyError를 던진다", async () => {
    const flatConversation: Conversation = {
      character: { id: "c", name: "무감정" },
      messages: [{ id: "m1", role: "user", content: "오늘 날씨 어때요?", timestamp: "2026-01-01T00:00:00+09:00" }],
    };

    await expect(getConceptOptions(flatConversation)).rejects.toBeInstanceOf(ConversationAnalysisEmptyError);
  });
});
