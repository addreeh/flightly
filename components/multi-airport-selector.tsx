'use client'

import * as React from 'react'
import { Check, MapPin, X, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { UNIQUE_AIRPORTS, AIRPORTS_BY_REGION, type Airport } from '@/lib/flight-data'

interface MultiAirportSelectorProps {
  values: string[]
  onValuesChange: (values: string[]) => void
  placeholder: string
  label: string
  maxSelections?: number
}

export function MultiAirportSelector({
  values,
  onValuesChange,
  placeholder,
  label,
  maxSelections = 5,
}: MultiAirportSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')

  const selectedAirports = UNIQUE_AIRPORTS.filter((airport) => values.includes(airport.code))

  const handleSelect = (code: string) => {
    if (values.includes(code)) {
      onValuesChange(values.filter((v) => v !== code))
    } else if (values.length < maxSelections) {
      onValuesChange([...values, code])
    }
  }

  const handleRemove = (code: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onValuesChange(values.filter((v) => v !== code))
  }

  // Filter airports based on search
  const filteredAirportsByRegion = React.useMemo(() => {
    if (!search) return AIRPORTS_BY_REGION
    
    const searchLower = search.toLowerCase()
    const filtered: Record<string, Airport[]> = {}
    
    Object.entries(AIRPORTS_BY_REGION).forEach(([region, airports]) => {
      const matchingAirports = airports.filter(
        (airport) =>
          airport.code.toLowerCase().includes(searchLower) ||
          airport.city.toLowerCase().includes(searchLower) ||
          airport.name.toLowerCase().includes(searchLower) ||
          airport.country.toLowerCase().includes(searchLower)
      )
      if (matchingAirports.length > 0) {
        filtered[region] = matchingAirports
      }
    })
    
    return filtered
  }, [search])

  const hasResults = Object.keys(filteredAirportsByRegion).length > 0

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-auto min-h-14 w-full justify-between bg-card hover:bg-secondary/50 border-border px-4 py-2"
          >
            <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
              <MapPin className="size-5 text-primary shrink-0" />
              {selectedAirports.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {selectedAirports.map((airport) => (
                    <Badge
                      key={airport.code}
                      variant="secondary"
                      className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary hover:bg-primary/20"
                    >
                      <span className="font-semibold">{airport.code}</span>
                      <span className="hidden sm:inline text-xs text-muted-foreground">
                        {airport.city}
                      </span>
                      <span
                        role="button"
                        aria-label={`Quitar ${airport.code}`}
                        tabIndex={0}
                        onClick={(e) => handleRemove(airport.code, e as unknown as React.MouseEvent)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            handleRemove(airport.code, e as unknown as React.MouseEvent)
                          }
                        }}
                        className="ml-0.5 rounded-full hover:bg-primary/30 p-0.5 cursor-pointer"
                      >
                        <X className="size-3" />
                      </span>
                    </Badge>
                  ))}
                  {values.length < maxSelections && (
                    <span className="text-xs text-muted-foreground self-center">
                      +{maxSelections - values.length} más
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </div>
            <ChevronDown className="size-4 shrink-0 opacity-50 ml-2" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[380px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput 
              placeholder="Buscar aeropuerto, ciudad o país..." 
              value={search}
              onValueChange={setSearch}
            />
            <CommandList className="max-h-[350px]">
              {!hasResults && (
                <CommandEmpty>No se encontró ningún aeropuerto.</CommandEmpty>
              )}
              {Object.entries(filteredAirportsByRegion).map(([region, airports]) => (
                <CommandGroup key={region} heading={region}>
                  {airports.map((airport) => (
                    <CommandItem
                      key={airport.code}
                      value={airport.code}
                      onSelect={() => handleSelect(airport.code)}
                      className={cn(
                        'flex items-center gap-3 py-2.5 cursor-pointer',
                        values.includes(airport.code) && 'bg-primary/5'
                      )}
                      disabled={!values.includes(airport.code) && values.length >= maxSelections}
                    >
                      <div
                        className={cn(
                          'flex size-8 items-center justify-center rounded-md text-xs font-bold transition-colors',
                          values.includes(airport.code)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground'
                        )}
                      >
                        {airport.code}
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-medium truncate">
                          {airport.city}, {airport.country}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                          {airport.name}
                        </span>
                      </div>
                      {values.includes(airport.code) && (
                        <Check className="size-4 text-primary shrink-0" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
          {values.length > 0 && (
            <div className="p-2 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {values.length} de {maxSelections} seleccionados
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onValuesChange([])}
                  className="h-auto py-1 px-2 text-xs"
                >
                  Limpiar todo
                </Button>
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
