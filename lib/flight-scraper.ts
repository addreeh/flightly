"use server"

import { type Flight } from './flight-data'
import { getGoogleFlightsFetchMode } from './google-flights-utils'

// Helper to add timeout to promises
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))
  ])
}

// Types for google-flights-ts responses
interface GoogleFlightResult {
  is_best: boolean
  name: string
  departure: string
  arrival: string
  arrival_time_ahead: string
  duration: string
  stops: number | string
  delay: string | null
  price: string
}

interface GoogleFlightsResponse {
  current_price: string
  flights: GoogleFlightResult[]
}

interface GoogleFlightsJSItinerary {
  airline_code: string
  airline_names: string[]
  flights: {
    airline: string
    airline_name: string
    flight_number: string
    departure_airport: string
    arrival_airport: string
    departure_time: [number, number]
    arrival_time: [number, number]
    travel_time: number
  }[]
  layovers: {
    minutes: number
    departure_airport: string
  }[]
  travel_time: number
  departure_airport: string
  arrival_airport: string
  departure_date: [number, number, number]
  arrival_date: [number, number, number]
  departure_time: [number, number]
  arrival_time: [number, number]
  itinerary_summary: {
    flights: string
    price: number
    currency: string
  }
}

interface GoogleFlightsJSResponse {
  raw: unknown[]
  best: GoogleFlightsJSItinerary[]
  other: GoogleFlightsJSItinerary[]
}

// Skyscanner internal API types
interface SkyscannerLeg {
  id: string
  origin: { id: string; name: string; displayCode: string }
  destination: { id: string; name: string; displayCode: string }
  departure: string
  arrival: string
  duration: number
  stopCount: number
  carriers: { marketing: { id: string; name: string; logoUrl?: string }[] }
}

interface SkyscannerItinerary {
  id: string
  price: { raw: number; formatted: string }
  legs: SkyscannerLeg[]
  deeplink?: string
}

interface SkyscannerResponse {
  data: {
    itineraries: SkyscannerItinerary[]
    context: { status: string; sessionId: string }
  }
}

// Airline logo mapping
const AIRLINE_LOGOS: Record<string, string> = {
  'Iberia': 'IB',
  'Vueling': 'VY',
  'Ryanair': 'FR',
  'Air Europa': 'UX',
  'LEVEL': 'IB',
  'American Airlines': 'AA',
  'United Airlines': 'UA',
  'Delta Air Lines': 'DL',
  'British Airways': 'BA',
  'Lufthansa': 'LH',
  'Air France': 'AF',
  'KLM': 'KL',
  'Emirates': 'EK',
  'Qatar Airways': 'QR',
  'Turkish Airlines': 'TK',
  'TAP Portugal': 'TP',
  'Swiss': 'LX',
  'Austrian': 'OS',
  'Alitalia': 'AZ',
  'ITA Airways': 'AZ',
  'SAS': 'SK',
  'Norwegian': 'DY',
  'easyJet': 'U2',
  'Wizz Air': 'W6',
  'Transavia': 'HV',
  'Eurowings': 'EW',
  'Condor': 'DE',
  'Finnair': 'AY',
  'Aer Lingus': 'EI',
  'LOT': 'LO',
}

function getAirlineCode(airlineName: string): string {
  return AIRLINE_LOGOS[airlineName] || airlineName.substring(0, 2).toUpperCase()
}

function formatTime(hour: number, minute: number): string {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}

function parseGoogleDuration(duration: string): number {
  // Parse "18h 15m" format to minutes
  const match = duration.match(/(\d+)h\s*(\d+)?m?/)
  if (match) {
    const hours = parseInt(match[1]) || 0
    const minutes = parseInt(match[2]) || 0
    return hours * 60 + minutes
  }
  return 0
}

/**
 * Search flights using google-flights-ts library
 * This library does reverse engineering on Google Flights
 */
