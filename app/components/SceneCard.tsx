import type { Scene } from "../../src/schema";

export function SceneCard({ index, scene, fps }: { index: number; scene: Scene; fps: number }) {
  const seconds = scene.durationInFrames / fps;

  return (
    <div
      className="overflow-hidden rounded-xl border border-white/10"
      style={{ background: `linear-gradient(160deg, ${scene.background.from}, ${scene.background.to})` }}
    >
      <div className="flex items-center justify-between px-5 pt-4 text-xs text-white/60">
        <span>Scene {index}</span>
        <span>{seconds.toFixed(1)}s</span>
      </div>
      {scene.caption !== undefined && (
        <p className="px-5 pt-2 text-xs uppercase tracking-widest text-white/50">{scene.caption}</p>
      )}
      <div className="px-5 pb-5 pt-3">
        <p className="text-sm text-pink-200">{scene.speaker}</p>
        <p className="mt-1 text-lg font-medium text-white">{scene.dialogue}</p>
      </div>
    </div>
  );
}
