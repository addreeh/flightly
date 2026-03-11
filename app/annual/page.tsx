'use client'

import * as React from 'react'
import { useSearchParams } from 'next/navigation'
import { Globe2, Trophy, Loader2, Sparkles } from 'lucide-react'
import { Header } from '@/components/header'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FlightDetailsModal } from '@/components/flight-details-modal'
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
        console.log('[annual] Respuesta del servidor /api/flights/annual (page):', json)
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
    // Aseguramos que la primera letra del mes va en mayúscula
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
    return `${fromStr} – ${toStr}`
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
      parts.push(`Ida ${outDep}–${outArr}`)
    }
    if (inDep && inArr) {
      parts.push(`Vuelta ${inDep}–${inArr}`)
    }

    if (parts.length === 0) {
      return 'Horario por confirmar'
    }

    return parts.join(' · ')
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
      return `${originsLabel} → ${destLabel} — búsqueda anual dinámica`
    }
    return 'AGP / SVQ → EDI, KRK, MXP, LIN, BGY — búsqueda anual dinámica'
  }, [selectedOrigins, selectedDestinations])

  const loadingSteps = React.useMemo(
    () => [
      'Generando todas las combinaciones posibles…',
      'Consultando Google Flights para cada combinación…',
      'Analizando precios para cada fin de semana…',
      'Ordenando los mejores para mostrarte el resumen…',
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

  const [topDestFilter, setTopDestFilter] = React.useState<string>('ALL')
  const [topOriginFilter, setTopOriginFilter] = React.useState<string>('ALL')
  const [topSortField, setTopSortField] = React.useState<'price' | 'date'>('price')
  const [topSortDirection, setTopSortDirection] = React.useState<'asc' | 'desc'>('asc')
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
      AGP: 'Málaga',
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

  return (
    <div className="min-h-screen bg-background">
      <Header backLinkHref="/" backLabel="Volver" />

      <main className="container mx-auto px-4 py-8 md:py-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">
              Mejores fines de semana del año
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground">
              {subtitleText}
            </p>
          </div>
          {data && (
            <span className="text-[11px] md:text-xs text-muted-foreground">
              Actualizado: {new Date(data.generatedAt).toLocaleString('es-ES')}
            </span>
          )}
        </div>

        {loading && (
          <div className="rounded-2xl border border-border bg-card p-6 md:p-8 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="h-12 w-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div>
                  <p className="text-sm md:text-base font-medium text-foreground">
                    Preparando tu búsqueda anual de fines de semana…
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1">
                    Este proceso puede tardar unos segundos mientras analizamos decenas de combinaciones en Google
                    Flights.
                  </p>
                </div>
              </div>

              <div className="flex-1">
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
                          className={`mt-0.5 h-1.5 w-1.5 rounded-full ${
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
          </div>
        )}

        {error && !loading && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {data && !loading && !error && (
          <div className="space-y-8">
            {/* Mejor finde global por destino */}
            <section className="relative overflow-hidden rounded-2xl border border-border bg-linear-to-br from-primary/5 via-card to-background p-5 md:p-6">
              <div className="pointer-events-none absolute inset-0 opacity-50">
                  <div className="absolute -right-24 -top-24 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute -left-24 bottom-0 h-32 w-32 rounded-full bg-primary/5 blur-3xl" />
              </div>

              <div className="relative mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                    <Sparkles className="size-4" />
                  </div>
                  <div>
                    <h2 className="text-sm md:text-base font-semibold text-foreground">
                      Mejores destinos del año
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Para cada destino, el fin de semana más barato de todo el año.
                    </p>
                  </div>
                </div>

                {data.totalResults > 0 && (
                  <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-background/60 px-3 py-1 text-[11px] text-muted-foreground">
                    <span className="inline-flex size-1.5 rounded-full bg-primary" />
                    <span>
                      Analizados{' '}
                      <span className="font-semibold text-foreground">
                        {data.totalResults.toLocaleString('es-ES')}
                      </span>{' '}
                      fines de semana para encontrar estos resultados.
                    </span>
                  </div>
                )}
              </div>

              <div className="relative grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                {/* Destino más barato destacado */}
                {bestPerDestination[0] && (
                  <button
                    type="button"
                    onClick={() => {
                      const flight = mapAnnualEntryToFlight(bestPerDestination[0])
                      setSelectedFlight(flight)
                      setSelectedWeekend(bestPerDestination[0])
                      setDetailsOpen(true)
                    }}
                    className="group relative w-full overflow-hidden rounded-2xl border border-primary/30 bg-background/80 p-4 text-left text-xs shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="absolute inset-x-0 -top-8 h-24 bg-linear-to-b from-primary/15 to-transparent opacity-70" />
                    <div className="relative flex items-start justify-between gap-3">
                      <div className="flex flex-col gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground px-2 py-0.5 text-[10px] font-medium shadow-sm">
                          <Sparkles className="size-3" />
                          Destino mejor valorado
                        </span>
                        <h3 className="text-base font-semibold text-foreground">
                          {formatAirportWithLabel(
                            bestPerDestination[0].destination_code,
                            bestPerDestination[0].destination_label,
                          )}
                        </h3>
                        <p className="text-[11px] text-muted-foreground">
                          {formatAirportWithLabel(bestPerDestination[0].origin)} →{' '}
                          {bestPerDestination[0].destination_code} ·{' '}
                          {formatMonthLabel(
                            `${bestPerDestination[0].year}-${String(bestPerDestination[0].month).padStart(2, '0')}`,
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="block text-[11px] text-muted-foreground">desde</span>
                        <span className="text-lg font-semibold text-foreground">
                          {formatMoney(bestPerDestination[0].total_price, bestPerDestination[0].currency)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 space-y-2 text-[11px] text-muted-foreground">
                      {/* Fechas en grande, como elemento protagonista */}
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/5 px-2.5 py-1 text-[10px] font-medium text-primary">
                        <CalendarDaysIcon className="text-primary" size={10} />
                        <span>
                          {formatDateRange(bestPerDestination[0].depart_date, bestPerDestination[0].return_date)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <MapPinIcon className="text-primary" size={12} />
                        <span>
                          {formatAirportWithLabel(bestPerDestination[0].origin)} →{' '}
                          {formatAirportWithLabel(
                            bestPerDestination[0].destination_code,
                            bestPerDestination[0].destination_label,
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ClockIcon className="text-muted-foreground" size={10} />
                        <span>{formatTimeRange(bestPerDestination[0])}</span>
                      </div>
                      <div className="flex items-center gap-2 truncate">
                        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 text-[9px] font-semibold text-primary">
                          ✈
                        </span>
                        <span className="truncate">
                          {bestPerDestination[0].outbound.airline} / {bestPerDestination[0].inbound.airline}
                        </span>
                      </div>
                    </div>
                  </button>
                )}

                {/* Resto de destinos como “tarjetas de cápsula” en tonos azules */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {bestPerDestination.slice(1).map((entry) => (
                    <button
                      type="button"
                      key={entry.destination_code}
                      onClick={() => {
                        const flight = mapAnnualEntryToFlight(entry)
                        setSelectedFlight(flight)
                        setSelectedWeekend(entry)
                        setDetailsOpen(true)
                      }}
                      className="group relative w-full overflow-hidden rounded-xl border border-border/60 bg-background/80 p-3 text-left text-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md cursor-pointer"
                    >
                      <div className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-primary/40 via-primary/10 to-transparent opacity-70" />
                      <div className="relative flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                            {entry.destination_code}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[12px] font-semibold text-foreground">
                              {formatAirportWithLabel(entry.destination_code, entry.destination_label)}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-secondary/40 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                              {/* <CalendarDaysIcon className="size-3 text-primary" /> */}
                              {formatMonthLabel(`${entry.year}-${String(entry.month).padStart(2, '0')}`)}
                            </span>
                          </div>
                        </div>
                        <span className="text-[13px] font-semibold">
                          {formatMoney(entry.total_price, entry.currency)}
                        </span>
                      </div>

                      <div className="mt-2 space-y-1.5 text-[11px] text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <CalendarDaysIcon className="text-primary" size={10} />
                          <span className="font-medium text-foreground">
                            {formatDateRange(entry.depart_date, entry.return_date)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <MapPinIcon className="text-primary" size={12} />
                          <span className="truncate">
                            {formatAirportWithLabel(entry.origin)} →{' '}
                            {formatAirportWithLabel(entry.destination_code, entry.destination_label)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <ClockIcon className="text-muted-foreground" size={10} />
                          <span className="truncate">{formatTimeRange(entry)}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Mejor por destino y mes */}
            <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Globe2 className="size-4" />
                </div>
                <div>
                  <h2 className="text-sm md:text-base font-semibold text-foreground">
                    Mejor fin de semana por destino y mes
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Para cada destino seleccionado, el mejor finde de cada mes.
                  </p>
                </div>
              </div>

              {Object.keys(groupedBestPerDestAndMonth).length > 0 && (
                <div className="mb-4 space-y-2 text-[11px]">
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Filtrar destinos
                    </span>
                    <button
                      type="button"
                      onClick={() => setGroupDestFilter('ALL')}
                      className={`px-2 py-1 rounded-full border ${
                        groupDestFilter === 'ALL'
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-card text-muted-foreground border-border'
                      }`}
                    >
                      Todos
                    </button>
                    {Object.keys(groupedBestPerDestAndMonth).map((code) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => setGroupDestFilter(code)}
                        className={`px-2 py-1 rounded-full border ${
                          groupDestFilter === code
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-card text-muted-foreground border-border'
                        }`}
                      >
                        {formatAirportWithLabel(code, groupedBestPerDestAndMonth[code]?.label)}
                      </button>
                    ))}
                  </div>

                  {monthOptions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Filtrar meses
                      </span>
                      <button
                        type="button"
                        onClick={() => setMonthFilter('ALL')}
                        className={`px-2 py-1 rounded-full border ${
                          monthFilter === 'ALL'
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-card text-muted-foreground border-border'
                        }`}
                      >
                        Todos
                      </button>
                      {monthOptions.map((monthKey) => (
                        <button
                          key={monthKey}
                          type="button"
                          onClick={() => setMonthFilter(monthKey)}
                          className={`px-2 py-1 rounded-full border ${
                            monthFilter === monthKey
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-card text-muted-foreground border-border'
                          }`}
                        >
                          {formatMonthLabel(monthKey)}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Ordenar
                    </span>
                    <div className="inline-flex rounded-full border border-border bg-card p-0.5">
                      <button
                        type="button"
                        onClick={() => setGroupSortField('price')}
                        className={`rounded-full px-2 py-0.5 text-[10px] ${
                          groupSortField === 'price'
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground'
                        }`}
                      >
                        Precio
                      </button>
                      <button
                        type="button"
                        onClick={() => setGroupSortField('date')}
                        className={`rounded-full px-2 py-0.5 text-[10px] ${
                          groupSortField === 'date'
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground'
                        }`}
                      >
                        Fecha
                      </button>
                    </div>
                    <div className="inline-flex rounded-full border border-border bg-card p-0.5">
                      <button
                        type="button"
                        onClick={() => setGroupSortDirection('asc')}
                        className={`rounded-full px-2 py-0.5 text-[10px] ${
                          groupSortDirection === 'asc'
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground'
                        }`}
                      >
                        Asc
                      </button>
                      <button
                        type="button"
                        onClick={() => setGroupSortDirection('desc')}
                        className={`rounded-full px-2 py-0.5 text-[10px] ${
                          groupSortDirection === 'desc'
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground'
                        }`}
                      >
                        Desc
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid gap-4 text-xs md:grid-cols-2 xl:grid-cols-3">
                {Object.values(groupedBestPerDestAndMonth)
                  .filter((group) => groupDestFilter === 'ALL' || group.code === groupDestFilter)
                  .map((group) => (
                  <div
                    key={group.code}
                    className="rounded-xl border border-border bg-background/40 p-3 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">
                          {formatAirportWithLabel(group.code, group.label)}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {group.code}
                        </span>
                      </div>
                    </div>
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
                            <div
                              key={`${group.code}-${monthKey}-${entry.depart_date}-${entry.origin}`}
                              className="rounded-lg border border-border bg-card/60 px-3 py-2 flex items-center justify-between gap-3"
                            >
                              <div className="flex flex-col gap-0.5">
                                <span className="font-semibold text-foreground">
                                  {formatMonthLabel(monthKey)}
                                </span>
                                <span className="text-[11px] text-muted-foreground">
                                  {formatAirportWithLabel(entry.origin)} →{' '}
                                  {formatAirportWithLabel(entry.destination_code, entry.destination_label)}
                                </span>
                                <span className="text-[11px] text-muted-foreground">
                                  {formatDateRange(entry.depart_date, entry.return_date)}
                                </span>
                                <span className="text-[11px] text-muted-foreground">
                                  {formatTimeRange(entry)} · {entry.outbound.airline} / {entry.inbound.airline}
                                </span>
                              </div>
                              <span className="font-semibold">
                                {formatMoney(entry.total_price, entry.currency)}
                              </span>
                            </div>
                          ))}
                      </div>
                    </ScrollArea>
                  </div>
                ))}
              </div>
            </section>

            {/* Top global con filtro simple por destino */}
            <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Trophy className="size-4" />
                </div>
                <div>
                  <h2 className="text-sm md:text-base font-semibold text-foreground">
                    Top mejores fines de semana del año
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Ranking global de los findes más baratos entre todos los destinos.
                  </p>
                </div>
              </div>

              {data.topGlobal.length > 0 && (
                <div className="mb-3 space-y-1.5 text-[11px]">
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Destinos
                    </span>
                    <button
                      type="button"
                      onClick={() => setTopDestFilter('ALL')}
                      className={`px-2 py-1 rounded-full border ${
                        topDestFilter === 'ALL'
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-card text-muted-foreground border-border'
                      }`}
                    >
                      Todos
                    </button>
                    {Array.from(new Set(data.topGlobal.map((e) => e.destination_code))).map((code) => {
                      const label =
                        data.topGlobal.find((e) => e.destination_code === code)?.destination_label ?? code
                      return (
                        <button
                          key={code}
                          type="button"
                          onClick={() => setTopDestFilter(code)}
                          className={`px-2 py-1 rounded-full border ${
                            topDestFilter === code
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-card text-muted-foreground border-border'
                          }`}
                        >
                          {formatAirportWithLabel(code, label)}
                        </button>
                      )
                    })}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Orígenes
                    </span>
                    <button
                      type="button"
                      onClick={() => setTopOriginFilter('ALL')}
                      className={`px-2 py-1 rounded-full border ${
                        topOriginFilter === 'ALL'
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-card text-muted-foreground border-border'
                      }`}
                    >
                      Todos
                    </button>
                    {Array.from(new Set(data.topGlobal.map((e) => e.origin))).map((origin) => (
                      <button
                        key={origin}
                        type="button"
                        onClick={() => setTopOriginFilter(origin)}
                        className={`px-2 py-1 rounded-full border ${
                          topOriginFilter === origin
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-card text-muted-foreground border-border'
                        }`}
                      >
                        {formatAirportWithLabel(origin)}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Ordenar
                    </span>
                    <div className="inline-flex rounded-full border border-border bg-card p-0.5">
                      <button
                        type="button"
                        onClick={() => setTopSortField('price')}
                        className={`rounded-full px-2 py-0.5 text-[10px] ${
                          topSortField === 'price'
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground'
                        }`}
                      >
                        Precio
                      </button>
                      <button
                        type="button"
                        onClick={() => setTopSortField('date')}
                        className={`rounded-full px-2 py-0.5 text-[10px] ${
                          topSortField === 'date'
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground'
                        }`}
                      >
                        Fecha
                      </button>
                    </div>
                    <div className="inline-flex rounded-full border border-border bg-card p-0.5">
                      <button
                        type="button"
                        onClick={() => setTopSortDirection('asc')}
                        className={`rounded-full px-2 py-0.5 text-[10px] ${
                          topSortDirection === 'asc'
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground'
                        }`}
                      >
                        Asc
                      </button>
                      <button
                        type="button"
                        onClick={() => setTopSortDirection('desc')}
                        className={`rounded-full px-2 py-0.5 text-[10px] ${
                          topSortDirection === 'desc'
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground'
                        }`}
                      >
                        Desc
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2 text-xs">
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
                      onClick={() => {
                        const flight = mapAnnualEntryToFlight(entry)
                        setSelectedFlight(flight)
                        setSelectedWeekend(entry)
                        setDetailsOpen(true)
                      }}
                      className="flex w-full items-center justify-between rounded-lg border border-border bg-background/40 px-3 py-2 gap-3 text-left transition-colors hover:border-primary/40 hover:bg-background/60"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-foreground">
                          #{index + 1} · {formatAirportWithLabel(entry.origin)} →{' '}
                          {formatAirportWithLabel(entry.destination_code, entry.destination_label)}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {formatDateRange(entry.depart_date, entry.return_date)}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {formatTimeRange(entry)} · {entry.outbound.airline} / {entry.inbound.airline}
                        </span>
                      </div>
                      <span className="font-semibold">
                        {formatMoney(entry.total_price, entry.currency)}
                      </span>
                    </button>
                  ))}
              </div>
            </section>
          </div>
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

