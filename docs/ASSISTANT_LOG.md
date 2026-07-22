# 어시스턴트 답변 로그

이 문서는 사용자가 순수한 궁금증으로 요청해서 유지하는, **Claude(어시스턴트)가 이 채팅에서 실제로
한 답변/작업만** 정리한 기록입니다.

> **주의**: 이 문서는 프로젝트의 의사결정 근거가 아닙니다. `docs/DECISIONS.md`, `docs/PORTFOLIO.md`와
> 달리 이 문서의 내용은 이후 작업 판단에 참고하지 않습니다. 단순 열람용 기록입니다.

---

## 1. 결합 방향 리서치 및 제안

러비더비(웹서치)와 OpenMontage(GitHub, WebFetch)를 각각 조사해 요약했고, 동시에 로컬 저장소를
Explore 서브에이전트로 조사시켰다. 저장소가 사실상 비어있고 이전 문서 커밋이 orphan 커밋으로
덮어써져 dangling 상태라는 것을 발견해 먼저 보고했다. 두 서비스를 "코드 결합"이 아니라
"러비더비의 대화 → OpenMontage식 승인 파이프라인 → 개인화 영상" 컨셉으로 엮는 방향을 제안했다.

## 2. 구조화된 질문으로 방향 확정

"OpenMontage를 코드로 가져다 쓸지 vs 설계만 참고할지", "러비더비 대화를 어디서 가져올지",
"생성 리소스를 유료로 바로 쓸지" 등을 선택지로 정리해 질문했다. 이어서 복구된 옛 문서
(PROJECT_BRIEF.md 등)를 그대로 쓸지 새로 쓸지도 별도로 질문했다. 답변을 반영해 Plan Mode에서
계획 파일을 작성하고 승인받은 뒤, README.md/CLAUDE.md/PROJECT_BRIEF.md/.gitignore/
.claude/settings.json을 새로 작성했다(Phase 0).

## 3. 저장소 정리 + Phase 1(Remotion POC) 구현

`git fsck`로 dangling 오브젝트를 먼저 전수 확인한 뒤 `git reflog expire` + `git gc --prune=now`로
이전 커밋을 완전히 삭제했다. `docs/DECISIONS.md`, `docs/PORTFOLIO.md`를 신설하고, CLAUDE.md에
Phase마다 이 두 문서를 갱신하는 규칙을 추가했다. Phase 1 범위(Remotion 단독, Next.js 아직 미도입)와
샘플 스토리("책갈피", 5씬)를 스스로 결정해 ADR로 기록한 뒤, Remotion + TypeScript strict 프로젝트를
수동으로 스캐폴딩하고 `typecheck`/`test`/`render`를 실행해 실제 MP4(840프레임, 1080×1920, 1.7MB)
출력까지 확인했다.

## 4. Phase 0 / Phase 1 분리 커밋 + 푸시 권한 버그 수정

"이전 페이즈랑 이번 페이즈를 각각 커밋해달라"는 요청에, README.md/CLAUDE.md를 Phase 0 시점 내용으로
잠시 되돌려 그 상태로 먼저 커밋한 뒤, Phase 1 변경분을 다시 적용해 두 번째 커밋으로 분리했다.
첫 `git push` 시도가 거부되어, 원인을 조사한 결과 `.claude/settings.json`에 `git push`가 `ask`와
`deny` 목록에 동시에 들어있어(내가 옛 설정을 그대로 복사하면서 생긴 실수) `deny`가 우선 적용되어
프롬프트도 없이 항상 차단되고 있었다는 것을 발견해 사용자에게 설명하고 수정한 뒤 푸시에 성공했다.
이 수정 자체도 별도 커밋으로 만들어 푸시했다.

## 5. Phase 2(AI 스토리 생성 Mock 파이프라인) 구현

이미지 Provider 연동을 다시 보류하고 ffprobe를 시스템 설치 대신 npm 정적 바이너리 패키지로
확보하기로 먼저 결정해 ADR로 남긴 뒤, `StoryProvider` 인터페이스와 `MockStoryProvider`(대화 분석 →
컨셉 3안 → 5씬 스토리보드)를 구현했다. 씬마다 `sourceMessageIds`를 추가해 생성된 대사가 원본 대화
메시지에서 왔는지 추적 가능하게 했고, `Root.tsx`를 `calculateMetadata` 기반으로 리팩터해 Phase 1의
고정 샘플과 Phase 2의 AI 생성 결과가 같은 렌더링 코드를 공유하도록 했다. `generate`/`qa` CLI
스크립트와 파이프라인 테스트를 추가하고, 의존성 설치부터 typecheck/test/generate/render/qa까지
전체를 실행해 검증했다(QA는 두 영상 모두 1080×1920·28.05초로 통과). `qa` 명령 중 하나가 60초
제한을 넘겨 백그라운드로 넘어갔을 때는 결과를 추측하지 않고 완료 알림을 기다린 뒤 실제 출력을
확인했다.

## 6. 커밋/푸시

