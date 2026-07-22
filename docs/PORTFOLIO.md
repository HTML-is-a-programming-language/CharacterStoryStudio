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

## Phase 4 — 스토리보드 승인/재생성 UI

### 무엇을 했나

1. **우선순위 재질문**: "이미지 Provider 연동 vs 승인/재생성 UI 확장" 중 사용자가 후자를 선택했다.
2. **재생성의 정직한 정의**: Mock Provider는 LLM이 아니라서 "대사를 다시 쓰는" 재생성은 불가능하다. 그래서 재생성을 "대사(원본 대화 사실)는 그대로 두고 연출(배경 팔레트)만 바꾸는 것"으로 명확히 좁혔다. `StoryProvider` 인터페이스에 `regenerateScene`을 추가하고, 이 불변식(대사 불변)을 테스트로 고정했다.
3. **설계 중 계획 수정**: 사용자에게 질문할 때는 "Server Action 도입"을 자연스러운 방향으로 제시했었는데, 막상 설계해보니 승인/재생성 상태 둘 다 DB 저장 없이 URL만으로 충분히 표현 가능했다. Phase 3에서 세운 "클라이언트 상태·DB 없이 URL이 곧 상태" 원칙을 지키는 게 더 일관성 있다고 판단해 Server Action 없이 순수 `<Link>` 기반으로 방향을 바꿨다(ADR-010). 사용자에게 다시 묻지 않고 기술적으로 더 단순한 대안을 스스로 선택하고 근거를 남겼다.
4. **팔레트 확장**: 각 톤(calm/romantic/bittersweet)의 배경 그라디언트를 2개→3개로 늘려서 재생성 버튼을 눌렀을 때 실제로 눈에 띄게 달라지도록 했다.
5. **테스트**: `storyQueryState`(파싱/직렬화/토글/증가, URL 라운드트립) 6종, `regenerateScene`(불변식 검증) 2종, 파이프라인 레벨 variants 적용 1종을 추가했다.

### 실행 결과

```
pnpm run typecheck → 통과 (2 tsconfig)
pnpm run test        → 19 passed (schema 3 + pipeline 6 + sampleConversationPipeline 4 + storyQueryState 6)
pnpm exec next build → 성공
curl 승인 흐름 확인:
  GET /story/concept-romantic?approved=scene-1                → "✓ 승인됨" 텍스트 확인
  GET /story/concept-romantic?variant=scene-1:1                → scene-1 배경만 #2a1a3d/#5b3a66 → #3a1f3d/#7a4a63로 변경, 대사 동일
  GET /story/concept-romantic?approved=scene-1,...,scene-5     → "모든 씬이 승인되었습니다" 안내 노출
pnpm run generate (CLI 경로) → 회귀 없음 확인
```

### 사용한 AI 도구/기능

| 도구 | 용도 |
|---|---|
| AskUserQuestion | "승인/재생성 UI 확장 vs 이미지 Provider" 우선순위를 사용자에게 위임 |
| Bash(dev 서버 백그라운드 + curl) | 실제 승인/재생성 상호작용을 브라우저 없이 HTTP 레벨에서 재현해 검증 |

### 겪은 이슈

- 없음 — Phase 3에서 이미 겪은 문제(server-only/vitest 충돌)를 재사용 가능한 alias로 미리 막아뒀기 때문에, 이번 Phase는 순조롭게 진행됐다.

### 왜 이렇게 결정했나

Server Action을 쓰지 않기로 한 이유, 재생성이 대사를 바꾸지 않는 이유는 [DECISIONS.md](./DECISIONS.md) ADR-010 참고.

---

## Phase 5 — 이미지 Provider(Mock) 연동

### 무엇을 했나

