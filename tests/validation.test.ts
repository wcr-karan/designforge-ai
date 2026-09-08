import { describe, it, expect } from 'vitest'
import {
  CreateOrResumeAttemptSchema,
  SaveResponsesSchema,
  SubmitAttemptSchema,
  AIReviewOutputSchema,
} from '@/lib/validation/schemas'

describe('Validation Schemas', () => {
  it('validates attempt creation input', () => {
    const valid = CreateOrResumeAttemptSchema.safeParse({
      problemSlug: 'parking-lot',
    })
    expect(valid.success).toBe(true)

    const invalid = CreateOrResumeAttemptSchema.safeParse({
      problemSlug: '',
    })
    expect(invalid.success).toBe(false)
  })

  it('validates saving response items', () => {
    const valid = SaveResponsesSchema.safeParse({
      responses: [
        { sectionId: 'sec-1', response: 'Class definitions here' },
        { sectionId: 'sec-2', response: 'Relationships here' },
      ],
      status: 'DRAFT',
    })
    expect(valid.success).toBe(true)

    const invalidStatus = SaveResponsesSchema.safeParse({
      responses: [{ sectionId: 'sec-1', response: 'text' }],
      status: 'INVALID_STATUS',
    })
    expect(invalidStatus.success).toBe(false)
  })

  it('validates structured AI review output schema', () => {
    const sampleReview = {
      overallScore: 85,
      assessment: 'STRONG FOUNDATION',
      designSummary: 'Cohesive object model with clean separation of concerns.',
      whatWorkedWell: [
        {
          title: 'CLEAR RESPONSIBILITIES',
          description: 'ParkingLot coordinates floors and entries cleanly.',
        },
      ],
      areasToImprove: [
        {
          title: 'CONCURRENCY',
          description: 'Define locking or atomic operations for spot allocation.',
        },
      ],
      sectionReviews: [
        {
          sectionId: 'sec-1',
          score: 8.5,
          feedback: 'Sound decomposition of entities.',
        },
      ],
      nextProblemRecommendation: {
        problemSlug: 'elevator-system',
        reason: 'Practice state coordination and dispatch strategies.',
      },
    }

    const valid = AIReviewOutputSchema.safeParse(sampleReview)
    expect(valid.success).toBe(true)

    // Check invalid overall score > 100
    const invalidScore = AIReviewOutputSchema.safeParse({
      ...sampleReview,
      overallScore: 105,
    })
    expect(invalidScore.success).toBe(false)

    // Check invalid section score > 10
    const invalidSectionScore = AIReviewOutputSchema.safeParse({
      ...sampleReview,
      sectionReviews: [
        {
          sectionId: 'sec-1',
          score: 12,
          feedback: 'Out of range score',
        },
      ],
    })
    expect(invalidSectionScore.success).toBe(false)
  })
})
