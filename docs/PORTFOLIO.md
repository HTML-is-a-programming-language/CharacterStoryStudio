# 포트폴리오 노트

이 문서는 Character Story Studio를 "AI-Native하게" 어떻게 만들었는지 — 어떤 도구를 어떻게 썼고,
어떤 문제가 생겼고, 어떤 판단을 왜 내렸는지 — 단계별로 기록합니다. 코드 자체보다 **AI 도구를 활용한
개발 과정 자체**를 보여주는 것이 목적입니다. (지원 포지션: 타인에이아이 AI-Native Developer)

각 Phase가 끝날 때마다 이 문서에 섹션을 추가합니다.

---

## Phase 0 — 컨셉 결합 & 기초 문서화

### 무엇을 했나

1. **결합 방향 리서치**: 러비더비(러비더비 앱스토어/나무위키 등 공개 정보)와 OpenMontage(GitHub 저장소)를 각각 조사해, 두 서비스의 공통 접점(대화形 콘텐츠 ↔ 승인 기반 AI 영상 파이프라인)을 찾음.
2. **AI와의 협업으로 방향 결정**: Claude Code와 함께 "OpenMontage를 코드로 가져다 쓸지 vs. 설계만 참고할지", "러비더비 대화를 어디서 가져올지", "생성 리소스를 유료로 바로 쓸지 무료부터 만들지" 등 핵심 결정 지점을 구조화된 질문으로 정리해 답변 → 방향을 빠르게 확정.
3. **기초 문서 작성**: README.md / CLAUDE.md(작업 규칙) / PROJECT_BRIEF.md(상세 스펙) / .gitignore / .claude/settings.json을 AI-Native 워크플로에 맞게 작성.

### 사용한 AI 도구/기능

| 도구 | 용도 |
|---|---|
| Claude Code (`Explore` 서브에이전트) | 저장소 전체 구조/커밋 히스토리를 백그라운드로 조사시키고, 그 사이 다른 조사(웹 리서치)를 병렬로 진행 |
| `WebFetch` | OpenMontage GitHub 저장소의 README를 요약·구조화해서 분석 |
| `WebSearch` | 러비더비 서비스의 공개 정보(기능, 회사 정보) 수집 |
| `AskUserQuestion` (구조화된 질문) | 여러 갈래로 나뉠 수 있는 설계 결정을, 옵션과 트레이드오프를 정리한 객관식 질문으로 변환해 빠르게 합의 |
| Plan Mode | 실제 파일을 건드리기 전에 "무엇을 왜 만드는지"를 먼저 문서화하고 승인받는 절차를 강제 |

### 겪은 이슈

**저장소 히스토리 사고**: 조사 중 `main` 브랜치가 실제로는 빈 트리를 가진 orphan 커밋(`ec04e72`)이고, 이전에 작성됐던 실제 내용이 담긴 커밋(`8f31097`)은 브랜치 교체 과정에서 도달 불가능(dangling) 상태가 되어 있는 것을 발견했다. `git log`만 봐서는 알 수 없고 `git reflog` / `git fsck --unreachable`로만 드러나는 문제였다.

- **원인 추정**: 이전 세션에서 `new-main`이라는 브랜치를 orphan 커밋으로 새로 만든 뒤 `main`으로 이름을 바꾸면서, 기존 `main`(실제 내용이 있던 브랜치)을 덮어쓴 것으로 보인다.
- **대응**: 삭제/덮어쓰기 전에 먼저 `git fsck`로 dangling 오브젝트를 전수 조사해 "예상한 것 외에 다른 게 섞여있지 않은지" 확인한 뒤, 사용자에게 상황을 설명하고 복구할지/버릴지 선택하게 함. 사용자가 "무시하고 새로 작성"을 선택한 뒤에야 `git reflog expire` + `git gc --prune=now`로 완전히 정리했다.
- **배운 점**: `git status`/`git log`만으로는 저장소가 "정상"인지 판단할 수 없다. 특히 AI 에이전트가 git 작업을 대신할 때는 겉보기 상태와 실제 도달 가능성(reachability)을 구분해서 확인하는 습관이 필요하다는 것을 재확인했다. 삭제성 작업은 반드시 사용자 확인 후 진행했다.

### 왜 이렇게 결정했나

자세한 근거는 [DECISIONS.md](./DECISIONS.md)의 ADR-001~003 참고.

---

## Phase 1 — 고정 JSON → Remotion MP4 렌더링 POC

### 무엇을 했나

