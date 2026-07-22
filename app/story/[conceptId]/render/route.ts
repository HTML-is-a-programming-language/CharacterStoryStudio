import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";
import { getStoryboardForConcept } from "../../../../src/pipeline/conversationPipeline";
import { ConversationAnalysisEmptyError } from "../../../../src/pipeline/types";
import { renderStoryboardToFile } from "../../../../src/rendering/renderStoryboard";
import { decodeConversation } from "../../../lib/conversationQueryState";
import { parseStoryQueryState } from "../../../lib/storyQueryState";

/**
 * GET /story/:conceptId/render — 모든 씬이 승인된 스토리보드를 실제로 Remotion으로
 * 렌더링해 MP4를 응답으로 스트리밍한다. 렌더링에 20~30초 정도 걸린다(동기 처리, 큐 없음
 * — 로컬 데모 범위를 넘어서면 비동기 작업 큐가 필요하다는 걸 알고 있는 의도적 단순화다).
 */
export async function GET(request: NextRequest, { params }: { params: { conceptId: string } }) {
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

  const tempDir = await mkdtemp(path.join(os.tmpdir(), "css-render-"));
  const outputPath = path.join(tempDir, `${concept.id}.mp4`);

  try {
    await renderStoryboardToFile(storyboard, outputPath);
    const file = await readFile(outputPath);

    return new NextResponse(new Uint8Array(file), {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="${concept.id}.mp4"`,
      },
    });
  } catch (error) {
    console.error("[render] Remotion 렌더링 실패:", error);
    return NextResponse.json({ error: "영상 렌더링에 실패했습니다." }, { status: 500 });
  } finally {
    await rm(tempDir, { recursive: true, force: true }).catch((error: unknown) => {
      console.warn("[render] 임시 렌더링 폴더 정리 실패:", error);
    });
  }
}
