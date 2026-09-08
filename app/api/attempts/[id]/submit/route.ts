import { NextRequest, NextResponse } from 'next/server'
import { submitAndEvaluateAttempt } from '@/lib/services/evaluation-service'
import { SubmitAttemptSchema } from '@/lib/validation/schemas'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const validation = SubmitAttemptSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid submission data',
          details: validation.error.format(),
        },
        { status: 400 }
      )
    }

    const result = await submitAndEvaluateAttempt(id, validation.data.responses)
    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    console.error('Error in attempt submission:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Submission failed' },
      { status: 500 }
    )
  }
}
