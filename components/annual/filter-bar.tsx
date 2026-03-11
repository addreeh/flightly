'use client'

import * as React from 'react'
import { ArrowUp, ArrowDown, MapPin, Plane } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Separator } from '@/components/ui/separator'

interface FilterOption {
  code: string
  label: string
}

interface FilterBarProps {
  destinations: FilterOption[]
  origins: FilterOption[]
  months?: FilterOption[]
  destFilter: string
  originFilter: string
  monthFilter?: string
  sortField: 'price' | 'date'
  sortDirection: 'asc' | 'desc'
  onDestFilterChange: (value: string) => void
  onOriginFilterChange: (value: string) => void
  onMonthFilterChange?: (value: string) => void
  onSortFieldChange: (value: 'price' | 'date') => void
  onSortDirectionChange: (value: 'asc' | 'desc') => void
  showMonthFilter?: boolean
  className?: string
}

export function FilterBar({
  destinations,
  origins,
  months = [],
  destFilter,
  originFilter,
  monthFilter = 'ALL',
  sortField,
  sortDirection,
  onDestFilterChange,
  onOriginFilterChange,
  onMonthFilterChange,
  onSortFieldChange,
  onSortDirectionChange,
  showMonthFilter = false,
  className,
}: FilterBarProps) {
  return (
    <Card className={className}>
      <CardContent className="pt-4 pb-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Destination filter */}
          <Select value={destFilter} onValueChange={onDestFilterChange}>
            <SelectTrigger className="w-[180px] h-9 text-xs">
              <MapPin className="size-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Destino" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los destinos</SelectItem>
              {destinations.map((dest) => (
                <SelectItem key={dest.code} value={dest.code}>
                  {dest.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Origin filter */}
          <Select value={originFilter} onValueChange={onOriginFilterChange}>
            <SelectTrigger className="w-[160px] h-9 text-xs">
              <Plane className="size-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Origen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              {origins.map((origin) => (
                <SelectItem key={origin.code} value={origin.code}>
                  {origin.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Month filter */}
          {showMonthFilter && months.length > 0 && onMonthFilterChange && (
            <Select value={monthFilter} onValueChange={onMonthFilterChange}>
              <SelectTrigger className="w-[150px] h-9 text-xs">
                <SelectValue placeholder="Mes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos los meses</SelectItem>
                {months.map((month) => (
                  <SelectItem key={month.code} value={month.code}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Separator orientation="vertical" className="h-6 hidden sm:block" />

          {/* Sort controls */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Ordenar
            </span>
            <ToggleGroup
              type="single"
              value={sortField}
              onValueChange={(v) => v && onSortFieldChange(v as 'price' | 'date')}
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
              value={sortDirection}
              onValueChange={(v) => v && onSortDirectionChange(v as 'asc' | 'desc')}
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
      </CardContent>
    </Card>
  )
}
