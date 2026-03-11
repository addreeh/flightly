'use client'

import * as React from 'react'
import { useSearchParams } from 'next/navigation'
import { Globe2, Trophy, Sparkles, ArrowUp, ArrowDown, MapPin, Plane, CalendarDays } from 'lucide-react'
import { Header } from '@/components/header'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FlightDetailsModal } from '@/components/flight-details-modal'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import mockAnnual from '@/data/annual-mock.json'
import { MapPinIcon } from '@/components/ui/map-pin'
import { ClockIcon } from '@/components/ui/clock'
import { CalendarDaysIcon } from '@/components/ui/calendar-days'
import type { Flight } from '@/lib/flight-data'

interface OneWayInfo {
  price: number
  currency: string
  airline: string
  arrivalMinutes: number
  arrivalTime: string
  departureTime: string
}

interface AnnualEntry {
  year: number
  month: number
  origin: string
  destination_code: string
  destination_label: string
  depart_date: string
  return_date: string
  total_price: number
  currency: string
  outbound: OneWayInfo
  inbound: OneWayInfo
}

interface AnnualSummaryResponse {
  status: string
  generatedAt: string
  totalResults: number
  allResults?: AnnualEntry[]
  bestPerMonth: Record<string, AnnualEntry>
  bestPerDestAndMonth: Record<string, AnnualEntry>
  topGlobal: AnnualEntry[]
}

