/** count개 프레임 구간으로 totalFrames를 최대한 균등하게(오차 없이) 나눈다. */
export function distributeDurationFrames(totalFrames: number, count: number): number[] {
  if (count <= 0) {
    throw new Error("count는 1 이상이어야 합니다.");
  }
  const base = Math.floor(totalFrames / count);
  const remainder = totalFrames - base * count;
  return Array.from({ length: count }, (_, i) => base + (i < remainder ? 1 : 0));
}

/** items를 순환하며 index번째 항목을 반환한다. items가 비어있으면 예외를 던진다. */
export function pickFromCycle<T>(items: readonly T[], index: number): T {
  if (items.length === 0) {
    throw new Error("빈 배열에서는 항목을 선택할 수 없습니다.");
  }
  const item = items[index % items.length];
  if (item === undefined) {
    throw new Error("예상치 못하게 항목을 찾지 못했습니다.");
  }
  return item;
}

/** 문자열을 결정론적 정수 시드로 바꾼다(Mock Provider들이 "같은 입력 → 같은 결과"를 보장하는 데 공용으로 쓴다). */
export function hashSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** seed+salt로부터 결정론적 의사난수([0,1))를 만든다. */
export function seededRandom(seed: number, salt: number): number {
  const value = Math.sin(seed + salt) * 10000;
  return value - Math.floor(value);
}
