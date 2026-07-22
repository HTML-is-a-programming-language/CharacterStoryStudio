import Link from "next/link";
import type { StoryConcept } from "../../src/pipeline/types";

const TONE_LABEL: Record<StoryConcept["tone"], string> = {
  calm: "잔잔함",
  romantic: "설렘",
  bittersweet: "여운",
};

export function ConceptCard({ concept, href }: { concept: StoryConcept; href: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col justify-between rounded-xl border border-white/10 bg-white/5 p-5 transition hover:border-white/30 hover:bg-white/10"
    >
      <div>
        <span className="inline-block rounded-full border border-white/20 px-2 py-0.5 text-xs text-white/60">
          {TONE_LABEL[concept.tone]}
        </span>
        <h2 className="mt-3 text-lg font-semibold">{concept.title}</h2>
        <p className="mt-2 text-sm text-white/60">{concept.logline}</p>
      </div>
      <span className="mt-4 text-sm text-white/80">이 컨셉으로 스토리보드 보기 →</span>
    </Link>
  );
}