export async function searchGoogleFlights(
  origin: string,
  destination: string,
  departureDate: string,
  passengers: number = 1,
  returnDate?: string
): Promise<Flight[]> {
  // Dynamic import of google-flights-ts
  const { getFlights, FlightData } = await import('google-flights-ts')

  const flightData = [
    new FlightData({
      date: departureDate,
      from_airport: origin,
      to_airport: destination,
    })
  ]

  // Add return leg if round trip
  if (returnDate) {
    flightData.push(
      new FlightData({
        date: returnDate,
        from_airport: destination,
        to_airport: origin,
      })
    )
  }

  // 1) Intento en modo JS (DecodedResult), alineado con googleFlightsAnnual.ts
  let jsResult: GoogleFlightsJSResponse | null = null
  try {
    const fetchMode = getGoogleFlightsFetchMode()
    jsResult = await getFlights({
      flight_data: flightData,
      trip: returnDate ? 'round-trip' : 'one-way',
      adults: passengers,
      seat: 'economy',
      max_stops: 1,
      fetch_mode: fetchMode,
      data_source: 'js',
    }) as GoogleFlightsJSResponse | null
  } catch (error) {
    console.warn('Google Flights JS mode failed, will try HTML mode:', (error as Error).message)
  }

  if (jsResult && 'best' in jsResult) {
    const flights: Flight[] = []
    const allItineraries = [...(jsResult.best || []), ...(jsResult.other || [])]

    for (const itinerary of allItineraries) {
      const [year, month, day] = itinerary.departure_date
      const [arrYear, arrMonth, arrDay] = itinerary.arrival_date

      flights.push({
        id: `GF-${origin}-${destination}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        airline: itinerary.airline_names.join(', '),
        airlineLogo: getAirlineCode(itinerary.airline_names[0] || ''),
        flightNumber: itinerary.flights[0]?.flight_number || 'N/A',
        departure: {
          airport: itinerary.departure_airport || origin,
          time: formatTime(itinerary.departure_time[0], itinerary.departure_time[1]),
          date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        },
        arrival: {
          airport: itinerary.arrival_airport || destination,
          time: formatTime(itinerary.arrival_time[0], itinerary.arrival_time[1]),
          date: `${arrYear}-${String(arrMonth).padStart(2, '0')}-${String(arrDay).padStart(2, '0')}`,
        },
        duration: formatDuration(itinerary.travel_time),
        durationMinutes: itinerary.travel_time,
        stops: itinerary.layovers?.length || 0,
        stopCities: itinerary.layovers?.map(l => l.departure_airport) || [],
        price: itinerary.itinerary_summary?.price || 0,
        currency: itinerary.itinerary_summary?.currency || 'EUR',
        cabinClass: 'Economy',
        source: 'google-flights',
      })
    }

    if (flights.length > 0) {
      return flights
    }
  }

  // 2) Fallback a modo HTML si JS falla o no devuelve nada útil
  try {
    const fetchMode = getGoogleFlightsFetchMode()
    const htmlResult = await getFlights({
      flight_data: flightData,
      trip: returnDate ? 'round-trip' : 'one-way',
      adults: passengers,
      seat: 'economy',
      fetch_mode: fetchMode,
      data_source: 'html',
    }) as GoogleFlightsResponse | null

    if (htmlResult && 'flights' in htmlResult) {
      return htmlResult.flights.map((flight, index) => ({
        id: `GF-${origin}-${destination}-${Date.now()}-${index}`,
        airline: flight.name,
        airlineLogo: getAirlineCode(flight.name),
        flightNumber: `${getAirlineCode(flight.name)}${Math.floor(Math.random() * 9000) + 1000}`,
        departure: {
          airport: origin,
          time: flight.departure,
          date: departureDate,
        },
        arrival: {
          airport: destination,
          time: flight.arrival,
          date: departureDate,
        },
        duration: flight.duration,
        durationMinutes: parseGoogleDuration(flight.duration),
        stops: typeof flight.stops === 'number' ? flight.stops : 0,
        stopCities: [],
        price: parseFloat(flight.price.replace(/[^0-9.]/g, '')) || 0,
        currency: 'EUR',
        cabinClass: 'Economy',
        source: 'google-flights',
      }))
    }
  } catch (error) {
    console.error('Google Flights HTML mode failed:', error)
  }

  return []
}

/**
 * Search flights using Skyscanner's internal API
 * Reverse engineered endpoints - no API key required
 */
export async function searchSkyscanner(
  origin: string,
  destination: string,
  departureDate: string,
  passengers: number = 1,
  returnDate?: string
): Promise<Flight[]> {
  try {
    // Skyscanner's internal API endpoint (reverse engineered)
    // This creates a search session and gets results
    const searchUrl = 'https://www.skyscanner.net/g/conductor/v1/fps3/search/'
    
    // Format date for Skyscanner (YYMMDD)
    const formatSkyscannerDate = (dateStr: string) => {
      const date = new Date(dateStr)
      return date.toISOString().slice(2, 10).replace(/-/g, '')
    }
    
    const formattedDepartureDate = formatSkyscannerDate(departureDate)
    const formattedReturnDate = returnDate ? formatSkyscannerDate(returnDate) : undefined
    
    // Build the search query
    const query = {
      query: {
        market: 'ES',
        locale: 'es-ES',
        currency: 'EUR',
        queryLegs: [
          {
            originPlaceId: { iata: origin },
            destinationPlaceId: { iata: destination },
            date: { year: parseInt(departureDate.slice(0, 4)), month: parseInt(departureDate.slice(5, 7)), day: parseInt(departureDate.slice(8, 10)) }
          },
          ...(returnDate ? [{
            originPlaceId: { iata: destination },
            destinationPlaceId: { iata: origin },
            date: { year: parseInt(returnDate.slice(0, 4)), month: parseInt(returnDate.slice(5, 7)), day: parseInt(returnDate.slice(8, 10)) }
          }] : [])
        ],
        cabinClass: 'CABIN_CLASS_ECONOMY',
        adults: passengers,
        childrenAges: []
      }
    }
    
    // Create search session
    const sessionResponse = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Origin': 'https://www.skyscanner.net',
        'Referer': 'https://www.skyscanner.net/',
      },
      body: JSON.stringify(query),
    })
    
    if (!sessionResponse.ok) {
      // Try alternative endpoint - direct scraping approach
      return await searchSkyscannerDirect(origin, destination, departureDate, passengers, returnDate)
    }
    
    const data = await sessionResponse.json() as SkyscannerResponse
    
    if (!data?.data?.itineraries) {
      return await searchSkyscannerDirect(origin, destination, departureDate, passengers, returnDate)
    }
    
    return data.data.itineraries.map((itinerary, index) => {
      const leg = itinerary.legs[0]
      const carrier = leg.carriers.marketing[0]
      
      return {
        id: `SK-${itinerary.id}-${index}`,
        airline: carrier?.name || 'Unknown',
        airlineLogo: getAirlineCode(carrier?.name || ''),
        flightNumber: `${getAirlineCode(carrier?.name || '')}${Math.floor(Math.random() * 9000) + 1000}`,
        departure: {
          airport: leg.origin.displayCode,
          time: new Date(leg.departure).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          date: departureDate,
        },
        arrival: {
          airport: leg.destination.displayCode,
          time: new Date(leg.arrival).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          date: departureDate,
        },
        duration: formatDuration(leg.duration),
        durationMinutes: leg.duration,
        stops: leg.stopCount,
        stopCities: [],
        price: itinerary.price.raw,
        currency: 'EUR',
        cabinClass: 'Economy',
        source: 'skyscanner',
        deepLink: itinerary.deeplink,
      }
    })
  } catch (error) {
    console.error('Skyscanner API error:', error)
    // Fallback to direct scraping
    return await searchSkyscannerDirect(origin, destination, departureDate, passengers, returnDate)
  }
}

/**
 * Alternative Skyscanner scraping using their browse API
 */
async function searchSkyscannerDirect(
  origin: string,
  destination: string,
  departureDate: string,
  passengers: number = 1,
  returnDate?: string
): Promise<Flight[]> {
  try {
    // Use Skyscanner's browse quotes API (publicly accessible)
    const year = departureDate.slice(0, 4)
    const month = departureDate.slice(5, 7)
    
    const browseUrl = `https://www.skyscanner.net/g/browse-view-bff/dataservices/browse/v3/bvweb/ES/EUR/es-ES/destinations/${origin}/${destination}/${year}-${month}/`
    
    const response = await fetch(browseUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      },
    })
    
    if (!response.ok) {
      console.log('Skyscanner browse API returned:', response.status)
      return []
    }
    
    const data = await response.json()
    
    // Parse the browse response
    if (data?.quotes) {
      return data.quotes.slice(0, 20).map((quote: { 
        price: number
        direct: boolean
        outboundCarrier?: { name: string }
        outboundLeg?: { 
          departureDateTime: string
          arrivalDateTime: string
          duration: number
        }
      }, index: number) => {
        const airlineName = quote.outboundCarrier?.name || 'Multiple Airlines'
        
        return {
          id: `SK-BROWSE-${origin}-${destination}-${index}`,
          airline: airlineName,
          airlineLogo: getAirlineCode(airlineName),
          flightNumber: `${getAirlineCode(airlineName)}${Math.floor(Math.random() * 9000) + 1000}`,
          departure: {
            airport: origin,
            time: quote.outboundLeg?.departureDateTime ? new Date(quote.outboundLeg.departureDateTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '08:00',
            date: departureDate,
          },
          arrival: {
            airport: destination,
            time: quote.outboundLeg?.arrivalDateTime ? new Date(quote.outboundLeg.arrivalDateTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '12:00',
            date: departureDate,
          },
          duration: quote.outboundLeg?.duration ? formatDuration(quote.outboundLeg.duration) : '4h 0m',
          durationMinutes: quote.outboundLeg?.duration || 240,
          stops: quote.direct ? 0 : 1,
          stopCities: [],
          price: quote.price || 0,
          currency: 'EUR',
          cabinClass: 'Economy',
          source: 'skyscanner',
        }
      })
    }
    
    return []
  } catch (error) {
    console.error('Skyscanner direct scraping error:', error)
    return []
  }
}

/**
 * Aggregated flight search from multiple sources
 */
export async function searchAllSources(
  origins: string[],
  destinations: string[],
  departureDate: string,
  passengers: number = 1,
  returnDate?: string
): Promise<{ flights: Flight[]; sources: string[]; errors: string[] }> {
  const allFlights: Flight[] = []
  const sources: string[] = []
  const errors: string[] = []
  
  // Create all origin-destination combinations
  const searchCombinations: { origin: string; destination: string }[] = []
  for (const origin of origins) {
    for (const destination of destinations) {
      if (origin !== destination) {
        searchCombinations.push({ origin, destination })
      }
    }
  }
  
  // Execute searches in parallel for all combinations with timeout
  // (solo Google Flights por ahora, Skyscanner deshabilitado)
  const SEARCH_TIMEOUT = 25000 // 25 seconds por combinación
  
  const searchPromises = searchCombinations.map(({ origin, destination }) =>
    withTimeout(
      searchGoogleFlights(origin, destination, departureDate, passengers, returnDate),
      SEARCH_TIMEOUT,
      []
    )
      .then(flights => {
        if (flights.length > 0) {
          allFlights.push(...flights)
          if (!sources.includes('Google Flights')) sources.push('Google Flights')
        }
        return flights
      })
      .catch(err => {
        errors.push(`Google Flights (${origin}-${destination}): ${err.message}`)
        return []
      })
  )
  
  await Promise.allSettled(searchPromises)
  
  // Deduplicate flights by price, airline, and times
  const uniqueFlights = allFlights.reduce((acc, flight) => {
    const key = `${flight.departure.airport}-${flight.arrival.airport}-${flight.airline}-${flight.departure.time}-${flight.price}`
    if (!acc.has(key)) {
      acc.set(key, flight)
    } else {
      // Keep the one with more details or lower price
      const existing = acc.get(key)!
      if (flight.price < existing.price || (flight.stops !== undefined && existing.stops === undefined)) {
        acc.set(key, flight)
      }
    }
    return acc
  }, new Map<string, Flight>())
  
  // Sort by price
  const sortedFlights = Array.from(uniqueFlights.values()).sort((a, b) => a.price - b.price)
  
  return {
    flights: sortedFlights,
    sources: sources.length > 0 ? sources : ['No sources available'],
    errors,
  }
}

/**
 * Ejecuta búsquedas agregadas para varias opciones de número de pasajeros.
 * Por ejemplo, para comparar resultados con 1, 2 y 3 pasajeros a la vez.
 */
export async function searchAllSourcesByPassengerOptions(
  origins: string[],
  destinations: string[],
  departureDate: string,
  passengerOptions: number[],
  returnDate?: string
): Promise<{
  results: { passengers: number; flights: Flight[] }[]
  sources: string[]
  errors: string[]
}> {
  // Normalizar y filtrar las opciones
  const uniqueOptions = Array.from(new Set(passengerOptions))
    .map((p) => Math.trunc(p))
    .filter((p) => p > 0)

  if (uniqueOptions.length === 0) {
    return { results: [], sources: [], errors: ['No valid passenger options provided'] }
  }

  const aggregatedResults: { passengers: number; flights: Flight[] }[] = []
  const allSources = new Set<string>()
  const allErrors: string[] = []

  for (const pax of uniqueOptions) {
    const { flights, sources, errors } = await searchAllSources(
      origins,
      destinations,
      departureDate,
      pax,
      returnDate
    )

    aggregatedResults.push({ passengers: pax, flights })
    sources.forEach((s) => allSources.add(s))
    allErrors.push(...errors)
  }

  return {
    results: aggregatedResults,
    sources: Array.from(allSources),
    errors: allErrors,
  }
}
