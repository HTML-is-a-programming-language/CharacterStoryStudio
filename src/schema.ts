import { z } from "zod";

export const SceneSchema = z.object({
  id: z.string(),
  durationInFrames: z.number().int().positive(),
  background: z.object({
    from: z.string().regex(/^#[0-9a-fA-F]{6}$/, "hex color required"),
    to: z.string().regex(/^#[0-9a-fA-F]{6}$/, "hex color required"),
  }),
  speaker: z.string(),
  dialogue: z.string().min(1),
  caption: z.string().optional(),
  /** 이 씬이 어떤 원본 대화 메시지에서 비롯됐는지 추적하기 위한 ID 목록. AI가 없는 내용을 지어내지 않았는지 검증하는 데 쓰인다. */
  sourceMessageIds: z.array(z.string()).optional(),
});

export const StoryPlanSchema = z.object({
  title: z.string().min(1),
  fps: z.number().int().positive(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  scenes: z.array(SceneSchema).min(1),
});

export type Scene = z.infer<typeof SceneSchema>;
export type StoryPlan = z.infer<typeof StoryPlanSchema>;
