import { NextRequest, NextResponse } from 'next/server'
import { getProblemBySlug } from '@/lib/services/problem-service'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const problem = await getProblemBySlug(slug)

    if (!problem) {
      return NextResponse.json(
        { success: false, error: `Problem not found for slug: ${slug}` },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: problem })
  } catch (error: any) {
    console.error('Error fetching problem by slug:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}