1. **우선순위 재질문**: "이미지 Provider 연동 vs 승인 상태 저장소(Supabase) 도입" 중 이미지 Provider를 선택했다.
2. **`ImageProvider` 추상화 신설**: `StoryProvider`와 같은 패턴으로 `src/pipeline/ImageProvider.ts`(인터페이스)와 `src/pipeline/MockImageProvider.ts`(구현체)를 만들었다.
3. **결정론적 절차적 이미지**: 실제 이미지 생성 API 없이, 씬 id·톤·재생성 횟수·대사를 해시해 시드로 쓰고 그 시드로 그라디언트 배경 + 3개의 반투명 도형을 가진 SVG를 만든 뒤 `data:image/svg+xml;base64,...`로 인코딩했다. 네트워크 호출 없이 완전히 로컬/무료로 동작하고, 같은 입력이면 같은 이미지, variant가 다르면 다른 이미지가 나오는 결정론성을 테스트로 고정했다.
4. **한 곳에서 만들어 두 곳에서 재사용**: `MockStoryProvider.generateStoryboard`/`regenerateScene`이 이미지 생성까지 함께 수행해 `Scene.imageDataUri`를 채운다. Next UI(`SceneCard`)와 Remotion(`StoryComposition`)이 새로 만든 `src/sceneStyle.ts`(`sceneBackgroundStyle`) 공유 헬퍼로 렌더링해, 두 렌더링 표면이 로직 중복 없이 같은 방식으로 이미지를 그린다.
5. **가독성 보강**: 이미지 위에 대사 텍스트가 있으니 양쪽 다 하단에서 위로 어두워지는 그라디언트 스크림(scrim)을 추가했다.
6. **기존 고정 샘플은 그대로 둠**: Phase 1의 손으로 쓴 `sample-story.json`은 `imageDataUri`가 없어 계속 그라디언트로 폴백 렌더링된다 — 굳이 손댈 이유가 없었다.

### 실행 결과

```
pnpm run typecheck → 통과 (2 tsconfig)
pnpm run test        → 24 passed (mockImageProvider 3 + sceneStyle 2 포함, 전 스위트 통과)
pnpm exec next build → 성공
curl로 실측: /story/concept-romantic 응답에 background-image:url(data:image/svg+xml;base64,...) 존재 확인,
             ?variant=scene-1:1 요청 시 scene-1의 base64 데이터가 실제로 달라짐(재생성 확인)
pnpm run render:generated → out/generated.mp4 (이미지 포함, 1080x1920, 28.05s) QA 통과
pnpm run render            → out/story.mp4 (이미지 없음, 그라디언트 폴백) QA 통과 — 회귀 없음
```

### 사용한 AI 도구/기능

| 도구 | 용도 |
|---|---|
| AskUserQuestion | "이미지 Provider vs 저장소 도입" 우선순위를 사용자에게 위임 |
| Bash(dev 서버 백그라운드 + curl) | base64 데이터 URI가 실제로 재생성 전후에 달라지는지 문자열 비교로 실측 |
| Bash 백그라운드 실행 | 이미지 있는/없는 두 스토리보드의 렌더링+QA를 한 번에 백그라운드로 돌려 회귀를 확인하면서 동시에 문서 작업 진행 |

### 겪은 이슈

- 없음 — Provider 추상화 패턴(Phase 2)과 URL 상태 패턴(Phase 3/4)을 그대로 재사용할 수 있어서 새로운 인프라 문제가 생기지 않았다.

### 왜 이렇게 결정했나

실제 유료 이미지 API 대신 Mock만 구현한 이유는 [DECISIONS.md](./DECISIONS.md) ADR-011 참고.

---

## Phase 6 — 실제 이미지 Provider(OpenAI) 연동

### 무엇을 했나

1. **우선순위 재질문**: "실제 유료 이미지 API 연동 vs 승인 상태 저장소(Supabase) 도입" 중 이미지 API 연동을 선택했다. 둘 다 사용자의 외부 계정/키가 있어야 끝까지 검증 가능하다는 걸 미리 밝히고 진행했다.
2. **벤더 선택**: OpenAI Images API(`gpt-image-1`)를 골랐다. FAL/Replicate류의 비동기 잡 제출→폴링 방식보다 단일 REST 호출로 끝나는 쪽이 이번 범위에 더 맞았다.
3. **이중 opt-in 설계**: `IMAGE_PROVIDER=real` **그리고** `OPENAI_API_KEY`가 둘 다 있어야 실제 API를 쓴다(`src/pipeline/getImageProvider.ts`). 키만 있고 모드를 지정 안 하면 여전히 Mock. 모드는 real인데 키가 없으면 에러 대신 경고 후 Mock 폴백 — Demo Mode가 절대 깨지지 않게 했다.
4. **의존성 주입으로 테스트 가능하게 설계**: `OpenAiImageProvider`가 `fetch` 구현체를 생성자로 주입받게 만들어, 실제 네트워크 없이도 요청 형식과 응답 파싱(성공/실패/빈 응답)을 vitest로 검증할 수 있게 했다.
5. **정직한 한계 표시**: 실제 API 키가 없어 라이브 호출은 단 한 번도 검증하지 못했다. 코드 주석, ADR, 이 문서 모두에 이 사실을 반복해서 명시했다 — "테스트가 통과했다"와 "실제로 동작을 확인했다"를 구분하는 게 중요하다고 판단했다.

