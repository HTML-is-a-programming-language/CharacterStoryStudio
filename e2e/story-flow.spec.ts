import { expect, test } from "@playwright/test";

/**
 * 채팅 → 분석 → 컨셉 선택 → 씬 승인 → 렌더링 → 다운로드까지, 이 프로젝트의 핵심 사용자
 * 흐름 전체를 실제 브라우저로 검증한다. 지금까지 이 경로는 vitest(함수 단위)와 curl(API
 * 단위)로만 검증했고, 실제 클릭/네비게이션은 여러 ADR에서 "확인하지 못한 한계"로 남아있었다
 * (ADR-009, ADR-016 등). Mock Provider만 쓰므로 API 키나 비용 없이 끝까지 돈다.
 */
test("채팅부터 렌더링 다운로드까지 전체 흐름이 동작한다", async ({ page }) => {
  await page.goto("/chat");

  const sendButton = page.getByRole("button", { name: /보내기|\.\.\./ });
  const finishedBanner = page.getByText("대화를 마쳤어요.");

  // 대본 길이만큼(고정, ADR-015) "보내기"를 눌러 대화를 끝까지 진행한다. 안전장치로
  // 최대 횟수를 둬서, 혹시 종료 조건이 깨져도 테스트가 무한히 매달리지 않게 한다. 마지막
  // 턴에는 버튼이 아예 사라지고(finished 배너로 교체) 대신 나타나므로, 클릭 후에는 "버튼이
  // 다시 활성화됨"과 "종료 배너가 뜸" 둘 중 먼저 일어나는 쪽을 기다린다.
  for (let i = 0; i < 20; i += 1) {
    if (await finishedBanner.isVisible()) {
      break;
    }
    await sendButton.click();
    await Promise.race([
      expect(finishedBanner).toBeVisible({ timeout: 10_000 }).catch(() => undefined),
      expect(sendButton).toBeEnabled({ timeout: 10_000 }).catch(() => undefined),
    ]);
  }
  await expect(finishedBanner).toBeVisible();

  await page.getByRole("link", { name: "이 대화로 컨셉 만들러 가기 →" }).click();
  await expect(page).toHaveURL(/\/(\?.*)?$/);

  await page.getByText("이 컨셉으로 스토리보드 보기 →").first().click();
  await expect(page).toHaveURL(/\/story\//);

  // "승인" 링크는 Next.js <Link>의 클라이언트 사이드 전환이라, count()는 전환이 끝나기 전의
  // DOM을 그대로 반환할 수 있다 — 클릭마다 개수가 실제로 하나 줄어드는 것까지 기다린다.
  // exact: true가 꼭 필요하다 — 안 그러면 이미 승인된 씬의 "✓ 승인됨 (취소)" 링크도
  // "승인"의 부분 문자열로 매칭돼서 카운트가 절대 줄지 않는다.
  const approveLink = page.getByRole("link", { name: "승인", exact: true });
  let remaining = await approveLink.count();
  while (remaining > 0) {
    await approveLink.first().click();
    remaining -= 1;
    await expect(approveLink).toHaveCount(remaining, { timeout: 10_000 });
  }

  const startRenderButton = page.getByRole("button", { name: "영상 렌더링 시작" });
  await expect(startRenderButton).toBeVisible();
  await startRenderButton.click();

  await expect(page.getByText(/렌더링 중입니다/)).toBeVisible();

  const downloadLink = page.getByRole("link", { name: "영상 다운로드 (MP4)" });
  await expect(downloadLink).toBeVisible({ timeout: 120_000 });
  await expect(downloadLink).toHaveAttribute("href", /\/render\/download\?jobId=/);
});
