import { NextResponse } from 'next/server'
import { buscarCracoviaHastaJunio } from '@/lib/cracovia-weekends'

export const runtime = 'nodejs'
export const maxDuration = 120

export async function GET() {
  try {
    const entries = await buscarCracoviaHastaJunio()

    return NextResponse.json({
      destination: 'Cracovia (KRK)',
      origins: ['AGP', 'SVQ'],
      blackoutRanges: [
        { start: '2026-04-23', end: '2026-05-15' },
      ],
      totalWeekends: entries.length,
      weekends: entries,
    })
  } catch (error) {
    console.error('[cracovia-weekends] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to search weekends to Cracovia',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

