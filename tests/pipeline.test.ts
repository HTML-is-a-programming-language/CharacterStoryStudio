import { describe, expect, it } from "vitest";
import { MockStoryProvider } from "../src/pipeline/MockStoryProvider";
import { ConversationSchema } from "../src/pipeline/types";
import { StoryPlanSchema } from "../src/schema";
import sampleConversation from "../src/pipeline/data/sample-conversation.json";

describe("MockStoryProvider", () => {
  const conversation = ConversationSchema.parse(sampleConversation);

  it("대화에서 감정적으로 의미 있는 이벤트만 추적 가능한 형태로 추출한다", async () => {
    const analysis = await MockStoryProvider.analyzeConversation(conversation);

    expect(analysis.events.length).toBeGreaterThan(0);
    for (const event of analysis.events) {
      const exists = conversation.messages.some((message) => message.id === event.sourceMessageId);
      expect(exists).toBe(true);
    }
  });

  it("서로 다른 톤을 가진 컨셉 3개를 생성한다", async () => {
    const analysis = await MockStoryProvider.analyzeConversation(conversation);
    const concepts = await MockStoryProvider.generateConcepts(analysis);

    expect(concepts).toHaveLength(3);
    expect(new Set(concepts.map((concept) => concept.tone)).size).toBe(3);
  });

  it("유효하고 추적 가능하며 목표 재생시간(25~35초) 안에 드는 스토리보드를 생성한다", async () => {
    const analysis = await MockStoryProvider.analyzeConversation(conversation);
    const concepts = await MockStoryProvider.generateConcepts(analysis);
    const concept = concepts.at(0);
    if (!concept) {
      throw new Error("테스트 준비 실패: 컨셉이 생성되지 않았습니다.");
    }

    const storyboard = await MockStoryProvider.generateStoryboard(concept, analysis, conversation);

    expect(StoryPlanSchema.safeParse(storyboard).success).toBe(true);

    const totalSeconds =
      storyboard.scenes.reduce((sum, scene) => sum + scene.durationInFrames, 0) / storyboard.fps;
    expect(totalSeconds).toBeGreaterThanOrEqual(25);
    expect(totalSeconds).toBeLessThanOrEqual(35);

    for (const scene of storyboard.scenes) {
      for (const sourceId of scene.sourceMessageIds ?? []) {
        const exists = conversation.messages.some((message) => message.id === sourceId);
        expect(exists).toBe(true);
      }
    }
  });

  it("감정적 이벤트를 찾지 못하면 명확한 에러를 던진다", async () => {
    const flatConversation = ConversationSchema.parse({
      character: conversation.character,
      messages: [
        { id: "msg-x", role: "user", content: "안녕하세요, 오늘 날씨 어때요?", timestamp: "2026-01-01T00:00:00+09:00" },
      ],
    });

    await expect(MockStoryProvider.analyzeConversation(flatConversation)).rejects.toThrow();
  });

  it("regenerateScene은 대사/화자/출처는 그대로 두고 배경만 바꾼다", async () => {
    const analysis = await MockStoryProvider.analyzeConversation(conversation);
    const concepts = await MockStoryProvider.generateConcepts(analysis);
    const concept = concepts.at(0);
    if (!concept) {
      throw new Error("테스트 준비 실패: 컨셉이 생성되지 않았습니다.");
    }

    const storyboard = await MockStoryProvider.generateStoryboard(concept, analysis, conversation);
    const originalScene = storyboard.scenes[0];
    if (!originalScene) {
      throw new Error("테스트 준비 실패: 씬이 생성되지 않았습니다.");
    }

    const regenerated = await MockStoryProvider.regenerateScene(originalScene, 0, concept, 1);

    expect(regenerated.speaker).toBe(originalScene.speaker);
    expect(regenerated.dialogue).toBe(originalScene.dialogue);
    expect(regenerated.sourceMessageIds).toEqual(originalScene.sourceMessageIds);
    expect(regenerated.background).not.toEqual(originalScene.background);
  });

  it("regenerateScene은 variant가 0이면 씬을 그대로 반환한다", async () => {
    const analysis = await MockStoryProvider.analyzeConversation(conversation);
    const concepts = await MockStoryProvider.generateConcepts(analysis);
    const concept = concepts.at(0);
    if (!concept) {
      throw new Error("테스트 준비 실패: 컨셉이 생성되지 않았습니다.");
    }

    const storyboard = await MockStoryProvider.generateStoryboard(concept, analysis, conversation);
    const originalScene = storyboard.scenes[0];
    if (!originalScene) {
      throw new Error("테스트 준비 실패: 씬이 생성되지 않았습니다.");
    }

    const unchanged = await MockStoryProvider.regenerateScene(originalScene, 0, concept, 0);
    expect(unchanged).toEqual(originalScene);
  });
});