### 실행 결과

```
pnpm run typecheck → 통과 (2 tsconfig)
pnpm run test        → 33 passed (openAiImageProvider 5 + getImageProvider 4 포함)
pnpm exec next build → 성공 (기본 Mock 경로, 환경변수 없음)
pnpm run generate/render:generated/qa → 회귀 없음 확인 (기본 Mock 경로)
```

라이브 API 호출 자체는 검증하지 못했다 — `OPENAI_API_KEY`를 가진 환경에서 `IMAGE_PROVIDER=real pnpm run generate`를 실행해봐야 진짜 검증이 끝난다.

### 사용한 AI 도구/기능

| 도구 | 용도 |
|---|---|
| AskUserQuestion | "이미지 API 연동 vs 저장소 도입" 우선순위를, 둘 다 외부 자격증명이 필요하다는 제약을 먼저 밝히고 위임 |
| Bash 백그라운드 실행 | 렌더링+QA 회귀 확인을 백그라운드로 돌리며 동시에 문서 작업 진행 |

### 겪은 이슈

- **검증 불가능한 부분의 정직한 처리**: 실제 API 키가 없다는 물리적 한계 때문에, "이 코드가 옳다고 확신한다"와 "실제로 동작을 확인했다"를 섞어 말하지 않으려고 의식적으로 문구를 구분했다(CLAUDE.md "실행하지 않은 검증을 통과했다고 보고하지 않는다"). 대신 fetch 의존성 주입으로 로직(요청 형식, 응답 파싱, 에러 처리)만이라도 실제로 테스트했다.

### 왜 이렇게 결정했나

벤더 선택과 이중 opt-in 설계의 근거는 [DECISIONS.md](./DECISIONS.md) ADR-012 참고.

---

## 저장소(Supabase) 도입 여부 검토 — "하지 않기로" 결정

Phase 6 이후 남은 두 개의 다음 작업 중 하나였던 "승인 상태 저장소(Supabase) 도입 여부"를 판단했다.
이번엔 코드를 만들지 않고 **"지금은 만들지 않는다"**는 결론을 내렸다 — 그 판단 과정 자체를 기록한다.

### 판단 근거

1. Phase 4에서 이미 URL 쿼리로 승인/재생성 상태를 표현해두었고(ADR-010), 이게 새로고침·링크 공유에는 이미 충분히 대응한다. "완전히 새 세션에서도 승인 이력이 보여야 한다"는 요구가 아직 없다.
2. Supabase를 실제로 검증하려면 사용자의 프로젝트 URL/키가 필요하다 — Phase 6의 `OPENAI_API_KEY`와 같은 성격의 미검증 외부 의존성이다. 사용자가 이미지 API 키 검증을 "모든 Phase가 끝난 뒤 한 번에" 하겠다고 명시했으므로, 지금 또 다른 검증 불가능한 외부 의존성을 늘리는 건 그 방침과 어긋난다고 판단했다.
3. 로드맵상 더 설득력 있는 DB 도입 시점(캐릭터 채팅/대화 세션 영속화)이 따로 있다. 승인 체크박스 몇 개 저장하자고 지금 Supabase 프로젝트·스키마·RLS를 붙이는 건 과투자다.

### 왜 이게 포트폴리오에 의미가 있나

"요청받은 걸 무조건 만든다"가 아니라, 왜 지금은 안 만드는 게 맞는지 근거를 대고 재검토 조건까지 명시하는 것 — 이게 AI-Native Developer 포지션이 요구하는 "올바른 문제를 올바른 방식으로 푸는" 판단력을 보여주는 지점이라고 생각해서 별도로 기록해둔다.

자세한 근거와 재검토 조건은 [DECISIONS.md](./DECISIONS.md) ADR-013 참고.

---

## Phase 7 — 실제 렌더링 트리거

### 무엇을 했나

