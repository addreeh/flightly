'use client'

import * as React from 'react'
import { ArrowUpDown, Filter, Plane, Database, AlertCircle, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FlightCard } from '@/components/flight-card'
import { type Flight, UNIQUE_AIRPORTS } from '@/lib/flight-data'
import { cn } from '@/lib/utils'

interface FlightResultsProps {
  flights: Flight[]
  origins: string[]
  destinations: string[]
  onSelectFlight: (flight: Flight) => void
  isLoading?: boolean
  searchTime?: number
  sources?: string[]
  basePassengers?: number
  multiPassengerResults?: { passengers: number; flights: Flight[] }[]
}

type SortOption = 'price' | 'duration' | 'departure' | 'stops'

export function FlightResults({
  flights,
  origins,
  destinations,
  onSelectFlight,
  isLoading,
  searchTime,
  sources = [],
  basePassengers,
  multiPassengerResults,
}: FlightResultsProps) {
  const [sortBy, setSortBy] = React.useState<SortOption>('price')
  const [filterStops, setFilterStops] = React.useState<string>('all')
  const [filterOrigin, setFilterOrigin] = React.useState<string>('all')
  const [filterDestination, setFilterDestination] = React.useState<string>('all')
  const [filterAirline, setFilterAirline] = React.useState<string>('all')

  // Get unique airlines from results
  const uniqueAirlines = React.useMemo(() => {
    const airlines = [...new Set(flights.map(f => f.airline))]
    return airlines.sort()
  }, [flights])

  const filteredFlights = React.useMemo(() => {
    let result = [...flights]

    // Filter by stops
    if (filterStops !== 'all') {
      const maxStops = parseInt(filterStops)
      result = result.filter((f) => f.stops <= maxStops)
    }

    // Filter by origin
    if (filterOrigin !== 'all') {
      result = result.filter((f) => f.departure.airport === filterOrigin)
    }

    // Filter by destination
    if (filterDestination !== 'all') {
      result = result.filter((f) => f.arrival.airport === filterDestination)
    }

    // Filter by airline
    if (filterAirline !== 'all') {
      result = result.filter((f) => f.airline === filterAirline)
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.price - b.price
        case 'duration':
          return (a.durationMinutes || 0) - (b.durationMinutes || 0)
        case 'departure':
          return a.departure.time.localeCompare(b.departure.time)
        case 'stops':
          return a.stops - b.stops
        default:
          return 0
      }
    })

    return result
  }, [flights, sortBy, filterStops, filterOrigin, filterDestination, filterAirline])

  // Get price range
  const priceStats = React.useMemo(() => {
    if (filteredFlights.length === 0) return null
    const prices = filteredFlights.map(f => f.price)
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
      avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
    }
  }, [filteredFlights])

  const passengerComparison = React.useMemo(() => {
    if (!multiPassengerResults || !basePassengers) return null
    if (!multiPassengerResults.length) return null

    const baseEntry =
      multiPassengerResults.find((r) => r.passengers === basePassengers) ?? multiPassengerResults[0]
    if (!baseEntry.flights.length) return null

    const baseMin = Math.min(...baseEntry.flights.map((f) => f.price))

    const rows = multiPassengerResults
      .filter((r) => r.passengers !== baseEntry.passengers && r.flights.length)
      .sort((a, b) => a.passengers - b.passengers)
      .map((r) => {
        const realMin = Math.min(...r.flights.map((f) => f.price))
        return {
          passengers: r.passengers,
          base: baseMin,
          baseScaled: baseMin * r.passengers,
          real: realMin,
        }
      })

    if (!rows.length) return null

    return {
      basePassengers: baseEntry.passengers,
      baseMin,
      rows,
    }
  }, [multiPassengerResults, basePassengers])

  if (isLoading) {
    return (
      <div className="w-full py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="size-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <Plane className="absolute inset-0 m-auto size-6 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-foreground">Buscando vuelos en tiempo real...</p>
            <p className="text-sm text-muted-foreground">Consultando múltiples fuentes para encontrar las mejores ofertas</p>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Database className="size-4 text-muted-foreground animate-pulse" />
            <span className="text-xs text-muted-foreground">Recopilando datos de aerolíneas y agregadores</span>
          </div>
        </div>
      </div>
    )
  }

  if (flights.length === 0) {
    return (
      <div className="w-full py-16">
        <div className="flex flex-col items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted">
            <AlertCircle className="size-8 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-foreground">No se encontraron vuelos</p>
            <p className="text-sm text-muted-foreground mt-1">
              Intenta modificar tus criterios de búsqueda o seleccionar fechas diferentes
            </p>
          </div>
        </div>
      </div>
    )
  }

  const originCities = origins.map(code => UNIQUE_AIRPORTS.find(a => a.code === code)?.city || code)
  const destCities = destinations.map(code => UNIQUE_AIRPORTS.find(a => a.code === code)?.city || code)

  return (
    <div className="w-full">
      {/* Results Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {originCities.length === 1 ? originCities[0] : `${origins.length} orígenes`}
              <span className="text-primary mx-2">→</span>
              {destCities.length === 1 ? destCities[0] : `${destinations.length} destinos`}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <p className="text-sm text-muted-foreground">
                {filteredFlights.length} vuelos encontrados
              </p>
              {searchTime && (
                <Badge variant="outline" className="text-xs">
                  {(searchTime / 1000).toFixed(1)}s
                </Badge>
              )}
              {sources.length > 0 && (
                <div className="flex items-center gap-1">
                  {sources.map(source => (
                    <Badge 
                      key={source} 
                      variant="secondary" 
                      className={cn(
                        "text-xs capitalize",
                        source === 'kiwi' && "bg-blue-100 text-blue-700",
                        source === 'amadeus' && "bg-emerald-100 text-emerald-700",
                        source === 'aggregated' && "bg-amber-100 text-amber-700"
                      )}
                    >
                      {source === 'aggregated' ? 'Agregador' : source}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            {priceStats && (
              <p className="text-sm text-muted-foreground mt-1">
                Precios desde <span className="font-semibold text-foreground">€{priceStats.min}</span>
                {' · '}Precio medio <span className="font-medium">€{priceStats.avg}</span>
              </p>
            )}
            {passengerComparison && (
              <div className="mt-2 text-[11px] text-muted-foreground space-y-1">
                <p>
                  Comparativa por pasajeros (precio mínimo global base:{' '}
                  <span className="font-semibold text-foreground">
                    €{passengerComparison.baseMin.toFixed(0)}
                  </span>
                  ):
                </p>
                <div className="flex flex-wrap gap-2">
                  {passengerComparison.rows.map((row) => (
                    <div
                      key={row.passengers}
                      className="rounded-full border border-border bg-background/60 px-3 py-1 flex items-center gap-2"
                    >
                      <span className="font-medium text-foreground">
                        {row.passengers} pax
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        base ×{row.passengers}:{' '}
                        <span className="font-medium text-foreground">
                          €{row.baseScaled.toFixed(0)}
                        </span>
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        real:{' '}
                        <span className="font-semibold text-foreground">
                          €{row.real.toFixed(0)}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Filter by Stops */}
          <Select value={filterStops} onValueChange={setFilterStops}>
            <SelectTrigger className="w-[150px] h-9 bg-card">
              <Filter className="size-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Escalas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las escalas</SelectItem>
              <SelectItem value="0">Solo directos</SelectItem>
              <SelectItem value="1">Máx. 1 escala</SelectItem>
              <SelectItem value="2">Máx. 2 escalas</SelectItem>
            </SelectContent>
          </Select>

          {/* Filter by Origin (if multiple) */}
          {origins.length > 1 && (
            <Select value={filterOrigin} onValueChange={setFilterOrigin}>
              <SelectTrigger className="w-[140px] h-9 bg-card">
                <MapPin className="size-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Origen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los orígenes</SelectItem>
                {origins.map(code => (
                  <SelectItem key={code} value={code}>{code}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Filter by Destination (if multiple) */}
          {destinations.length > 1 && (
            <Select value={filterDestination} onValueChange={setFilterDestination}>
              <SelectTrigger className="w-[140px] h-9 bg-card">
                <MapPin className="size-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Destino" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los destinos</SelectItem>
                {destinations.map(code => (
                  <SelectItem key={code} value={code}>{code}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Filter by Airline */}
          {uniqueAirlines.length > 1 && (
            <Select value={filterAirline} onValueChange={setFilterAirline}>
              <SelectTrigger className="w-[160px] h-9 bg-card">
                <Plane className="size-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Aerolínea" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las aerolíneas</SelectItem>
                {uniqueAirlines.map(airline => (
                  <SelectItem key={airline} value={airline}>{airline}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Sort */}
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[170px] h-9 bg-card">
              <ArrowUpDown className="size-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price">Precio más bajo</SelectItem>
              <SelectItem value="duration">Duración más corta</SelectItem>
              <SelectItem value="departure">Salida más temprana</SelectItem>
              <SelectItem value="stops">Menos escalas</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear filters */}
          {(filterStops !== 'all' || filterOrigin !== 'all' || filterDestination !== 'all' || filterAirline !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterStops('all')
                setFilterOrigin('all')
                setFilterDestination('all')
                setFilterAirline('all')
              }}
              className="h-9 text-primary"
            >
              Limpiar filtros
            </Button>
          )}
        </div>
      </div>

      {/* Flight Cards */}
      <div className="flex flex-col gap-4">
        {filteredFlights.map((flight, index) => (
          <FlightCard
            key={`${flight.id}-${index}`}
            flight={flight}
            onSelect={onSelectFlight}
          />
        ))}
      </div>

      {filteredFlights.length === 0 && flights.length > 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No hay vuelos que coincidan con los filtros seleccionados.
          </p>
          <Button
            variant="link"
            onClick={() => {
              setFilterStops('all')
              setFilterOrigin('all')
              setFilterDestination('all')
              setFilterAirline('all')
            }}
            className="text-primary mt-2"
          >
            Limpiar filtros
          </Button>
        </div>
      )}
    </div>
  )
}