export default function AnnualPage() {
  const searchParams = useSearchParams()
  const [data, setData] = React.useState<AnnualSummaryResponse | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [selectedFlight, setSelectedFlight] = React.useState<Flight | null>(null)
  const [selectedWeekend, setSelectedWeekend] = React.useState<AnnualEntry | null>(null)
  const [detailsOpen, setDetailsOpen] = React.useState(false)

  const USE_MOCK = true

  React.useEffect(() => {
    const load = async () => {
      try {
        if (USE_MOCK) {
          setData(mockAnnual as unknown as AnnualSummaryResponse)
          setError(null)
          setLoading(false)
          return
        }

        const originsParam = searchParams.get('origins')
        const destinationsParam = searchParams.get('destinations')

        const qs = new URLSearchParams()
        if (originsParam) qs.set('origins', originsParam)
        if (destinationsParam) qs.set('destinations', destinationsParam)

        const url =
          qs.toString().length > 0
            ? `/api/flights/annual?${qs.toString()}`
            : '/api/flights/annual'

        const res = await fetch(url)
        if (!res.ok) {
          throw new Error('No se pudo cargar el resumen anual')
        }
        const json = (await res.json()) as AnnualSummaryResponse
        setData(json)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // Formatting helpers
  const formatMoney = (value: number, currency: string) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(value)

  const formatMonthLabel = (monthKey: string) => {
    const [yearStr, monthStr] = monthKey.split('-')
    const year = Number(yearStr)
    const month = Number(monthStr)
    const d = new Date(year, month - 1, 1)
    const label = d.toLocaleDateString('es-ES', {
      month: 'long',
      year: 'numeric',
    })
    return label.charAt(0).toUpperCase() + label.slice(1)
  }

  const formatDateRange = (from: string, to: string) => {
    const fromDate = new Date(from)
    const toDate = new Date(to)
    const fromStr = fromDate.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
    const toStr = toDate.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
    return `${fromStr} - ${toStr}`
  }

  const formatTimeRange = (entry: AnnualEntry) => {
    const clean = (value?: string | null) => {
      if (!value) return ''
      if (value.includes('null') || value.includes('undefined')) return ''
      return value
    }

    const outDep = clean(entry.outbound?.departureTime)
    const outArr = clean(entry.outbound?.arrivalTime)
    const inDep = clean(entry.inbound?.departureTime)
    const inArr = clean(entry.inbound?.arrivalTime)

    const parts: string[] = []

    if (outDep && outArr) {
      parts.push(`Ida ${outDep}-${outArr}`)
    }
    if (inDep && inArr) {
      parts.push(`Vuelta ${inDep}-${inArr}`)
    }

    if (parts.length === 0) {
      return 'Horario por confirmar'
    }

    return parts.join(' | ')
  }

  const selectedOrigins = React.useMemo(() => {
    const raw = searchParams.get('origins')
    if (!raw) return []
    return raw.split(',').filter(Boolean)
  }, [searchParams])

  const selectedDestinations = React.useMemo(() => {
    const raw = searchParams.get('destinations')
    if (!raw) return []
    return raw.split(',').filter(Boolean)
  }, [searchParams])

  const subtitleText = React.useMemo(() => {
    if (selectedOrigins.length || selectedDestinations.length) {
      const originsLabel =
        selectedOrigins.length > 0 ? selectedOrigins.join(' / ') : 'AGP / SVQ'
      const destLabel =
        selectedDestinations.length > 0
          ? selectedDestinations.join(', ')
          : 'EDI, KRK, MXP, LIN, BGY'
      return `${originsLabel} > ${destLabel} - busqueda anual dinamica`
    }
    return 'AGP / SVQ > EDI, KRK, MXP, LIN, BGY - busqueda anual dinamica'
  }, [selectedOrigins, selectedDestinations])

  const loadingSteps = React.useMemo(
    () => [
      'Generando todas las combinaciones posibles...',
      'Consultando Google Flights para cada combinacion...',
      'Analizando precios para cada fin de semana...',
      'Ordenando los mejores para mostrarte el resumen...',
    ],
    [],
  )

  const [currentLoadingStep, setCurrentLoadingStep] = React.useState(0)

  React.useEffect(() => {
    if (!loading) {
      setCurrentLoadingStep(0)
      return
    }

    const id = setInterval(() => {
      setCurrentLoadingStep((prev) => (prev + 1) % loadingSteps.length)
    }, 2200)

    return () => clearInterval(id)
  }, [loading, loadingSteps])

  const bestPerDestination = React.useMemo(() => {
    if (!data?.allResults) return []
    const byDest = new Map<string, AnnualEntry>()

    for (const entry of data.allResults) {
      const existing = byDest.get(entry.destination_code)
      if (!existing || entry.total_price < existing.total_price) {
        byDest.set(entry.destination_code, entry)
      }
    }

    return Array.from(byDest.values()).sort((a, b) => a.total_price - b.total_price)
  }, [data])

  const groupedBestPerDestAndMonth = React.useMemo(() => {
    if (!data) return {}
    const groups: Record<
      string,
      {
        code: string
        label: string
        items: { monthKey: string; entry: AnnualEntry }[]
      }
    > = {}

    Object.entries(data.bestPerDestAndMonth).forEach(([key, entry]) => {
      const [code, monthKey] = key.split('|')
      if (!groups[code]) {
        groups[code] = {
          code,
          label: entry.destination_label,
          items: [],
        }
      }
      groups[code].items.push({ monthKey, entry })
    })

    Object.values(groups).forEach((group) => {
      group.items.sort((a, b) => (a.monthKey < b.monthKey ? -1 : 1))
    })

    return groups
  }, [data])

  // Filter states - Top section
  const [topDestFilter, setTopDestFilter] = React.useState<string>('ALL')
  const [topOriginFilter, setTopOriginFilter] = React.useState<string>('ALL')
  const [topSortField, setTopSortField] = React.useState<'price' | 'date'>('price')
  const [topSortDirection, setTopSortDirection] = React.useState<'asc' | 'desc'>('asc')
  
  // Filter states - Group section
  const [groupDestFilter, setGroupDestFilter] = React.useState<string>('ALL')
  const [monthFilter, setMonthFilter] = React.useState<string>('ALL')
  const [groupSortField, setGroupSortField] = React.useState<'price' | 'date'>('price')
  const [groupSortDirection, setGroupSortDirection] = React.useState<'asc' | 'desc'>('asc')

  const monthOptions = React.useMemo(() => {
    const keys = new Set<string>()
    Object.values(groupedBestPerDestAndMonth).forEach((group) => {
      group.items.forEach(({ monthKey }) => keys.add(monthKey))
    })
    return Array.from(keys).sort()
  }, [groupedBestPerDestAndMonth])

  const CITY_FROM_CODE: Record<string, string> = React.useMemo(
    () => ({
      AGP: 'Malaga',
      SVQ: 'Sevilla',
      ALC: 'Alicante',
      PMI: 'Palma de Mallorca',
      MAD: 'Madrid',
      BIO: 'Bilbao',
      KRK: 'Cracovia',
    }),
    [],
  )

  const mapAnnualEntryToFlight = (entry: AnnualEntry): Flight => {
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
        time: entry.outbound.departureTime,
        date: entry.depart_date,
      },
      arrival: {
        airport: entry.destination_code,
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

  const formatAirportWithLabel = (code: string, label?: string) => {
    const city = label && label !== code ? label : CITY_FROM_CODE[code]
    if (city) {
      return `${city} (${code})`
    }
    return code
  }

  const handleSelectEntry = (entry: AnnualEntry) => {
    const flight = mapAnnualEntryToFlight(entry)
    setSelectedFlight(flight)
    setSelectedWeekend(entry)
    setDetailsOpen(true)
  }

  // Derived filter options for selects
  const destOptions = React.useMemo(() => {
    if (!data?.topGlobal) return []
    const seen = new Set<string>()
    return data.topGlobal
      .filter((e) => {
        if (seen.has(e.destination_code)) return false
        seen.add(e.destination_code)
        return true
      })
      .map((e) => ({
        code: e.destination_code,
        label: formatAirportWithLabel(e.destination_code, e.destination_label),
      }))
  }, [data, formatAirportWithLabel])

  const originOptions = React.useMemo(() => {
    if (!data?.topGlobal) return []
    const seen = new Set<string>()
    return data.topGlobal
      .filter((e) => {
        if (seen.has(e.origin)) return false
        seen.add(e.origin)
        return true
      })
      .map((e) => ({
        code: e.origin,
        label: formatAirportWithLabel(e.origin),
      }))
  }, [data, formatAirportWithLabel])

  const groupDestOptions = React.useMemo(() => {
    return Object.entries(groupedBestPerDestAndMonth).map(([code, group]) => ({
      code,
      label: formatAirportWithLabel(code, group.label),
    }))
  }, [groupedBestPerDestAndMonth, formatAirportWithLabel])

  return (
    <div className="min-h-screen bg-background">
      <Header backLinkHref="/" backLabel="Volver" />

      <main className="container mx-auto px-4 py-8 md:py-10">
        {/* Page header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground text-balance">
              Mejores fines de semana del ano
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground">
              {subtitleText}
            </p>
          </div>
          {data && (
            <Badge variant="outline" className="w-fit text-[11px]">
              Actualizado: {new Date(data.generatedAt).toLocaleString('es-ES')}
            </Badge>
          )}
        </div>

        {/* Loading state */}
        {loading && (
          <Card className="mb-6 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="h-12 w-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                    <Sparkles className="absolute inset-0 m-auto h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm md:text-base font-medium text-foreground">
                      Preparando tu busqueda anual de fines de semana...
                    </p>
                    <p className="text-xs md:text-sm text-muted-foreground mt-1">
                      Este proceso puede tardar unos segundos mientras analizamos decenas de combinaciones.
                    </p>
                  </div>
                </div>

                <div className="flex-1 max-w-md">
                  <ol className="space-y-1.5 text-xs md:text-sm">
                    {loadingSteps.map((step, index) => {
                      const isActive = index === currentLoadingStep
                      return (
                        <li
                          key={index}
                          className={`flex items-center gap-2 ${
                            isActive ? 'text-foreground' : 'text-muted-foreground'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isActive ? 'bg-primary animate-pulse' : 'bg-muted-foreground/40'
                            }`}
                          />
                          <span>{step}</span>
                        </li>
                      )
                    })}
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Skeleton placeholders while loading */}
        {loading && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-5 w-16" />
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="pt-4">
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Main content with Tabs */}
        {data && !loading && !error && (
          <Tabs defaultValue="destinations" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6 h-auto">
              <TabsTrigger value="destinations" className="gap-1.5 py-2.5 text-xs sm:text-sm">
                <Sparkles className="size-4" />
                <span className="hidden sm:inline">Mejores Destinos</span>
                <span className="sm:hidden">Destinos</span>
              </TabsTrigger>
              <TabsTrigger value="by-month" className="gap-1.5 py-2.5 text-xs sm:text-sm">
                <Globe2 className="size-4" />
                <span className="hidden sm:inline">Por Mes</span>
                <span className="sm:hidden">Meses</span>
              </TabsTrigger>
              <TabsTrigger value="ranking" className="gap-1.5 py-2.5 text-xs sm:text-sm">
                <Trophy className="size-4" />
                <span>Ranking</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Best Destinations */}
            <TabsContent value="destinations" className="space-y-6">
              <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-card to-background">
                <div className="pointer-events-none absolute inset-0 opacity-50">
                  <div className="absolute -right-24 -top-24 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
                  <div className="absolute -left-24 bottom-0 h-32 w-32 rounded-full bg-primary/5 blur-3xl" />
                </div>

                <CardHeader className="relative">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                        <Sparkles className="size-4" />
                      </div>
                      <div>
                        <CardTitle className="text-sm md:text-base">
                          Mejores destinos del ano
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Para cada destino, el fin de semana mas barato de todo el ano.
                        </CardDescription>
                      </div>
                    </div>

                    {data.totalResults > 0 && (
                      <Badge variant="secondary" className="w-fit gap-1.5 text-[11px]">
                        <span className="size-1.5 rounded-full bg-primary" />
                        {data.totalResults.toLocaleString('es-ES')} fines de semana analizados
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="relative">
                  <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                    {/* Featured destination (cheapest) */}
                    {bestPerDestination[0] && (
                      <Card
                        className="group cursor-pointer overflow-hidden border-primary/30 bg-background/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                        onClick={() => handleSelectEntry(bestPerDestination[0])}
                      >
                        <div className="absolute inset-x-0 -top-8 h-24 bg-gradient-to-b from-primary/15 to-transparent opacity-70" />
                        <CardHeader className="relative pb-2 pt-4">
                          <Badge className="w-fit gap-1 mb-2 bg-primary text-primary-foreground shadow-sm">
                            <Sparkles className="size-3" />
                            Destino mejor valorado
                          </Badge>
                          <CardTitle className="text-base">
                            {formatAirportWithLabel(
                              bestPerDestination[0].destination_code,
                              bestPerDestination[0].destination_label,
                            )}
                          </CardTitle>
                          <CardDescription className="text-[11px]">
                            {formatAirportWithLabel(bestPerDestination[0].origin)} {'>'}{' '}
                            {bestPerDestination[0].destination_code} |{' '}
                            {formatMonthLabel(
                              `${bestPerDestination[0].year}-${String(bestPerDestination[0].month).padStart(2, '0')}`,
                            )}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="relative pb-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-2 text-[11px] text-muted-foreground">
                              <Badge variant="secondary" className="gap-1 bg-primary/5 text-primary text-[10px]">
                                <CalendarDaysIcon className="text-primary" size={10} />
                                {formatDateRange(bestPerDestination[0].depart_date, bestPerDestination[0].return_date)}
                              </Badge>
                              <div className="flex items-center gap-2">
                                <MapPinIcon className="text-primary shrink-0" size={12} />
                                <span>
                                  {formatAirportWithLabel(bestPerDestination[0].origin)} {'>'}{' '}
                                  {formatAirportWithLabel(
                                    bestPerDestination[0].destination_code,
                                    bestPerDestination[0].destination_label,
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <ClockIcon className="text-muted-foreground shrink-0" size={10} />
                                <span>{formatTimeRange(bestPerDestination[0])}</span>
                              </div>
                              <div className="flex items-center gap-2 truncate">
                                <span className="inline-flex size-4 items-center justify-center rounded-full bg-primary/10 text-[9px] font-semibold text-primary">
                                  A
                                </span>
                                <span className="truncate">
                                  {bestPerDestination[0].outbound.airline} / {bestPerDestination[0].inbound.airline}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="block text-[11px] text-muted-foreground">desde</span>
                              <span className="text-lg font-semibold text-foreground">
                                {formatMoney(bestPerDestination[0].total_price, bestPerDestination[0].currency)}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Other destinations */}
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {bestPerDestination.slice(1).map((entry) => (
                        <Card
                          key={entry.destination_code}
                          className="group cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/40"
                          onClick={() => handleSelectEntry(entry)}
                        >
                          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary/40 via-primary/10 to-transparent opacity-70" />
                          <CardHeader className="pb-2 pt-3 px-3">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                                  {entry.destination_code}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-xs font-semibold text-foreground">
                                    {formatAirportWithLabel(entry.destination_code, entry.destination_label)}
                                  </span>
                                  <Badge variant="secondary" className="w-fit text-[10px] px-1.5 py-0 h-4">
                                    {formatMonthLabel(`${entry.year}-${String(entry.month).padStart(2, '0')}`)}
                                  </Badge>
                                </div>
                              </div>
                              <span className="text-sm font-semibold">
                                {formatMoney(entry.total_price, entry.currency)}
                              </span>
                            </div>
                          </CardHeader>
                          <CardContent className="px-3 pb-3 pt-0">
                            <div className="space-y-1.5 text-[11px] text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                <CalendarDaysIcon className="text-primary" size={10} />
                                <span className="font-medium text-foreground">
                                  {formatDateRange(entry.depart_date, entry.return_date)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 truncate">
                                <MapPinIcon className="text-primary shrink-0" size={12} />
                                <span className="truncate">
                                  {formatAirportWithLabel(entry.origin)} {'>'}{' '}
                                  {formatAirportWithLabel(entry.destination_code, entry.destination_label)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 truncate">
                                <ClockIcon className="text-muted-foreground shrink-0" size={10} />
                                <span className="truncate">{formatTimeRange(entry)}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 2: By Month */}
            <TabsContent value="by-month" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Globe2 className="size-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm md:text-base">
                        Mejor fin de semana por destino y mes
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Para cada destino seleccionado, el mejor finde de cada mes.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Filters using Select and ToggleGroup */}
                  {Object.keys(groupedBestPerDestAndMonth).length > 0 && (
                    <div className="flex flex-wrap items-center gap-3 mb-4 pb-4 border-b border-border">
                      <Select value={groupDestFilter} onValueChange={setGroupDestFilter}>
                        <SelectTrigger className="w-[180px] h-9 text-xs">
                          <MapPin className="size-3.5 mr-1.5 text-muted-foreground" />
                          <SelectValue placeholder="Destino" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">Todos los destinos</SelectItem>
                          {groupDestOptions.map((opt) => (
                            <SelectItem key={opt.code} value={opt.code}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {monthOptions.length > 0 && (
                        <Select value={monthFilter} onValueChange={setMonthFilter}>
                          <SelectTrigger className="w-[160px] h-9 text-xs">
                            <CalendarDays className="size-3.5 mr-1.5 text-muted-foreground" />
                            <SelectValue placeholder="Mes" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ALL">Todos los meses</SelectItem>
                            {monthOptions.map((mk) => (
                              <SelectItem key={mk} value={mk}>
                                {formatMonthLabel(mk)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      <Separator orientation="vertical" className="h-6 hidden sm:block" />

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          Ordenar
                        </span>
                        <ToggleGroup
                          type="single"
                          value={groupSortField}
                          onValueChange={(v) => v && setGroupSortField(v as 'price' | 'date')}
                          className="h-8"
                        >
                          <ToggleGroupItem value="price" className="h-7 px-2.5 text-xs">
                            Precio
                          </ToggleGroupItem>
                          <ToggleGroupItem value="date" className="h-7 px-2.5 text-xs">
                            Fecha
                          </ToggleGroupItem>
                        </ToggleGroup>

                        <ToggleGroup
                          type="single"
                          value={groupSortDirection}
                          onValueChange={(v) => v && setGroupSortDirection(v as 'asc' | 'desc')}
                          className="h-8"
                        >
                          <ToggleGroupItem value="asc" className="h-7 px-2 text-xs">
                            <ArrowUp className="size-3.5" />
                          </ToggleGroupItem>
                          <ToggleGroupItem value="desc" className="h-7 px-2 text-xs">
                            <ArrowDown className="size-3.5" />
                          </ToggleGroupItem>
                        </ToggleGroup>
                      </div>
                    </div>
                  )}

                  {/* Monthly grid */}
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {Object.values(groupedBestPerDestAndMonth)
                      .filter((group) => groupDestFilter === 'ALL' || group.code === groupDestFilter)
                      .map((group) => (
                        <Card key={group.code} className="bg-background/40">
                          <CardHeader className="pb-2 pt-3 px-3">
                            <CardTitle className="text-sm font-semibold text-foreground">
                              {formatAirportWithLabel(group.code, group.label)}
                            </CardTitle>
                            <CardDescription className="text-[11px]">
                              {group.items.filter(({ monthKey }) => monthFilter === 'ALL' || monthKey === monthFilter).length} meses disponibles
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="px-3 pb-3">
                            <ScrollArea className="max-h-60 pr-2">
                              <div className="space-y-2">
                                {group.items
                                  .filter(({ monthKey }) => monthFilter === 'ALL' || monthKey === monthFilter)
                                  .slice()
                                  .sort((a, b) => {
                                    const direction = groupSortDirection === 'asc' ? 1 : -1
                                    if (groupSortField === 'price') {
                                      return (a.entry.total_price - b.entry.total_price) * direction
                                    }
                                    const aDate = new Date(a.entry.depart_date).getTime()
                                    const bDate = new Date(b.entry.depart_date).getTime()
                                    return (aDate - bDate) * direction
                                  })
                                  .map(({ monthKey, entry }) => (
                                    <button
                                      key={`${group.code}-${monthKey}-${entry.depart_date}-${entry.origin}`}
                                      type="button"
                                      onClick={() => handleSelectEntry(entry)}
                                      className="w-full rounded-lg border border-border bg-card/60 px-3 py-2 text-left transition-colors hover:border-primary/40 hover:bg-accent/50"
                                    >
                                      <div className="flex items-center justify-between gap-3">
                                        <div className="flex flex-col gap-0.5 min-w-0">
                                          <span className="text-xs font-semibold text-foreground">
                                            {formatMonthLabel(monthKey)}
                                          </span>
                                          <span className="text-[11px] text-muted-foreground truncate">
                                            {formatAirportWithLabel(entry.origin)} {'>'}{' '}
                                            {formatAirportWithLabel(entry.destination_code, entry.destination_label)}
                                          </span>
                                          <span className="text-[11px] text-muted-foreground">
                                            {formatDateRange(entry.depart_date, entry.return_date)}
                                          </span>
                                          <span className="text-[11px] text-muted-foreground truncate">
                                            {formatTimeRange(entry)} | {entry.outbound.airline} / {entry.inbound.airline}
                                          </span>
                                        </div>
                                        <span className="text-xs font-semibold text-foreground shrink-0">
                                          {formatMoney(entry.total_price, entry.currency)}
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
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 3: Ranking */}
            <TabsContent value="ranking" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Trophy className="size-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm md:text-base">
                        Top mejores fines de semana del ano
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Ranking global de los findes mas baratos entre todos los destinos.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Filters */}
                  {data.topGlobal.length > 0 && (
                    <div className="flex flex-wrap items-center gap-3 mb-4 pb-4 border-b border-border">
                      <Select value={topDestFilter} onValueChange={setTopDestFilter}>
                        <SelectTrigger className="w-[180px] h-9 text-xs">
                          <MapPin className="size-3.5 mr-1.5 text-muted-foreground" />
                          <SelectValue placeholder="Destino" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">Todos los destinos</SelectItem>
                          {destOptions.map((opt) => (
                            <SelectItem key={opt.code} value={opt.code}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={topOriginFilter} onValueChange={setTopOriginFilter}>
                        <SelectTrigger className="w-[160px] h-9 text-xs">
                          <Plane className="size-3.5 mr-1.5 text-muted-foreground" />
                          <SelectValue placeholder="Origen" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">Todos</SelectItem>
                          {originOptions.map((opt) => (
                            <SelectItem key={opt.code} value={opt.code}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Separator orientation="vertical" className="h-6 hidden sm:block" />

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          Ordenar
                        </span>
                        <ToggleGroup
                          type="single"
                          value={topSortField}
                          onValueChange={(v) => v && setTopSortField(v as 'price' | 'date')}
                          className="h-8"
                        >
                          <ToggleGroupItem value="price" className="h-7 px-2.5 text-xs">
                            Precio
                          </ToggleGroupItem>
                          <ToggleGroupItem value="date" className="h-7 px-2.5 text-xs">
                            Fecha
                          </ToggleGroupItem>
                        </ToggleGroup>

                        <ToggleGroup
                          type="single"
                          value={topSortDirection}
                          onValueChange={(v) => v && setTopSortDirection(v as 'asc' | 'desc')}
                          className="h-8"
                        >
                          <ToggleGroupItem value="asc" className="h-7 px-2 text-xs">
                            <ArrowUp className="size-3.5" />
                          </ToggleGroupItem>
                          <ToggleGroupItem value="desc" className="h-7 px-2 text-xs">
                            <ArrowDown className="size-3.5" />
                          </ToggleGroupItem>
                        </ToggleGroup>
                      </div>
                    </div>
                  )}

                  {/* Ranking list */}
                  <div className="space-y-2">
                    {data.topGlobal
                      .filter(
                        (entry) =>
                          (topDestFilter === 'ALL' || entry.destination_code === topDestFilter) &&
                          (topOriginFilter === 'ALL' || entry.origin === topOriginFilter),
                      )
                      .slice()
                      .sort((a, b) => {
                        const direction = topSortDirection === 'asc' ? 1 : -1
                        if (topSortField === 'price') {
                          return (a.total_price - b.total_price) * direction
                        }
                        const aDate = new Date(a.depart_date).getTime()
                        const bDate = new Date(b.depart_date).getTime()
                        return (aDate - bDate) * direction
                      })
                      .map((entry, index) => (
                        <button
                          type="button"
                          key={`${entry.destination_code}-${entry.depart_date}-${entry.origin}-${index}`}
                          onClick={() => handleSelectEntry(entry)}
                          className="flex w-full items-center justify-between rounded-lg border border-border bg-background/40 px-3 py-2.5 gap-3 text-left transition-colors hover:border-primary/40 hover:bg-accent/50"
                        >
                          <div className="flex items-center gap-3">
                            <Badge
                              variant={index < 3 ? 'default' : 'secondary'}
                              className="w-8 justify-center text-[10px] font-semibold"
                            >
                              #{index + 1}
                            </Badge>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs font-semibold text-foreground">
                                {formatAirportWithLabel(entry.origin)} {'>'}{' '}
                                {formatAirportWithLabel(entry.destination_code, entry.destination_label)}
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                {formatDateRange(entry.depart_date, entry.return_date)}
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                {formatTimeRange(entry)} | {entry.outbound.airline} / {entry.inbound.airline}
                              </span>
                            </div>
                          </div>
                          <span className="text-sm font-semibold text-foreground">
                            {formatMoney(entry.total_price, entry.currency)}
                          </span>
                        </button>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </main>

      <FlightDetailsModal
        flight={selectedFlight}
        open={detailsOpen}
        onOpenChange={(open) => {
          setDetailsOpen(open)
          if (!open) {
            setSelectedFlight(null)
            setSelectedWeekend(null)
          }
        }}
        passengers={1}
        annualWeekend={selectedWeekend}
      />
    </div>
  )
}
