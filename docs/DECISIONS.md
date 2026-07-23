# 의사결정 기록 (ADR)

이 프로젝트에서 내린 주요 기술/제품 결정과 그 근거를 시간 순으로 기록합니다.
포트폴리오 심사자가 "왜 이렇게 만들었는가"를 코드가 아니라 문서로 확인할 수 있게 하는 것이 목적입니다.

각 항목은 `상태 / 배경 / 결정 / 결과` 순서로 적습니다.

---

## ADR-001. 러비더비 × OpenMontage 결합 방식

- **상태**: 확정
- **배경**: 타인에이아이의 AI 캐릭터 채팅 서비스 "러비더비"와, 오픈소스 에이전트 기반 영상 제작 시스템 "OpenMontage"(GitHub, AGPLv3, Python 중심 + Remotion 렌더러)를 결합한 포트폴리오 프로젝트를 만들기로 함. 두 서비스를 코드 수준에서 어떻게 엮을지 결정 필요.
- **결정**: OpenMontage 코드는 직접 의존성으로 쓰지 않는다. 대신 그 파이프라인 구조(단계별 승인 게이트, 상태 머신, QA 검증)만 참고해 TypeScript로 자체 구현한다. 러비더비는 공개 API가 없으므로 실제 연동 대신, 독자적 캐릭터/세계관을 가진 자체 데모 채팅 UI로 대화를 생성한다.
- **결과**:
  - AGPLv3 라이선스 이슈를 원천 차단.
  - 채용공고가 요구하는 스택(TypeScript/React/Firebase 계열)과 일치.
  - "러비더비 클론"이라는 오해를 피할 수 있음.
  - 대신 OpenMontage가 제공하는 실제 AI 생성 도구(52개 Provider 등)는 그대로 못 쓰므로, Provider 연동을 처음부터 직접 설계해야 함.

## ADR-002. 생성 리소스 정책: 무료/로컬 우선

- **상태**: 확정
- **배경**: 이미지/영상/음성 생성 AI API는 대부분 유료이고 키 발급이 필요함. 포트폴리오 특성상 채용 담당자가 별도 설정 없이 결과물을 확인할 수 있어야 함.
- **결정**: Mock Provider + 정적 이미지 + Remotion 애니메이션으로 동작하는 무료 경로(Demo Mode)를 먼저 구축한다. 유료 Provider는 이후 옵션으로 추가한다.
- **결과**: 초기 개발 속도가 빨라지고 비용 리스크가 없음. 다만 실제 생성형 AI 이미지/영상의 품질을 보여주려면 이후 별도로 유료 Provider 연동이 필요함.

## ADR-003. 이전 저장소 상태 정리 (dangling 커밋 삭제)

- **상태**: 확정
- **배경**: 저장소 조사 중 `main` 브랜치가 이전 작업 내용이 담긴 커밋(`8f31097`, 5개 파일: CLAUDE.md/PROJECT_BRIEF.md/README.md/.gitignore/.claude/settings.json 포함)을 대체하는 orphan 커밋(`ec04e72`, 빈 트리)으로 교체된 상태였음이 발견됨. 원인은 이번 세션 이전에 일어난 일이며, 정확한 경위는 git 로그만으로는 알 수 없음(아마 브랜치 재구성 과정에서의 실수로 추정). 다행히 이전 커밋은 dangling 상태로 reflog에 남아 있어 복구 가능했음.
- **결정**: 복구된 이전 문서 내용은 이번 대화에서 새로 합의한 방향과 상당 부분 겹쳤지만, 사용자가 "완전히 무시하고 새로 작성"을 선택함에 따라 참고하지 않고 CLAUDE.md/PROJECT_BRIEF.md/README.md/.gitignore/.claude/settings.json을 전부 새로 작성함. 이후 사용자 요청으로 dangling 커밋(`8f31097`, `0fe1fb6`)과 그 하위 오브젝트를 `git reflog expire --expire=now --all` + `git gc --prune=now`로 완전히 삭제함.
- **결과**: 현재 git 히스토리는 `ec04e72 프로젝트 초기화` 단일 커밋만 남은 깨끗한 상태. 이전 문서는 복구 불가능하게 삭제되었으므로 참고가 필요하면 이번 대화 로그가 유일한 출처.

---

## ADR-004. Phase 1 범위: Remotion 단독 프로젝트로 시작 (Next.js 아직 도입 안 함)

- **상태**: 확정
- **배경**: PROJECT_BRIEF.md의 Phase 1은 "고정 JSON → Remotion MP4 렌더링 POC"다. 전체 로드맵에는 Next.js/Supabase/BullMQ가 포함되어 있지만, 이 단계에서 필요한 것은 렌더링 파이프라인의 실현 가능성 검증뿐이다.
- **결정**: 이번 Phase에서는 Next.js, Supabase, 큐 시스템을 도입하지 않는다. 저장소 루트에 Remotion 전용 패키지만 최소 구성으로 만든다 — TypeScript strict, pnpm, Zod로 검증되는 고정 JSON 입력, `remotion render`로 MP4 산출까지만. UI/채팅/백엔드는 이후 Phase에서 필요해질 때 추가한다.
- **결과**: 불필요한 조기 추상화(모노레포, DB 스키마 등)를 피하고 렌더링 코어부터 빠르게 검증할 수 있다. 다만 이후 Next.js 앱이 추가되면 Remotion 패키지를 별도 워크스페이스로 재배치하는 리팩터링이 한 번 필요할 수 있다.

## ADR-005. Phase 1 샘플 스토리 결정

- **상태**: 확정
- **배경**: 렌더링 POC를 검증하려면 구체적인 샘플 데이터가 필요하다. 실제 러비더비 콘텐츠를 사용할 수 없고(공개 API 없음, 클론 방지), 저작권 있는 캐릭터도 쓸 수 없으므로 완전히 새로운 원작 캐릭터/서사가 필요하다.
- **결정**: 원작 5씬 스토리 "책갈피"를 만들어 사용한다 — 비 오는 날 도서관을 배경으로, 사서 캐릭터 "하람"과의 짧은 로맨스 벡터. 배경은 사진/이미지 대신 그라디언트 색상 패널 + 타이포그래피 애니메이션으로 표현한다(무료/로컬 우선 정책, ADR-002).
- **결과**: 이미지 생성 API 없이도 "모션코믹"의 형태(장면 전환, 대사 캡션, 감정 곡선)를 보여줄 수 있다. 실제 캐릭터 일러스트는 이후 이미지 생성 Provider 연동 Phase에서 교체한다.

---

## ADR-006. Phase 2에서도 이미지 생성 Provider는 아직 연동하지 않는다

- **상태**: 확정
- **배경**: Phase 2 착수 시점에 "이미지 생성 Provider 연동 여부와 시점"을 결정해야 했다. 대화 분석→컨셉→스토리보드로 이어지는 텍스트 파이프라인과, 실제 이미지 생성 Provider 연동은 서로 독립적으로 검증 가능한 별개 문제다.
- **결정**: Phase 2는 텍스트/구조 파이프라인(분석·컨셉·스토리보드 생성 로직과 그 검증)에만 집중한다. 씬 배경은 Phase 1과 동일하게 그라디언트+타이포그래피로 표현한다. 실제 이미지 생성 Provider(Mock→실 API) 연동은 별도 Phase로 미룬다.
- **결과**: 한 Phase에 여러 관심사가 섞이지 않아 검증(테스트/리뷰)이 쉬워진다. 다만 아직 "실제 캐릭터 일러스트가 들어간 결과물"은 보여주지 못하므로, 포트폴리오에서 이 점을 한계로 명시한다.

