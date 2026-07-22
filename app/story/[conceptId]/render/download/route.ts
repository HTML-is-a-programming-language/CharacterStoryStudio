import { readFile, rm } from "node:fs/promises";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";
import { getJob, removeJob } from "../../../../../src/rendering/renderJobStore";

/**
 * GET /story/:conceptId/render/download?jobId=... — 완료된 렌더링 결과물을 내려받는다.
 * 한 번 내려받으면(또는 요청이 들어오는 순간) 임시 파일과 잡 기록을 정리한다 — 1회성
 * 다운로드 링크로 취급한다.
 */
export async function GET(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get("jobId");
  if (!jobId) {
    return NextResponse.json({ error: "jobId 쿼리 파라미터가 필요합니다." }, { status: 400 });
  }

  const job = getJob(jobId);
  if (!job || job.status !== "completed" || !job.filePath || !job.fileName) {
    return NextResponse.json(
      { error: "아직 준비되지 않았거나 존재하지 않는 작업입니다." },
      { status: 409 },
    );
  }

  const file = await readFile(job.filePath);
  const tempDir = path.dirname(job.filePath);
  const fileName = job.fileName;

  removeJob(jobId);
  await rm(tempDir, { recursive: true, force: true }).catch((error: unknown) => {
    console.warn(`[render] 작업 ${jobId} 다운로드 후 임시 폴더 정리 실패:`, error);
  });

  return new NextResponse(new Uint8Array(file), {
    status: 200,
    headers: {
      "Content-Type": "video/mp4",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