1. **레포 히스토리 완전 정리**: Phase 0에서 발견한 dangling 커밋(이전에 쓰다 유실된 CLAUDE.md/PROJECT_BRIEF.md 등)을 사용자 확인 후 `git fsck`로 다른 오브젝트가 섞여있지 않은지 먼저 검증하고, `git reflog expire` + `git gc --prune=now`로 완전히 삭제했다.
2. **원작 샘플 스토리 작성**: 러비더비나 저작권 있는 캐릭터를 쓸 수 없으므로, 5씬짜리 원작 로맨스 벡터 "책갈피"(비 오는 도서관, 사서 하람)를 새로 만들었다. 근거는 [DECISIONS.md](./DECISIONS.md) ADR-005 참고.
3. **Remotion 프로젝트를 수동으로 최소 구성**: Next.js/Supabase 등 이후 Phase에서 필요한 것들을 먼저 끌어오지 않고, `remotion`/`@remotion/cli`/`zod`/`vitest`/`typescript`만으로 TypeScript strict 프로젝트를 직접 구성했다(create-video 같은 스캐폴딩 CLI를 쓰지 않고 package.json/tsconfig부터 직접 작성 — 구조를 온전히 이해하고 통제하기 위함).
4. **데이터/렌더 코드 분리**: `src/schema.ts`(Zod), `src/data/sample-story.json`(고정 데이터), `src/StoryComposition.tsx`(렌더 컴포넌트)를 분리해, 나중에 AI가 생성한 JSON으로 이 JSON을 그대로 교체할 수 있게 설계했다.
5. **검증**: `tsc --noEmit`(strict 통과), Vitest 3종 테스트(스키마 유효성, 총 재생시간이 25~35초 범위인지, 잘못된 색상값 거부), `remotion render`로 실제 `out/story.mp4`(1080×1920, 30fps, 28초, 1.7MB) 렌더링까지 전부 성공을 확인했다.

### 사용한 AI 도구/기능

| 도구 | 용도 |
|---|---|
| Claude Code (직접 코드 작성) | Zod 스키마, Remotion Composition, 애니메이션(spring/interpolate) 코드를 직접 설계·작성 |
| Bash 도구 | `pnpm install`/`typecheck`/`test`/`render`를 순차 실행하며 각 단계 실패 여부를 즉시 확인 |
| TodoWrite | Phase 1의 6개 하위 작업(스캐폴딩→스키마→컴포지션→검증→문서화)을 진행 상황과 함께 추적 |

### 겪은 이슈

- **ffmpeg 미설치**: 렌더링 서버에 시스템 ffmpeg가 없었다. Remotion 4.x는 자체 컴포지터/먹서를 내장해 시스템 ffmpeg 없이도 렌더링이 가능하다는 것을 사전에 확인하고 진행했고, 실제로 문제없이 렌더링됐다.
- **ffprobe로 산출물 정밀 검증 불가**: ffprobe도 없어서 PROJECT_BRIEF.md가 요구하는 수준(정확한 해상도/오디오 트랙 자동 검증)까지는 이번 Phase에서 확인하지 못했다. 파일 시그니처(ISO Media MP4)와 렌더 로그상의 프레임 수(840/840, 30fps 기준 28초)로 간접 확인하는 데 그쳤다. **한계로 남겨두고, ffmpeg가 있는 환경에서 재검증이 필요하다.**
- **esbuild 빌드 스크립트 차단**: `pnpm install` 시 pnpm이 esbuild의 postinstall 스크립트를 보안상 기본 차단했다는 경고가 있었다(`pnpm approve-builds` 필요). 이번 Phase의 테스트/타입체크/렌더링은 모두 정상 동작해 당장 영향은 없었지만, 추후 원인 불명의 빌드 이슈가 생기면 가장 먼저 의심할 지점으로 기록해둔다.

### 왜 이렇게 결정했나

Phase 1 범위를 Remotion 단독으로 좁힌 이유와 샘플 스토리 선정 이유는 [DECISIONS.md](./DECISIONS.md) ADR-004, ADR-005 참고.

---

## Phase 2 — AI 스토리 생성 파이프라인 (Mock Provider)

### 무엇을 했나