## ADR-007. QA 자동화: 시스템 ffmpeg 대신 npm 정적 바이너리 패키지 사용

- **상태**: 확정
- **배경**: Phase 1 보고 시점에 개발 환경에 시스템 ffmpeg/ffprobe가 없어 렌더링 결과물의 정밀 QA(해상도/재생시간 등 자동 검증)를 하지 못했다. 시스템 레벨 설치(winget 등)는 관리자 권한/대화형 설치가 필요해 자동화 스크립트에 부적합하고, 개발 환경마다 설치 여부가 달라지는 문제가 있다.
- **결정**: `@ffprobe-installer/ffprobe` npm 패키지(플랫폼별 정적 ffprobe 바이너리를 devDependency로 설치)를 사용해 `pnpm install`만으로 QA 스크립트가 항상 동작하게 한다.
- **결과**: 시스템 환경에 의존하지 않고 CI에서도 동일하게 동작하는 QA 스크립트(`pnpm run qa`)를 만들 수 있다. 다만 실제 ffmpeg CLI와 100% 동일한 빌드는 아니므로, 추후 실제 배포 환경에서 한 번은 시스템 ffmpeg로도 교차 검증하는 것이 안전하다.

---

## ADR-008. Phase 3: Next.js를 모노레포 분리 없이 기존 패키지에 공존시킨다

- **상태**: 확정
- **배경**: ADR-004는 "Next.js는 필요해질 때까지 도입하지 않는다"고 결정하며 "이후 Next.js 앱이 추가되면 Remotion 패키지를 별도 워크스페이스로 재배치하는 리팩터링이 한 번 필요할 수 있다"고 예고했다. Phase 3에서 컨셉 선택 UI가 실제로 필요해져 Next.js 도입 시점이 왔다.
- **결정**: 모노레포(pnpm workspace) 분리는 하지 않고, 기존 단일 `package.json`에 Next.js 14(App Router, React 18.3.1 유지)를 추가했다. 실질적 충돌은 Next.js가 `tsconfig.json`을 자동으로 덮어쓰는 동작뿐이었는데, `tsconfig.web.json`(기존 tsconfig를 extends)을 분리하고 `next.config.mjs`의 `typescript.tsconfigPath`로 지정해 해결했다. `pnpm run typecheck`는 두 tsconfig를 모두 검사하도록 확장했다. Provider 호출은 `src/pipeline/sampleConversationPipeline.ts`(`server-only`)로만 격리해, `app/**`의 어떤 컴포넌트도 `MockStoryProvider`를 직접 import하지 않는다.
- **결과**: `next build`/`pnpm run render`/`pnpm run generate`/`pnpm run qa`가 같은 저장소 안에서 서로 간섭 없이 전부 정상 동작함을 확인했다(둘 다 typecheck 통과, 둘 다 각자의 산출물 생성 성공). 모노레포 전환은 다음 조건 중 하나가 생기면 재검토한다: (1) Next.js 전용 무거운 의존성(Supabase, BullMQ 등)이 늘어나 패키지가 비대해질 때, (2) tsconfig 분리로도 해결 안 되는 실제 충돌이 발생할 때.

## ADR-009. Phase 3: Playwright E2E는 도입하지 않는다

- **상태**: 확정
- **배경**: PROJECT_BRIEF.md 기술 스택에는 Playwright(E2E)가 포함되어 있었지만, 현재 개발/실행 환경에는 브라우저 자동화 도구가 설치되어 있지 않다.
- **결정**: 이번 Phase의 UI 검증은 `pnpm run typecheck`(2종), `pnpm run test`(vitest), `pnpm exec next build`, 그리고 `next dev` 기동 후 `curl`로 세 라우트(`/`, 유효한 `/story/[id]`, 존재하지 않는 `/story/[id]`→404) 응답을 확인하는 것으로 대체한다. Playwright 도입은 실제 브라우저 자동화가 가능한 환경이 확보되거나, 상호작용이 복잡해져(폼 제출, 클라이언트 상태 등) curl만으로는 부족해질 때 재검토한다.
- **결과**: 서버 렌더링 결과(HTML)와 라우팅 동작은 검증했지만, 실제 브라우저에서의 시각적 렌더링(레이아웃 깨짐, CSS 적용 여부 등)은 확인하지 못했다는 한계가 남는다. 포트폴리오 문서에 이 한계를 명시한다.

---

## ADR-010. Phase 4: 승인/재생성 상태도 Server Action 없이 URL로만 표현한다

- **상태**: 확정
- **배경**: 스토리보드 화면에 씬별 "승인"/"재생성" 기능을 추가하기로 했다. 질문 단계에서는 Server Action 도입을 자연스러운 방향으로 제시했었다. 그런데 실제로 설계해보니, 승인은 "선택된 씬 id 집합"일 뿐이고 재생성은 "그 씬을 몇 번째 연출 변형으로 볼지"일 뿐이라 둘 다 순수하게 URL에서 계산 가능한 정보였다(DB에 아무것도 저장하지 않으므로 "진짜 mutation"이 아니다).
- **결정**: Server Action을 도입하지 않는다. `app/lib/storyQueryState.ts`에 순수 함수(파싱/직렬화/토글/증가)만 두고, "승인"/"연출 재생성" 버튼은 전부 `<Link>`(다음 URL로의 GET 이동)로 구현한다. `getStoryboardForConcept`가 URL에서 파싱된 `sceneVariants`를 받아 해당 씬만 `MockStoryProvider.regenerateScene`으로 다시 연출한다. 재생성은 대사/화자/출처(`sourceMessageIds`)는 절대 바꾸지 않고 배경 팔레트만 바꾼다 — 원본 대화 추적성을 깨지 않기 위한 설계 불변식이며, 테스트로 고정해뒀다.
- **결과**: Phase 3의 "클라이언트 상태 0개, 전부 URL" 원칙을 그대로 유지하면서 승인/재생성이라는 상호작용을 추가했다. 새로고침·링크 공유해도 같은 화면이 재현된다. 다만 이건 "진짜 저장"이 아니라 "그 순간의 URL이 곧 상태"이므로, 실제 DB에 승인 이력을 남기는 것은 Supabase 도입 시점(추후 Phase)으로 남아있다.

---

## ADR-011. Phase 5: 이미지 Provider도 Mock으로만 구현(실제 유료 API는 이번에도 보류)

