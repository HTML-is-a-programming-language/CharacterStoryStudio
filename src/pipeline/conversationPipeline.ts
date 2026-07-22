import "server-only";

import { StoryPlanSchema, type StoryPlan } from "../schema";
import { MockStoryProvider } from "./MockStoryProvider";
import { ConversationSchema, type Conversation, type StoryConcept } from "./types";
import sampleConversation from "./data/sample-conversation.json";

/**
 * UI(Server Component)가 MockStoryProvider를 직접 호출하지 않도록 감싸는 유일한 진입점.
 * `conversation`을 넘기면 그걸 분석하고, 생략하면 고정 샘플 대화로 폴백한다(Demo Mode —
 * 아무 파라미터 없이 방문해도 항상 동작해야 한다, ADR-002).
 */

function resolveConversation(override?: Conversation): Conversation {
  return override ?? ConversationSchema.parse(sampleConversation);
}

export interface ConceptOptions {
  characterName: string;
  summary: string;
  concepts: StoryConcept[];
}

export async function getConceptOptions(conversation?: Conversation): Promise<ConceptOptions> {
  const resolved = resolveConversation(conversation);
  const analysis = await MockStoryProvider.analyzeConversation(resolved);
  const concepts = await MockStoryProvider.generateConcepts(analysis);

  return {
    characterName: analysis.characterName,
    summary: analysis.summary,
    concepts,
  };
}

export interface StoryboardResult {
  concept: StoryConcept;
  storyboard: StoryPlan;
}

/**
 * @param sceneVariants 씬 id → 재생성 횟수(1 이상이면 그 씬의 연출을 다시 고른다).
 *   승인/재생성 UI가 URL 쿼리 상태로부터 이 값을 만들어 넘긴다.
 * @param conversation 생략하면 고정 샘플 대화로 폴백한다.
 */
export async function getStoryboardForConcept(
  conceptId: string,
  sceneVariants: Record<string, number> = {},
  conversation?: Conversation,
): Promise<StoryboardResult | undefined> {
  const resolved = resolveConversation(conversation);
  const analysis = await MockStoryProvider.analyzeConversation(resolved);
  const concepts = await MockStoryProvider.generateConcepts(analysis);

  const concept = concepts.find((candidate) => candidate.id === conceptId);
  if (!concept) {
    return undefined;
  }

  const baseStoryboard = await MockStoryProvider.generateStoryboard(concept, analysis, resolved);

  const scenes = await Promise.all(
    baseStoryboard.scenes.map((scene, index) => {
      const variant = sceneVariants[scene.id] ?? 0;
      return MockStoryProvider.regenerateScene(scene, index, concept, variant);
    }),
  );

  const storyboard = StoryPlanSchema.parse({ ...baseStoryboard, scenes });
  return { concept, storyboard };
}
