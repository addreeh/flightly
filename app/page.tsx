'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { FlightSearchForm, type FlightSearchParams } from '@/components/flight-search-form'
import { FlightResults } from '@/components/flight-results'
import { FlightDetailsModal } from '@/components/flight-details-modal'
import { type Flight, type FlightSearchResponse } from '@/lib/flight-data'
import { Plane, Shield, Clock, CreditCard, Zap, Database } from 'lucide-react'
import { DestinationAnnualSummary } from '@/components/destination-annual-summary'
import type { AnnualEntry } from '@/lib/annual-search'

export default function Home() {
  const router = useRouter()
  const [flights, setFlights] = React.useState<Flight[]>([])
  const [isSearching, setIsSearching] = React.useState(false)
  const [hasSearched, setHasSearched] = React.useState(false)
  const [selectedFlight, setSelectedFlight] = React.useState<Flight | null>(null)
  const [searchParams, setSearchParams] = React.useState<{
    origins: string[]
    destinations: string[]
    passengers: number
    passengerOptions?: number[]
    excludedWeekendKeys?: string[]
  } | null>(null)
  const [searchMeta, setSearchMeta] = React.useState<{
    searchTime?: number
    sources?: string[]
  }>({})
  const [searchError, setSearchError] = React.useState<string | null>(null)
  const [multiPassengerResults, setMultiPassengerResults] = React.useState<
    { passengers: number; flights: Flight[] }[] | null
  >(null)
  const [selectedAnnualWeekend, setSelectedAnnualWeekend] = React.useState<AnnualEntry | null>(null)
  const [annualData, setAnnualData] = React.useState<{
    status: string
    generatedAt: string
    totalResults: number
    allResults?: any[]
    bestPerMonth: Record<string, any>
    bestPerDestAndMonth: Record<string, any>
    topGlobal: any[]
  } | null>(null)

  const resultsRef = React.useRef<HTMLDivElement>(null)

  const mapAnnualEntryToFlight = (entry: any): Flight => {
    const roundedTotal = Math.round(entry.total_price * 100) / 100
    const deepLinkParams = new URLSearchParams({
      q: `${entry.origin} to ${entry.destination_code} ${entry.depart_date} ${entry.return_date}`,
    })

    return {
      id: `ANNUAL-${entry.origin}-${entry.destination_code}-${entry.depart_date}`,
      airline: `${entry.outbound.airline} / ${entry.inbound.airline}`,
      airlineLogo: entry.outbound.airline.slice(0, 2).toUpperCase(),
      flightNumber: 'Fin de semana',
      departure: {
        airport: entry.origin,
        // Hora de salida de la ida (dato real del scraping)
        time: entry.outbound.departureTime,
        date: entry.depart_date,
      },
      arrival: {
        airport: entry.destination_code,
        // Hora de llegada de la ida
        time: entry.outbound.arrivalTime,
        date: entry.depart_date,
      },
      duration: 'fin de semana',
      durationMinutes: 72 * 60,
      stops: 0,
      stopCities: [],
      price: roundedTotal,
      currency: entry.currency,
      cabinClass: 'Economy',
      source: 'google-flights-weekend-annual',
      deepLink: `https://www.google.com/travel/flights?${deepLinkParams.toString()}`,
    }
  }

  const handleSearch = async (params: FlightSearchParams) => {
    if (!params.dateRange?.from) return

    // Si el usuario selecciona más de un destino,
    // lo llevamos a la vista anual agregada.
    if (params.destinations.length > 1) {
      const qs = new URLSearchParams()
      if (params.origins?.length) qs.set('origins', params.origins.join(','))
      if (params.destinations?.length) qs.set('destinations', params.destinations.join(','))
      if (params.dateRange.from)
        qs.set('from', params.dateRange.from.toISOString().split('T')[0])
      if (params.dateRange.to)
        qs.set('to', params.dateRange.to.toISOString().split('T')[0])
      if (params.excludedWeekendKeys?.length)
        qs.set('excluded', params.excludedWeekendKeys.join(','))

      router.push(`/annual?${qs.toString()}`)
      return
    }

    setIsSearching(true)
    setHasSearched(true)
    setSearchError(null)
    setAnnualData(null)
    setSearchParams({
      origins: params.origins,
      destinations: params.destinations,
      passengers: params.passengers,
      passengerOptions: params.passengerOptions,
      excludedWeekendKeys: params.excludedWeekendKeys,
    })

    try {
      // Si solo hay un destino, usamos la lógica anual (findes)
      if (params.destinations.length === 1) {
        const endMonth =
          params.dateRange.to?.getMonth() !== undefined
            ? params.dateRange.to.getMonth() + 1
            : undefined
        const qs = new URLSearchParams()
        if (endMonth) qs.set('endMonth', String(endMonth))
        if (params.origins?.length) qs.set('origins', params.origins.join(','))
        if (params.destinations?.length) qs.set('destinations', params.destinations.join(','))

        const res = await fetch(`/api/flights/annual?${qs.toString()}`)
        if (!res.ok) {
          throw new Error('Error en la búsqueda anual de fines de semana')
        }
        const json: {
          flights: Flight[]
          searchTime: number
          sources: string[]
          multiPassengerResults?: { passengers: number; flights: Flight[] }[]
        } = await res.json()
        console.log('[annual] Respuesta del servidor /api/flights/annual (home):', json)
        setAnnualData(json)
      } else {
        const response = await fetch('/api/flights/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            origins: params.origins,
            destinations: params.destinations,
            departureDate: params.dateRange.from.toISOString().split('T')[0],
            returnDate: params.dateRange.to?.toISOString().split('T')[0],
            passengers: params.passengers,
             // Por defecto comparamos 1 y 2 pasajeros
            passengerOptions: params.passengerOptions ?? [1, 2],
            currency: 'EUR',
            // Opcional: fines de semana a excluir dentro del rango seleccionado,
            // codificados como "YYYY-MM-DD|YYYY-MM-DD"
            excludedWeekends: params.excludedWeekendKeys,
          }),
        })

        if (!response.ok) {
          throw new Error('Error en la búsqueda de vuelos')
        }

        const data: FlightSearchResponse = await response.json()
        
        setFlights(data.flights)
        setSearchMeta({
          searchTime: data.searchTime,
          sources: data.sources,
        })
        setMultiPassengerResults(data.multiPassengerResults ?? null)
      }

      // Scroll to results (tanto para vista anual como normal)
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } catch (error) {
      console.error('[v0] Search error:', error)
      setSearchError('No se pudieron cargar los vuelos. Por favor, intenta de nuevo.')
      setFlights([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectDestination = (code: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-primary/5 to-background">
      <div className="flex-1 flex flex-col">
        <Header />

        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="container mx-auto px-4 relative">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium mb-4">
              <Zap className="size-4" />
              Búsqueda en tiempo real
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 text-balance">
              Compara vuelos de múltiples fuentes
            </h1>
            <p className="text-base md:text-lg text-muted-foreground mx-auto text-pretty">
              Selecciona múltiples aeropuertos de salida y destino. Nuestro sistema recopila datos en tiempo real para mostrarte las mejores opciones.
            </p>
          </div>

          <FlightSearchForm onSearch={handleSearch} isSearching={isSearching} />

          {/* CTA para exploración anual de fines de semana */}
          {!hasSearched && (
            <div className="mt-6 flex flex-col items-center gap-2">
              <p className="text-xs md:text-sm text-muted-foreground text-center">
                ¿Fechas flexibles? Explora todos los fines de semana desde Málaga y Sevilla a
                Edimburgo, Cracovia y Milán para este año.
              </p>
              <Link
                href="/annual"
                className="inline-flex items-center justify-center rounded-full border border-dashed border-primary/40 bg-primary/5 px-4 py-1.5 text-xs md:text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
              >
                Ver mejores fines de semana del año
              </Link>
            </div>
          )}
          
          {searchError && (
            <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-center">
              <p className="text-destructive text-sm">{searchError}</p>
            </div>
          )}
          </div>
        </section>

        {/* Features (solo antes de buscar) */}
        {!hasSearched && (
          <section className="border-y border-border bg-card mt-8">
            <div className="container mx-auto px-4 py-6 md:py-7">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
                  <Database className="size-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Datos en tiempo real</h3>
                  <p className="text-sm text-muted-foreground">Información actualizada al instante</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
                  <Shield className="size-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Múltiples fuentes</h3>
                  <p className="text-sm text-muted-foreground">Agregamos varios servicios</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
                  <Clock className="size-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Multi-aeropuerto</h3>
                  <p className="text-sm text-muted-foreground">Busca desde varios orígenes</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
                  <CreditCard className="size-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Sin cargos ocultos</h3>
                  <p className="text-sm text-muted-foreground">Precio final transparente</p>
                </div>
              </div>
            </div>
            </div>
          </section>
        )}

        {/* Results Section */}
        <div ref={resultsRef}>
          {(hasSearched || isSearching) && (
            <section className="container mx-auto px-4 py-8">
              {searchParams?.destinations.length === 1 && annualData ? (
                <DestinationAnnualSummary
                  destinationCode={searchParams.destinations[0]}
                  data={annualData}
                  passengerOptions={searchParams.passengerOptions}
                  onSelectWeekend={(entry) => {
                    const flightFromAnnual = mapAnnualEntryToFlight(entry)
                    setSelectedAnnualWeekend(entry)
                    setSelectedFlight(flightFromAnnual)
                  }}
                />
              ) : (
                <FlightResults
                  flights={flights}
                  origins={searchParams?.origins || []}
                  destinations={searchParams?.destinations || []}
                  onSelectFlight={setSelectedFlight}
                  isLoading={isSearching}
                  searchTime={searchMeta.searchTime}
                  sources={searchMeta.sources}
                  basePassengers={searchParams?.passengers}
                  multiPassengerResults={multiPassengerResults ?? undefined}
                />
              )}
            </section>
          )}
        </div>

        {/* Popular Destinations (oculto por ahora) */}

        {/* API Info Section (solo antes de buscar) */}
        {!hasSearched && (
          <section className="container mx-auto px-4 py-8 md:py-10">
            <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
            <h2 className="text-xl font-bold text-foreground mb-4">
              Ingeniería inversa en tiempo real
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm">
                    1
                  </div>
                  <h3 className="font-semibold text-foreground">Google Flights</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Utilizamos la librería google-flights-ts que hace scraping directo a Google Flights, codificando parámetros en protobuf y parseando los resultados.
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm">
                    2
                  </div>
                  <h3 className="font-semibold text-foreground">Búsqueda anual de fines de semana</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Calculamos de forma dinámica todos los fines de semana del año para encontrar las combinaciones más baratas de viernes a lunes, sin depender de datos estáticos.
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm">
                    3
                  </div>
                  <h3 className="font-semibold text-foreground">Agregación inteligente</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Los resultados de múltiples fuentes se deduplicados y normalizan, mostrándote las mejores opciones ordenadas por precio.
                </p>
              </div>
            </div>
            </div>
          </section>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-8">
        <div className="container mx-auto px-4 py-4 md:py-5">
          <p className="text-center text-xs md:text-sm text-muted-foreground">
            Desarrollado por{' '}
            <a
              href="https://adrianpino.vercel.app/"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-primary hover:underline"
            >
              Adrián Pino
            </a>
          </p>
        </div>
      </footer>

      {/* Flight Details Modal */}
      <FlightDetailsModal
        flight={selectedFlight}
        open={!!selectedFlight}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedFlight(null)
            setSelectedAnnualWeekend(null)
          }
        }}
        passengers={searchParams?.passengers || 1}
        annualWeekend={selectedAnnualWeekend}
      />
    </div>
  )
}