1. **우선순위 재질문**: "캐릭터 채팅 UI vs 실제 렌더링 트리거" 중 렌더링 트리거를 선택했다 — 지금까지 만든 파이프라인(대화→분석→컨셉→스토리보드→승인→이미지)의 마지막 고리를 닫는 자연스러운 마무리이자, 새 Provider 추상화나 새 상태 관리 패턴이 필요 없어 범위가 작았다.
2. **"모든 씬 승인" → 실제 MP4 다운로드**: `/story/[conceptId]/render` Route Handler를 만들어, 승인 완료 시 뜨던 안내 문구를 실제 다운로드 버튼으로 바꿨다.
3. **첫 실전 버그와 수정**: `@remotion/bundler`를 그냥 가져다 쓰니 `next build`가 "Self-reference dependency" 웹팩 에러로 실패했다 — Remotion의 번들러 자체가 웹팩을 다시 실행하는 도구라 Next의 웹팩 안에서 중첩 번들링이 깨진 것이었다. `next.config.mjs`에 `serverComponentsExternalPackages`를 추가해 해결했다(ADR-014).
4. **서버측 재검증**: "모든 씬 승인" 체크를 URL 상태를 믿지 않고 Route Handler 안에서 다시 수행해, URL을 조작해도 미승인 상태로는 렌더링되지 않게 했다.
5. **정직한 성능 실측**: 번들 캐싱을 넣었지만 실제로 두 번째 요청도 비슷하게 오래 걸렸다(42~50초) — 병목이 번들링이 아니라 프레임 렌더링 자체라는 걸 실측으로 확인하고 그대로 기록했다. "캐싱을 넣었으니 빨라졌을 것"이라고 넘겨짚지 않았다.

### 실행 결과

```
pnpm run typecheck → 통과 (2 tsconfig)
pnpm run test        → 36 passed (renderRoute 404/400 분기 2종 포함)
pnpm exec next build → 성공 (처음엔 @remotion/bundler 웹팩 충돌로 실패 → external 처리 후 성공)
curl GET /story/does-not-exist/render                → 404
curl GET /story/concept-calm/render (미승인)           → 400
curl GET /story/concept-romantic/render (전체 승인)     → 200, 1.69MB, 49.9초 (첫 요청, 번들링 포함)
curl GET /story/concept-calm/render (전체 승인, 2번째)   → 200, 1.64MB, 42.9초
pnpm run qa <다운로드된 mp4>                             → ✓ 1080x1920, ✓ 28.05초
```

### 사용한 AI 도구/기능

| 도구 | 용도 |
|---|---|
| AskUserQuestion | "캐릭터 채팅 UI vs 렌더링 트리거" 우선순위를 위임 |
| Bash(foreground, 긴 timeout) | 렌더링 요청이 실제로 40~50초 걸리는 걸 알고 있었기 때문에, 이번엔 백그라운드 대신 넉넉한 timeout으로 포그라운드 실행해 결과를 바로 확인 |

### 겪은 이슈

- **웹팩 중첩 번들링 충돌**: 위에서 설명한 `@remotion/bundler` 관련 `next build` 실패. 원인을 로그의 import trace로 추적해 `serverComponentsExternalPackages`로 해결했다.
- **누적된 유령 dev 서버 프로세스**: 이전 여러 Phase에 걸쳐 `pnpm run dev`를 백그라운드로 여러 번 띄웠던 프로세스들이 완전히 종료되지 않고 남아 있어서, 새 dev 서버가 3000~3003 포트를 다 건너뛰고 3004에서 떴다. `curl localhost:3000`으로 검증했다가 어느 서버에 요청이 가는지 헷갈릴 뻔했다 — PID를 직접 찾아 `kill -9`로 정리하고, 이후로는 실제 서버가 로그에 출력한 포트를 그대로 사용했다. 장시간 세션에서 백그라운드 프로세스를 안 남기고 정리하는 습관이 필요하다는 걸 실감했다.

### 왜 이렇게 결정했나

동기 처리/서버측 재검증/webpack external 처리 근거는 [DECISIONS.md](./DECISIONS.md) ADR-014 참고.

---

## Phase 8 — 캐릭터 채팅 UI

### 무엇을 했나

