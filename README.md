# Character Story Studio

AI 캐릭터와 나눈 대화를 사용자가 승인·수정할 수 있는 짧은 개인화 모션코믹 영상으로 변환하는 서비스입니다.

타인에이아이의 AI 캐릭터 채팅 서비스 **러비더비**와, 에이전트 기반 오픈소스 영상 제작 시스템 **[OpenMontage](https://github.com/calesthio/OpenMontage)**의 접점에서 출발한 AI-Native 포트폴리오 프로젝트입니다.

## 왜 이 프로젝트인가

러비더비 같은 AI 캐릭터 채팅 서비스에서는 대화 자체가 하나의 이야기입니다. 하지만 그 이야기는 텍스트 로그로만 남고, 사용자가 다시 꺼내보거나 공유하기 좋은 형태로 남지 않습니다.

OpenMontage는 자연어 프롬프트를 입력하면 리서치부터 렌더링까지 전 과정을 AI 에이전트가 처리하되, 각 단계마다 사람의 승인을 받는 파이프라인 구조를 보여줍니다.

이 두 지점을 연결하면: **대화(러비더비의 핵심 경험) → 승인 기반 AI 파이프라인(OpenMontage의 설계 철학) → 개인화 영상(결과물)** 이라는 흐름이 만들어집니다. 이 프로젝트는 OpenMontage의 코드를 그대로 가져다 쓰지 않고, 그 파이프라인/승인 게이트 설계를 참고하여 TypeScript 스택으로 직접 구현합니다.

> 러비더비의 클론이 아닙니다. 러비더비의 공개 API는 없으므로, 실제 서비스와 연동하지 않고 독자적인 캐릭터·세계관으로 구성된 데모 채팅 UI를 사용합니다.

## 핵심 사용자 흐름

1. 캐릭터 선택 → AI 캐릭터와 채팅
2. 의미 있었던 대화 구간 선택
3. AI가 대화를 분석해 영상 컨셉 3가지 제안
4. 컨셉 선택 → 5개 씬 스토리보드 생성
5. 씬별 이미지/대사/연출 검토 및 승인(또는 재생성 요청)
6. 음성/자막/음악 생성 → Remotion으로 세로형(9:16) 영상 렌더링
7. 자동 품질 검사(QA) 통과 후 최종 영상 확인/다운로드

모든 단계는 사용자 승인 게이트를 거칩니다 — AI가 만든 결과를 그대로 밀어붙이지 않습니다.

## 기술 스택 (예정)

- **프론트엔드**: Next.js(App Router), TypeScript strict, Tailwind CSS
- **렌더링**: Remotion (React 기반 영상 렌더링)
- **백엔드/데이터**: Supabase(Postgres/Auth/Storage), Zod
- **비동기 처리**: Redis + BullMQ
- **AI Provider**: Chat/Story/Image/TTS Provider 인터페이스로 추상화, Mock Provider 우선 구현
- **테스트**: Vitest, Playwright
- **패키지 매니저**: pnpm

자세한 배경과 설계는 [PROJECT_BRIEF.md](./PROJECT_BRIEF.md)를 참고하세요.

## Demo Mode

API 키 없이도 전체 흐름을 체험할 수 있는 Demo Mode를 목표로 합니다. Mock Provider와 미리 준비된 샘플 데이터로 채팅부터 최종 영상까지의 흐름을 확인할 수 있습니다. (구현 예정)

## 현재 상태

**Phase 12 — 렌더링 비동기화(인메모리 잡 큐) 완료, 이후 렌더링 버그 수정 + QA 자동 통합**

- Phase 0: 프로젝트 설계 및 기초 문서 작성 완료
- Phase 1: 고정 JSON → Remotion MP4 렌더링 POC 완료
- Phase 2: 대화 분석 → 컨셉 3안 → 스토리보드 생성 `StoryProvider`/`MockStoryProvider` 파이프라인 완료
- Phase 3: Next.js(App Router)를 기존 Remotion 프로젝트와 한 패키지에 공존시켜, 컨셉 선택 → 스토리보드 최소 UI 구현
- Phase 4: 스토리보드 화면에 씬별 "승인"/"연출 재생성" 버튼 추가(URL 쿼리 기반 상태, DB 없음)
- Phase 5: `ImageProvider` 추상화 + `MockImageProvider` 추가(API 키 없이 결정론적 절차적 SVG로 씬 이미지 생성)
- Phase 6: 실제 이미지 생성 API(OpenAI `gpt-image-1`) 연동(이중 opt-in, 라이브 호출은 아직 미검증)
- Phase 7: 모든 씬이 승인되면 `/story/[conceptId]/render`에서 실제로 Remotion 렌더링을 실행해 MP4를 다운로드할 수 있습니다(당시엔 요청당 약 40~50초 동기 처리·큐 없음 — Phase 12에서 비동기로 개선).
- Phase 8: `/chat`에서 캐릭터와 채팅하는 데모 화면을 추가했습니다(Mock, 고정 대본 재생, 첫 Server Action 도입).
- Phase 9: `/chat`에서 실제로 오간(또는 사용자가 수정한) 대화가 홈의 분석→컨셉→스토리보드→승인→렌더링까지 전부 그대로 이어집니다(base64url URL 토큰, DB 없음).
- Phase 10: `TtsProvider`/`MusicProvider`를 추가해 렌더링되는 영상에 씬별 나레이션과 배경음악이 실제로 들어갑니다(당시엔 둘 다 API 키 없이 절차적 WAV 합성). 실제 렌더링 결과물에 오디오 스트림(AAC)이 있는 것을 `ffprobe`로 확인했습니다.
- Phase 11: 실제 TTS API(OpenAI `tts-1`)를 연동했습니다(이중 opt-in, 라이브 호출은 아직 미검증). 배경음악은 실제 작곡 API가 대부분 비동기 방식이라 이번엔 Mock으로 유지했습니다.
- Phase 12: 렌더링을 비동기로 바꿨습니다. "영상 렌더링 시작" 버튼을 누르면 즉시 응답이 오고(약 0.1초), 화면이 2초마다 진행 상태를 폴링하다가 완료되면 다운로드 링크를 보여줍니다. Redis 없이 서버 프로세스 메모리(`globalThis`)만으로 구현했습니다.
- 버그 수정: `out/generated.mp4`에 이미지·오디오가 안 나오던 문제를 고쳤습니다. 진짜 원인은 `pnpm run generate`가 저장하는 JSON 모양이 Remotion Composition이 기대하는 `{ story: ... }` 형태와 달라서, CLI 렌더링(`render:generated`)이 실제 생성 데이터를 한 번도 읽지 못하고 항상 Phase 1 고정 샘플만 렌더링해온 것이었습니다. 여기에 더해 Remotion 헤드리스 렌더링에서 CSS 배경 이미지가 아닌 Remotion `<Img>`를 써야 큰 실물 이미지가 확실히 나온다는 것도 확인해 반영했습니다.
- QA 자동 통합: 해상도/재생시간을 검사하던 `pnpm run qa` CLI 스크립트를 렌더링 파이프라인에 연결했습니다. 이제 렌더링이 끝나면 자동으로 QA가 돌고, 결과가 다운로드 링크와 함께 화면에 표시됩니다(QA 실패가 다운로드를 막지는 않습니다 — 정보성 표시입니다).

실제 이미지/음성 생성을 켜려면(비용 발생):

```bash
cp .env.example .env.local
# .env.local에 OPENAI_API_KEY=sk-... 를 채우고, 켜고 싶은 항목의
# IMAGE_PROVIDER=real / TTS_PROVIDER=real 주석을 해제
pnpm run generate
```

로컬에서 직접 실행해보려면:

```bash
pnpm install
pnpm run dev                # http://localhost:3000 — 컨셉 선택 UI
pnpm run studio              # Remotion Studio에서 미리보기
pnpm run render               # 고정 샘플(책갈피) → out/story.mp4
pnpm run generate             # 샘플 대화 → 분석 → 컨셉 → 스토리보드 → src/data/generated-story.json
pnpm run render:generated     # 생성된 스토리보드 → out/generated.mp4
pnpm run qa out/story.mp4     # 해상도/재생시간 자동 검증
pnpm run test                  # 스키마 + 파이프라인 검증 테스트
pnpm run typecheck              # Remotion/pipeline + Next.js 양쪽 tsconfig 모두 검사
pnpm run build                  # Next.js 프로덕션 빌드
```

다음 단계는 [PROJECT_BRIEF.md](./PROJECT_BRIEF.md)의 구현 순서와 [docs/PORTFOLIO.md](./docs/PORTFOLIO.md)를 참고하세요.
