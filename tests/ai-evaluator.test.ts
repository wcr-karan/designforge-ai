import { describe, it, expect } from 'vitest'
import { DeterministicRuleEvaluator } from '@/lib/services/ai-evaluator'

describe('AI Evaluator (Deterministic Rule Engine)', () => {
  const evaluator = new DeterministicRuleEvaluator()

  const sampleInput = {
    problemTitle: 'PARKING LOT',
    problemSlug: 'parking-lot',
    problemDescription: 'Model a multi-floor parking system...',
    requirements: [
      'Support multiple parking floors.',
      'Handle Motorcycle, Car and Truck vehicle types.',
    ],
    sections: [
      {
        id: 'sec-1',
        title: 'CLASSES & RESPONSIBILITIES',
        description: 'Identify the major objects and describe what each one owns.',
        evaluationCriteria: 'Separation of concerns across ParkingLot, Floor, Spot, Vehicle.',
      },
      {
        id: 'sec-2',
        title: 'OBJECT RELATIONSHIPS',
        description: 'Explain containment, associations and relationships.',
        evaluationCriteria: 'Composition of floors and spots, association with tickets.',
      },
      {
        id: 'sec-3',
        title: 'DESIGN DECISIONS',
        description: 'Trade-offs and spot allocation strategy.',
        evaluationCriteria: 'Reasoning behind spot allocation and pricing strategy.',
      },
    ],
  }

  it('evaluates complete and thoughtful responses with high scores', async () => {
    const output = await evaluator.evaluate({
      ...sampleInput,
      responses: [
        {
          sectionId: 'sec-1',
          response:
            'ParkingLot is the primary orchestrator that contains multiple ParkingFloors and delegates entry ticket creation. Vehicle encapsulates vehicle dimensions and license plate. ParkingSpot models slot size and occupancy state. Ticket encapsulates duration and entry timestamp.',
        },
        {
          sectionId: 'sec-2',
          response:
            'A ParkingLot has a strong composition relationship with ParkingFloors. Each floor contains a collection of ParkingSpots. A Ticket references an active Vehicle and an assigned ParkingSpot during the session lifecycle.',
        },
        {
          sectionId: 'sec-3',
          response:
            'I chose a Strategy pattern for spot allocation to isolate nearest-first vs random assignment trade-offs. Pricing policies are decoupled via an independent PricingStrategy to avoid violating Single Responsibility in ParkingLot.',
        },
      ],
    })

    expect(output.overallScore).toBeGreaterThanOrEqual(75)
    expect(['EXCELLENT ARCHITECTURE', 'STRONG FOUNDATION']).toContain(output.assessment)
    expect(output.sectionReviews).toHaveLength(3)
    expect(output.whatWorkedWell.length).toBeGreaterThan(0)
    expect(output.areasToImprove.length).toBeGreaterThan(0)
    expect(output.nextProblemRecommendation.problemSlug).toBe('elevator-system')
  })

  it('penalizes empty responses with low scores and specific improvement guidance', async () => {
    const output = await evaluator.evaluate({
      ...sampleInput,
      responses: [
        { sectionId: 'sec-1', response: '' },
        { sectionId: 'sec-2', response: '' },
        { sectionId: 'sec-3', response: '' },
      ],
    })

    expect(output.overallScore).toBeLessThan(50)
    expect(output.assessment).toBe('NEEDS REFINEMENT')
    for (const sr of output.sectionReviews) {
      expect(sr.score).toBeLessThanOrEqual(3.0)
      expect(sr.feedback).toContain('No response provided')
    }
  })
})