1. **우선순위 재질문**: "캐릭터 채팅 UI vs 렌더링 비동기화(큐)" 중 채팅 UI를 선택했다. ADR-013(Supabase 보류)과 같은 논리로, 큐는 실제 다중 사용자 부하가 생기기 전까지는 과투자라고 판단해 채팅을 권장했고 사용자도 동의했다.
2. **정직한 Mock 설계**: `ChatProvider`/`MockChatProvider`를 추가했는데, 사용자가 실제로 입력한 텍스트는 전혀 이해하지 않고 `sample-conversation.json`의 고정 대본을 순서대로 재생한다(ADR-015). 화면에 이걸 명시했다.
3. **이 프로젝트 첫 Server Action**: 지금까지(Phase 4) 승인 상태는 전부 URL로만 표현했는데, 채팅은 진행형 상호작용이라 URL로 표현하기 부적합했다. `app/chat/actions.ts`의 `sendChatMessage`가 이 프로젝트의 첫 Server Action이다(ADR-016). 채팅 메시지 목록 자체는 클라이언트 컴포넌트(`ChatClient.tsx`)의 React state에만 있고 DB는 여전히 없다.
4. **기존 파이프라인과의 연결**: 채팅이 끝나면(대본 소진) 홈 화면(기존 컨셉 분석 파이프라인)으로 가는 링크를 보여준다. 사용자가 기본 제안 문구를 그대로 보내는 한 채팅 내용이 기존에 분석해온 `sample-conversation.json`과 동일해서 자연스럽게 이어진다.

### 실행 결과

```
pnpm run typecheck → 통과 (2 tsconfig)
pnpm run test        → 43 passed (mockChatProvider 5, chatActions 2 포함)
pnpm exec next build → 성공, /chat 라우트 정적 생성됨
curl GET /chat        → 200, 안내 문구/장면 캡션 확인, 입력창에 대본 첫 사용자 대사 "오늘따라 도서관이 한산하네요." 프리필 확인
curl GET /            → "먼저 하람와(과) 채팅해보기 →" 링크 확인
```

### 사용한 AI 도구/기능

| 도구 | 용도 |
|---|---|
| AskUserQuestion | "채팅 UI vs 큐" 우선순위를 ADR-013과 같은 논리적 근거를 제시하며 위임 |
| Bash(dev 서버 + curl) | 서버 컴포넌트 렌더링(초기 화면, 프리필 문구)을 실제로 확인 |

### 겪은 이슈 / 한계

- **Server Action은 curl로 끝까지 검증하지 못했다**: `sendChatMessage`의 실제 "보내기" 클릭 흐름은 Next.js의 React Server Actions 프로토콜(특수 헤더/직렬화)을 curl로 재현하기 어려워, 이번엔 vitest로 함수 자체(사용자 메시지 생성 → 캐릭터 답장 조회 → 다음 제안 문구 계산)만 직접 호출해 검증했다. 실제 브라우저 클릭까지는 확인하지 못했다는 한계를 남긴다.
- **장시간 세션에서 누적된 유령 프로세스**: 이번에도 `pgrep -f "node"`로 찾은 프로세스를 다 죽였는데도 포트 3000~3003이 여전히 막혀 있었다 — Windows 네이티브 프로세스라 Git Bash의 프로세스 도구로는 안 잡히는 것으로 추정된다. 매번 실제로 뜬 포트를 로그에서 확인하고 그걸 쓰는 방식으로 우회했다.

### 왜 이렇게 결정했나

Mock 채팅 설계와 Server Action 도입 근거는 [DECISIONS.md](./DECISIONS.md) ADR-015, ADR-016 참고.

---

## Phase 9 — 채팅 내용을 실제 분석 파이프라인에 반영

### 무엇을 했나

1. **Plan Mode + Plan 서브에이전트로 설계 검증**: 인코딩 방식(percent-encoding vs base64url)을 실제 샘플 대화로 실측 비교하게 했다 — 감으로 판단하지 않고 숫자로 확인했다(원본 1,539자 → percent-encoding 4,127자 → base64url 2,575자, 38% 절감).
2. **URL 토큰으로 대화 전파**: `app/lib/conversationQueryState.ts`(신규)가 대화 인코딩/디코딩을 전담한다. 손상되거나 너무 긴 토큰은 예외 없이 조용히 고정 샘플로 폴백한다(Demo Mode 보장, ADR-002).
3. **파이프라인 리네이밍**: `sampleConversationPipeline.ts` → `conversationPipeline.ts`. "샘플 전용"에서 "대화 있으면 그걸, 없으면 폴백"으로 본질이 바뀐 만큼 이름도 맞췄다. import 3곳, 테스트 파일도 함께 리네이밍했다.
4. **URL 전파 체인 완성**: 홈의 컨셉 카드 → 스토리보드 승인/재생성 → 렌더링 다운로드까지, 대화 토큰이 한 번도 끊기지 않고 이어지게 `StoryQueryState`를 확장했다.
5. **에러를 정직하게 구분**: "감정 포인트를 못 찾음"(사용자가 채팅에서 대사를 과하게 고치면 생길 수 있는 정상적인 케이스)과 "내부 불변식이 깨짐"(진짜 버그)을 `ConversationAnalysisEmptyError`라는 전용 클래스로 나눠, 전자만 친절한 안내 화면으로 감싸고 후자는 숨기지 않는다.
6. **실제 엔드투엔드 검증**: 커스텀 대화(다른 캐릭터명, 다른 대사)를 만들어 홈→컨셉→스토리보드→승인→실제 렌더링까지 curl로 전부 실행해, 최종 MP4에 그 커스텀 대화 내용이 실제로 반영됐는지까지 확인했다(QA 통과: 1080×1920, 28.05초).

