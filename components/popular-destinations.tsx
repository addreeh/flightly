'use client'

import { MapPin, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface Destination {
  city: string
  country: string
  code: string
  price: number
  image: string
}

const POPULAR_DESTINATIONS: Destination[] = [
  {
    city: 'Málaga',
    country: 'España',
    code: 'AGP',
    price: 45,
    image: 'https://images.unsplash.com/photo-1561632669-7f55f7975606?w=400&h=300&fit=crop',
  },
  {
    city: 'Sevilla',
    country: 'España',
    code: 'SVQ',
    price: 52,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
  },
  {
    city: 'París',
    country: 'Francia',
    code: 'CDG',
    price: 89,
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=300&fit=crop',
  },
  {
    city: 'Roma',
    country: 'Italia',
    code: 'FCO',
    price: 75,
    image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&h=300&fit=crop',
  },
  {
    city: 'Londres',
    country: 'Reino Unido',
    code: 'LHR',
    price: 65,
    image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=300&fit=crop',
  },
  {
    city: 'Ámsterdam',
    country: 'Países Bajos',
    code: 'AMS',
    price: 95,
    image: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=400&h=300&fit=crop',
  },
]

interface PopularDestinationsProps {
  onSelectDestination: (code: string) => void
}

export function PopularDestinations({ onSelectDestination }: PopularDestinationsProps) {
  return (
    <section className="py-12">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="size-5 text-primary" />
        <h2 className="text-xl font-bold text-foreground">Destinos populares</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {POPULAR_DESTINATIONS.map((destination) => (
          <Card
            key={destination.code}
            className="group cursor-pointer overflow-hidden border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300"
            onClick={() => onSelectDestination(destination.code)}
          >
            <div className="relative h-40 overflow-hidden">
              <img
                src={destination.image}
                alt={destination.city}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                crossOrigin="anonymous"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3">
                <div className="flex items-center gap-1 text-white/90 text-sm mb-1">
                  <MapPin className="size-3" />
                  <span>{destination.country}</span>
                </div>
                <h3 className="text-white font-bold text-lg">{destination.city}</h3>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Desde</span>
                <span className="text-xl font-bold text-primary">€{destination.price}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
