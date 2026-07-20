import { describe, expect, it } from "vitest";
import { getConceptOptions, getStoryboardForConcept } from "../src/pipeline/sampleConversationPipeline";
import { StoryPlanSchema } from "../src/schema";

describe("sampleConversationPipeline", () => {
  it("서로 다른 톤을 가진 컨셉 3개를 반환한다", async () => {
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
    // 재생성 대상이 아닌 씬은 그대로 유지된다.
    expect(varied?.storyboard.scenes[1]).toEqual(base.storyboard.scenes[1]);
  });
});
