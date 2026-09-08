import { notFound } from 'next/navigation'
import { PracticePage } from '@/components/practice-pages'

const slugs = ['parking-lot', 'elevator-system', 'vending-machine', 'library-management'] as const

type PracticeSlug = (typeof slugs)[number]

export function generateStaticParams() {
  return slugs.map((slug) => ({ slug }))
}

export default async function PracticeRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!slugs.includes(slug as PracticeSlug)) notFound()
  return <PracticePage slug={slug as PracticeSlug} />
}
