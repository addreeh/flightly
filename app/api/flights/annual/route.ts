import { NextRequest, NextResponse } from 'next/server'
import { buscarAnualDinamico } from '@/lib/annual-search'

export const runtime = 'nodejs'
export const maxDuration = 120

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const endMonthParam = searchParams.get('endMonth')
    const topNParam = searchParams.get('topN')
    const originsParam = searchParams.get('origins')
    const destinationsParam = searchParams.get('destinations')
    const fromParam = searchParams.get('from')
    const toParam = searchParams.get('to')
    const excludedParam = searchParams.get('excluded')

    const endMonth = endMonthParam ? Number.parseInt(endMonthParam, 10) : 12
    const topN = topNParam ? Number.parseInt(topNParam, 10) : 10
    const origins = originsParam
      ? (originsParam.split(',').filter(Boolean) as any)
      : undefined
    const destinations = destinationsParam
      ? (destinationsParam.split(',').filter(Boolean) as any)
      : undefined

    const excludedWeekendKeys = excludedParam
      ? excludedParam
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean)
      : undefined

    const summary = await buscarAnualDinamico({
      endMonth,
      topN,
      origins,
      destinations,
      fromDate: fromParam ?? undefined,
      toDate: toParam ?? undefined,
      excludedWeekendKeys,
    })

    return NextResponse.json({
      status: 'ok',
      generatedAt: new Date().toISOString(),
      totalResults: summary.allResults.length,
      allResults: summary.allResults,
      bestPerMonth: summary.bestPerMonth,
      bestPerDestAndMonth: summary.bestPerDestAndMonth,
      topGlobal: summary.topGlobal,
    })
  } catch (error) {
    console.error('[annual] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to run annual search',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

