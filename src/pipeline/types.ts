import { z } from "zod";

export const ConversationMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "character"]),
  content: z.string().min(1),
  timestamp: z.string(),
});

export const ConversationSchema = z.object({
  character: z.object({
    id: z.string(),
    name: z.string(),
  }),
  messages: z.array(ConversationMessageSchema).min(1),
});

export const ConversationEventSchema = z.object({
  sourceMessageId: z.string(),
  description: z.string(),
});

export const ConversationAnalysisSchema = z.object({
  characterName: z.string(),
  summary: z.string(),
  emotionalArc: z.string(),
  events: z.array(ConversationEventSchema).min(1),
  safetyFlag: z.boolean(),
});

export const StoryConceptSchema = z.object({
  id: z.string(),
  title: z.string(),
  logline: z.string(),
  tone: z.enum(["calm", "romantic", "bittersweet"]),
});

export type ConversationMessage = z.infer<typeof ConversationMessageSchema>;
export type Conversation = z.infer<typeof ConversationSchema>;
export type ConversationEvent = z.infer<typeof ConversationEventSchema>;
export type ConversationAnalysis = z.infer<typeof ConversationAnalysisSchema>;
export type StoryConcept = z.infer<typeof StoryConceptSchema>;