- **상태**: 확정
- **배경**: "이미지 Provider 연동 vs 승인 상태 저장소(Supabase) 도입" 중 이미지 Provider를 선택했다. 이미지 생성 API(FAL, OpenAI 등)는 대부분 유료이고 키가 필요해, ADR-002(무료/로컬 우선)를 계속 지키려면 실제 API 연동 여부를 다시 판단해야 했다.
- **결정**: `ImageProvider` 인터페이스를 신설하고 `MockImageProvider`만 구현한다. 실제 이미지 생성 API 호출은 이번에도 하지 않는다. Mock은 씬 id·톤·재생성 횟수·대사를 시드로 한 **결정론적 절차적 SVG**(그라디언트 + 추상 도형)를 로컬에서 만들어 `data:image/svg+xml;base64,...`로 인코딩한다. 네트워크 호출이 전혀 없고, 같은 입력이면 항상 같은 이미지가 나오며, 재생성(variant 증가)하면 실제로 다른 이미지가 나온다.
- **결과**: API 키 없이도 "이미지가 있는 모션코믹"을 보여줄 수 있게 됐다. `Scene.imageDataUri`는 optional로 추가해 Phase 1의 손으로 쓴 고정 샘플(`sample-story.json`)에는 영향이 없고(이미지 없이 그라디언트로 폴백), 파이프라인이 생성하는 스토리보드만 이미지를 갖는다. 다만 실제 캐릭터 일러스트는 아니고 추상적인 무드 아트라는 한계가 있다 — 진짜 이미지 생성 Provider 연동은 여전히 남아있는 다음 Phase다.

---

## ADR-012. Phase 6: 실제 이미지 Provider 연동(OpenAI, 이중 opt-in, Mock 폴백)

- **상태**: 확정
- **배경**: "실제 유료 이미지 API 연동 vs Supabase 도입" 중 이미지 API 연동을 선택했다. 어떤 벤더를 쓸지, 그리고 CLAUDE.md의 "비용이 발생하는 실제 Provider 호출은 사용자 승인 없이 자동 실행하지 않는다"를 코드로 어떻게 강제할지 결정이 필요했다.
- **결정**:
  - **벤더**: OpenAI Images API(`gpt-image-1`)를 선택했다. FAL/Replicate류는 보통 비동기 잡 제출 → 폴링 방식이라 이번 범위에 비해 복잡하고, OpenAI는 단일 REST 호출로 끝난다.
  - **이중 opt-in**: `IMAGE_PROVIDER=real` **그리고** `OPENAI_API_KEY`가 둘 다 있어야 실제 Provider를 쓴다. 키만 있고 `IMAGE_PROVIDER`를 지정하지 않으면(기본값 `mock`) 여전히 Mock을 쓴다 — 환경에 키가 어쩌다 있다는 이유만으로 비용이 발생하지 않게 하기 위한 장치다. `IMAGE_PROVIDER=real`인데 키가 없으면 에러를 던지지 않고 콘솔 경고 후 Mock으로 안전하게 폴백한다(Demo Mode가 항상 동작해야 한다는 ADR-002 원칙 유지).
  - **테스트 방식**: 실제 API 키가 없어 라이브 호출은 검증하지 못한다. `OpenAiImageProvider`는 `fetch` 구현체를 주입받게 설계해, 테스트에서는 가짜 fetch로 요청 형식(URL/헤더/바디)과 응답 파싱(b64_json/url 두 형태), 에러 처리(비정상 응답 시 명확한 에러)만 검증한다.
- **결과**: 코드/설계는 준비됐지만 **실제 라이브 API 호출은 이번 세션에서 한 번도 검증되지 않았다** — 사용자가 실제 `OPENAI_API_KEY`를 넣고 `IMAGE_PROVIDER=real`로 실행해봐야 진짜 검증이 끝난다. 이 한계를 보고서와 포트폴리오 문서에 명시한다.

---

## ADR-013. 승인 상태 저장소(Supabase)는 지금 도입하지 않는다

- **상태**: 확정
- **배경**: "승인 상태 저장소(Supabase) 도입 여부"를 판단해야 했다. 현재 승인/재생성 상태는 Phase 4(ADR-010)에서 URL 쿼리로만 표현되고 있고, DB가 없어 새 URL(공유 없이 새로고침만 하는 경우는 유지되지만, 완전히 새 링크로 접속하면)로는 초기화된다.
- **결정**: 지금은 Supabase(또는 다른 DB)를 도입하지 않는다. 이유는 세 가지다.
  1. **실제 통증이 아직 크지 않다**: URL이 곧 상태이므로 새로고침에도 유지되고, 링크를 공유하면 같은 화면이 재현된다. "완전히 새 세션에서도 승인 이력이 남아있어야 한다"는 요구가 아직 없다.
  2. **외부 자격증명 문제가 OPENAI_API_KEY와 동일하게 반복된다**: Supabase를 실제로 쓰려면 사용자의 프로젝트 URL/키가 있어야 하고, 그게 없으면 이번에도 "코드는 만들었지만 라이브 검증은 못 함" 상태가 된다. 사용자가 이미 이미지 API 키 검증은 모든 Phase가 끝난 뒤 한 번에 하겠다고 했으므로, 같은 성격의 또 다른 미검증 외부 의존성을 지금 늘리는 것보다는 미루는 쪽이 일관적이다.
  3. **더 강한 도입 이유가 로드맵에 이미 있다**: PROJECT_BRIEF.md의 이후 로드맵(캐릭터 채팅, 대화 세션)이 실제로 들어오면 그때는 "승인 여부" 정도가 아니라 대화 이력 자체를 영속시켜야 하므로 DB 도입 명분이 훨씬 분명해진다. 지금 승인 플래그 몇 개를 저장하려고 Supabase 프로젝트/스키마/클라이언트/보안 정책(RLS)을 붙이는 건 과한 선투자다.
- **결과**: URL 기반 상태(ADR-010)를 계속 유지한다. **재검토 조건**: 캐릭터 채팅/대화 세션 영속화가 실제로 다음 작업으로 확정되는 시점, 또는 "새 세션에서도 승인 이력이 보여야 한다"는 요구가 명시적으로 생기는 시점.

---

## ADR-014. 실제 렌더링 트리거: 동기 Route Handler + 서버측 재검증, Remotion 패키지는 webpack external 처리

- **상태**: 확정
- **배경**: "남은 기능적 다음 단계" 중 실제 렌더링 트리거를 선택했다. 모든 씬이 승인되면 화면에 안내 문구만 뜨던 것을, 실제로 Remotion 렌더링을 실행해 MP4를 내려받게 만들어야 했다.
- **결정**:
  1. **동기 처리**: 큐/워커 없이 Next.js Route Handler(`app/story/[conceptId]/render/route.ts`)가 요청을 받아 그 자리에서 렌더링하고 완료되면 파일을 응답으로 스트리밍한다. 로컬 1인 데모 범위이므로 비동기 작업 큐(BullMQ 등, PROJECT_BRIEF가 언급했던)는 여전히 도입하지 않는다 — 도입 시점은 실제 다중 사용자/오래 걸리는 작업이 생길 때로 미룬다.
  2. **서버측 재검증**: "모든 씬 승인" 여부를 클라이언트가 아니라 Route Handler 안에서 다시 확인한다. URL을 직접 조작해 미승인 상태로 렌더링을 시도하면 400을 반환한다.
  3. **CLI 재사용 대신 프로그래매틱 API 사용**: `remotion render` CLI를 자식 프로세스로 spawn하는 대신 `@remotion/bundler`/`@remotion/renderer`의 JS API(`bundle`/`selectComposition`/`renderMedia`)를 직접 호출한다. Windows에서 `pnpm`/`.cmd` 래퍼를 자식 프로세스로 spawn하는 것보다 크로스플랫폼으로 더 안전하다고 판단했다.
  4. **Next 웹팩과의 충돌 해결**: `@remotion/bundler`는 그 자체로 웹팩을 다시 실행하는 도구라, Next의 웹팩이 이걸 또 번들링하려 하면 깨진다("Self-reference dependency" 에러로 실제로 빌드 실패를 겪었다). `next.config.mjs`의 `experimental.serverComponentsExternalPackages`에 `@remotion/bundler`/`@remotion/renderer`를 등록해 Next가 이 패키지들을 번들링하지 않고 런타임에 `require`만 하도록 해결했다.
  5. **번들 캐시**: 프로세스 생명주기 동안 Remotion 번들을 한 번만 만들어 재사용한다(요청마다 재번들링 방지). 다만 실측해보니 번들링은 전체 렌더링 시간의 병목이 아니었다(아래 결과 참고) — 그래도 불필요한 재작업을 막는다는 점에서 남겨둔다.