### 실행 결과

```
pnpm run typecheck → 통과 (2 tsconfig)
pnpm run test        → 54 passed (conversationQueryState 6, conversationPipeline 6, storyQueryState 9, chatActions 3 포함)
pnpm exec next build → 성공 ("/"가 searchParams를 읽으므로 정적→동적으로 전환됨)

curl 검증:
  GET /                                          → 기본(하람) 표시
  GET /?conversation=<커스텀 토큰>                  → 커스텀 캐릭터명("이앤투이") 표시
  GET /?conversation=broken                       → 조용히 기본으로 폴백
  GET /?conversation=<이벤트 0개 대화>               → 크래시 대신 "감정 포인트를 못 찾았다" 안내
  홈의 컨셉 카드 href                                → conversation 토큰이 그대로 붙어 전파됨
  GET /story/concept-calm?conversation=<커스텀>      → 커스텀 대사("좋아해왔어") 표시
  GET /story/concept-calm/render?approved=scene-1&conversation=<커스텀> → 200, 1.37MB, 49.8초
  pnpm run qa <다운로드된 mp4>                        → ✓ 1080x1920, ✓ 28.05초
```

### 사용한 AI 도구/기능

| 도구 | 용도 |
|---|---|
| Plan Mode + Plan 서브에이전트 | 인코딩 방식을 실측으로 검증받고, 파일 리네이밍·에러 클래스 분리 같은 세부 설계까지 미리 다듬음 |
| Bash(node -e로 토큰 수동 생성) | 브라우저 없이도 실제 인코딩 스킴과 동일한 토큰을 만들어 전체 체인을 curl로 실측 |

### 겪은 이슈

- 없음 — 새 인프라(DB, 큐, 외부 API)를 전혀 추가하지 않고 기존 URL 상태 패턴(ADR-010)만 확장한 덕분에, 이번 Phase는 새로운 종류의 문제 없이 순조롭게 끝났다.

### 왜 이렇게 결정했나

인코딩 방식 실측 근거, 파일 리네이밍 이유, 에러 클래스 분리 이유는 [DECISIONS.md](./DECISIONS.md) ADR-017 참고.

---

## Phase 10 — 음성/BGM Provider(Mock) 추가

### 무엇을 했나

1. **우선순위 재질문**: "음성/BGM Provider vs 렌더링 비동기화(큐)" 중 음성/BGM을 선택했다. 지금까지 렌더링된 영상엔 오디오가 전혀 없었다는 실질적인 공백을 채우는 쪽을 권장했고 사용자도 동의했다.
2. **본격 구현 전 기술 검증부터**: "Remotion이 `<Audio src="data:...">`를 실제 렌더링에 반영할 수 있는가"는 확신이 없는 핵심 리스크였다. 임시 스파이크 컴포지션을 만들어 실제로 렌더링해보고 `ffprobe`로 결과물에 오디오 스트림이 생기는지 먼저 확인한 뒤, 확인되자 스파이크 코드를 지우고 본 기능을 만들었다 — 잘못된 가정 위에 큰 기능을 쌓지 않으려는 순서였다.
3. **직접 WAV 인코딩**: 외부 라이브러리 없이 모노 16bit PCM WAV 인코더(`src/pipeline/wavEncoder.ts`)를 직접 만들었다.
4. **정직한 Mock 오디오**: `MockAudioProvider`가 실제 음성이 아니라 사람 목소리대 사인파+트레몰로(나레이션), 컨셉 톤별 화음(배경음악)을 만든다. 대사 텍스트는 여전히 불변이고, 재생성 시 나레이션도 함께 다른 시드로 바뀐다.
5. **중복 제거**: `MockImageProvider`에만 있던 시드 해시 유틸을 `src/pipeline/utils.ts`로 옮겨 `MockAudioProvider`와 공유했다.

