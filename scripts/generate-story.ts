import { writeFileSync } from "node:fs";
import path from "node:path";
import { MockStoryProvider } from "../src/pipeline/MockStoryProvider";
import { ConversationSchema } from "../src/pipeline/types";
import sampleConversation from "../src/pipeline/data/sample-conversation.json";

async function main(): Promise<void> {
  const conversation = ConversationSchema.parse(sampleConversation);

  const analysis = await MockStoryProvider.analyzeConversation(conversation);
  const concepts = await MockStoryProvider.generateConcepts(analysis);

  const chosenConcept = concepts.at(0);
  if (!chosenConcept) {
    throw new Error("생성된 컨셉이 없습니다.");
  }

  const storyboard = await MockStoryProvider.generateStoryboard(chosenConcept, analysis, conversation);

  const outPath = path.resolve("src/data/generated-story.json");
  writeFileSync(outPath, `${JSON.stringify(storyboard, null, 2)}\n`, "utf-8");

  console.log(`분석된 이벤트: ${analysis.events.length}개`);
  console.log(`생성된 컨셉: ${concepts.map((c) => `${c.title}(${c.tone})`).join(", ")}`);
  console.log(`선택된 컨셉: ${chosenConcept.title}`);
  console.log(`스토리보드 저장 완료: ${outPath}`);
  console.log(`다음 명령으로 렌더링할 수 있습니다: pnpm run render:generated`);
}

main().catch((error: unknown) => {
  console.error("스토리 생성 실패:", error);
  process.exitCode = 1;
});
