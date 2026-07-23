"use client";

import { useEffect, useRef, useState } from "react";
import type { QaCheckResult } from "../../../src/rendering/qaCheck";

type RenderState = "idle" | "pending" | "completed" | "failed";

const POLL_INTERVAL_MS = 2000;

export function RenderPanel({ conceptId, startHref }: { conceptId: string; startHref: string }) {
  const [state, setState] = useState<RenderState>("idle");
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [qaResult, setQaResult] = useState<QaCheckResult | undefined>(undefined);
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (state !== "pending" || !jobId) {
      return;
    }

    const interval = setInterval(async () => {
      if (startedAtRef.current !== null) {
        setElapsedSeconds(Math.round((Date.now() - startedAtRef.current) / 1000));
      }

      const response = await fetch(`/story/${conceptId}/render/status?jobId=${jobId}`);
      if (!response.ok) {
        return;
      }
      const data = (await response.json()) as {
        status: RenderState;
        error?: string;
        qaResult?: QaCheckResult;
      };

      if (data.status === "completed") {
        setState("completed");
        setQaResult(data.qaResult);
      } else if (data.status === "failed") {
        setState("failed");
        setError(data.error ?? "영상 렌더링에 실패했습니다.");
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [state, jobId, conceptId]);

  async function handleStart() {
    setState("pending");
    setError(null);
    setQaResult(undefined);
    startedAtRef.current = Date.now();
    setElapsedSeconds(0);

    const response = await fetch(startHref, { method: "POST" });
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      setState("failed");
      setError(body.error ?? "렌더링 시작에 실패했습니다.");
      return;
    }

    const body = (await response.json()) as { jobId: string };
    setJobId(body.jobId);
  }

  if (state === "completed" && jobId) {
    return (
      <div className="mt-2">
        <a
          href={`/story/${conceptId}/render/download?jobId=${jobId}`}
          className="inline-block rounded-md bg-emerald-400/20 px-4 py-2 font-medium text-emerald-100 hover:bg-emerald-400/30"
        >
          영상 다운로드 (MP4)
        </a>
        {qaResult && (
          <ul className="mt-2 space-y-1 text-sm">
            {qaResult.checks.map((check) => (
              <li key={check.name} className={check.pass ? "text-emerald-200/80" : "text-amber-300"}>
                {check.pass ? "✓" : "⚠"} {check.name} — {check.detail}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (state === "pending") {
    return (
      <p className="mt-2 text-sm text-emerald-200/80">
        렌더링 중입니다… ({elapsedSeconds}초 경과, 보통 20~50초 정도 걸립니다)
      </p>
    );
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={handleStart}
        className="rounded-md bg-emerald-400/20 px-4 py-2 font-medium text-emerald-100 hover:bg-emerald-400/30"
      >
        영상 렌더링 시작
      </button>
      {state === "failed" && error !== null && <p className="mt-2 text-sm text-red-300">{error}</p>}
    </div>
  );
}
