import { NextRequest, NextResponse } from 'next/server'
import {
  getOrCreateActiveAttempt,
  listAttempts,
} from '@/lib/services/attempt-service'
import { CreateOrResumeAttemptSchema } from '@/lib/validation/schemas'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const filter = searchParams.get('filter') as
      | 'ALL'
      | 'REVIEWED'
      | 'IN_PROGRESS'
      | 'DRAFTS'
      | null

    const attempts = await listAttempts(filter || 'ALL')
    return NextResponse.json({ success: true, data: attempts })
  } catch (error: any) {
    console.error('Error listing attempts:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = CreateOrResumeAttemptSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body',
          details: validation.error.format(),
        },
        { status: 400 }
      )
    }

    const { problemSlug, userId } = validation.data
    const attempt = await getOrCreateActiveAttempt(problemSlug, userId)

    return NextResponse.json({ success: true, data: attempt })
  } catch (error: any) {
    console.error('Error creating or resuming attempt:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}
