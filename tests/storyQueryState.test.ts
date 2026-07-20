import { describe, expect, it } from "vitest";
import {
  buildStoryHref,
  bumpVariant,
  parseStoryQueryState,
  toggleApproved,
} from "../app/lib/storyQueryState";

describe("storyQueryState", () => {
  it("빈 searchParams는 빈 상태로 파싱된다", () => {
    const state = parseStoryQueryState({});
    expect(state.approved.size).toBe(0);
    expect(Object.keys(state.variants)).toHaveLength(0);
  });

  it("approved/variant 쿼리 문자열을 파싱한다", () => {
    const state = parseStoryQueryState({
      approved: "scene-1,scene-3",
      variant: "scene-2:1,scene-4:2",
    });

    expect(state.approved.has("scene-1")).toBe(true);
    expect(state.approved.has("scene-3")).toBe(true);
    expect(state.approved.has("scene-2")).toBe(false);
    expect(state.variants).toEqual({ "scene-2": 1, "scene-4": 2 });
  });

  it("toggleApproved는 없으면 추가하고 있으면 제거한다", () => {
    const empty = parseStoryQueryState({});
    const added = toggleApproved(empty, "scene-1");
    expect(added.approved.has("scene-1")).toBe(true);

    const removed = toggleApproved(added, "scene-1");
    expect(removed.approved.has("scene-1")).toBe(false);
  });

  it("bumpVariant는 해당 씬의 카운트만 1 올린다", () => {
    const state = parseStoryQueryState({ variant: "scene-1:1" });
    const bumped = bumpVariant(state, "scene-1");
    expect(bumped.variants["scene-1"]).toBe(2);

    const bumpedOther = bumpVariant(state, "scene-2");
    expect(bumpedOther.variants["scene-1"]).toBe(1);
    expect(bumpedOther.variants["scene-2"]).toBe(1);
  });

  it("buildStoryHref로 만든 URL을 다시 파싱하면 같은 상태가 나온다(라운드트립)", () => {
    const original = parseStoryQueryState({
      approved: "scene-1",
      variant: "scene-2:3",
    });

    const href = buildStoryHref("concept-romantic", original);
    expect(href.startsWith("/story/concept-romantic?")).toBe(true);

    const query = href.split("?")[1] ?? "";
    const reparsed = parseStoryQueryState(Object.fromEntries(new URLSearchParams(query)));

    expect(Array.from(reparsed.approved)).toEqual(Array.from(original.approved));
    expect(reparsed.variants).toEqual(original.variants);
  });

  it("아무 상태도 없으면 쿼리 없이 순수 경로만 반환한다", () => {
    const href = buildStoryHref("concept-calm", parseStoryQueryState({}));
    expect(href).toBe("/story/concept-calm");
  });
});