1. **Provider 추상화**: `StoryProvider` 인터페이스(`analyzeConversation` → `generateConcepts` → `generateStoryboard`)를 정의하고, 실제 LLM 없이 규칙 기반으로 동작하는 `MockStoryProvider`를 구현했다. 나중에 실제 LLM 기반 Provider로 교체해도 호출부(스크립트/향후 UI)는 바뀌지 않는다.
2. **원본 대화 → 분석 → 컨셉 3안 → 스토리보드**: 하람과의 14턴짜리 샘플 대화(`src/pipeline/data/sample-conversation.json`)를 만들고, 감정적으로 의미 있는 5개 메시지를 키워드 매칭으로 추출 → 서로 다른 톤(잔잔함/설렘/여운)의 컨셉 3개 생성 → 그중 하나를 골라 Phase 1과 동일한 `StoryPlan` 스키마의 5씬 스토리보드로 변환하는 전체 파이프라인을 구현했다.
3. **추적성(traceability) 검증**: 각 씬에 `sourceMessageIds`를 붙여, 생성된 대사가 실제 원본 대화 메시지에서 왔는지 역추적할 수 있게 했다. 테스트에서 이 추적성을 실제로 검증한다.
4. **Root.tsx를 `calculateMetadata`로 리팩터**: Phase 1에서는 `sample-story.json`으로 고정된 재생시간/해상도만 지원했는데, Phase 2에서는 `--props`로 다른 `StoryPlan`(AI가 생성한 것)을 넘겨도 재생시간·fps·해상도가 그 값 기준으로 재계산되도록 바꿨다. 덕분에 Phase 1의 고정 샘플과 Phase 2의 생성 결과가 같은 렌더링 코드를 공유한다.
5. **CLI 스크립트 2종 추가**: `pnpm run generate`(대화 → `src/data/generated-story.json`), `pnpm run render:generated`(그 JSON을 실제 MP4로 렌더링).
6. **QA 자동화**: `@ffprobe-installer/ffprobe`(정적 바이너리 npm 패키지)로 `pnpm run qa <mp4>`를 구현해, Phase 1에서 미뤄뒀던 해상도/재생시간 자동 검증을 시스템 설치 없이 해결했다.

### 실행 결과

```
pnpm run generate         → 분석된 이벤트: 5개 / 컨셉 3개(잔잔한 하루·설레는 고백·여운이 남는 밤) 생성
pnpm run render:generated → out/generated.mp4 (840프레임, 1.7MB)
pnpm run qa out/story.mp4     → ✓ 1080x1920, ✓ 28.05s
pnpm run qa out/generated.mp4 → ✓ 1080x1920, ✓ 28.05s
pnpm run test              → 7 passed (schema 3 + pipeline 4)
pnpm run typecheck          → 통과
```

Phase 1의 고정 스토리와 Phase 2의 AI(Mock) 생성 스토리가 우연히 아니라 설계상(둘 다 5개 이벤트, 28초 타깃) 같은 재생시간이 나왔다 — 같은 렌더링 파이프라인을 공유한다는 걸 보여주는 결과다.

### 사용한 AI 도구/기능

| 도구 | 용도 |
|---|---|
| Claude Code (직접 설계·구현) | Provider 인터페이스, Zod 스키마 확장, Mock 휴리스틱 로직, Remotion `calculateMetadata` 리팩터를 전부 직접 작성 |
| Bash 도구(백그라운드 실행) | `pnpm run qa` 실행이 예상보다 오래 걸려 자동으로 백그라운드로 전환됐고, 완료 알림을 받아 결과를 확인 — 긴 명령을 차단 없이 처리하는 워크플로를 실제로 사용 |
| TodoWrite | Phase 2의 11개 하위 작업을 스캐폴딩→로직→검증→문서화 순서로 추적 |

### 겪은 이슈

- **Mock 휴리스틱의 한계(자기 인지)**: `MockStoryProvider`의 이벤트 추출은 5개 키워드(`비, 설레, 좋아, 예쁘다, 우산`) 포함 여부로만 판단한다. 이건 로맨스 장르·한국어 구어체에 맞춰 고른 목록이라 다른 톤의 대화에는 잘 안 맞을 수 있다. 코드 주석과 이 문서에 한계로 명시해뒀고, 실제 Provider(LLM 기반)로 교체할 때 가장 먼저 손볼 부분으로 남겨둔다.
- **QA 스크립트 실행 지연**: `pnpm run qa`가 60초 타임아웃을 넘겨 백그라운드로 전환됐다(정확한 원인은 tsx 콜드 스타트 + Windows에서의 자식 프로세스 스폰 비용으로 추정, 미확정). 실행 자체는 두 번 다 정상 종료(exit code 0)했고 결과도 정확했다 — 순수 성능 이슈였고 QA 로직의 정확성 문제는 아니었다.

### 왜 이렇게 결정했나

이미지 Provider를 이번 Phase에서 붙이지 않은 이유, ffprobe를 npm 패키지로 확보한 이유는 [DECISIONS.md](./DECISIONS.md) ADR-006, ADR-007 참고.

---

## Phase 3 — 컨셉 선택 최소 UI (Next.js)

### 무엇을 했나

