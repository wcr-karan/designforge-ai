import { describe, it, expect, afterAll } from 'vitest'
import { prisma } from '@/lib/db/prisma'
import {
  getOrCreateActiveAttempt,
  getAttemptById,
  saveAttemptResponses,
  listAttempts,
} from '@/lib/services/attempt-service'
import { submitAndEvaluateAttempt } from '@/lib/services/evaluation-service'

describe('Attempt Workflow Integration', () => {
  let createdAttemptId: string

  afterAll(async () => {
    // Clean up test attempt if needed
    if (createdAttemptId) {
      await prisma.attempt.delete({ where: { id: createdAttemptId } }).catch(() => {})
    }
    await prisma.$disconnect()
  })

  it('creates a new attempt and resumes an existing unfinished attempt', async () => {
    // 1. Create active attempt for vending-machine
    const attempt1 = await getOrCreateActiveAttempt('vending-machine')
    expect(attempt1).toBeDefined()
    expect(attempt1.problem.slug).toBe('vending-machine')
    expect(attempt1.status).toBe('IN_PROGRESS')
    createdAttemptId = attempt1.id

    // 2. Calling again should resume the existing attempt rather than create a duplicate
    const attempt2 = await getOrCreateActiveAttempt('vending-machine')
    expect(attempt2.id).toBe(attempt1.id)
  })

  it('saves and updates responses and draft status', async () => {
    const attempt = await getAttemptById(createdAttemptId)
    const section = attempt?.problem.sections[0]
    expect(section).toBeDefined()

    const updated = await saveAttemptResponses(
      createdAttemptId,
      [
        {
          sectionId: section!.id,
          response: 'VendingMachine orchestrates state transitions and item inventory.',
        },
      ],
      'DRAFT'
    )

    expect(updated.status).toBe('DRAFT')

    const reloaded = await getAttemptById(createdAttemptId)
    const matching = reloaded?.responses.find((r) => r.sectionId === section!.id)
    expect(matching?.response).toContain('VendingMachine orchestrates')
  })

  it('prevents submitting an attempt with entirely empty responses', async () => {
    // Create an empty attempt for testing validation rejection
    const emptyAttempt = await prisma.attempt.create({
      data: {
        problemId: (await prisma.problem.findUniqueOrThrow({ where: { slug: 'library-management' } })).id,
        status: 'IN_PROGRESS',
      },
    })

    await expect(submitAndEvaluateAttempt(emptyAttempt.id)).rejects.toThrow(
      'Cannot submit an empty design'
    )

    // Clean up
    await prisma.attempt.delete({ where: { id: emptyAttempt.id } })
  })

  it('submits design, generates AI evaluation, and stores review', async () => {
    const attempt = await getAttemptById(createdAttemptId)
    const sections = attempt!.problem.sections

    const allResponses = sections.map((s, i) => ({
      sectionId: s.id,
      response: `Detailed architectural response for ${s.title}: modeling responsibilities, state transitions, interfaces, and trade-offs.`,
    }))

    const result = await submitAndEvaluateAttempt(createdAttemptId, allResponses)
    expect(result.success).toBe(true)
    expect(result.attemptId).toBe(createdAttemptId)
    expect(result.overallScore).toBeGreaterThanOrEqual(0)

    const reviewed = await getAttemptById(createdAttemptId)
    expect(reviewed?.status).toBe('REVIEWED')
    expect(reviewed?.aiReview).toBeDefined()
    expect(reviewed?.aiReview?.sectionReviews.length).toBe(sections.length)

    // Test duplicate submission protection
    const dup = await submitAndEvaluateAttempt(createdAttemptId)
    expect(dup.alreadyReviewed).toBe(true)
  })

  it('filters attempts list correctly by status', async () => {
    const all = await listAttempts('ALL')
    expect(all.length).toBeGreaterThan(0)

    const reviewed = await listAttempts('REVIEWED')
    expect(reviewed.every((a) => a.status === 'REVIEWED')).toBe(true)
  })
})
