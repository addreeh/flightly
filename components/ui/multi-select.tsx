'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'

export interface MultiSelectOption {
  value: string
  label: string
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  emptyMessage?: string
  className?: string
  icon?: React.ReactNode
  maxDisplayedItems?: number
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Seleccionar...',
  emptyMessage = 'Sin opciones',
  className,
  icon,
  maxDisplayedItems = 2,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)

  const handleToggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  const handleRemove = (value: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(selected.filter((v) => v !== value))
  }

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange([])
  }

  const selectedLabels = selected
    .map((v) => options.find((o) => o.value === v)?.label ?? v)
    .slice(0, maxDisplayedItems)

  const remainingCount = selected.length - maxDisplayedItems

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'h-9 justify-between font-normal text-xs min-w-[160px]',
            selected.length === 0 && 'text-muted-foreground',
            className,
          )}
        >
          <div className="flex items-center gap-1.5 overflow-hidden">
            {icon && <span className="shrink-0">{icon}</span>}
            {selected.length === 0 ? (
              <span>{placeholder}</span>
            ) : (
              <div className="flex items-center gap-1 overflow-hidden">
                {selectedLabels.map((label, index) => (
                  <Badge
                    key={selected[index]}
                    variant="secondary"
                    className="h-5 px-1.5 text-[10px] font-medium gap-0.5 shrink-0"
                  >
                    <span className="truncate max-w-[60px]">{label}</span>
                    <button
                      type="button"
                      onClick={(e) => handleRemove(selected[index], e)}
                      className="ml-0.5 hover:text-destructive"
                    >
                      <X className="size-2.5" />
                    </button>
                  </Badge>
                ))}
                {remainingCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="h-5 px-1.5 text-[10px] font-medium shrink-0"
                  >
                    +{remainingCount}
                  </Badge>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-1">
            {selected.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="hover:text-destructive"
              >
                <X className="size-3" />
              </button>
            )}
            <ChevronsUpDown className="size-3.5 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-0" align="start">
        <ScrollArea className="max-h-64">
          <div className="p-1">
            {options.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-4">
                {emptyMessage}
              </p>
            ) : (
              options.map((option) => {
                const isSelected = selected.includes(option.value)
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleToggle(option.value)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs outline-none transition-colors',
                      'hover:bg-accent hover:text-accent-foreground',
                      isSelected && 'bg-accent/50',
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      className="size-3.5 pointer-events-none"
                    />
                    <span className="truncate">{option.label}</span>
                    {isSelected && (
                      <Check className="size-3 ml-auto text-primary shrink-0" />
                    )}
                  </button>
                )
              })
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
