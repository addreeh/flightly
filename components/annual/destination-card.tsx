'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPinIcon } from '@/components/ui/map-pin'
import { ClockIcon } from '@/components/ui/clock'
import { CalendarDaysIcon } from '@/components/ui/calendar-days'

interface DestinationCardProps {
  destinationCode: string
  destinationLabel: string
  originCode: string
  originLabel: string
  month: string
  dateRange: string
  timeRange: string
  outboundAirline: string
  inboundAirline: string
  price: string
  onClick?: () => void
}

export function DestinationCard({
  destinationCode,
  destinationLabel,
  originCode,
  originLabel,
  month,
  dateRange,
  timeRange,
  outboundAirline,
  inboundAirline,
  price,
  onClick,
}: DestinationCardProps) {
  return (
    <Card
      className="group cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/40"
      onClick={onClick}
    >
      <CardHeader className="pb-2 pt-3 px-3">
        <div className="flex items-start gap-2">
          {/* Icon */}
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
            {destinationCode}
          </div>
          {/* Name + month — takes available space, clips if needed */}
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-xs font-semibold text-foreground leading-tight">
              {destinationLabel} ({destinationCode})
            </span>
            <Badge variant="secondary" className="w-fit text-[10px] px-1.5 py-0 h-4 shrink-0">
              {month}
            </Badge>
          </div>
          {/* Price — never shrinks, always right-aligned */}
          <span className="shrink-0 text-sm font-bold text-primary tabular-nums">
            {price}
          </span>
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-3 pt-0">
        <div className="space-y-1.5 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <CalendarDaysIcon className="text-primary" size={10} />
            <span className="font-medium text-foreground">{dateRange}</span>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <MapPinIcon className="text-primary shrink-0" size={12} />
            <span className="truncate">
              {originLabel} ({originCode}) {'>'} {destinationLabel}
            </span>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <ClockIcon className="text-muted-foreground shrink-0" size={10} />
            <span className="truncate">{timeRange}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex size-3.5 items-center justify-center rounded-full bg-primary/10 text-[8px] font-semibold text-primary">
              {'<'}
            </span>
            <span className="truncate">
              {outboundAirline} / {inboundAirline}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
