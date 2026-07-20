import Link from "next/link";
import { notFound } from "next/navigation";
import { getStoryboardForConcept } from "../../../src/pipeline/sampleConversationPipeline";
import { SceneCard } from "../../components/SceneCard";

export default async function StoryboardPage({
  params,
}: {
  params: { conceptId: string };
}) {
  const result = await getStoryboardForConcept(params.conceptId);

  if (!result) {
    notFound();
  }

  const { concept, storyboard } = result;
  const totalSeconds =
    storyboard.scenes.reduce((sum, scene) => sum + scene.durationInFrames, 0) / storyboard.fps;

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

      <div className="mt-10 space-y-4">
        {storyboard.scenes.map((scene, index) => (
          <SceneCard key={scene.id} index={index + 1} scene={scene} fps={storyboard.fps} />
        ))}
      </div>
    </main>
  );
}