### 실행 결과

```
pnpm run typecheck → 통과 (2 tsconfig)
pnpm run test        → 63 passed (wavEncoder 5, mockAudioProvider 4 포함)
pnpm exec next build → 성공
pnpm run generate     → src/data/generated-story.json에 audioDataUri 5개 + musicDataUri 1개 확인
pnpm run render:generated → out/generated.mp4
ffprobe 실측: video(h264, 28.0s) + audio(aac, 48000Hz, 2채널, 28.05s) 스트림 모두 확인
pnpm run qa → 해상도/재생시간 통과
```

### 사용한 AI 도구/기능

| 도구 | 용도 |
|---|---|
| AskUserQuestion | "음성/BGM vs 큐" 우선순위 위임 |
| Bash(스파이크 렌더링 + ffprobe) | 기능을 다 만들기 전에 핵심 가정(Remotion의 data URI 오디오 지원 여부)부터 실제로 검증 |

### 겪은 이슈

- 없음(설계상 큰 이슈) — 다만 스파이크 첫 시도에서 `node:fs`로 파일을 런타임에 읽으려다 Remotion의 웹팩 번들링이 "node: URI를 처리할 수 없다"는 에러를 냈다. Remotion 컴포넌트는 브라우저 컨텍스트에서 번들링된다는 걸 다시 확인하고, 데이터를 소스 코드에 리터럴로 박아넣는 방식으로 바꿔 해결했다.

### 왜 이렇게 결정했나

Mock 오디오 설계와 사전 기술 검증 절차의 근거는 [DECISIONS.md](./DECISIONS.md) ADR-018 참고.

---

## Phase 11 — 실제 TTS API(OpenAI) 연동

### 무엇을 했나

1. **우선순위 재질문**: "실제 TTS/음악 API 연동 vs 렌더링 비동기화(큐)" 중 전자를 선택했다.
2. **인터페이스 분리**: TTS(나레이션)와 음악(작곡)은 API 성격이 다르다는 걸 깨닫고, 기존 `AudioProvider`를 `TtsProvider`/`MusicProvider`로 나눴다. 음악 생성 API(Suno 등)는 대부분 비동기 잡 방식이라 이번 범위(동기 처리 원칙)에 안 맞아 Mock만 유지하기로 하고, TTS만 실제 연동했다 — "전부 다 하기"보다 "할 수 있는 만큼 정직하게" 범위를 좁혔다.
3. **Phase 6과 같은 안전장치 재사용**: `OpenAiTtsProvider` + `getTtsProvider()`(이중 opt-in: `TTS_PROVIDER=real` + `OPENAI_API_KEY`, 하나라도 없으면 Mock). 이미지 Provider와 같은 `OPENAI_API_KEY`를 재사용해 새 키를 요구하지 않았다.
4. **동기화 한계를 미리 인지하고 기록**: 실제 TTS는 대사 길이에 맞춰 오디오 길이를 조절해주지 않는다(Mock은 반대로 길이는 정확히 맞지만 가짜 소리다). Remotion `<Audio>`가 씬 길이보다 길거나 짧은 오디오를 크래시 없이 자르거나 무음 처리한다는 것도 확인해 기록해뒀다 — 완벽한 싱크는 이번 범위 밖임을 명시.

### 실행 결과

```
pnpm run typecheck → 통과 (2 tsconfig)
pnpm run test        → 72 passed (openAiTtsProvider 3, getTtsProvider 4, mockTtsProvider 3, mockMusicProvider 3 포함)
pnpm exec next build → 성공
pnpm run generate/render:generated/qa (기본 Mock 경로) → 회귀 없음 확인(1080x1920, 28.05s)
```

라이브 API 호출 자체는 검증하지 못했다 — `OPENAI_API_KEY`를 가진 환경에서 `TTS_PROVIDER=real`로 실행해봐야 진짜 검증이 끝난다(이미지 Provider와 마찬가지로, 모든 Phase가 끝난 뒤 한 번에 검증하기로 한 계획에 포함된다).

### 사용한 AI 도구/기능

| 도구 | 용도 |
|---|---|
| AskUserQuestion | "TTS/음악 API vs 큐" 우선순위 위임 |
| Bash 백그라운드 실행 | 회귀 확인(generate→render→qa)을 백그라운드로 돌리며 문서 작업 병행 |

### 겪은 이슈

