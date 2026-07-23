import crypto from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";
import { getStoryboardForConcept } from "../../../../src/pipeline/conversationPipeline";
import { ConversationAnalysisEmptyError } from "../../../../src/pipeline/types";
import { runQaCheck, type QaCheckResult } from "../../../../src/rendering/qaCheck";
import { createJob, markJobCompleted, markJobFailed } from "../../../../src/rendering/renderJobStore";
import { renderStoryboardToFile } from "../../../../src/rendering/renderStoryboard";
import type { StoryPlan } from "../../../../src/schema";
import { decodeConversation } from "../../../lib/conversationQueryState";
import { parseStoryQueryState } from "../../../lib/storyQueryState";

/**
 * POST /story/:conceptId/render — 모든 씬이 승인된 스토리보드의 렌더링 작업을 "시작"만
 * 하고 즉시 202 + jobId를 반환한다(실제 렌더링은 백그라운드에서 계속 진행). 렌더링에
 * 20~50초 정도 걸리는데, 요청을 그동안 붙잡아두지 않는다 — Next.js 서버가 그 시간 동안
 * 다른 요청을 처리 못 하는 것도 막고, 서버리스 환경의 함수 실행 시간 제한 위험도 줄인다
 * (ADR-020). 진행 상태는 /render/status, 결과물은 /render/download에서 jobId로 조회한다.
 */
export async function POST(request: NextRequest, { params }: { params: { conceptId: string } }) {
  const searchParams = Object.fromEntries(request.nextUrl.searchParams);
  const queryState = parseStoryQueryState(searchParams);
  const conversation = decodeConversation(queryState.conversation);

  let result;
  try {
    result = await getStoryboardForConcept(params.conceptId, queryState.variants, conversation);
  } catch (error) {
    if (error instanceof ConversationAnalysisEmptyError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    throw error;
  }

  if (!result) {
    return NextResponse.json({ error: "존재하지 않는 컨셉입니다." }, { status: 404 });
  }

  const { concept, storyboard } = result;
  const allApproved = storyboard.scenes.every((scene) => queryState.approved.has(scene.id));
  if (!allApproved) {
    return NextResponse.json(
      { error: "모든 씬이 승인되어야 렌더링할 수 있습니다." },
      { status: 400 },
    );
  }

  const jobId = crypto.randomUUID();
  createJob(jobId);

  // 의도적으로 await하지 않는다 — 이 요청은 작업을 등록만 하고 바로 응답한다.
  runRenderJob(jobId, storyboard, concept.id).catch((error: unknown) => {
    console.error(`[render] 작업 ${jobId} 실행 중 예상치 못한 오류:`, error);
  });

  return NextResponse.json({ jobId }, { status: 202 });
}

async function runRenderJob(jobId: string, storyboard: StoryPlan, conceptId: string): Promise<void> {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "css-render-"));
  const outputPath = path.join(tempDir, `${conceptId}.mp4`);

  try {
    await renderStoryboardToFile(storyboard, outputPath);

    let qaResult: QaCheckResult | undefined;
    try {
      qaResult = runQaCheck(outputPath);
    } catch (qaError) {
      // QA 실행 자체가 실패해도(ffprobe 문제 등) 렌더링은 이미 성공했으므로 작업을
      // 실패시키지 않는다 — 로그만 남기고 다운로드 가능한 결과물을 그대로 완료 처리한다.
      console.warn(`[render] 작업 ${jobId} QA 검사 실행 실패:`, qaError);
    }

    markJobCompleted(jobId, outputPath, `${conceptId}.mp4`, qaResult);
  } catch (error) {
    console.error(`[render] 작업 ${jobId} 렌더링 실패:`, error);
    markJobFailed(jobId, "영상 렌더링에 실패했습니다.");
    await rm(tempDir, { recursive: true, force: true }).catch((cleanupError: unknown) => {
      console.warn(`[render] 작업 ${jobId} 임시 폴더 정리 실패:`, cleanupError);
    });
  }
}
