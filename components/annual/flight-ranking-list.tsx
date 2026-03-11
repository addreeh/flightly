'use client'

import * as React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface RankingEntry {
  id: string
  rank: number
  originLabel: string
  destinationLabel: string
  dateRange: string
  timeRange: string
  outboundAirline: string
  inboundAirline: string
  price: string
}

interface FlightRankingListProps {
  entries: RankingEntry[]
  onEntryClick?: (entry: RankingEntry) => void
}

export function FlightRankingList({ entries, onEntryClick }: FlightRankingListProps) {
  return (
    <Card>
      <CardContent className="pt-4 pb-2">
        <div className="space-y-2">
          {entries.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => onEntryClick?.(entry)}
              className="flex w-full items-center justify-between rounded-lg border border-border bg-background/40 px-3 py-2.5 gap-3 text-left transition-colors hover:border-primary/40 hover:bg-accent/50"
            >
              <div className="flex items-center gap-3">
                <Badge
                  variant={entry.rank <= 3 ? 'default' : 'secondary'}
                  className="w-8 justify-center text-[10px] font-semibold"
                >
                  #{entry.rank}
                </Badge>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold text-foreground">
                    {entry.originLabel} {'>'} {entry.destinationLabel}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {entry.dateRange}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {entry.timeRange} - {entry.outboundAirline} / {entry.inboundAirline}
                  </span>
                </div>
              </div>
              <span className="text-sm font-semibold text-foreground">{entry.price}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
