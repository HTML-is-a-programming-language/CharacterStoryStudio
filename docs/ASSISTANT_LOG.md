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

---

<!-- 이후 답변도 이 아래에 이어서 추가합니다 -->
