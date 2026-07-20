import Link from "next/link";
import type { Scene } from "../../src/schema";
import { sceneBackgroundStyle } from "../../src/sceneStyle";

interface SceneCardProps {
  index: number;
  scene: Scene;
  fps: number;
  approved: boolean;
  approveHref: string;
  regenerateHref: string;
}

export function SceneCard({ index, scene, fps, approved, approveHref, regenerateHref }: SceneCardProps) {
  const seconds = scene.durationInFrames / fps;

  return (
    <div
      className={`overflow-hidden rounded-xl border bg-cover bg-center ${approved ? "border-emerald-400/60" : "border-white/10"}`}
      style={sceneBackgroundStyle(scene)}
      role={scene.imageAlt ? "img" : undefined}
      aria-label={scene.imageAlt}
    >
      <div className="bg-linear-to-t from-black/70 via-black/20 to-transparent">
        <div className="flex items-center justify-between px-5 pt-4 text-xs text-white/60">
          <span>Scene {index}</span>
          <span>{seconds.toFixed(1)}s</span>
        </div>
        {scene.caption !== undefined && (
          <p className="px-5 pt-2 text-xs uppercase tracking-widest text-white/50">{scene.caption}</p>
        )}
        <div className="px-5 pb-3 pt-3">
          <p className="text-sm text-pink-200">{scene.speaker}</p>
          <p className="mt-1 text-lg font-medium text-white">{scene.dialogue}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 border-t border-white/10 bg-black/20 px-5 py-3 text-sm">
        <Link
          href={approveHref}
          className={
            approved
              ? "font-medium text-emerald-300 hover:text-emerald-200"
              : "text-white/70 hover:text-white"
          }
        >
          {approved ? "✓ 승인됨 (취소)" : "승인"}
        </Link>
        <Link href={regenerateHref} className="text-white/70 hover:text-white">
          연출 재생성
        </Link>
      </div>
    </div>
  );
}