"커밋하고 푸시해줘"라는 두 번의 요청에 각각 응답해, 변경분을 확인 후 커밋 메시지를 작성하고
푸시까지 완료했다(각 커밋의 정확한 범위는 `git log`로 확인 가능).

## 7. Phase 3(컨셉 선택 최소 UI) 우선순위 질문 + Plan Mode 설계 + 구현

"다음 권장 작업" 중 "컨셉 선택 최소 UI 대 이미지 Provider 연동" 우선순위를 사용자에게 질문해
UI를 먼저 만들기로 확정했다. Plan Mode에서 Plan 서브에이전트에게 Next.js 도입 방식(모노레포 분리 vs
공존), 버전, Provider 호출 격리, 라우팅 설계를 맡겨 검증받은 뒤 계획을 확정해 승인받았다. 이후
Next.js 14를 기존 Remotion 패키지에 공존시키고(`tsconfig.web.json` 분리로 충돌 해결),
`server-only`로 격리한 `sampleConversationPipeline.ts`를 통해서만 UI가 파이프라인을 호출하게 만들어
컨셉 3장 → 스토리보드 화면을 구현했다. `server-only`가 Vitest에서 무조건 에러를 던지는 문제를
발견해 alias 스텁으로 우회했고, typecheck(2종)/test/build/curl 라우트 확인/기존 렌더링 파이프라인
회귀 확인까지 전부 통과시켰다.

## 8. Phase 4(승인/재생성 UI) 우선순위 질문 + 설계 중 계획 스스로 수정 + 구현

"이미지 Provider 연동 vs 승인/재생성 UI 확장" 우선순위를 다시 질문했고 후자로 확정됐다. 질문 시점에는
Server Action 도입을 자연스러운 방향으로 제시했지만, 실제 설계 과정에서 승인/재생성 상태 둘 다
URL만으로 충분히 표현 가능하다는 걸 확인하고 Server Action 없이 순수 `<Link>` 기반으로 방향을
스스로 바꿨다(사용자에게 재질문하지 않고, 더 단순한 대안을 택한 뒤 근거를 ADR-010에 남김).
`StoryProvider`에 `regenerateScene`을 추가하되 "대사는 원본 대화 사실이므로 재생성해도 바뀌지
않는다"는 불변식을 설계와 테스트 양쪽에 고정했다. 승인/재생성 상태를 URL 쿼리로 파싱·직렬화하는
순수 함수(`app/lib/storyQueryState.ts`)를 만들고, 실제 dev 서버를 백그라운드로 띄운 뒤 curl로
승인 표시/배경 변경/전체 승인 메시지가 실제로 동작하는 것까지 확인했다.

## 9. Phase 5(이미지 Provider Mock) 우선순위 질문 + 구현

"이미지 Provider 연동 vs 승인 상태 저장소(Supabase) 도입" 우선순위를 질문했고 전자로 확정됐다.
`ImageProvider`/`MockImageProvider`를 `StoryProvider`와 같은 패턴으로 만들어, 씬 id·톤·재생성
횟수·대사를 해시한 시드로 결정론적 절차적 SVG(그라디언트+추상 도형)를 생성해 base64 데이터 URI로
인코딩했다. 실제 유료 이미지 API는 이번에도 연동하지 않고 근거를 ADR-011에 남겼다. Next UI와
Remotion 양쪽이 새로 만든 `sceneBackgroundStyle` 공유 헬퍼로 이 이미지를 렌더링하게 해 로직 중복을
없앴고, 재생성 시 이미지가 실제로 달라지는지 curl로 base64 데이터를 직접 비교해 확인했다. 이미지
있는 스토리보드와 Phase 1의 이미지 없는 고정 샘플 둘 다 Remotion 렌더링+QA를 통과시켜 회귀가
없음을 확인했다.

## 10. Phase 6(실제 이미지 Provider) 우선순위 질문 + 구현

"실제 유료 이미지 API 연동 vs 승인 상태 저장소(Supabase) 도입" 중, 둘 다 사용자의 외부 계정/키가
있어야 끝까지 검증 가능하다는 제약을 먼저 밝히고 질문했다. 사용자가 이미지 API 연동을 선택했다.
OpenAI Images API(`gpt-image-1`)를 벤더로 고르고, `IMAGE_PROVIDER=real`과 `OPENAI_API_KEY`가
둘 다 있어야만 실제 API를 쓰는 이중 opt-in을 설계해 비용이 실수로 발생하지 않게 했다. 실제 API
키가 없어 라이브 호출은 검증하지 못했다는 한계를 코드 주석·ADR·포트폴리오 문서에 반복해서
명시했고, 대신 `fetch`를 의존성 주입 가능하게 설계해 요청 형식과 응답 파싱 로직만이라도
테스트로 검증했다. 기본(Mock) 경로의 typecheck/test/build/렌더링/QA 회귀는 모두 확인했다.

## 11. Supabase 도입 여부 판단(도입하지 않기로 결정) + 커밋/푸시