- 없음 — Phase 6에서 이미 검증한 "이중 opt-in + fetch 의존성 주입 테스트" 패턴을 그대로 재사용할 수 있어서 새로운 종류의 문제가 생기지 않았다.

### 왜 이렇게 결정했나

TTS만 실제 연동하고 음악은 Mock으로 남긴 이유, 동기화 한계를 받아들인 이유는 [DECISIONS.md](./DECISIONS.md) ADR-019 참고.

---

## Phase 12 — 렌더링 비동기화(인메모리 잡 큐)

### 무엇을 했나

1. **큐 재검토**: "실제 API 키 검증 vs 큐 재검토" 중 큐를 선택했다. 다중 사용자 부하는 여전히 없지만, 서버리스 배포 시 40~50초짜리 요청이 함수 실행 시간 제한에 걸릴 수 있다는 새로운 이유가 생겼기 때문이다.
2. **Redis 없이 해결**: BullMQ+Redis 대신, 서버 프로세스 메모리에만 있는 `Map` 기반 잡 저장소(`renderJobStore.ts`)로 문제를 풀었다. 실제로 필요한 건 "요청을 안 막는 것"이지 "다중 인스턴스 분산 처리"가 아니었기 때문에, 외부 인프라 없이도 목표를 달성할 수 있다고 판단했다(ADR-013/014와 같은 판단 기준).
3. **POST(시작)→GET(폴링)→GET(다운로드) 3단 라우트**로 재설계하고, 클라이언트 폴링 컴포넌트(`RenderPanel`)를 새로 만들었다 — 이 프로젝트에서 "진행 상태를 실시간으로 보여주는" 첫 UI다.
4. **실전에서 진짜 버그를 발견하고 고쳤다**: 자동 테스트를 전부 통과했는데도, 실제 dev 서버로 시작→폴링을 붙여보니 상태가 절대 "완료"로 안 바뀌었다. Next.js가 Route Handler 파일마다 독립적으로 컴파일해서 같은 소스 파일이 라우트마다 다른 모듈 인스턴스(= 다른 Map)를 갖는다는 걸 원인으로 찾아냈고, `globalThis`에 상태를 붙이는 방식으로 고쳤다. **이건 vitest로는 절대 못 잡는 버그였다** — 실제 서버를 띄우고 여러 라우트를 순서대로 호출해봐야만 드러났다.

### 실행 결과

```
pnpm run typecheck → 통과 (2 tsconfig)
pnpm run test        → 82 passed (renderJobStore 5, renderStatusDownloadRoutes 5 포함)
pnpm exec next build → 성공, render/status, render/download 라우트 모두 등록됨

실제 curl 검증(dev 서버):
  POST /story/x/render (미승인)        → 400
  POST /story/does-not-exist/render     → 404
  POST /story/concept-romantic/render(전체 승인) → 202 + jobId, 응답 시간 0.098초(!)
  GET .../render/status?jobId=...       → pending을 거쳐(18회 폴링, ~54초) completed로 전환
  GET .../render/download?jobId=...     → 200, 1.69MB 다운로드
  같은 jobId로 재다운로드                → 409(1회성 다운로드 확인)
  qa 실행                               → ✓ 1080x1920, ✓ 28.05s
```

### 사용한 AI 도구/기능

| 도구 | 용도 |
|---|---|
| AskUserQuestion | "라이브 API 검증 vs 큐 재검토" 우선순위 위임 |
| Bash(dev 서버 + curl 폴링 루프) | 시작→폴링→다운로드 전체 비동기 흐름을 실제로 재현해, 자동 테스트로는 발견 못 했을 모듈 공유 버그를 잡아냄 |

### 겪은 이슈

- **Next.js Route Handler의 모듈 격리 버그**: 위에서 설명한 대로, "간단한 모듈 스코프 Map이면 충분하다"는 가정이 실제로는 틀렸다. 이 이슈는 코드 리뷰나 타입체크로는 전혀 안 보이고, 오직 "진짜로 여러 라우트를 순서대로 실행"해봐야만 드러나는 종류였다 — 자동화된 검증(vitest)과 실제 실행 검증(curl 엔드투엔드)을 둘 다 하는 습관이 왜 필요한지 다시 확인한 사례다.

### 왜 이렇게 결정했나

Redis 대신 인메모리 방식을 택한 이유, globalThis 수정 근거는 [DECISIONS.md](./DECISIONS.md) ADR-020 참고.

---

<!-- 다음 작업 섹션은 아래에 이어서 추가됩니다 -->
