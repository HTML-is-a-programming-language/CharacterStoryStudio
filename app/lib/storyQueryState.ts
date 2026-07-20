/**
 * 스토리보드 화면의 "승인"/"재생성" 상태를 URL 쿼리 파라미터로 표현하기 위한 순수 함수 모음.
 * DB/세션 없이 URL만으로 상태가 재현되게 한다(새로고침·공유해도 동일한 화면).
 */

export interface StoryQueryState {
  approved: ReadonlySet<string>;
  variants: Readonly<Record<string, number>>;
}

export type StoryPageSearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

export function parseStoryQueryState(searchParams: StoryPageSearchParams): StoryQueryState {
  const approved = new Set(
    firstValue(searchParams.approved)
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id.length > 0),
  );

  const variants: Record<string, number> = {};
  for (const pair of firstValue(searchParams.variant).split(",")) {
    const [sceneId, rawValue] = pair.split(":");
    if (!sceneId || !rawValue) {
      continue;
    }
    const value = Number.parseInt(rawValue, 10);
    if (Number.isFinite(value) && value > 0) {
      variants[sceneId] = value;
    }
  }

  return { approved, variants };
}

export function buildStoryHref(conceptId: string, state: StoryQueryState): string {
  const params = new URLSearchParams();

  if (state.approved.size > 0) {
    params.set("approved", Array.from(state.approved).join(","));
  }

  const variantEntries = Object.entries(state.variants).filter(([, value]) => value > 0);
  if (variantEntries.length > 0) {
    params.set("variant", variantEntries.map(([sceneId, value]) => `${sceneId}:${value}`).join(","));
  }

  const query = params.toString();
  return `/story/${conceptId}${query ? `?${query}` : ""}`;
}

export function toggleApproved(state: StoryQueryState, sceneId: string): StoryQueryState {
  const approved = new Set(state.approved);
  if (approved.has(sceneId)) {
    approved.delete(sceneId);
  } else {
    approved.add(sceneId);
  }
  return { approved, variants: state.variants };
}

export function bumpVariant(state: StoryQueryState, sceneId: string): StoryQueryState {
  const current = state.variants[sceneId] ?? 0;
  return {
    approved: state.approved,
    variants: { ...state.variants, [sceneId]: current + 1 },
  };
}
