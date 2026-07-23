import { NextResponse, type NextRequest } from "next/server";
import { getJob } from "../../../../../src/rendering/renderJobStore";

/** GET /story/:conceptId/render/status?jobId=... — 렌더링 작업의 현재 상태를 조회한다. */
export function GET(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get("jobId");
  if (!jobId) {
    return NextResponse.json({ error: "jobId 쿼리 파라미터가 필요합니다." }, { status: 400 });
  }

  const job = getJob(jobId);
  if (!job) {
    return NextResponse.json({ error: "존재하지 않는 작업입니다." }, { status: 404 });
  }

  return NextResponse.json({ status: job.status, error: job.error, qaResult: job.qaResult });
}
