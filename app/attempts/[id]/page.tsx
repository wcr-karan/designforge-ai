import { AttemptDetailsPage } from '@/components/attempts-pages'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <AttemptDetailsPage attemptId={id} />
}
