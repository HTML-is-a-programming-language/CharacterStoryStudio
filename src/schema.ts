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
