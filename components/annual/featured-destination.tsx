'use client'

import * as React from 'react'
import { Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPinIcon } from '@/components/ui/map-pin'
import { ClockIcon } from '@/components/ui/clock'
import { CalendarDaysIcon } from '@/components/ui/calendar-days'

interface FeaturedDestinationProps {
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

export function FeaturedDestination({
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
}: FeaturedDestinationProps) {
  return (
    <Card
      className="group relative cursor-pointer overflow-hidden border-primary/30 bg-background/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      onClick={onClick}
    >
      {/* Gradient accent */}
      <div className="absolute inset-x-0 -top-8 h-24 bg-gradient-to-b from-primary/15 to-transparent opacity-70" />
      
      <CardHeader className="relative pb-2 pt-4 px-4">
        <Badge className="w-fit gap-1 mb-2 bg-primary text-primary-foreground shadow-sm">
          <Sparkles className="size-3" />
          Destino mejor valorado
        </Badge>
        <h3 className="text-base font-semibold text-foreground">
          {destinationLabel} ({destinationCode})
        </h3>
        <p className="text-[11px] text-muted-foreground">
          {originLabel} ({originCode}) {'>'} {destinationCode} - {month}
        </p>
      </CardHeader>
      
      <CardContent className="relative px-4 pb-4 pt-0">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 text-[11px] text-muted-foreground flex-1">
            {/* Date badge */}
            <Badge variant="secondary" className="gap-1 bg-primary/5 text-primary text-[10px]">
              <CalendarDaysIcon className="text-primary" size={10} />
              {dateRange}
            </Badge>
            
            <div className="flex items-center gap-2">
              <MapPinIcon className="text-primary shrink-0" size={12} />
              <span>
                {originLabel} {'>'} {destinationLabel}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ClockIcon className="text-muted-foreground shrink-0" size={10} />
              <span>{timeRange}</span>
            </div>
            <div className="flex items-center gap-2 truncate">
              <span className="inline-flex size-4 items-center justify-center rounded-full bg-primary/10 text-[9px] font-semibold text-primary">
                {'<'}
              </span>
              <span className="truncate">
                {outboundAirline} / {inboundAirline}
              </span>
            </div>
          </div>
          
          <div className="text-right">
            <span className="block text-[11px] text-muted-foreground">desde</span>
            <span className="text-lg font-semibold text-foreground">{price}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
