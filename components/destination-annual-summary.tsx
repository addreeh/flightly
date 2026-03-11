import * as React from 'react'
import { Trophy, ExternalLink } from 'lucide-react'
import { CalendarDaysIcon } from '@/components/ui/calendar-days'

interface OneWayInfo {
  price: number
  currency: string
  airline: string
  departureTime: string
  arrivalMinutes: number
  arrivalTime: string
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
  allResults?: AnnualEntry[]
  bestPerDestAndMonth: Record<string, AnnualEntry>
  topGlobal: AnnualEntry[]
}

interface DestinationAnnualSummaryProps {
  destinationCode: string
  data: AnnualSummaryResponse
  onSelectWeekend?: (entry: AnnualEntry) => void
  passengerOptions?: number[]
}

const formatMoney = (value: number, currency: string) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(value)

const formatMonthLabel = (year: number, month: number) => {
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
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const toStr = toDate.toLocaleDateString('es-ES', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `${fromStr} – ${toStr}`
}

const formatTimeRange = (entry: AnnualEntry) => {
  const out = `${entry.outbound.departureTime}–${entry.outbound.arrivalTime}`
  const ret = `${entry.inbound.departureTime}–${entry.inbound.arrivalTime}`
  return `Ida ${out} · Vuelta ${ret}`
}

export function DestinationAnnualSummary({
  destinationCode,
  data,
  onSelectWeekend,
  passengerOptions,
}: DestinationAnnualSummaryProps) {
  const allForDest = React.useMemo(
    () => (data.allResults || []).filter((e) => e.destination_code === destinationCode),
    [data.allResults, destinationCode],
  )

  const passengerCounts = React.useMemo(
    () =>
      Array.from(
        new Set((passengerOptions || []).filter((n) => Number.isFinite(n) && n > 0)),
      ).sort((a, b) => a - b),
    [passengerOptions],
  )

  if (!allForDest.length) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
        No se han encontrado fines de semana para este destino en la búsqueda anual.
      </div>
    )
  }

  const destLabel = allForDest[0]?.destination_label ?? destinationCode

  // Mejor por mes para este destino
  const bestPerMonthForDest: Record<string, AnnualEntry> = {}
  for (const entry of allForDest) {
    const monthKey = `${entry.year}-${String(entry.month).padStart(2, '0')}`
    const current = bestPerMonthForDest[monthKey]
    if (!current || entry.total_price < current.total_price) {
      bestPerMonthForDest[monthKey] = entry
    }
  }

  // Top global para este destino
  const topForDest = [...allForDest].sort((a, b) => a.total_price - b.total_price).slice(0, 10)

  return (
    <div className="space-y-8">
      {/* Mejor finde por mes (solo este destino) */}
      <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CalendarDaysIcon className="text-primary" size={14} />
          </div>
          <div>
            <h2 className="text-sm md:text-base font-semibold text-foreground">
              Mejor fin de semana por mes · {destLabel} ({destinationCode})
            </h2>
            <p className="text-xs text-muted-foreground">
              Para cada mes, el finde más barato a este destino desde Málaga o Sevilla.
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(bestPerMonthForDest)
            .sort(([a], [b]) => (a < b ? -1 : 1))
            .map(([monthKey, entry]) => (
              <div
                key={monthKey}
                className="rounded-xl border border-border bg-linear-to-br from-background/70 to-primary/5 p-3 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">
                    {formatMonthLabel(entry.year, entry.month)}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {entry.origin} → {entry.destination_code}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">
                    {formatDateRange(entry.depart_date, entry.return_date)}
                  </span>
                  <span className="font-semibold">
                    {formatMoney(entry.total_price, entry.currency)}
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {formatTimeRange(entry)}
                </div>
                <div className="text-[11px] text-muted-foreground truncate">
                  {entry.outbound.airline} / {entry.inbound.airline}
                </div>
                {passengerCounts.length > 1 && (
                  <div className="text-[11px] text-muted-foreground mt-1">
                    {passengerCounts.map((p, idx) => (
                      <span key={p}>
                        {idx > 0 && ' · '}
                        {p} pax:{' '}
                        <span className="font-medium text-foreground">
                          {formatMoney(entry.total_price * p, entry.currency)}
                        </span>
                      </span>
                    ))}
                  </div>
                )}
                {onSelectWeekend && (
                  <button
                    type="button"
                    onClick={() => onSelectWeekend(entry)}
                    className="mt-2 inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-2.5 py-1 text-[11px] font-medium text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                  >
                    <ExternalLink className="size-3" />
                    Ver detalles de este finde
                  </button>
                )}
              </div>
            ))}
        </div>
      </section>

      {/* Top global para este destino */}
      <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Trophy className="size-4" />
          </div>
          <div>
            <h2 className="text-sm md:text-base font-semibold text-foreground">
              Top fines de semana más baratos · {destLabel}
            </h2>
            <p className="text-xs text-muted-foreground">
              Ranking de los mejores findes del año a este destino.
            </p>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          {topForDest.map((entry, index) => (
            <div
              key={`${entry.destination_code}-${entry.depart_date}-${entry.origin}-${index}`}
              className="flex items-center justify-between rounded-lg border border-border bg-background/40 px-3 py-2 gap-3 hover:bg-primary/5 transition-colors cursor-pointer"
              onClick={() => onSelectWeekend?.(entry)}
            >
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold text-foreground">
                  #{index + 1} · {entry.origin} → {destLabel} ({entry.destination_code})
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {formatDateRange(entry.depart_date, entry.return_date)}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {formatTimeRange(entry)} · {entry.outbound.airline} / {entry.inbound.airline}
                </span>
                {passengerCounts.length > 1 && (
                  <span className="text-[11px] text-muted-foreground">
                    {passengerCounts.map((p, i) => (
                      <span key={p}>
                        {i > 0 && ' · '}
                        {p} pax:{' '}
                        <span className="font-medium text-foreground">
                          {formatMoney(entry.total_price * p, entry.currency)}
                        </span>
                      </span>
                    ))}
                  </span>
                )}
              </div>
              <span className="font-semibold">
                {formatMoney(entry.total_price, entry.currency)}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

