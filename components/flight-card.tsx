'use client'

import { Clock, Plane } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { type Flight, UNIQUE_AIRPORTS } from '@/lib/flight-data'
import { cn } from '@/lib/utils'

interface FlightCardProps {
  flight: Flight
  onSelect: (flight: Flight) => void
}

export function FlightCard({ flight, onSelect }: FlightCardProps) {
  const originAirport = UNIQUE_AIRPORTS.find((a) => a.code === flight.departure.airport)
  const destAirport = UNIQUE_AIRPORTS.find((a) => a.code === flight.arrival.airport)

  return (
    <div className="bg-card border border-border rounded-xl p-4 md:p-6 hover:shadow-md hover:border-primary/30 transition-all duration-200 group">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
        {/* Airline Info */}
        <div className="flex items-center gap-3 lg:w-[140px] shrink-0">
          <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm">
            {flight.airlineLogo}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-foreground truncate">
              {flight.airline}
            </span>
            <span className="text-xs text-muted-foreground">
              {flight.flightNumber}
            </span>
          </div>
        </div>

        {/* Flight Times */}
        <div className="flex-1 flex items-center gap-4">
          {/* Departure */}
          <div className="text-center min-w-[80px]">
            <div className="text-2xl font-bold text-foreground">
              {flight.departure.time}
            </div>
            <div className="text-sm text-muted-foreground">
              {flight.departure.airport}
            </div>
            {originAirport && (
              <div className="text-xs text-muted-foreground truncate max-w-[100px]">
                {originAirport.city}
              </div>
            )}
          </div>

          {/* Flight Path */}
          <div className="flex-1 flex flex-col items-center gap-1 px-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3" />
              {flight.duration}
            </div>
            <div className="relative w-full flex items-center">
              <div className="h-px flex-1 bg-border" />
              <div className="relative mx-2">
                {flight.stops === 0 ? (
                  <Plane className="size-4 text-primary rotate-90" />
                ) : (
                  <div className="flex items-center gap-1">
                    {Array.from({ length: flight.stops }).map((_, i) => (
                      <div
                        key={i}
                        className="size-2 rounded-full bg-accent border-2 border-card"
                      />
                    ))}
                  </div>
                )}
              </div>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="text-xs text-muted-foreground">
              {flight.stops === 0 ? (
                <span className="text-accent font-medium">Directo</span>
              ) : (
                <span>
                  {flight.stops} {flight.stops === 1 ? 'escala' : 'escalas'}
                  {flight.stopCities && (
                    <span className="hidden md:inline"> ({flight.stopCities.join(', ')})</span>
                  )}
                </span>
              )}
            </div>
          </div>

          {/* Arrival */}
          <div className="text-center min-w-[80px]">
            <div className="text-2xl font-bold text-foreground">
              {flight.arrival.time}
            </div>
            <div className="text-sm text-muted-foreground">
              {flight.arrival.airport}
            </div>
            {destAirport && (
              <div className="text-xs text-muted-foreground truncate max-w-[100px]">
                {destAirport.city}
              </div>
            )}
          </div>
        </div>

        {/* Price and Action */}
        <div className="flex items-center justify-between lg:justify-end gap-4 lg:w-[180px] shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-border">
          <div className="flex flex-col items-start lg:items-end">
            {flight.seatsLeft && (
              <Badge variant="destructive" className="mb-1 text-xs">
                {flight.seatsLeft} asientos
              </Badge>
            )}
            <div className="text-2xl font-bold text-foreground">
              {flight.currency === 'EUR' ? '€' : '$'}{flight.price}
            </div>
            <div className="text-xs text-muted-foreground">
              por persona
            </div>
          </div>
          <Button
            onClick={() => onSelect(flight)}
            className={cn(
              'shrink-0 font-semibold',
              'bg-primary hover:bg-primary/90 text-primary-foreground'
            )}
          >
            Seleccionar
          </Button>
        </div>
      </div>
    </div>
  )
}