- **결과**: 실제 HTTP 요청으로 렌더링→다운로드→QA까지 전부 성공을 확인했다(1080×1920, 28.05초, 1.7MB). 다만 요청 1건에 42~50초가 걸린다 — 로컬 데모로는 괜찮지만, 실제 서비스라면 요청이 오래 걸리는 동안 서버가 막힌다는 한계가 있다(비동기 큐가 필요해지는 시점의 신호로 기록해둔다).

---

## ADR-015. 캐릭터 채팅은 완전한 Mock(고정 스크립트 재생)으로 구현한다

- **상태**: 확정
- **배경**: "캐릭터 채팅 UI vs 렌더링 비동기화" 중 채팅 UI를 선택했다. 실제 LLM 없이 어떻게 "대화"를 만들지 결정해야 했다.
- **결정**: `MockChatProvider`는 사용자가 실제로 입력한 텍스트 내용을 이해하지 않는다. `sample-conversation.json`에 이미 있는 고정 대사를 순서대로 재생할 뿐이다 — 지금까지 온 사용자 메시지 개수로 다음 캐릭터 대사의 인덱스를 정한다. 입력창엔 원본 대사가 기본값으로 채워져 있어 그대로 보내거나 수정해서 보낼 수 있지만, 무엇을 보내든 캐릭터의 답장은 항상 같은 스크립트를 따른다. 화면에 "정해진 흐름을 따라가는 데모"라는 걸 명시한다.
- **결과**: 사용자가 원본 대사를 그대로 보내는 한(기본 경로), 채팅에서 만들어지는 대화가 기존에 분석해온 `sample-conversation.json`과 동일해서, 채팅이 끝나면 이미 만들어둔 분석/컨셉/스토리보드 파이프라인(홈 화면)으로 자연스럽게 이어진다. 다만 사용자가 뭐라고 입력해도 캐릭터의 반응 자체는 달라지지 않는다는 한계가 있다 — 실제 LLM Provider로 교체하기 전까지는 "진짜 이해하는 대화"가 아니다.

## ADR-016. 채팅 상태는 클라이언트 state로만 관리, 이번에 처음 Server Action을 도입한다

- **상태**: 확정
- **배경**: Phase 3~4에서 승인/재생성 상태는 전부 URL 쿼리로 표현했고(ADR-010), Server Action은 "진짜 mutation이 생기면 그때 도입"하기로 미뤄뒀다. 채팅은 메시지가 계속 늘어나는 진행형 상호작용이라 URL에 전체 이력을 담기엔(길이·페이지 이동 UX) 적합하지 않다.
- **결정**: 채팅 메시지 목록은 클라이언트 컴포넌트(`app/chat/ChatClient.tsx`, `"use client"`)의 React state에만 있다 — 새로고침하면 사라진다(DB 없음, ADR-013과 같은 기조). 사용자가 보내기를 누르면 Server Action(`app/chat/actions.ts`)이 `MockChatProvider`를 호출해 다음 캐릭터 대사를 반환한다. 이게 이 프로젝트의 첫 Server Action이다.
- **결과**: 새 상태 관리 패턴(클라이언트 state + Server Action)이 하나 추가됐지만 DB/세션은 여전히 없다. 대화가 끝나면 홈(`/`)의 기존 분석 파이프라인으로 연결되는 링크를 보여주는데, 그 분석은 여전히 고정된 `sample-conversation.json`을 대상으로 한다 — 채팅에서 사용자가 실제로 고친 문구가 분석에 반영되지는 않는다. 이건 의도적으로 이번 범위 밖에 뒀다(다음 확장 지점으로 남김).

---

## ADR-017. 채팅 대화를 URL 토큰으로 분석 파이프라인까지 전파한다

- **상태**: 확정
- **배경**: Phase 8까지는 `/chat`에서 무엇을 하든 홈은 항상 고정 `sample-conversation.json`을 분석했다. "채팅 내용을 실제 분석에 반영"을 위해, DB 없이(ADR-013 유지) 대화 전체를 상태로 표현할 방법이 필요했다. Plan 서브에이전트가 실측(14턴 샘플 대화 기준)으로 인코딩 방식을 검증했다.
- **결정**:
  1. **인코딩**: `Buffer.from(json,"utf-8").toString("base64url")`. 실측 결과 원본 JSON 1,539자 → `encodeURIComponent` 4,127자 → base64url 2,575자로, 한글이 많은 콘텐츠에서 base64url이 38% 더 짧다. 방어적으로 토큰 길이 6,000자 상한을 두고, 초과 시 조용히 무쿼리(고정 샘플 폴백)로 떨어진다(`app/lib/conversationQueryState.ts`).
  2. **인코딩 위치**: 별도 Server Action을 추가하지 않고, 이미 있는 `sendChatMessage`의 반환값에 `conversationHref`를 추가했다 — 대화가 끝나는 턴에 이미 서버 왕복이 있으므로 왕복을 늘리지 않는다.
  3. **전파**: `StoryQueryState`에 `conversation` 필드를 추가해 승인/재생성/렌더링 링크 전부에 자동으로 같이 실려가게 했다. `ConceptCard`도 `SceneCard`와 같은 "부모가 href를 완성해서 내려준다" 패턴으로 통일했다.
  4. **파이프라인 리네이밍**: `sampleConversationPipeline.ts` → `conversationPipeline.ts`. 더 이상 "샘플 전용"이 아니라 "대화가 있으면 그걸, 없으면 샘플로 폴백"이 본질이라 이름을 실제 동작에 맞췄다.
  5. **에러 구분**: `analyzeConversation`이 던지던 일반 `Error`를 `ConversationAnalysisEmptyError`라는 전용 클래스로 바꿨다. 홈/스토리 페이지는 이 클래스만 잡아 "감정 포인트를 못 찾았다"는 안내(+ `/chat`으로 돌아가는 링크)를 보여주고, 그 외 에러(예: 내부 불변식 깨짐)는 숨기지 않고 그대로 던진다.
