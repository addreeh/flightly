'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Search, ArrowRightLeft, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'
import { type DateRange } from 'react-day-picker'
import { Button } from '@/components/ui/button'
import { MultiAirportSelector } from '@/components/multi-airport-selector'
import { DateRangePicker } from '@/components/date-range-picker'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

export interface CompactSearchParams {
  origins: string[]
  destinations: string[]
  dateRange: DateRange | undefined
}

interface CompactSearchFormProps {
  initialOrigins?: string[]
  initialDestinations?: string[]
  initialDateRange?: DateRange
  onSearch?: (params: CompactSearchParams) => void
  className?: string
}

export function CompactSearchForm({
  initialOrigins = ['AGP', 'SVQ'],
  initialDestinations = ['KRK', 'EDI', 'MXP', 'LIN', 'BGY'],
  initialDateRange,
  onSearch,
  className,
}: CompactSearchFormProps) {
  const router = useRouter()
  const today = React.useMemo(() => new Date(), [])
  const endOfYear = React.useMemo(
    () => new Date(today.getFullYear(), 11, 31),
    [today],
  )

  const [origins, setOrigins] = React.useState<string[]>(initialOrigins)
  const [destinations, setDestinations] = React.useState<string[]>(initialDestinations)
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(
    initialDateRange ?? { from: today, to: endOfYear },
  )
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [isSearching, setIsSearching] = React.useState(false)

  const handleSwapAirports = () => {
    const tempOrigins = origins
    setOrigins(destinations)
    setDestinations(tempOrigins)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (onSearch) {
      onSearch({ origins, destinations, dateRange })
      return
    }

    // Default behavior: navigate to annual page with query params
    setIsSearching(true)
    const qs = new URLSearchParams()
    if (origins.length) qs.set('origins', origins.join(','))
    if (destinations.length) qs.set('destinations', destinations.join(','))
    if (dateRange?.from) qs.set('from', dateRange.from.toISOString().split('T')[0])
    if (dateRange?.to) qs.set('to', dateRange.to.toISOString().split('T')[0])

    router.push(`/annual?${qs.toString()}`)
  }

  const isValid = origins.length > 0 && destinations.length > 0

  // Summary text for collapsed view
  const summaryText = React.useMemo(() => {
    const originsStr = origins.length > 2 
      ? `${origins.slice(0, 2).join(', ')} +${origins.length - 2}` 
      : origins.join(', ')
    const destsStr = destinations.length > 2 
      ? `${destinations.slice(0, 2).join(', ')} +${destinations.length - 2}` 
      : destinations.join(', ')
    
    return `${originsStr || 'Sin origen'} > ${destsStr || 'Sin destino'}`
  }, [origins, destinations])

  return (
    <Card className={cn('border-primary/20 bg-card/50 backdrop-blur-sm', className)}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardContent className="p-3">
          {/* Collapsed header */}
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 text-left group"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                  <Search className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">
                    {summaryText}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {dateRange?.from && dateRange?.to
                      ? `${dateRange.from.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} - ${dateRange.to.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}`
                      : 'Selecciona fechas'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground hidden sm:inline">
                  {isExpanded ? 'Cerrar' : 'Editar busqueda'}
                </span>
                {isExpanded ? (
                  <ChevronUp className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                ) : (
                  <ChevronDown className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                )}
              </div>
            </button>
          </CollapsibleTrigger>

          {/* Expanded form */}
          <CollapsibleContent>
            <form onSubmit={handleSubmit} className="mt-4 pt-4 border-t border-border space-y-4">
              {/* Origins & Destinations row */}
              <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr]">
                <MultiAirportSelector
                  values={origins}
                  onValuesChange={setOrigins}
                  placeholder="Aeropuertos de salida"
                  label="Desde"
                  maxSelections={10}
                />

                <div className="hidden sm:flex items-end pb-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleSwapAirports}
                    disabled={origins.length === 0 && destinations.length === 0}
                    className="rounded-full hover:bg-primary/10 hover:text-primary size-8"
                  >
                    <ArrowRightLeft className="size-3.5" />
                  </Button>
                </div>

                <MultiAirportSelector
                  values={destinations}
                  onValuesChange={setDestinations}
                  placeholder="Aeropuertos de destino"
                  label="Hasta"
                  maxSelections={10}
                />
              </div>

              {/* Mobile swap button */}
              <div className="flex justify-center sm:hidden">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSwapAirports}
                  disabled={origins.length === 0 && destinations.length === 0}
                  className="rounded-full hover:bg-primary/10 hover:text-primary text-xs h-7"
                >
                  <ArrowRightLeft className="size-3 mr-1.5" />
                  Intercambiar
                </Button>
              </div>

              {/* Date range & Search button */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <DateRangePicker
                    dateRange={dateRange}
                    onDateRangeChange={setDateRange}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={!isValid || isSearching}
                  className="h-14 sm:h-auto sm:self-end px-6"
                >
                  {isSearching ? (
                    <>
                      <RefreshCw className="size-4 mr-2 animate-spin" />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <Search className="size-4 mr-2" />
                      Buscar
                    </>
                  )}
                </Button>
              </div>

              {/* Search summary */}
              {(origins.length > 0 || destinations.length > 0) && (
                <p className="text-[10px] text-muted-foreground text-center">
                  {origins.length * destinations.length} combinaciones de ruta
                </p>
              )}
            </form>
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  )
}
