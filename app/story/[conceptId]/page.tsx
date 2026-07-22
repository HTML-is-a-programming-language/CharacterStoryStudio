import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getStoryboardForConcept, type StoryboardResult } from "../../../src/pipeline/conversationPipeline";
import { ConversationAnalysisEmptyError } from "../../../src/pipeline/types";
import { SceneCard } from "../../components/SceneCard";
import { decodeConversation } from "../../lib/conversationQueryState";
import {
  buildRenderHref,
  buildStoryHref,
  bumpVariant,
  parseStoryQueryState,
  toggleApproved,
  type StoryPageSearchParams,
} from "../../lib/storyQueryState";
import { RenderPanel } from "./RenderPanel";

export default async function StoryboardPage({
  params,
  searchParams,
}: {
  params: { conceptId: string };
  searchParams: StoryPageSearchParams;
}) {
  const queryState = parseStoryQueryState(searchParams);
  const conversation = decodeConversation(queryState.conversation);
  const homeHref = queryState.conversation ? `/?conversation=${queryState.conversation}` : "/";

  let result: StoryboardResult | undefined;
  try {
    result = await getStoryboardForConcept(params.conceptId, queryState.variants, conversation);
  } catch (error) {
    if (error instanceof ConversationAnalysisEmptyError) {
      redirect(homeHref);
    }
    throw error;
  }

  if (!result) {
    notFound();
  }

  const { concept, storyboard } = result;
  const totalSeconds =
    storyboard.scenes.reduce((sum, scene) => sum + scene.durationInFrames, 0) / storyboard.fps;
  const allApproved = storyboard.scenes.every((scene) => queryState.approved.has(scene.id));

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href={homeHref} className="text-sm text-white/50 hover:text-white/80">
        ← 다른 컨셉 선택
      </Link>
      <h1 className="mt-4 text-3xl font-bold">{concept.title}</h1>
      <p className="mt-2 text-white/70">{concept.logline}</p>
      <p className="mt-1 text-sm text-white/40">
        {storyboard.scenes.length}개 씬 · 약 {totalSeconds.toFixed(0)}초 · {storyboard.width}×{storyboard.height}
      </p>
      <p className="mt-4 max-w-xl text-xs text-white/40">
        대사는 원본 대화에서 그대로 가져온 것이라 재생성으로 바뀌지 않습니다. "연출 재생성"은 씬의
        배경 톤만 다시 고릅니다.
      </p>

      <div className="mt-10 space-y-4">
        {storyboard.scenes.map((scene, index) => (
          <SceneCard
            key={scene.id}
            index={index + 1}
            scene={scene}
            fps={storyboard.fps}
            approved={queryState.approved.has(scene.id)}
            approveHref={buildStoryHref(concept.id, toggleApproved(queryState, scene.id))}
            regenerateHref={buildStoryHref(concept.id, bumpVariant(queryState, scene.id))}
          />
        ))}
      </div>

      {allApproved && (
        <div className="mt-8 rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
          <p>모든 씬이 승인되었습니다.</p>
          <RenderPanel conceptId={concept.id} startHref={buildRenderHref(concept.id, queryState)} />
        </div>
      )}
    </main>
  );
}
