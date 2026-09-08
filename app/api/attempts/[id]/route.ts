import { NextRequest, NextResponse } from 'next/server'
import {
  getAttemptById,
  saveAttemptResponses,
} from '@/lib/services/attempt-service'
import { SaveResponsesSchema } from '@/lib/validation/schemas'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const attempt = await getAttemptById(id)

    if (!attempt) {
      return NextResponse.json(
        { success: false, error: `Attempt not found: ${id}` },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: attempt })
  } catch (error: any) {
    console.error('Error fetching attempt by id:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validation = SaveResponsesSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid response format',
          details: validation.error.format(),
        },
        { status: 400 }
      )
    }

    const { responses, status } = validation.data
    const updatedAttempt = await saveAttemptResponses(id, responses, status)

    return NextResponse.json({ success: true, data: updatedAttempt })
  } catch (error: any) {
    console.error('Error saving attempt responses:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}
