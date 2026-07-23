import { describe, expect, it } from "vitest";
import {
  createJob,
  getJob,
  markJobCompleted,
  markJobFailed,
  removeJob,
} from "../src/rendering/renderJobStore";

describe("renderJobStore", () => {
  it("createJob은 pending 상태의 작업을 만들고 getJob으로 조회할 수 있다", () => {
    const job = createJob("job-1");
    expect(job.status).toBe("pending");
    expect(getJob("job-1")).toEqual(job);
  });

  it("markJobCompleted는 상태와 파일 정보를 채운다", () => {
    createJob("job-2");
    markJobCompleted("job-2", "/tmp/out.mp4", "out.mp4");

    const job = getJob("job-2");
    expect(job?.status).toBe("completed");
    expect(job?.filePath).toBe("/tmp/out.mp4");
    expect(job?.fileName).toBe("out.mp4");
    expect(job?.qaResult).toBeUndefined();
  });

  it("markJobCompleted에 QA 결과를 넘기면 함께 저장한다", () => {
    createJob("job-2b");
    const qaResult = {
      passed: true,
      checks: [{ name: "해상도 1080x1920 (9:16 세로형)", pass: true, detail: "1080x1920" }],
    };
    markJobCompleted("job-2b", "/tmp/out.mp4", "out.mp4", qaResult);

    expect(getJob("job-2b")?.qaResult).toEqual(qaResult);
  });

  it("markJobFailed는 상태와 에러 메시지를 채운다", () => {
    createJob("job-3");
    markJobFailed("job-3", "렌더링 실패");

    const job = getJob("job-3");
    expect(job?.status).toBe("failed");
    expect(job?.error).toBe("렌더링 실패");
  });

  it("removeJob 이후에는 조회되지 않는다", () => {
    createJob("job-4");
    removeJob("job-4");
    expect(getJob("job-4")).toBeUndefined();
  });

  it("존재하지 않는 작업에 markJobCompleted/markJobFailed를 호출해도 에러를 던지지 않는다", () => {
    expect(() => markJobCompleted("does-not-exist", "/tmp/x.mp4", "x.mp4")).not.toThrow();
    expect(() => markJobFailed("does-not-exist", "에러")).not.toThrow();
  });
});
