import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { GET as getStatus } from "../app/story/[conceptId]/render/status/route";
import { GET as getDownload } from "../app/story/[conceptId]/render/download/route";
import { createJob, markJobCompleted } from "../src/rendering/renderJobStore";

describe("GET /story/[conceptId]/render/status", () => {
  it("jobId가 없으면 400을 반환한다", async () => {
    const response = getStatus(new NextRequest("http://localhost/story/x/render/status"));
    expect(response.status).toBe(400);
  });

  it("존재하지 않는 작업이면 404를 반환한다", async () => {
    const response = getStatus(
      new NextRequest("http://localhost/story/x/render/status?jobId=does-not-exist"),
    );
    expect(response.status).toBe(404);
  });

  it("존재하는 작업이면 상태를 반환한다", async () => {
    createJob("status-test-job");
    const response = getStatus(
      new NextRequest("http://localhost/story/x/render/status?jobId=status-test-job"),
    );
    expect(response.status).toBe(200);

    const body = (await response.json()) as { status: string };
    expect(body.status).toBe("pending");
  });

  it("완료된 작업이면 QA 결과도 함께 반환한다", async () => {
    createJob("status-qa-job");
    const qaResult = {
      passed: false,
      checks: [{ name: "재생시간 20~40초 범위", pass: false, detail: "10.00s" }],
    };
    markJobCompleted("status-qa-job", "/tmp/out.mp4", "out.mp4", qaResult);

    const response = getStatus(
      new NextRequest("http://localhost/story/x/render/status?jobId=status-qa-job"),
    );
    const body = (await response.json()) as { status: string; qaResult?: typeof qaResult };
    expect(body.qaResult).toEqual(qaResult);
  });
});

describe("GET /story/[conceptId]/render/download", () => {
  it("jobId가 없으면 400을 반환한다", async () => {
    const response = await getDownload(new NextRequest("http://localhost/story/x/render/download"));
    expect(response.status).toBe(400);
  });

  it("완료되지 않은(또는 존재하지 않는) 작업이면 409를 반환한다", async () => {
    createJob("pending-job");
    const response = await getDownload(
      new NextRequest("http://localhost/story/x/render/download?jobId=pending-job"),
    );
    expect(response.status).toBe(409);
  });
});
