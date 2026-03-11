import { NextRequest, NextResponse } from 'next/server'
import { searchAllSources, searchAllSourcesByPassengerOptions } from '@/lib/flight-scraper'
import { type FlightSearchRequest, UNIQUE_AIRPORTS, AIRLINES, type Flight } from '@/lib/flight-data'
import { buscarCracoviaHastaJunio } from '@/lib/cracovia-weekends'

export const runtime = 'nodejs'
export const maxDuration = 60 // Allow up to 60 seconds for scraping

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const body: FlightSearchRequest = await request.json()
    const {
      origins,
      destinations,
      departureDate,
      returnDate,
      passengers = 1,
      passengerOptions,
      cabinClass = 'economy',
      currency = 'EUR',
    } = body

    // Validate required fields
    if (!origins?.length || !destinations?.length || !departureDate) {
      return NextResponse.json(
        { error: 'Missing required fields: origins, destinations, departureDate' },
        { status: 400 }
      )
    }

    // Validate airports exist
    const validOrigins = origins.filter(code => 
      UNIQUE_AIRPORTS.some(a => a.code === code)
    )
    const validDestinations = destinations.filter(code => 
      UNIQUE_AIRPORTS.some(a => a.code === code)
    )

    if (validOrigins.length === 0) {
      return NextResponse.json(
        { error: 'No valid origin airports provided' },
        { status: 400 }
      )
    }

    if (validDestinations.length === 0) {
      return NextResponse.json(
        { error: 'No valid destination airports provided' },
        { status: 400 }
      )
    }

    console.log(`[v0] Starting flight search: ${validOrigins.join(',')} -> ${validDestinations.join(',')} on ${departureDate}`)

    // MODO ESPECIAL: fines de semana AGP/SVQ → Cracovia (KRK) hasta junio,
    // replicando cracoviaHastaJunio.ts para poder depurar mejor.
    const isCracoviaOnly =
      validDestinations.length === 1 && validDestinations[0] === 'KRK'

    if (isCracoviaOnly) {
      const weekendEntries = await buscarCracoviaHastaJunio()

      const flights: Flight[] = weekendEntries.map((e, index) => {
        // Redondeamos a 2 decimales para evitar solapes visuales tipo 117.9499999
        const roundedTotal = Math.round(e.total_price * 100) / 100
        return {
          id: `KRK-WE-${index}`,
          airline: `${e.outbound.airline} / ${e.inbound.airline}`,
          airlineLogo: e.outbound.airline.slice(0, 2).toUpperCase(),
          flightNumber: `KRK${index + 1}`,
          departure: {
            airport: e.origin,
            time: '08:00',
            date: e.depart_date,
          },
          arrival: {
            airport: e.destination_code,
            time: '12:00',
            date: e.depart_date,
          },
          duration: 'fin de semana',
          durationMinutes: 72 * 60,
          stops: 0,
          stopCities: [],
          price: roundedTotal,
          currency: e.currency,
          cabinClass: 'Economy',
          source: 'google-flights-weekend',
        } satisfies Flight
      })

      const searchTime = Date.now() - startTime

      return NextResponse.json({
        flights,
        searchId: `cracovia-weekends-${Date.now()}`,
        totalResults: flights.length,
        searchTime,
        sources: ['Google Flights (weekend one-way, Cracovia script)'],
        stats: {
          minPrice: flights.length ? Math.min(...flights.map((f) => f.price)) : 0,
          maxPrice: flights.length ? Math.max(...flights.map((f) => f.price)) : 0,
          avgPrice: flights.length
            ? Math.round(flights.reduce((sum, f) => sum + f.price, 0) / flights.length)
            : 0,
        },
        meta: {
          origins: validOrigins,
          destinations: validDestinations,
          departureDate,
          returnDate: null,
          passengers,
          cabinClass,
          currency,
        },
      })
    }

    // Si se han pasado varias opciones de pasajeros, ejecutamos búsqueda múltiple
    const hasMultiPassengerOptions = Array.isArray(passengerOptions) && passengerOptions.length > 0

    let allFlights: Flight[] = []
    let sources: string[] = []
    let errors: string[] = []
    let multiPassengerResults:
      | { passengers: number; flights: typeof allFlights }
      | undefined

    if (hasMultiPassengerOptions) {
      const { results, sources: s, errors: e } = await searchAllSourcesByPassengerOptions(
        validOrigins,
        validDestinations,
        departureDate,
        passengerOptions!,
        returnDate
      )

      // Elegimos como lista "principal" la correspondiente al valor de passengers
      const primaryPassengers = passengers || passengerOptions![0]
      const primary = results.find((r) => r.passengers === primaryPassengers) ?? results[0]

      allFlights = primary?.flights ?? []
      sources = s
      errors = e
      multiPassengerResults = results
    } else {
      // Búsqueda estándar con un número de pasajeros
      const result = await searchAllSources(
        validOrigins,
        validDestinations,
        departureDate,
        passengers,
        returnDate
      )

      allFlights = result.flights
      sources = result.sources
      errors = result.errors
    }
    
    console.log(`[v0] Scraped ${allFlights.length} flights from: ${sources.join(', ')}`)
    
    if (errors.length > 0) {
      console.log(`[v0] Scraping errors: ${errors.join('; ')}`)
    }

    // Sort by price
    allFlights.sort((a, b) => a.price - b.price)

    // Calculate statistics
    const prices = allFlights.map(f => f.price).filter(p => p > 0)
    const stats = {
      minPrice: prices.length > 0 ? Math.min(...prices) : 0,
      maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
      avgPrice: prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0,
    }

    const searchTime = Date.now() - startTime

    console.log(`[v0] Search completed in ${searchTime}ms with ${allFlights.length} results`)

    return NextResponse.json({
      flights: allFlights,
      searchId: `search-${Date.now()}`,
      totalResults: allFlights.length,
      searchTime,
      sources,
      errors: errors.length > 0 ? errors : undefined,
      stats,
      meta: {
        origins: validOrigins,
        destinations: validDestinations,
        departureDate,
        returnDate: returnDate || null,
        passengers,
        cabinClass,
        currency,
      },
      multiPassengerResults,
    })
  } catch (error) {
    console.error('[v0] Flight search error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to search flights',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  // Quick endpoint to check API status and available airports
  return NextResponse.json({
    status: 'ok',
    message: 'Flight search API - Google Flights scraper',
    description: 'Esta API obtiene datos de vuelo directamente de Google Flights mediante la librería google-flights-ts, sin necesidad de claves de API.',
    availableAirports: UNIQUE_AIRPORTS.length,
    availableAirlines: AIRLINES.length,
    sources: ['Google Flights (via google-flights-ts - scraping directo)'],
    usage: {
      method: 'POST',
      body: {
        origins: ['AGP', 'SVQ'],
        destinations: ['LHR', 'CDG'],
        departureDate: '2026-04-15',
        returnDate: '2026-04-22',
        passengers: 1,
        cabinClass: 'economy',
        currency: 'EUR',
      }
    },
    spanishAirports: UNIQUE_AIRPORTS.filter(a => a.country === 'España').map(a => ({
      code: a.code,
      city: a.city,
      name: a.name
    }))
  })
}
