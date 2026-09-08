import { NextResponse } from 'next/server'
import { getAllProblems } from '@/lib/services/problem-service'

export async function GET() {
  try {
    const problems = await getAllProblems()
    return NextResponse.json({ success: true, data: problems })
  } catch (error: any) {
    console.error('Error fetching problems:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}
