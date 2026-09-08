import { prisma } from '@/lib/db/prisma'
import { AttemptStatus } from '@prisma/client'

export async function getOrCreateActiveAttempt(problemSlug: string, userId?: string) {
  const problem = await prisma.problem.findUnique({
    where: { slug: problemSlug },
    include: {
      sections: {
        orderBy: { order: 'asc' },
      },
    },
  })

  if (!problem) {
    throw new Error(`Problem not found for slug: ${problemSlug}`)
  }

  // Look for an unfinished attempt for this problem (and user if supplied)
  const existingAttempt = await prisma.attempt.findFirst({
    where: {
      problemId: problem.id,
      status: { in: ['IN_PROGRESS', 'DRAFT'] },
      ...(userId ? { userId } : {}),
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      problem: {
        include: {
          sections: {
            orderBy: { order: 'asc' },
          },
        },
      },
      responses: true,
    },
  })

  if (existingAttempt) {
    return existingAttempt
  }

  // Create a new attempt
  const newAttempt = await prisma.attempt.create({
    data: {
      problemId: problem.id,
      userId: userId || null,
      status: 'IN_PROGRESS',
    },
    include: {
      problem: {
        include: {
          sections: {
            orderBy: { order: 'asc' },
          },
        },
      },
      responses: true,
    },
  })

  return newAttempt
}

export async function getAttemptById(attemptId: string) {
  return prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      problem: {
        include: {
          sections: {
            orderBy: { order: 'asc' },
          },
        },
      },
      responses: {
        include: {
          section: true,
        },
      },
      aiReview: {
        include: {
          sectionReviews: {
            include: {
              section: true,
            },
          },
        },
      },
    },
  })
}

export async function saveAttemptResponses(
  attemptId: string,
  responses: Array<{ sectionId: string; response: string }>,
  status?: 'DRAFT' | 'IN_PROGRESS'
) {
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
  })

  if (!attempt) {
    throw new Error(`Attempt not found: ${attemptId}`)
  }

  if (attempt.status === 'SUBMITTED' || attempt.status === 'REVIEWED') {
    throw new Error(`Cannot modify responses for an attempt that is already ${attempt.status}`)
  }

  // Upsert all responses atomically in a transaction
  await prisma.$transaction(
    responses.map((item) =>
      prisma.attemptResponse.upsert({
        where: {
          attemptId_sectionId: {
            attemptId,
            sectionId: item.sectionId,
          },
        },
        update: {
          response: item.response,
        },
        create: {
          attemptId,
          sectionId: item.sectionId,
          response: item.response,
        },
      })
    )
  )

  const updatedAttempt = await prisma.attempt.update({
    where: { id: attemptId },
    data: {
      ...(status ? { status } : {}),
      updatedAt: new Date(),
    },
    include: {
      responses: true,
    },
  })

  return updatedAttempt
}

export async function updateAttemptStatus(
  attemptId: string,
  status: AttemptStatus,
  overallScore?: number,
  submittedAt?: Date
) {
  return prisma.attempt.update({
    where: { id: attemptId },
    data: {
      status,
      ...(overallScore !== undefined ? { overallScore } : {}),
      ...(submittedAt ? { submittedAt } : {}),
      updatedAt: new Date(),
    },
  })
}

export async function listAttempts(filter?: 'ALL' | 'REVIEWED' | 'IN_PROGRESS' | 'DRAFTS') {
  let whereClause: { status?: { in: AttemptStatus[] } } = {}

  if (filter === 'REVIEWED') {
    whereClause = { status: { in: ['REVIEWED'] } }
  } else if (filter === 'IN_PROGRESS') {
    whereClause = { status: { in: ['IN_PROGRESS'] } }
  } else if (filter === 'DRAFTS') {
    whereClause = { status: { in: ['DRAFT'] } }
  }

  const attempts = await prisma.attempt.findMany({
    where: whereClause,
    orderBy: { updatedAt: 'desc' },
    include: {
      problem: true,
      aiReview: {
        select: {
          overallScore: true,
          assessment: true,
        },
      },
    },
  })

  return attempts
}
