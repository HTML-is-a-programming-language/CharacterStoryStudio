import "server-only";

import type { StoryPlan } from "../schema";
import { MockStoryProvider } from "./MockStoryProvider";
import { ConversationSchema, type StoryConcept } from "./types";
import sampleConversation from "./data/sample-conversation.json";

/**
 * UI(Server Component)가 MockStoryProvider를 직접 호출하지 않도록 감싸는 유일한 진입점.
 * 지금은 고정된 샘플 대화 하나만 다룬다 — 대화 선택 UI는 다음 Phase 범위.
 */

function loadSampleConversation() {
  return ConversationSchema.parse(sampleConversation);
}

export interface ConceptOptions {
  characterName: string;
  summary: string;
  concepts: StoryConcept[];
}

export async function getConceptOptions(): Promise<ConceptOptions> {
  const conversation = loadSampleConversation();
  const analysis = await MockStoryProvider.analyzeConversation(conversation);
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

export async function getStoryboardForConcept(
  conceptId: string,
): Promise<StoryboardResult | undefined> {
  const conversation = loadSampleConversation();
  const analysis = await MockStoryProvider.analyzeConversation(conversation);
  const concepts = await MockStoryProvider.generateConcepts(analysis);

  const concept = concepts.find((candidate) => candidate.id === conceptId);
  if (!concept) {
    return undefined;
  }

  const storyboard = await MockStoryProvider.generateStoryboard(concept, analysis, conversation);
  return { concept, storyboard };
}