사용자가 "OPENAI_API_KEY 라이브 검증은 모든 Phase가 끝난 뒤 한 번에 하자"고 정리하면서, 남은 작업
중 "승인 상태 저장소(Supabase) 도입 여부"만 먼저 판단해달라고 요청했다. 코드를 만드는 대신 판단만
내렸다: 지금은 도입하지 않기로 결정했다. 근거는 (1) 이미 URL 쿼리 기반 상태(ADR-010)로 새로고침·
공유는 충분히 대응됨, (2) Supabase도 외부 프로젝트/키가 있어야 검증되는데 이는 OPENAI_API_KEY와
같은 성격의 미검증 의존성이라 "나중에 한 번에 검증" 방침과 어긋남, (3) 캐릭터 채팅/대화 세션
영속화가 실제로 필요해질 때가 훨씬 설득력 있는 DB 도입 시점이라는 점. 이 판단 과정 자체를
ADR-013과 PORTFOLIO.md에 기록했다("만들지 않기로 한 이유"도 포트폴리오 근거가 된다는 판단).

## 12. Phase 7(실제 렌더링 트리거) 우선순위 질문 + 구현 + 웹팩 충돌 해결

"캐릭터 채팅 UI vs 실제 렌더링 트리거" 우선순위를 질문했고 후자로 확정됐다. 승인 완료 시
`/story/[conceptId]/render` Route Handler가 실제로 Remotion을 호출해 MP4를 렌더링하고
다운로드시키도록 구현했다(동기 처리, 서버측 재승인 검증 포함). 구현 중 `@remotion/bundler`를
그대로 쓰면 `next build`가 "Self-reference dependency" 웹팩 에러로 실패하는 걸 발견했다 —
Remotion 번들러 자체가 웹팩을 다시 실행하는 도구라 Next의 웹팩과 중첩되어 깨진 것이었고,
`serverComponentsExternalPackages` 설정으로 해결했다(ADR-014). 이전 여러 Phase에서 백그라운드로
띄웠던 dev 서버 프로세스들이 완전히 안 죽고 남아있어 포트가 3004까지 밀린 것도 발견해 정리했다.
실제 HTTP 요청으로 404/400/200(다운로드+QA) 전부 확인했고, 번들 캐싱을 넣었음에도 두 번째
요청도 비슷하게 오래 걸린다는 걸(병목은 번들링이 아니라 프레임 렌더링) 실측 그대로 정직하게
기록했다.

## 13. Phase 8(캐릭터 채팅 UI) 우선순위 질문 + 구현

"캐릭터 채팅 UI vs 렌더링 비동기화(큐)" 우선순위를 질문하면서, ADR-013(Supabase 보류)과 같은
논리로 큐는 아직 과투자라고 판단해 채팅 UI를 권장했고 사용자가 동의했다. `ChatProvider`/
`MockChatProvider`를 추가해 사용자 입력을 이해하지 않고 고정 대본(`sample-conversation.json`)을
순서대로 재생하는 정직한 Mock 채팅을 구현했고, 이 사실을 화면에 명시했다. 지금까지 URL 쿼리로만
상태를 표현해온 이 프로젝트에서 처음으로 Server Action(`sendChatMessage`)을 도입했다 — 채팅은
진행형 상호작용이라 URL로 표현하기 부적합하다고 판단했기 때문이다. 채팅이 끝나면 기존 컨셉 분석
파이프라인(홈)으로 이어지는 링크를 보여준다. Server Action의 실제 클릭 흐름은 Next.js RSC
프로토콜을 curl로 재현하기 어려워 vitest로 함수 로직만 검증했고, 서버 컴포넌트 렌더링(초기 화면,
프리필 문구, 홈의 진입 링크)은 curl로 실측 확인했다는 점을 한계로 명시했다.

## 14. Phase 9(채팅→분석 연결) 우선순위 질문 + Plan Mode 설계 + 구현

"렌더링 비동기화(큐) vs 채팅 내용을 실제 분석에 반영" 우선순위를 질문해 후자로 확정됐다. Plan
Mode에서 Plan 서브에이전트에게 URL 인코딩 방식(실측 비교: base64url이 percent-encoding보다
38% 짧음), 파일 리네이밍 여부, 에러 처리 설계를 검증받은 뒤 계획을 확정해 승인받았다. 채팅에서
오간 대화 전체를 base64url 토큰으로 인코딩해 DB 없이 URL로만 홈→컨셉→스토리보드→승인→렌더링까지
전파되게 구현했고, `sampleConversationPipeline.ts`를 `conversationPipeline.ts`로 리네이밍했다.
"감정 포인트를 못 찾음"(정상 케이스)과 "내부 불변식 깨짐"(버그)을 `ConversationAnalysisEmptyError`
전용 클래스로 구분해 전자만 친절한 안내 화면으로 감쌌다. `node -e`로 실제 인코딩 스킴과 동일한
토큰을 수동 생성해, 커스텀 대화가 홈부터 실제 Remotion 렌더링(다운로드된 MP4에 QA까지)까지
전부 반영되는 것을 curl로 엔드투엔드 확인했다.

---

<!-- 이후 답변도 이 아래에 이어서 추가합니다 -->
