import Link from "next/link";
import { getConceptOptions } from "../src/pipeline/sampleConversationPipeline";
import { ConceptCard } from "./components/ConceptCard";

export default async function HomePage() {
  const { characterName, summary, concepts } = await getConceptOptions();

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
          <ConceptCard key={concept.id} concept={concept} />
        ))}
      </div>
    </main>
  );
}