- **결과**: 채팅에서 실제로 오간(또는 사용자가 수정한) 대화가 분석→컨셉→스토리보드→승인→렌더링까지 전부 그대로 이어지는 걸 커스텀 대화 토큰으로 실제 렌더링까지 성공시켜 확인했다(1080×1920, 28.05초). 다만 사용자가 채팅에서 과도하게 텍스트를 늘리면 토큰이 상한을 넘어 조용히 고정 샘플로 돌아간다는 한계가 있고, 실제 브라우저의 URL 길이 한계까지는(로컬 curl로만) 검증하지 못했다.

---

## ADR-018. 음성/BGM도 Mock으로만 구현(절차적 WAV 합성), Remotion data URI 오디오 사전 검증

- **상태**: 확정
- **배경**: "음성/BGM Provider 추가 vs 렌더링 비동기화(큐)" 중 음성/BGM을 선택했다. 지금까지 렌더링되는 영상엔 오디오 트랙이 전혀 없었다(대사가 화면 텍스트로만 보임). 실제 TTS/작곡 API는 이번에도 쓰지 않기로 하고(Mock-first 정책, ADR-002/006/011/012와 같은 기조), 어떻게 "그럴듯한 무음이 아닌 실제 오디오"를 만들지, 그리고 Remotion이 data URI 오디오를 실제로 렌더링에 반영할 수 있는지부터 확인해야 했다.
- **결정**:
  1. **사전 기술 검증(spike)**: 본 기능을 만들기 전에, 임시 Composition에 `<Audio src="data:audio/wav;base64,...">`를 넣어 실제로 렌더링해보고 `ffprobe`로 결과 MP4에 오디오 스트림(AAC, 48kHz)이 생기는지 먼저 확인했다. 확인 후 스파이크 코드는 삭제했다.
  2. **직접 WAV 인코딩**: 외부 오디오 라이브러리 없이 `src/pipeline/wavEncoder.ts`(모노 16bit PCM WAV 인코더 + 사인파 합성 + 믹싱)를 직접 구현했다.
  3. **Mock 설계**: `MockAudioProvider`가 나레이션은 대사 텍스트를 시드로 한 사람 목소리대(150~220Hz) 사인파에 트레몰로(3~5Hz 진폭 변조)를 입혀 "말하는 리듬" 느낌만 흉내내고, 배경음악은 컨셉 톤(calm/romantic/bittersweet)마다 다른 화음(완전5도/장3도/단3도) 두 음을 지속한다. 둘 다 진짜 음성 합성이나 작곡이 아니라는 걸 코드 주석에 명시했다.
  4. **재생성과의 연동**: "연출 재생성"을 누르면 배경/이미지뿐 아니라 나레이션도 함께(같은 대사, 다른 시드로) 다시 생성해 "다른 톤의 연기"처럼 보이게 했다. 대사 텍스트 자체는 여전히 불변이다.
  5. **공용 유틸 정리**: `MockImageProvider`에 있던 `hashSeed`/`seededRandom`을 `src/pipeline/utils.ts`로 옮겨 `MockAudioProvider`와 공유했다(중복 제거).
- **결과**: 렌더링된 영상에 실제 씬별 나레이션 + 배경음악이 섞여 나온다. 실제 렌더링(`pnpm run render:generated`)과 `ffprobe`로 오디오 스트림 존재를 확인했다. 다만 실제 사람 목소리가 아니라 사인파 톤이라는 한계가 있고, 실제 TTS/음악 생성 Provider 연동은 여전히 다음 Phase다.

---

## ADR-019. 실제 TTS는 OpenAI로 연동, 배경음악은 Mock만 유지(비동기 작곡 API 제외)

- **상태**: 확정
- **배경**: "실제 TTS/음악 API 연동 vs 렌더링 비동기화(큐)" 중 전자를 선택했다. 다만 나레이션(TTS)과 배경음악(작곡)은 API 성격이 크게 다르다 — TTS는 OpenAI처럼 단일 REST 호출로 끝나는 벤더가 있는 반면, 음악 생성(Suno 등)은 대부분 비동기 잡 제출→폴링 방식이라 이번 범위(동기 처리 원칙, ADR-014)에 맞지 않는다.
- **결정**:
  1. 기존 `AudioProvider`(나레이션+음악 통합 인터페이스)를 `TtsProvider`/`MusicProvider`로 분리했다. 관심사가 다른 두 기능을 억지로 한 인터페이스에 묶어두지 않기 위함이다.
  2. **TTS만 실제 연동**: `OpenAiTtsProvider`(OpenAI `tts-1`)를 추가하고, `getTtsProvider()`가 `TTS_PROVIDER=real` + `OPENAI_API_KEY`(이미지 Provider와 같은 키 재사용) 이중 opt-in으로 실제 Provider를 켠다. 하나라도 없으면 항상 `MockTtsProvider`(ADR-018의 절차적 톤 합성).
  3. **음악은 Mock만 유지**: 실제 작곡 API는 이번에 연동하지 않는다. `MusicProvider`는 `MockMusicProvider` 구현체 하나만 존재한다.
  4. **알려진 한계를 명시**: OpenAI TTS는 대사의 자연스러운 발화 속도로 음성을 만들 뿐 씬 `durationInFrames`에 맞춰 길이를 조절해주지 않는다 — Mock은 반대로 길이를 정확히 맞추지만 실제 목소리가 아니다. Remotion `<Audio>`는 씬 길이보다 긴 오디오는 그 지점에서 잘리고, 짧으면 남는 시간은 무음으로 재생되어 크래시 없이 우아하게 대응한다. 완벽한 립싱크 싱크는 이번 범위에 포함하지 않는다.
- **결과**: `TtsProvider`/`MusicProvider` 분리로 향후 실제 음악 API(예: 비동기 잡 지원 인프라가 생겼을 때)를 추가하기 쉬운 구조가 됐다. 실제 API 키가 없어 `OpenAiTtsProvider`의 라이브 호출은 검증하지 못했고, fetch 의존성 주입으로 요청/응답 로직만 테스트했다(Phase 6, ADR-012와 같은 방식).

---

## ADR-020. 렌더링 비동기화: Redis/BullMQ 없이 인메모리 잡 저장소 + 폴링

