'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'

interface MonthlyEntry {
  monthKey: string
  monthLabel: string
  originLabel: string
  destinationLabel: string
  dateRange: string
  timeRange: string
  outboundAirline: string
  inboundAirline: string
  price: string
}

interface DestinationGroup {
  code: string
  label: string
  items: MonthlyEntry[]
}

interface MonthlyGridProps {
  groups: DestinationGroup[]
  onEntryClick?: (entry: MonthlyEntry, groupCode: string) => void
}

export function MonthlyGrid({ groups, onEntryClick }: MonthlyGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {groups.map((group) => (
        <Card key={group.code} className="bg-background/40">
          <CardHeader className="pb-2 pt-3 px-3">
            <CardTitle className="text-sm font-semibold text-foreground">
              {group.label} ({group.code})
            </CardTitle>
            <CardDescription className="text-[11px]">
              {group.items.length} meses disponibles
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <ScrollArea className="max-h-60 pr-2">
              <div className="space-y-2">
                {group.items.map((item, index) => (
                  <button
                    key={`${group.code}-${item.monthKey}-${index}`}
                    type="button"
                    onClick={() => onEntryClick?.(item, group.code)}
                    className="w-full rounded-lg border border-border bg-card/60 px-3 py-2 text-left transition-colors hover:border-primary/40 hover:bg-accent/50"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-xs font-semibold text-foreground">
                          {item.monthLabel}
                        </span>
                        <span className="text-[11px] text-muted-foreground truncate">
                          {item.originLabel} {'>'} {item.destinationLabel}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {item.dateRange}
                        </span>
                        <span className="text-[11px] text-muted-foreground truncate">
                          {item.timeRange} - {item.outboundAirline} / {item.inboundAirline}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-foreground shrink-0">
                        {item.price}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
