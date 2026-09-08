import { prisma } from '@/lib/db/prisma'

export async function getAllProblems() {
  return prisma.problem.findMany({
    orderBy: { number: 'asc' },
    include: {
      sections: {
        orderBy: { order: 'asc' },
        select: {
          id: true,
          title: true,
          order: true,
        },
      },
    },
  })
}

export async function getProblemBySlug(slug: string) {
  return prisma.problem.findUnique({
    where: { slug },
    include: {
      sections: {
        orderBy: { order: 'asc' },
      },
    },
  })
}
