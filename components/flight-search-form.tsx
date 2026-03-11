'use client'

import * as React from 'react'
import { ArrowRightLeft, Search, Users, RefreshCw, Check } from 'lucide-react'
import { type DateRange } from 'react-day-picker'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MultiAirportSelector } from '@/components/multi-airport-selector'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { DateRangePicker } from '@/components/date-range-picker'
import { cn } from '@/lib/utils'

export interface FlightSearchParams {
  origins: string[]
  destinations: string[]
  dateRange: DateRange | undefined
  passengers: number
  /**
   * Opciones de número de pasajeros a comparar (por ejemplo [1, 2])
   */
  passengerOptions?: number[]
  /**
   * Fines de semana (pares salida/vuelta) dentro del rango seleccionado
   * que el usuario quiere excluir, codificados como "YYYY-MM-DD|YYYY-MM-DD".
   */
  excludedWeekendKeys?: string[]
}

interface FlightSearchFormProps {
  onSearch: (params: FlightSearchParams) => void
  isSearching?: boolean
  initialParams?: Partial<FlightSearchParams>
}

export function FlightSearchForm({ onSearch, isSearching, initialParams }: FlightSearchFormProps) {
  const today = React.useMemo(() => new Date(), [])
  const endOfMay = React.useMemo(
    () => new Date(today.getFullYear(), 4, 31),
    [today],
  )

  const [origins, setOrigins] = React.useState<string[]>(initialParams?.origins ?? ['AGP', 'SVQ'])
  const [destinations, setDestinations] = React.useState<string[]>(
    initialParams?.destinations ?? ['KRK'],
  )
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(
    initialParams?.dateRange ?? { from: today, to: endOfMay },
  )
  const [passengerOptions, setPassengerOptions] = React.useState<number[]>(
    initialParams?.passengerOptions ?? [1, 2],
  )
  const [excludedWeekendKeys, setExcludedWeekendKeys] = React.useState<string[]>([])

  const weekendOptions = React.useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return []

    const options: { key: string; depart: Date; ret: Date }[] = []

    const start = new Date(dateRange.from)
    const end = new Date(dateRange.to)

    let current = new Date(start)
    while (current <= end) {
      const weekday = current.getDay() // 0=dom, 1=lun, ..., 5=vie
      const daysToFriday = (5 - weekday + 7) % 7
      const friday = new Date(current)
      friday.setDate(friday.getDate() + daysToFriday)
      if (friday > end) break
      const monday = new Date(friday)
      monday.setDate(monday.getDate() + 3)
      if (monday <= end) {
        const departStr = friday.toISOString().slice(0, 10)
        const retStr = monday.toISOString().slice(0, 10)
        const key = `${departStr}|${retStr}`
        options.push({ key, depart: friday, ret: monday })
      }
      current = new Date(friday)
      current.setDate(current.getDate() + 7)
    }

    // Rango por defecto a excluir: 23 abril - 15 mayo del año actual del rango
    const blackoutStart = new Date(start.getFullYear(), 3, 23) // meses base 0
    const blackoutEnd = new Date(start.getFullYear(), 4, 15)

    const defaultBlackoutKeys = options
      .filter(({ depart, ret }) => depart <= blackoutEnd && ret >= blackoutStart)
      .map((o) => o.key)

    // Limpiar exclusiones que ya no existen en el rango
    // y, si no hay ninguna seleccionada todavía, aplicar por defecto el blackout
    setExcludedWeekendKeys((prev) => {
      const filtered = prev.filter((k) => options.some((o) => o.key === k))
      if (filtered.length === 0 && defaultBlackoutKeys.length > 0) {
        return defaultBlackoutKeys
      }
      return filtered
    })

    return options
  }, [dateRange?.from, dateRange?.to])

  const toggleExcludedWeekend = (key: string) => {
    setExcludedWeekendKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    )
  }

  const handleSwapAirports = () => {
    const tempOrigins = origins
    setOrigins(destinations)
    setDestinations(tempOrigins)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const sorted = passengerOptions.length > 0 ? [...passengerOptions].sort((a, b) => a - b) : [1]
    const basePassengers = sorted[0]
    onSearch({
      origins,
      destinations,
      dateRange,
      passengers: basePassengers,
      passengerOptions: sorted,
      excludedWeekendKeys,
    })
  }

  const isValid = origins.length > 0 && destinations.length > 0 && dateRange?.from

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="bg-card border border-border rounded-2xl p-4 md:p-6 shadow-sm">
        {/* Main Search Row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-[1fr_auto_1fr]">
          {/* Origins */}
          <div>
            <MultiAirportSelector
              values={origins}
              onValuesChange={setOrigins}
              placeholder="Selecciona aeropuertos de salida"
              label="Desde"
              maxSelections={10}
            />
          </div>

          {/* Swap Button - Desktop */}
          <div className="hidden lg:flex items-end pb-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleSwapAirports}
              disabled={origins.length === 0 && destinations.length === 0}
              className="rounded-full hover:bg-primary/10 hover:text-primary"
            >
              <ArrowRightLeft className="size-4" />
            </Button>
          </div>

          {/* Destinations */}
          <div>
            <MultiAirportSelector
              values={destinations}
              onValuesChange={setDestinations}
              placeholder="Selecciona aeropuertos de destino"
              label="Hasta"
              maxSelections={10}
            />
          </div>
        </div>

        {/* Mobile Swap Button */}
        <div className="flex justify-center lg:hidden my-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleSwapAirports}
            disabled={origins.length === 0 && destinations.length === 0}
            className="rounded-full hover:bg-primary/10 hover:text-primary"
          >
            <ArrowRightLeft className="size-4 mr-2" />
            Intercambiar
          </Button>
        </div>

        {/* Second Row: Dates, Passengers, Search */}
        <div className="grid gap-4 md:grid-cols-[1fr_auto_auto] mt-4 pt-4 border-t border-border">
          {/* Date Range */}
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />

          {/* Passengers (multi-select) */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Pasajeros
            </span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-14 px-3 justify-between bg-card hover:bg-secondary/50 border-border gap-3"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Users className="size-5 text-primary shrink-0" />
                    <span className="truncate text-left text-xs">
                      {passengerOptions.length === 0
                        ? 'Selecciona pasajeros'
                        : `${[...passengerOptions].sort((a, b) => a - b).join(', ')} pasajero${
                            passengerOptions.length > 1 ? 's' : ''
                          }`}
                    </span>
                  </div>
                  <Check className="size-3 opacity-60 ml-2" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="start">
                <div className="flex flex-col gap-2">
                  {[1, 2, 3, 4].map((num) => {
                    const active = passengerOptions.includes(num)
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() =>
                          setPassengerOptions((prev) =>
                            prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num],
                          )
                        }
                        className={cn(
                          'flex items-center justify-between rounded-md px-2 py-1 text-xs border transition-colors w-full',
                          active
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background text-foreground border-border hover:bg-secondary/60',
                        )}
                      >
                        <span>
                          {num} pasajero{num > 1 ? 's' : ''}
                        </span>
                        {active && <Check className="size-3" />}
                      </button>
                    )
                  })}
                  <button
                    type="button"
                    onClick={() => setPassengerOptions([1, 2])}
                    className="mt-1 text-[11px] text-muted-foreground hover:text-primary text-left"
                  >
                    Resetear a 1 y 2 pasajeros
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Search Button */}
          <div className="flex items-end">
            <Button
              type="submit"
              disabled={!isValid || isSearching}
              className={cn(
                'h-14 px-6 md:px-8 text-base font-semibold w-full md:w-auto',
                'bg-primary hover:bg-primary/90 text-primary-foreground',
                'disabled:opacity-50 cursor-pointer'
              )}
            >
              {isSearching ? (
                <>
                  <RefreshCw className="size-4 mr-2 animate-spin" />
                  <span className="hidden sm:inline">Buscando...</span>
                  <span className="sm:hidden">...</span>
                </>
              ) : (
                <>
                  <Search className="size-4 mr-2" />
                  <span className="hidden sm:inline">Buscar vuelos</span>
                  <span className="sm:hidden">Buscar</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Excluded date ranges (friday–monday pairs) within selected range */}
        {weekendOptions.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Excluir rangos de fechas del rango
              </span>
              <div className="flex flex-wrap gap-2">
                {weekendOptions.map(({ key, depart, ret }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleExcludedWeekend(key)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs border transition-colors',
                      excludedWeekendKeys.includes(key)
                        ? 'bg-destructive/10 text-destructive border-destructive/70'
                        : 'bg-secondary text-secondary-foreground border-border hover:bg-secondary/80',
                    )}
                  >
                    {depart.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} –{' '}
                    {ret.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Search Summary */}
        {(origins.length > 0 || destinations.length > 0) && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>Buscando vuelos</span>
              {origins.length > 0 && (
                <>
                  <span>desde</span>
                  <span className="font-medium text-foreground">
                    {origins.length === 1 
                      ? origins[0] 
                      : `${origins.length} aeropuertos`}
                  </span>
                </>
              )}
              {destinations.length > 0 && (
                <>
                  <span>hacia</span>
                  <span className="font-medium text-foreground">
                    {destinations.length === 1 
                      ? destinations[0] 
                      : `${destinations.length} destinos`}
                  </span>
                </>
              )}
              {origins.length > 0 && destinations.length > 0 && (
                <span className="text-xs">
                  ({origins.length * destinations.length} combinaciones)
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </form>
  )
}
