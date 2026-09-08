import { z } from 'zod'

export const AttemptStatusSchema = z.enum([
  'DRAFT',
  'IN_PROGRESS',
  'SUBMITTED',
  'REVIEWED',
  'FAILED',
])

export const CreateOrResumeAttemptSchema = z.object({
  problemSlug: z.string().min(1, 'Problem slug is required'),
  userId: z.string().optional(),
})

export const ResponseItemSchema = z.object({
  sectionId: z.string().min(1, 'Section ID is required'),
  response: z.string(),
})

export const SaveResponsesSchema = z.object({
  responses: z.array(ResponseItemSchema),
  status: z.enum(['DRAFT', 'IN_PROGRESS']).optional(),
})

export const SubmitAttemptSchema = z.object({
  responses: z.array(ResponseItemSchema).optional(),
})

export const AIReviewItemSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
})

export const SectionReviewOutputSchema = z.object({
  sectionId: z.string().min(1),
  score: z.number().min(0).max(10),
  feedback: z.string().min(1),
})

export const AIReviewOutputSchema = z.object({
  overallScore: z.number().min(0).max(100),
  assessment: z.string().min(1),
  designSummary: z.string().min(1),
  whatWorkedWell: z.array(AIReviewItemSchema).min(1),
  areasToImprove: z.array(AIReviewItemSchema).min(1),
  sectionReviews: z.array(SectionReviewOutputSchema).min(1),
  nextProblemRecommendation: z.object({
    problemSlug: z.string().min(1),
    reason: z.string().min(1),
  }),
})

export type CreateOrResumeAttemptInput = z.infer<typeof CreateOrResumeAttemptSchema>
export type SaveResponsesInput = z.infer<typeof SaveResponsesSchema>
export type SubmitAttemptInput = z.infer<typeof SubmitAttemptSchema>
export type AIReviewOutput = z.infer<typeof AIReviewOutputSchema>