- **상태**: 확정
- **배경**: ADR-013/014에서 "실제 다중 사용자 부하가 생기기 전까지는 큐 도입이 과투자"라고 판단해 미뤄왔다. 이번에 재검토하면서 새로운 이유가 하나 생겼다 — 이 프로젝트를 Vercel 같은 서버리스 환경에 배포할 경우, 렌더링 요청이 40~50초씩 걸리는 게 서버리스 함수 실행 시간 제한(보통 10~60초)에 실제로 걸릴 수 있다는 점이다. 다만 여전히 동시 사용자가 많은 서비스가 아니므로, Redis+BullMQ급 인프라가 꼭 필요한지는 다시 판단이 필요했다.
- **결정**: Redis를 도입하지 않고, `src/rendering/renderJobStore.ts`에 순수 인메모리 `Map` 기반 잡 저장소를 만들었다. `POST /story/:id/render`가 렌더링을 시작만 하고(await하지 않음) 즉시 202 + jobId를 반환하고, 클라이언트(`RenderPanel`)가 `GET .../render/status?jobId=`를 2초 간격으로 폴링하다가 완료되면 `GET .../render/download?jobId=`로 1회성 다운로드한다.
- **실전에서 발견한 버그와 수정**: 처음엔 모듈 스코프의 평범한 `const jobs = new Map()`으로 만들었는데, 실제로 붙여서 검증해보니 `POST` 직후 `GET .../status`가 항상 "존재하지 않는 작업"을 반환했다. 원인은 Next.js가 Route Handler 파일(`render/route.ts`, `render/status/route.ts`)마다 별도로 컴파일해서, 같은 소스 파일을 import해도 서로 다른 모듈 인스턴스(= 서로 다른 `Map`)를 갖게 되는 것이었다. `globalThis`에 Map을 붙이는 방식(Prisma 클라이언트 싱글턴에 흔히 쓰는 패턴)으로 바꿔 해결했다. 이 버그는 자동 테스트로는 못 잡고 실제 dev 서버 + curl로 시작→폴링→다운로드 전체 흐름을 실행해봐야만 드러났다.
- **결과**: 렌더링 시작 요청이 0.1초 안에 응답하는 것을 실측 확인했다(기존엔 40~50초 동안 요청이 막혀 있었음). 실제 시작→폴링(18회, 약 54초)→다운로드→QA까지 전체 흐름을 curl로 검증했고, 1회성 다운로드(재요청 시 409)와 에러 분기(400/404/409)도 확인했다. 한계는 여전히 남아있다: 서버 재시작 시 진행 중이던 작업은 전부 사라지고, 여러 서버 인스턴스로 수평 확장하면 인스턴스별로 저장소가 따로 논다 — 실제 다중 인스턴스 서비스로 키우려면 그때 Redis 같은 공유 저장소가 필요해진다.

---

## ADR-021. 렌더링 결과에 이미지/오디오가 안 나오던 버그 — 진짜 원인은 CLI props 형태 불일치

- **상태**: 확정
- **배경**: 사용자가 `out/generated.mp4`(`pnpm run generate` + `pnpm run render:generated`로 만든 결과물)를 직접 재생해보니 텍스트만 나오고 이미지도 오디오도 안 나온다고 제보했다. 처음엔 두 가지를 의심했다 — (1) `src/StoryComposition.tsx`가 씬 배경을 순수 CSS `background-image`(`sceneStyle.ts`)로 그리는데, Remotion의 헤드리스 프레임 캡처는 자신의 `<Img>` 컴포넌트가 등록하는 `delayRender`/`continueRender`만 기다리고 CSS 배경 이미지 디코딩은 기다리지 않는다는 점, (2) `OpenAiTtsProvider.ts`가 `data:audio/mp3;base64,...`로 오디오를 만드는데 `audio/mp3`가 등록된 MIME이 아니라는 점(표준은 `audio/mpeg`). 둘 다 고치고 다시 렌더링했는데도 여전히 이미지가 안 보여서 더 깊이 파봤다.
- **진짜 원인**: `src/Root.tsx`의 `<Composition>`은 `defaultProps={{ story: defaultStory }}`처럼 `story` 키로 감싼 모양을 기대하고, `calculateMetadata`도 `props.story`를 읽는다. `src/rendering/renderStoryboard.ts`(웹 앱의 실제 렌더링 경로)는 `inputProps: { story }`로 정확히 이 모양을 맞춰 호출하지만, `scripts/generate-story.ts`는 `writeFileSync(outPath, JSON.stringify(storyboard, ...))`로 **StoryPlan을 감싸지 않고 그대로** 저장했다. `package.json`의 `render:generated`는 이 파일을 `--props=src/data/generated-story.json`로 그대로 넘기는데, 감싸지 않은 최상위 필드(`title/fps/scenes/musicDataUri`)는 `story`가 아닌 별도 키로 들어가버려서 `calculateMetadata`가 읽는 `props.story`는 계속 `defaultProps`의 `story`(= Phase 1 고정 샘플, `sample-story.json`)로 남아 있었다. 즉 `pnpm run generate`로 진짜 데이터를 만들어도 `render:generated`는 그 데이터를 한 번도 읽은 적이 없었고, 항상 이미지·오디오가 아예 없는 고정 샘플을 렌더링해온 것이다. `remotion still`로 직접 확인했다 — 씬 객체에 디버그 라벨을 임시로 붙여보니 `imageDataUri`/`audioDataUri`/`sourceMessageIds`/`imageAlt`(모두 고정 샘플에는 없는 필드) 네 개가 통째로 빠져 있었고, props를 `{ story: ... }`로 감싸자 즉시 정상적으로 나타났다.
- **mp3 MIME 가설은 틀렸다**: props를 올바르게 감싼 뒤 mp3(`audio/mp3`) 오디오만 따로 다시 테스트해보니 **정상적으로 재생됐다** — `silencedetect`로 무음 구간이 전혀 없었다. 처음의 "오디오 전체가 무음" 증상은 mp3 MIME 문제가 아니라 전적으로 위 props 불일치 때문이었다(고정 샘플엔 오디오가 아예 없으니 당연히 무음). 이미 WAV로 바꾼 코드는 되돌리지 않았다 — 틀린 MIME(`audio/mp3`)을 안 쓰는 게 여전히 더 표준적이고, 이 파이프라인에서 실측 검증된 유일한 포맷(ADR-018)과 통일해두는 편이 안전하기 때문이다. 다만 `OpenAiTtsProvider.ts` 주석에 "이 변경은 실제로는 불필요했던 것으로 확인됨"을 명시했다 — 검증 없이 통과했다고 보고하지 않는다는 원칙(CLAUDE.md)에 따라 정확한 경위를 남긴다.
- **`<Img>` 전환은 독립적으로 유효한 수정이다**: props 문제와는 별개로, `src/StoryComposition.tsx`의 `SceneView`를 Remotion의 `<Img>` 컴포넌트로 바꾼 것은 여전히 필요한 수정이다 — 웹 앱의 실제 렌더링 경로(`renderStoryboardToFile`)는 props를 처음부터 올바르게 감싸 넘기고 있었으므로, 실제 서비스에서 큰 실물 이미지(~3-4MB PNG)를 렌더링할 때 CSS `background-image`의 비동기 디코딩을 기다리지 않는 문제는 실재했을 것이다. `sceneStyle.ts`(Next.js `SceneCard`가 쓰는 일반 브라우저 DOM 경로)는 그대로 뒀다.
- **결정**:
  1. `scripts/generate-story.ts`가 `{ story: storyboard }`로 감싸서 저장하도록 고쳤다 — `renderStoryboardToFile`가 쓰는 모양과 통일.
  2. `src/StoryComposition.tsx`의 `SceneView`가 `imageDataUri`가 있으면 CSS 배경 대신 Remotion `<Img>`를 쓰도록 바꿨다(디코딩을 실제로 기다리게 함). 없으면 기존 CSS 그라디언트 폴백 유지.
  3. `OpenAiTtsProvider.ts`는 `response_format: "wav"`로 유지(불필요했음을 주석에 명시).
