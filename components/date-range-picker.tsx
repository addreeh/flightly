'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { type DateRange } from 'react-day-picker'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface DateRangePickerProps {
  dateRange: DateRange | undefined
  onDateRangeChange: (range: DateRange | undefined) => void
  className?: string
}

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Fechas de viaje
      </span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'h-14 justify-start gap-3 bg-card hover:bg-secondary/50 border-border px-4 text-left font-normal',
              !dateRange && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="size-5 text-primary shrink-0" />
            <div className="flex flex-col items-start">
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    <span className="font-semibold text-foreground">
                      {format(dateRange.from, 'd MMM', { locale: es })} - {format(dateRange.to, 'd MMM', { locale: es })}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))} noches
                    </span>
                  </>
                ) : (
                  <span className="font-semibold text-foreground">
                    {format(dateRange.from, 'd MMM yyyy', { locale: es })}
                  </span>
                )
              ) : (
                <span>Seleccionar fechas</span>
              )}
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={onDateRangeChange}
            numberOfMonths={2}
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
