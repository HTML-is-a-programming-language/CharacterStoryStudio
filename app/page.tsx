import Link from "next/link";
import { getConceptOptions } from "../src/pipeline/conversationPipeline";
import { ConversationAnalysisEmptyError } from "../src/pipeline/types";
import { ConceptCard } from "./components/ConceptCard";
import { decodeConversation } from "./lib/conversationQueryState";
import { buildStoryHref, parseStoryQueryState, type StoryPageSearchParams } from "./lib/storyQueryState";

export default async function HomePage({
  searchParams,
}: {
  searchParams: StoryPageSearchParams;
}) {
  const queryState = parseStoryQueryState(searchParams);
  const conversation = decodeConversation(queryState.conversation);

  try {
    const { characterName, summary, concepts } = await getConceptOptions(conversation);

    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-sm uppercase tracking-widest text-white/50">Character Story Studio · Demo</p>
        <h1 className="mt-2 text-3xl font-bold">{characterName}와(과)의 대화, 어떤 영상으로 만들까요?</h1>
        <p className="mt-4 text-white/70">{summary}</p>
        <Link href="/chat" className="mt-3 inline-block text-sm text-pink-200 hover:underline">
          먼저 {characterName}와(과) 채팅해보기 →
        </Link>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {concepts.map((concept) => (
            <ConceptCard
              key={concept.id}
              concept={concept}
              href={buildStoryHref(concept.id, {
                approved: new Set(),
                variants: {},
                conversation: queryState.conversation,
              })}
            />
          ))}
        </div>
      </main>
    );
  } catch (error) {
    if (error instanceof ConversationAnalysisEmptyError) {
      return (
        <main className="mx-auto max-w-3xl px-6 py-16">
          <p className="text-sm uppercase tracking-widest text-white/50">Character Story Studio · Demo</p>
          <h1 className="mt-2 text-3xl font-bold">이 대화에서는 분석할 감정 포인트를 찾지 못했어요</h1>
          <p className="mt-4 text-white/70">{error.message}</p>
          <Link href="/chat" className="mt-3 inline-block text-sm text-pink-200 hover:underline">
            채팅에서 원래 제안된 문장을 그대로 보내며 다시 시도해보기 →
          </Link>
        </main>
      );
    }
    throw error;
  }
}