- **결과**: `.env.local`을 임시로 다시 켜고(사용자가 이전에 채워둔 키 재사용) `pnpm run generate` → `pnpm run render:generated`로 실제 API 데이터를 다시 만들고 렌더링해서, Remotion 번들 ffmpeg로 프레임을 추출해 실제 일러스트가 보이는 것을 눈으로 확인했고, `silencedetect`로 오디오 트랙 전체(28초)에 무음 구간이 없는 것을 확인했다. 검증 후 `.env.local`의 real 스위치는 다시 꺼두고 Mock으로 재생성/재렌더링해 데모 상태로 되돌렸다.
- **교훈**: vitest/typecheck/build는 모두 통과했지만 실제 렌더링 결과물의 시각적/청각적 정합성은 검증하지 못했다 — Phase 12(ADR-020)의 `globalThis` 버그와 같은 계열이다. 또한 첫 가설(mp3 MIME)이 그럴듯해 보여도 실측으로 재확인하지 않았다면 잘못된 원인을 문서에 남길 뻔했다 — 변수를 하나씩 통제해서 재현하는 것의 가치를 다시 확인했다.

---

## ADR-022. QA를 렌더링 파이프라인에 자동 통합

- **상태**: 확정
- **배경**: `scripts/qa-check.ts`(`pnpm run qa <mp4>`)는 해상도/재생시간을 검증하는 CLI 스크립트였지만 실제 렌더링 흐름과 분리되어 있어, 사용자가 렌더링 완료 후 이 명령을 별도로 기억해서 실행해야만 결과를 볼 수 있었다. PROJECT_BRIEF.md가 정의한 핵심 흐름("렌더링 → QA → 결과 확인")과도 어긋났다. 렌더링 작업이 완료되면 QA가 자동으로 돌고, 그 결과가 `RenderPanel` 화면에 함께 보이도록 파이프라인에 통합했다.
- **핵심 제약**: 공유 모듈(`src/rendering/qaCheck.ts`)에 `"server-only"`를 붙일 수 없다. `scripts/qa-check.ts`는 plain `tsx`로 실행되는데, `"server-only"` 패키지는 Next.js 번들러의 `"react-server"` 조건부 export가 있을 때만 안전한 no-op으로 resolve되고 그 외 환경(plain tsx, vitest 등)에서는 무조건 throw한다(`vitest.config.ts`가 이 패키지를 스텁으로 alias해둔 것과 같은 이유). 클라이언트 번들에서 이 모듈에 닿을 경로가 없으므로(Route Handler와 CLI 스크립트에서만 import) 붙이지 않아도 안전하다는 걸 리팩터링 후 `pnpm run qa`를 그대로 실행해 실측 확인했다.
- **결정**:
  1. `scripts/qa-check.ts`의 ffprobe 로직을 `src/rendering/qaCheck.ts`(`runQaCheck`)로 옮기고, CLI 스크립트는 이걸 호출하도록 리팩터링했다. `probeImpl`을 기본 인자로 주입 가능하게 해서(`OpenAiTtsProvider`의 `fetchImpl` 패턴과 같은 취지) 테스트가 실제 ffprobe 바이너리 없이도 검증할 수 있게 했다.
  2. `app/story/[conceptId]/render/route.ts`의 `runRenderJob`에서 렌더링 성공 후, `markJobCompleted` 전에 QA를 실행한다. **QA 실행 자체가 실패해도(ffprobe 문제 등) 렌더링 작업을 실패로 표시하지 않는다** — 렌더링은 이미 성공했고 결과물은 여전히 다운로드 가능해야 하기 때문이다. 별도 try/catch로 감싸고 `qaResult`를 `undefined`로 둔 채 `console.warn`만 남긴다.
  3. `RenderJob`/`markJobCompleted`/`/render/status` 응답에 `qaResult`를 실어 `RenderPanel.tsx`가 다운로드 링크 아래에 체크 목록을 보여준다. 실패한 체크는 경고 색상(빨강 아님)으로 — QA는 다운로드를 막지 않는 정보성 표시임을 시각적으로도 드러낸다.
  4. `@ffprobe-installer/ffprobe`를 `devDependencies`에서 `dependencies`로 옮겼다 — 이제 배포된 서버(렌더 라우트)에서도 실행되는 런타임 의존성이기 때문이다.
- **겪은 이슈**: `next build`가 `@ffprobe-installer/ffprobe`의 `index.js`(동적 require로 자신의 `tsconfig.json`/`.d.ts`까지 끌어들이는 Node 전용 패키지)를 웹팩이 번들링하려다 `tsconfig.json`을 JS로 파싱해서 실패했다 — Phase 7에서 `@remotion/bundler`에 겪었던 것과 같은 "Node 전용 패키지를 웹팩이 억지로 번들링하려는" 문제였다. `next.config.mjs`의 `experimental.serverComponentsExternalPackages`에 `@ffprobe-installer/ffprobe`를 추가해 같은 방식으로 해결했다.
- **결과**: `pnpm run typecheck`/`pnpm run test`(89개 통과)/`pnpm exec next build` 모두 통과. `pnpm run qa out/story.mp4`로 CLI 스크립트가 리팩터링 후에도 기존과 동일하게 동작하는 것을 확인했다. dev 서버 + curl로 렌더링 시작→폴링→완료 응답에 `qaResult`가 정상적으로 실리는 것(`{"passed":true,"checks":[...]}`)과 다운로드가 QA 결과와 무관하게 계속 되는 것(1회성 다운로드 409 포함)을 실제로 확인했다.
- **추가(같은 작업 단위) — "오디오 스트림 존재" 체크만으로는 부족했다**: 다음 권장 작업으로 "QA 체크 항목 확장"을 진행하면서 "오디오 스트림 존재" 체크를 추가했는데, `out/story.mp4`(오디오 데이터가 아예 없는 Phase 1 고정 샘플)로 실측해보니 이 체크가 **통과**해버렸다. Remotion의 `renderMedia`가 `<Audio>` 요소가 하나도 없어도 무음 오디오 스트림을 컨테이너에 채워 넣기 때문이었다 — `ffmpeg`로 직접 까보니 스트림은 있지만 28초 전체가 완전 무음이었고, 이건 정확히 ADR-021에서 겪은 버그의 증상과 같았다. 즉 "스트림 존재" 체크는 애초에 잡으려던 버그(무음 렌더링)를 실제로는 못 잡는 반쪽짜리였다 — 이 사실을 확인 즉시 사용자에게 알리고, 실제 무음 감지로 확장할지/한계를 명시한 채 유지할지/체크를 뺄지 다시 선택받았다. 사용자가 실제 무음 감지 확장을 선택해서, `@ffmpeg-installer/ffmpeg`를 새 런타임 의존성으로 추가하고 `silencedetect` 필터로 실제 무음 구간 길이를 재는 "오디오 무음 아님" 체크를 추가했다(전체 재생시간의 대부분(0.5초 오차 허용)이 무음이면 실패). Remotion이 내부적으로 쓰는 ffmpeg 바이너리(`--disable-filters` 빌드, `silencedetect`는 지원하지만 `volumedetect`는 미지원 — ADR-021 진단 때 확인)는 공개 API로 노출된 경로가 아니라 의존하지 않고, `@ffprobe-installer/ffprobe`와 같은 패턴으로 별도 패키지를 썼다. `@ffmpeg-installer/ffmpeg`도 `@ffprobe-installer/ffprobe`와 같은 웹팩 번들링 문제가 예상되어 `next.config.mjs`에 미리 추가해뒀고, 실제로 `next build`가 처음부터 통과했다. `out/story.mp4`(무음 28.05s/28.05s → 실패, exit 1)와 `out/generated.mp4`(무음 0.00s → 통과)로 실측 검증했고, dev 서버 + curl로 렌더링 파이프라인에서도 4개 체크가 모두 정상적으로 흐르는 것을 확인했다.
- **교훈**: "그럴듯해 보이는 체크"도 반드시 알려진 실패 케이스(이번엔 `story.mp4`)로 실측해봐야 한다 — 이번에도 검증 없이 넘어갔다면 실제로는 아무것도 못 잡는 체크를 "버그 방지 장치"라고 잘못 보고할 뻔했다. ADR-021의 mp3 MIME 가설 때와 같은 종류의 교훈이 이 프로젝트에서 벌써 두 번째로 반복됐다.
- **추가(같은 작업 단위) — 비디오 프레임 검사는 시도 후 되돌렸다**: 다음 권장 작업으로 이미지가 실제로 나오는지(완전 단색이 아닌지) 검사하는 체크를 추가해봤다. ffmpeg로 프레임 몇 장을 뽑아 인접 픽셀 색 차이("거칠기")를 재는 방식으로 구현하고, `out/story.mp4`(이미지 없음, 거칠기 4.61)와 `out/generated.mp4`(실제 API 이미지, 거칠기 19.67)로 임계값(8)을 잡았다. 그런데 웹 앱의 실제 렌더링 경로(Mock 모드, 기본값)로 다시 검증해보니 Mock 렌더링(거칠기 4.93)이 이 체크에 실패했다 — `MockImageProvider`가 의도적으로 가우시안 블러(stdDeviation 14)를 강하게 준 저투명도 원 + 그라디언트로 "부드러운 무드 아트"를 그리도록 설계되어 있어서, "이미지 없음"과 거칠기가 통계적으로 거의 구분되지 않았다(4.61 대 4.93, 차이 0.32). 이 프로젝트의 기본/무료 경로(Mock)에서 QA가 거짓 실패를 내는 건 받아들일 수 없어서, 이 사실을 확인 즉시 사용자에게 알리고 체크를 되돌렸다(커밋 전이라 되돌린 뒤 남은 변경 없음). 오디오 무음 체크와 달리, 이번엔 신뢰할 만한 지표를 찾지 못한 채 종료한 사례로 남긴다 — 나중에 다시 시도한다면 Mock의 부드러운 아트 스타일까지 고려한 다른 지표(예: 색상 다양성, 특정 색 영역 대비 등)가 필요하다.

