'use client'

import * as React from 'react'
import {
  Briefcase,
  Check,
  Clock,
  Luggage,
  Plane,
  Utensils,
  Wifi,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { type Flight, UNIQUE_AIRPORTS } from '@/lib/flight-data'
import type { AnnualEntry } from '@/lib/annual-search'

interface FlightDetailsModalProps {
  flight: Flight | null
  open: boolean
  onOpenChange: (open: boolean) => void
  passengers: number
  annualWeekend?: AnnualEntry | null
}

export function FlightDetailsModal({
  flight,
  open,
  onOpenChange,
  passengers,
  annualWeekend,
}: FlightDetailsModalProps) {
  if (!flight) return null

  const originAirport = UNIQUE_AIRPORTS.find((a) => a.code === flight.departure.airport)
  const destAirport = UNIQUE_AIRPORTS.find((a) => a.code === flight.arrival.airport)
  const totalPrice = flight.price * passengers
  const isAnnualWeekend = flight.source === 'google-flights-weekend-annual'

  const [showLogoZoom, setShowLogoZoom] = React.useState(false)

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const amenities = [
    { icon: Luggage, label: 'Equipaje de mano incluido', included: true },
    { icon: Briefcase, label: 'Equipaje facturado', included: Math.random() > 0.3 },
    { icon: Wifi, label: 'Wi-Fi a bordo', included: Math.random() > 0.5 },
    { icon: Utensils, label: 'Comida incluida', included: Math.random() > 0.6 },
  ]

  const buildGoogleFlightsUrl = (
    from: string,
    to: string,
    departDate: string,
    returnDate?: string,
  ) => {
    const q = returnDate
      ? `${from} to ${to} ${departDate} ${returnDate}`
      : `${from} to ${to} ${departDate}`
    const params = new URLSearchParams({ q })
    return `https://www.google.com/travel/flights?${params.toString()}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowLogoZoom(true)}
              className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm hover:bg-primary/20 transition-colors"
              aria-label="Ver logo en grande"
            >
              {flight.airlineLogo}
            </button>
            <div>
              <span className="text-foreground">{flight.airline}</span>
              <p className="text-sm font-normal text-muted-foreground">
                {flight.flightNumber} - {flight.cabinClass}
              </p>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Detalles del vuelo {flight.flightNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Flight / Weekend Route */}
          <div className="space-y-3">
            <div className="bg-secondary/50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                {/* Outbound */}
                <div className="text-center">
                  <div className="text-3xl font-bold text-foreground">
                    {flight.departure.time}
                  </div>
                  <div className="text-lg font-semibold text-foreground">
                    {flight.departure.airport}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {originAirport?.city}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatDateLabel(flight.departure.date)}
                  </div>
                </div>

                <div className="flex-1 px-4">
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="size-4" />
                      {flight.duration}
                    </div>
                    <div className="relative w-full flex items-center">
                      <div className="h-0.5 flex-1 bg-primary/30" />
                      <Plane className="mx-2 size-5 text-primary" />
                      <div className="h-0.5 flex-1 bg-primary/30" />
                    </div>
                    <Badge variant="secondary" className="bg-accent/20 text-accent-foreground">
                      Ida · Vuelo directo
                    </Badge>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-3xl font-bold text-foreground">
                    {flight.arrival.time}
                  </div>
                  <div className="text-lg font-semibold text-foreground">
                    {flight.arrival.airport}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {destAirport?.city}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatDateLabel(annualWeekend?.depart_date || flight.departure.date)}
                  </div>
                </div>
              </div>
            </div>

            {annualWeekend && (
              <div className="bg-secondary/40 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  {/* Return leg */}
                  <div className="text-center">
                    <div className="text-3xl font-bold text-foreground">
                      {annualWeekend.inbound.departureTime}
                    </div>
                    <div className="text-lg font-semibold text-foreground">
                      {annualWeekend.destination_code}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {destAirport?.city}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatDateLabel(annualWeekend.return_date)}
                    </div>
                  </div>

                  <div className="flex-1 px-4">
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="size-4" />
                        Vuelta · horario estimado
                      </div>
                      <div className="relative w-full flex items-center">
                        <div className="h-0.5 flex-1 bg-primary/30" />
                        <Plane className="mx-2 size-5 text-primary rotate-180" />
                        <div className="h-0.5 flex-1 bg-primary/30" />
                      </div>
                      <Badge variant="secondary" className="bg-accent/10 text-accent-foreground">
                        Vuelta · {annualWeekend.inbound.airline}
                      </Badge>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-3xl font-bold text-foreground">
                      {annualWeekend.inbound.arrivalTime}
                    </div>
                    <div className="text-lg font-semibold text-foreground">
                      {flight.departure.airport}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {originAirport?.city}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatDateLabel(annualWeekend.return_date)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Amenities */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">Incluido en tu vuelo</h3>
            <div className="grid grid-cols-2 gap-3">
              {amenities.map((amenity, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-2 p-2 rounded-lg ${
                    amenity.included
                      ? 'bg-primary/10 text-foreground'
                      : 'bg-muted/50 text-muted-foreground line-through'
                  }`}
                >
                  <amenity.icon className={`size-4 ${amenity.included ? 'text-primary' : ''}`} />
                  <span className="text-sm">{amenity.label}</span>
                  {amenity.included && <Check className="size-4 text-primary ml-auto" />}
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Price Summary */}
          <div className="bg-secondary/50 rounded-xl p-4">
            <h3 className="font-semibold text-foreground mb-3">Resumen de precio</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Precio por pasajero
                </span>
                <span className="text-foreground">
                  {flight.currency === 'EUR' ? '€' : '$'}{flight.price}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Pasajeros
                </span>
                <span className="text-foreground">
                  x{passengers}
                </span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-bold text-lg">
                <span className="text-foreground">Total</span>
                <span className="text-primary">
                  {flight.currency === 'EUR' ? '€' : '$'}{totalPrice}
                </span>
              </div>
            </div>
          </div>

          {flight.seatsLeft && (
            <div className="flex items-center justify-center">
              <Badge variant="destructive" className="text-sm">
                Solo quedan {flight.seatsLeft} asientos a este precio
              </Badge>
            </div>
          )}

          {/* Hint for annual weekend results */}
          {isAnnualWeekend && (
            <p className="text-[11px] text-muted-foreground text-center">
              Para los resultados anuales, las horas mostradas corresponden a la hora de llegada de
              la ida y la vuelta para ese fin de semana concreto.
            </p>
          )}

          {/* Source Info */}
          {/* {flight.source && (
            <div className="text-center">
              <span className="text-xs text-muted-foreground">
                Datos proporcionados por: <span className="capitalize font-medium">{flight.source === 'aggregated' ? 'Agregador de vuelos' : flight.source}</span>
              </span>
            </div>
          )} */}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Volver
          </Button>
          {isAnnualWeekend ? (
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              asChild
            >
              <a
                href={buildGoogleFlightsUrl(
                  flight.departure.airport,
                  flight.arrival.airport,
                  annualWeekend?.depart_date || flight.departure.date,
                  annualWeekend?.return_date,
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                Ver este fin de semana en Google Flights
              </a>
            </Button>
          ) : flight.deepLink ? (
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              asChild
            >
              <a href={flight.deepLink} target="_blank" rel="noopener noreferrer">
                Reservar en sitio oficial
              </a>
            </Button>
          ) : (
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
              Reservar ahora
            </Button>
          )}
        </DialogFooter>

        {showLogoZoom && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <button
              type="button"
              onClick={() => setShowLogoZoom(false)}
              className="absolute inset-0 cursor-default"
              aria-label="Cerrar vista ampliada del logo"
            />
            <div className="relative z-10 rounded-2xl bg-card px-8 py-6 shadow-xl flex flex-col items-center gap-4">
              <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-primary/10 text-primary text-5xl font-bold">
                {flight.airlineLogo}
              </div>
              <p className="text-sm text-muted-foreground text-center max-w-xs">
                Verifica que este es el logo y la aerolínea que quieres antes de continuar con la reserva.
              </p>
              <Button variant="outline" size="sm" onClick={() => setShowLogoZoom(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
