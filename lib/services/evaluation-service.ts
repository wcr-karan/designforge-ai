import { prisma } from '@/lib/db/prisma'
import { getAIEvaluator } from '@/lib/services/ai-evaluator'
import { saveAttemptResponses } from '@/lib/services/attempt-service'

export async function submitAndEvaluateAttempt(
  attemptId: string,
  incomingResponses?: Array<{ sectionId: string; response: string }>
) {
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      problem: {
        include: {
          sections: {
            orderBy: { order: 'asc' },
          },
        },
      },
      responses: true,
      aiReview: true,
    },
  })

  if (!attempt) {
    throw new Error(`Attempt not found: ${attemptId}`)
  }

  // Duplicate submission protection
  if (attempt.status === 'REVIEWED' && attempt.aiReview) {
    return {
      success: true,
      alreadyReviewed: true,
      attemptId: attempt.id,
    }
  }

  // Persist incoming responses if provided
  if (incomingResponses && incomingResponses.length > 0) {
    await saveAttemptResponses(attemptId, incomingResponses)
  }

  // Reload responses to ensure we have the latest persisted data
  const currentResponses = await prisma.attemptResponse.findMany({
    where: { attemptId },
  })

  // Basic deterministic check: ensure at least one section has non-empty text
  const hasContent = currentResponses.some((r) => r.response.trim().length > 0)
  if (!hasContent) {
    throw new Error('Cannot submit an empty design. Please provide your solution before submitting.')
  }

  // Step 1: Mark attempt as SUBMITTED
  await prisma.attempt.update({
    where: { id: attemptId },
    data: {
      status: 'SUBMITTED',
      submittedAt: new Date(),
    },
  })

  try {
    // Step 2: Run AI evaluation
    const evaluator = getAIEvaluator()
    const evaluationResult = await evaluator.evaluate({
      problemTitle: attempt.problem.title,
      problemSlug: attempt.problem.slug,
      problemDescription: attempt.problem.description,
      requirements: attempt.problem.requirements,
      sections: attempt.problem.sections.map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        evaluationCriteria: s.evaluationCriteria,
      })),
      responses: currentResponses.map((r) => ({
        sectionId: r.sectionId,
        response: r.response,
      })),
    })

    // Step 3: Atomically store review and section reviews, then mark as REVIEWED
    await prisma.$transaction(async (tx) => {
      // Upsert AIReview
      const review = await tx.aIReview.upsert({
        where: { attemptId },
        update: {
          overallScore: evaluationResult.overallScore,
          assessment: evaluationResult.assessment,
          designSummary: evaluationResult.designSummary,
          strengths: evaluationResult.whatWorkedWell,
          improvements: evaluationResult.areasToImprove,
          nextProblemRecommendation: evaluationResult.nextProblemRecommendation,
        },
        create: {
          attemptId,
          overallScore: evaluationResult.overallScore,
          assessment: evaluationResult.assessment,
          designSummary: evaluationResult.designSummary,
          strengths: evaluationResult.whatWorkedWell,
          improvements: evaluationResult.areasToImprove,
          nextProblemRecommendation: evaluationResult.nextProblemRecommendation,
        },
      })

      // Upsert each SectionReview
      for (const sr of evaluationResult.sectionReviews) {
        await tx.sectionReview.upsert({
          where: {
            aiReviewId_sectionId: {
              aiReviewId: review.id,
              sectionId: sr.sectionId,
            },
          },
          update: {
            score: sr.score,
            feedback: sr.feedback,
          },
          create: {
            aiReviewId: review.id,
            sectionId: sr.sectionId,
            score: sr.score,
            feedback: sr.feedback,
          },
        })
      }

      // Mark Attempt as REVIEWED with overallScore
      await tx.attempt.update({
        where: { id: attemptId },
        data: {
          status: 'REVIEWED',
          overallScore: evaluationResult.overallScore,
        },
      })
    })

    return {
      success: true,
      attemptId,
      overallScore: evaluationResult.overallScore,
    }
  } catch (error: any) {
    console.error(`Evaluation failed for attempt ${attemptId}:`, error)
    // Mark as FAILED to preserve user responses and allow retry
    await prisma.attempt.update({
      where: { id: attemptId },
      data: { status: 'FAILED' },
    })
    throw new Error(`Evaluation failed: ${error.message || 'Unknown error'}. Responses have been preserved.`)
  }
}
