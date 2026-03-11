'use client'

import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface LoadingSkeletonProps {
  loadingSteps: string[]
  currentStep: number
}

export function LoadingSkeleton({ loadingSteps, currentStep }: LoadingSkeletonProps) {
  return (
    <div className="space-y-6">
      {/* Loading message card */}
      <Card className="border-primary/20">
        <CardContent className="pt-6 pb-6">
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
                  Preparando tu busqueda anual de fines de semana...
                </p>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">
                  Este proceso puede tardar unos segundos mientras analizamos decenas de combinaciones.
                </p>
              </div>
            </div>

            <div className="flex-1">
              <ol className="space-y-1.5 text-xs md:text-sm">
                {loadingSteps.map((step, index) => {
                  const isActive = index === currentStep
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
        </CardContent>
      </Card>

      {/* Skeleton cards */}
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
    </div>
  )
}