---

## ADR-023. Playwright E2E 테스트 도입

- **상태**: 확정
- **배경**: PROJECT_BRIEF.md가 테스트 스택으로 Playwright(E2E)를 명시했지만 실제로 도입한 적이 없었다. 그 결과 여러 ADR(ADR-009, ADR-016 등)에 "Server Action의 실제 클릭→화면 전환은 vitest/curl로 검증하지 못했다"는 한계가 반복적으로 남았다. 채팅 → 분석 → 컨셉 선택 → 씬 승인 → 렌더링 → 다운로드로 이어지는, 이 프로젝트의 핵심 사용자 흐름 전체를 실제 브라우저로 한 번은 검증해보기로 했다.
- **결정**:
  1. `@playwright/test`를 devDependency로 추가하고, `e2e/`(vitest의 `tests/`와 분리) 아래에 스펙을 둔다. `vitest.config.ts`의 `test.exclude`에 `e2e/**`를 추가해 vitest 기본 include 패턴(`**/*.spec.ts`)이 Playwright 스펙을 집어가지 않게 막았다 — `configDefaults.exclude`를 펼쳐서 확장하는 방식으로, 원래의 `node_modules` 등 기본 제외 목록을 실수로 지우지 않게 했다.
  2. `playwright.config.ts`의 `webServer`가 `pnpm run dev`를 자동으로 띄우고 대기한다(`reuseExistingServer`로 이미 떠 있으면 재사용). `renderJobStore`가 프로세스 전역 인메모리 싱글턴(ADR-020)이라 여러 테스트가 동시에 렌더링을 시작하면 서로 다른 잡을 헷갈릴 수 있어 `fullyParallel: false`, `workers: 1`로 항상 순차 실행한다.
  3. 스펙 하나(`e2e/story-flow.spec.ts`)에 전체 흐름을 담았다: `/chat`에서 대본 끝까지 "보내기" 반복 → 컨셉 카드 클릭 → 모든 씬 "승인" 클릭 → "영상 렌더링 시작" → 다운로드 링크 등장까지 기다림. API 키나 비용 없이 Mock으로 끝까지 돈다.
  4. `pnpm run test:e2e` 스크립트를 추가하고, `tsconfig.json`의 `include`에 `e2e`를 더해 `pnpm run typecheck`가 이 스펙도 같이 검사하게 했다.
- **겪은 이슈(실제로 세 번 고쳐가며 통과시켰다)**:
  1. **"승인" 링크가 부분 문자열로 매칭됐다**: `getByRole("link", { name: "승인" })`는 기본적으로 부분 문자열 매칭이라, 이미 승인된 씬의 "✓ 승인됨 (취소)" 링크도 "승인"을 포함하고 있어 계속 매칭됐다 — 클릭해도 남은 개수가 절대 줄지 않는 무한 루프에 빠졌다. `exact: true`로 고쳤다.
  2. **`count()`가 Next.js `<Link>`의 클라이언트 사이드 전환을 기다려주지 않았다**: 클릭 직후 바로 `count()`를 부르면 전환 전 DOM을 읽어버릴 수 있어, `expect(locator).toHaveCount(n)`(자동 재시도가 있는 assertion)으로 바꿔 실제로 개수가 줄어드는 것을 확인하고서야 다음 씬으로 넘어가게 했다.
  3. **테스트 전체 타임아웃이 렌더링 대기 시간보다 빠듯했다**: 채팅 왕복 + 페이지 전환까지 합치면 기본 90초 타임아웃 안에서 렌더링(Mock 기준 20~50초) 대기가 끝까지 버티지 못하고 잘렸다. `playwright.config.ts`의 전체 타임아웃을 150초로, 다운로드 링크 대기를 120초로 늘렸다.
- **결과**: `pnpm run test:e2e`로 전체 흐름(채팅 → 컨셉 → 승인 5회 → 렌더링 시작 → 다운로드 링크 등장)이 실제 Chromium에서 약 2분 안에 통과하는 것을 확인했다. `pnpm run typecheck`/`pnpm run test`(91개, e2e와 충돌 없음)/`pnpm exec next build`도 모두 통과했다.
- **한계**: 스펙이 하나뿐이라 넓은 커버리지는 아니다(핵심 흐름의 "골든 패스"만 검증). "연출 재생성", 손상된 대화 토큰 폴백, 렌더링 실패 분기 등은 여전히 vitest 단위 테스트로만 검증된다. CI가 없는 로컬 저장소라 이 테스트는 사람이 필요할 때 수동으로 돌리는 용도다.

---

<!-- 이후 Phase에서 결정한 사항은 이 아래에 계속 추가합니다 -->
