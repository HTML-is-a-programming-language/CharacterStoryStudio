import "server-only";

/**
 * 렌더링 작업을 서버 프로세스 메모리에만 보관하는 아주 단순한 잡 저장소.
 *
 * 한계(의도적 단순화, TODO): Redis 같은 외부 저장소가 아니라 순수 인메모리 Map이라
 * (1) 서버 재시작 시 모든 작업 상태가 사라지고, (2) 여러 서버 인스턴스로 수평 확장하면
 * 인스턴스마다 저장소가 따로 놀아 동작하지 않는다. `next start`처럼 단일 프로세스가
 * 계속 떠 있는 배포(로컬 데모, 단일 VM/컨테이너)를 전제로 한다 — 서버리스 함수처럼
 * 요청이 끝나면 프로세스가 죽는 환경에서는 fire-and-forget 렌더링 자체가 끝까지
 * 실행된다는 보장이 없다(ADR-020). 실제 다중 인스턴스 서비스로 키우려면 그때 Redis 같은
 * 공유 저장소가 필요해진다.
 *
 * globalThis에 Map을 붙이는 이유: Next.js는 Route Handler 파일(app/**\/route.ts)마다
 * 별도로 컴파일한다. `const jobs = new Map()`을 모듈 스코프에 그냥 두면, POST(render/route.ts)와
 * GET(render/status/route.ts)이 같은 소스 파일을 import해도 서로 다른 모듈 인스턴스를 갖게 되어
 * Map이 공유되지 않는다(실제로 겪은 버그 — POST 직후 GET에서 항상 "존재하지 않는 작업"이 나왔다).
 * globalThis는 Node.js 프로세스 전역이라 이 문제를 우회한다(Prisma 클라이언트 싱글턴에도 흔히
 * 쓰는 패턴).
 */

export type RenderJobStatus = "pending" | "completed" | "failed";

export interface RenderJob {
  id: string;
  status: RenderJobStatus;
  createdAt: number;
  filePath?: string;
  fileName?: string;
  error?: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __characterStoryStudioRenderJobs: Map<string, RenderJob> | undefined;
}

const jobs = globalThis.__characterStoryStudioRenderJobs ?? new Map<string, RenderJob>();
globalThis.__characterStoryStudioRenderJobs = jobs;

export function createJob(id: string): RenderJob {
  const job: RenderJob = { id, status: "pending", createdAt: Date.now() };
  jobs.set(id, job);
  return job;
}

export function getJob(id: string): RenderJob | undefined {
  return jobs.get(id);
}

export function markJobCompleted(id: string, filePath: string, fileName: string): void {
  const job = jobs.get(id);
  if (!job) {
    return;
  }
  job.status = "completed";
  job.filePath = filePath;
  job.fileName = fileName;
}

export function markJobFailed(id: string, error: string): void {
  const job = jobs.get(id);
  if (!job) {
    return;
  }
  job.status = "failed";
  job.error = error;
}

export function removeJob(id: string): void {
  jobs.delete(id);
}