1. **우선순위 결정**: "컨셉 선택 최소 UI" vs "이미지 Provider 연동" 중 무엇을 먼저 할지 사용자에게 확인했다. UI를 먼저 만들기로 하면서 PROJECT_BRIEF.md의 핵심 차별화 포인트인 "Human-in-the-loop 승인 게이트"를 처음으로 화면에 구현하게 됐다.
2. **설계를 Plan 서브에이전트에 위임**: Next.js를 모노레포로 분리할지 기존 패키지에 공존시킬지, 어떤 버전을 쓸지, Provider 호출을 어떻게 UI와 격리할지, 라우팅/상태를 어떻게 설계할지를 Plan 에이전트에게 맡겨 검증받았다. 결과를 검토한 뒤 Plan Mode로 계획을 확정하고 승인받았다.
3. **Next.js 14(App Router)를 기존 패키지에 공존**: 모노레포 전환 없이 `tsconfig.web.json`(Next 전용, 기존 tsconfig.json은 extends만 함)과 `next.config.mjs`의 `typescript.tsconfigPath`로 Next의 tsconfig 자동 덮어쓰기 문제만 해결했다. 근거는 ADR-008.
4. **Provider 호출 격리**: `src/pipeline/sampleConversationPipeline.ts`에 `import "server-only";`를 두어, `app/**`의 어떤 컴포넌트도 `MockStoryProvider`를 직접 호출할 수 없게 강제했다.
5. **화면 2개, 클라이언트 상태 0개**: `/`(컨셉 3장) → `/story/[conceptId]`(5씬 스토리보드). 전환은 일반 `<Link>`(GET)만 쓰고, 상태는 전부 URL에 있다 — Server Component만으로 충분해 `"use client"`가 한 곳도 필요 없었다.
6. **테스트 우선 순서**: UI를 만들기 전에 `sampleConversationPipeline.ts`와 그 테스트부터 작성해 로직을 vitest로 먼저 검증한 뒤 화면을 붙였다.

### 실행 결과

```
pnpm run typecheck   → tsc(기존) + tsc(tsconfig.web.json) 둘 다 통과
pnpm run test         → 10 passed (schema 3 + pipeline 4 + sampleConversationPipeline 3)
pnpm exec next build  → 성공, "/"는 정적 프리렌더, "/story/[conceptId]"는 동적 렌더로 자동 분류됨
curl GET /                          → 200, 컨셉 3장(잔잔한 하루/설레는 고백/여운이 남는 밤) 확인
curl GET /story/concept-romantic    → 200, 5개 씬 대사(우산/예쁘다/설레는데요 등) 확인
curl GET /story/does-not-exist      → 404 (notFound() 정상 동작)
pnpm run generate/render:generated/qa → 회귀 없음 확인 (1080x1920, 28.05s 유지)
```

### 사용한 AI 도구/기능

| 도구 | 용도 |
|---|---|
| Plan Mode + Plan 서브에이전트 | Next.js 도입이라는 구조적 결정을 코드를 만들기 전에 먼저 설계·검증. 특히 "Next.js가 tsconfig.json을 자동 덮어쓴다"는, 직접 실행해보지 않으면 놓치기 쉬운 충돌 지점을 Plan 에이전트가 사전에 짚어줬다 |
| AskUserQuestion | "UI 먼저 vs 이미지 Provider 먼저"라는 제품 우선순위 결정을 사용자에게 위임 |
| Bash 백그라운드 실행 | `next dev` 서버를 백그라운드로 띄운 뒤 `curl`로 라우트를 검증하고, 렌더링/QA 회귀 확인도 백그라운드로 돌려 대기 시간을 문서 작업과 병행 |

### 겪은 이슈

- **`server-only` 패키지가 Vitest에서 무조건 에러를 던짐**: `server-only`는 런타임 체크가 아니라 Next.js 번들러가 클라이언트 번들에서만 에러가 나도록 특수 처리하는 패키지라, Vitest(순수 Node)에서 그냥 import하면 항상 예외가 발생했다. `vitest.config.ts`에 `server-only`를 빈 스텁(`tests/stubs/server-only.ts`)으로 alias 처리해 해결했다 — Next.js 커뮤니티에서 흔히 쓰는 우회법이다. 처음엔 "테스트가 왜 이 파일에서만 깨지지?"에서 시작해 원인을 추적한 케이스였다.
- **브라우저 자동화 도구 부재**: 이 환경엔 Playwright 등이 없어 실제 브라우저 렌더링(레이아웃/CSS 적용 여부)은 확인하지 못했다. `curl`로 서버 렌더링 HTML과 라우팅 상태 코드만 검증했다. 근거와 한계는 ADR-009에 남겼다.

### 왜 이렇게 결정했나

Next.js 공존 방식과 Playwright 미도입 근거는 [DECISIONS.md](./DECISIONS.md) ADR-008, ADR-009 참고.

---

<!-- Phase 4 이후 섹션은 아래에 이어서 추가됩니다 -->
