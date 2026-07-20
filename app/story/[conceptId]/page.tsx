import Link from "next/link";
import { notFound } from "next/navigation";
import { getStoryboardForConcept } from "../../../src/pipeline/sampleConversationPipeline";
import { SceneCard } from "../../components/SceneCard";
import {
  buildRenderHref,
  buildStoryHref,
  bumpVariant,
  parseStoryQueryState,
  toggleApproved,
  type StoryPageSearchParams,
} from "../../lib/storyQueryState";

export default async function StoryboardPage({
  params,
  searchParams,
}: {
  params: { conceptId: string };
  searchParams: StoryPageSearchParams;
}) {
  const queryState = parseStoryQueryState(searchParams);
  const result = await getStoryboardForConcept(params.conceptId, queryState.variants);

  if (!result) {
    notFound();
  }

  const { concept, storyboard } = result;
  const totalSeconds =
    storyboard.scenes.reduce((sum, scene) => sum + scene.durationInFrames, 0) / storyboard.fps;
  const allApproved = storyboard.scenes.every((scene) => queryState.approved.has(scene.id));

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/" className="text-sm text-white/50 hover:text-white/80">
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
          {/* next/link가 아니라 일반 <a>를 쓴다 — Link의 prefetch가 렌더링(비용/시간이 드는
              작업)을 사용자가 누르기도 전에 미리 트리거하면 안 되기 때문이다. */}
          <a
            href={buildRenderHref(concept.id, queryState)}
            className="mt-2 inline-block rounded-md bg-emerald-400/20 px-4 py-2 font-medium text-emerald-100 hover:bg-emerald-400/30"
          >
            영상 다운로드 (MP4, 렌더링에 20~30초 정도 걸립니다)
          </a>
        </div>
      )}
    </main>
  );
}
