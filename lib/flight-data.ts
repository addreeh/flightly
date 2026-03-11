export interface Airport {
  code: string
  name: string
  city: string
  country: string
  region?: string
}

export interface Flight {
  id: string
  airline: string
  airlineLogo: string
  flightNumber: string
  departure: {
    airport: string
    time: string
    date: string
  }
  arrival: {
    airport: string
    time: string
    date: string
  }
  duration: string
  durationMinutes: number
  stops: number
  stopCities?: string[]
  price: number
  currency: string
  seatsLeft?: number
  cabinClass: string
  source?: string
  deepLink?: string
  bookingToken?: string
}

export interface SearchParams {
  origins: string[]
  destinations: string[]
  departureDate: Date | undefined
  returnDate: Date | undefined
  passengers: number
  tripType: 'roundtrip' | 'oneway'
}

export interface FlightSearchRequest {
  origins: string[]
  destinations: string[]
  departureDate: string
  returnDate?: string
  passengers: number
  /**
   * Opciones adicionales de número de pasajeros para comparar precios
   * (por ejemplo [1, 2] para comparar 1 vs 2 pasajeros)
   */
  passengerOptions?: number[]
  /**
   * Fines de semana a excluir dentro del rango considerado en búsquedas
   * más avanzadas (por ejemplo, búsquedas anuales). Cada elemento se
   * codifica como "YYYY-MM-DD|YYYY-MM-DD" (salida|vuelta).
   */
  excludedWeekends?: string[]
  cabinClass?: string
  currency?: string
}

export interface FlightSearchResponse {
  flights: Flight[]
  searchId: string
  totalResults: number
  searchTime: number
  sources: string[]
  errors?: string[]
  /**
   * Resultados separados por número de pasajeros cuando se solicitan
   * varias opciones (multi-búsqueda de pasajeros).
   */
  multiPassengerResults?: {
    passengers: number
    flights: Flight[]
  }[]
}

// Comprehensive list of airports including Spanish airports
export const AIRPORTS: Airport[] = [
  // Spain
  { code: 'MAD', name: 'Adolfo Suárez Madrid-Barajas', city: 'Madrid', country: 'España', region: 'Europa' },
  { code: 'BCN', name: 'Josep Tarradellas Barcelona-El Prat', city: 'Barcelona', country: 'España', region: 'Europa' },
  { code: 'AGP', name: 'Málaga-Costa del Sol', city: 'Málaga', country: 'España', region: 'Europa' },
  { code: 'SVQ', name: 'San Pablo', city: 'Sevilla', country: 'España', region: 'Europa' },
  { code: 'VLC', name: 'Valencia', city: 'Valencia', country: 'España', region: 'Europa' },
  { code: 'PMI', name: 'Palma de Mallorca', city: 'Palma de Mallorca', country: 'España', region: 'Europa' },
  { code: 'AGP', name: 'Málaga-Costa del Sol', city: 'Málaga', country: 'España', region: 'Europa' },
  { code: 'ALC', name: 'Alicante-Elche', city: 'Alicante', country: 'España', region: 'Europa' },
  { code: 'BIO', name: 'Bilbao', city: 'Bilbao', country: 'España', region: 'Europa' },
  { code: 'TFS', name: 'Tenerife Sur', city: 'Tenerife', country: 'España', region: 'Europa' },
  { code: 'LPA', name: 'Gran Canaria', city: 'Las Palmas', country: 'España', region: 'Europa' },
  // Europe
  { code: 'LHR', name: 'Heathrow', city: 'Londres', country: 'Reino Unido', region: 'Europa' },
  { code: 'LGW', name: 'Gatwick', city: 'Londres', country: 'Reino Unido', region: 'Europa' },
  { code: 'STN', name: 'Stansted', city: 'Londres', country: 'Reino Unido', region: 'Europa' },
  { code: 'CDG', name: 'Charles de Gaulle', city: 'París', country: 'Francia', region: 'Europa' },
  { code: 'ORY', name: 'Orly', city: 'París', country: 'Francia', region: 'Europa' },
  { code: 'FCO', name: 'Leonardo da Vinci-Fiumicino', city: 'Roma', country: 'Italia', region: 'Europa' },
  { code: 'MXP', name: 'Malpensa', city: 'Milán', country: 'Italia', region: 'Europa' },
  { code: 'AMS', name: 'Schiphol', city: 'Ámsterdam', country: 'Países Bajos', region: 'Europa' },
  { code: 'FRA', name: 'Frankfurt', city: 'Frankfurt', country: 'Alemania', region: 'Europa' },
  { code: 'MUC', name: 'Munich', city: 'Munich', country: 'Alemania', region: 'Europa' },
  { code: 'BER', name: 'Berlin Brandenburg', city: 'Berlín', country: 'Alemania', region: 'Europa' },
  { code: 'ZRH', name: 'Zürich', city: 'Zúrich', country: 'Suiza', region: 'Europa' },
  { code: 'VIE', name: 'Vienna', city: 'Viena', country: 'Austria', region: 'Europa' },
  { code: 'LIS', name: 'Humberto Delgado', city: 'Lisboa', country: 'Portugal', region: 'Europa' },
  { code: 'OPO', name: 'Francisco Sá Carneiro', city: 'Oporto', country: 'Portugal', region: 'Europa' },
  { code: 'BRU', name: 'Brussels', city: 'Bruselas', country: 'Bélgica', region: 'Europa' },
  { code: 'DUB', name: 'Dublin', city: 'Dublín', country: 'Irlanda', region: 'Europa' },
  { code: 'CPH', name: 'Copenhagen', city: 'Copenhague', country: 'Dinamarca', region: 'Europa' },
  { code: 'OSL', name: 'Gardermoen', city: 'Oslo', country: 'Noruega', region: 'Europa' },
  { code: 'ARN', name: 'Arlanda', city: 'Estocolmo', country: 'Suecia', region: 'Europa' },
  { code: 'HEL', name: 'Helsinki-Vantaa', city: 'Helsinki', country: 'Finlandia', region: 'Europa' },
  { code: 'ATH', name: 'Eleftherios Venizelos', city: 'Atenas', country: 'Grecia', region: 'Europa' },
  { code: 'IST', name: 'Istanbul', city: 'Estambul', country: 'Turquía', region: 'Europa' },
  { code: 'WAW', name: 'Chopin', city: 'Varsovia', country: 'Polonia', region: 'Europa' },
  { code: 'KRK', name: 'John Paul II International', city: 'Cracovia', country: 'Polonia', region: 'Europa' },
  { code: 'PRG', name: 'Václav Havel', city: 'Praga', country: 'República Checa', region: 'Europa' },
  { code: 'EDI', name: 'Edinburgh Airport', city: 'Edimburgo', country: 'Reino Unido', region: 'Europa' },
  { code: 'LIN', name: 'Linate', city: 'Milán', country: 'Italia', region: 'Europa' },
  { code: 'BGY', name: 'Orio al Serio', city: 'Bérgamo/Milán', country: 'Italia', region: 'Europa' },
  // Americas
  { code: 'JFK', name: 'John F. Kennedy', city: 'Nueva York', country: 'Estados Unidos', region: 'América' },
  { code: 'EWR', name: 'Newark Liberty', city: 'Newark', country: 'Estados Unidos', region: 'América' },
  { code: 'LAX', name: 'Los Angeles International', city: 'Los Ángeles', country: 'Estados Unidos', region: 'América' },
  { code: 'MIA', name: 'Miami International', city: 'Miami', country: 'Estados Unidos', region: 'América' },
  { code: 'ORD', name: "O'Hare International", city: 'Chicago', country: 'Estados Unidos', region: 'América' },
  { code: 'SFO', name: 'San Francisco International', city: 'San Francisco', country: 'Estados Unidos', region: 'América' },
  { code: 'BOS', name: 'Logan International', city: 'Boston', country: 'Estados Unidos', region: 'América' },
  { code: 'ATL', name: 'Hartsfield-Jackson', city: 'Atlanta', country: 'Estados Unidos', region: 'América' },
  { code: 'MEX', name: 'Benito Juárez', city: 'Ciudad de México', country: 'México', region: 'América' },
  { code: 'CUN', name: 'Cancún International', city: 'Cancún', country: 'México', region: 'América' },
  { code: 'BOG', name: 'El Dorado', city: 'Bogotá', country: 'Colombia', region: 'América' },
  { code: 'GRU', name: 'São Paulo-Guarulhos', city: 'São Paulo', country: 'Brasil', region: 'América' },
  { code: 'GIG', name: 'Galeão', city: 'Río de Janeiro', country: 'Brasil', region: 'América' },
  { code: 'EZE', name: 'Ministro Pistarini', city: 'Buenos Aires', country: 'Argentina', region: 'América' },
  { code: 'SCL', name: 'Arturo Merino Benítez', city: 'Santiago', country: 'Chile', region: 'América' },
  { code: 'LIM', name: 'Jorge Chávez', city: 'Lima', country: 'Perú', region: 'América' },
  { code: 'PTY', name: 'Tocumen', city: 'Ciudad de Panamá', country: 'Panamá', region: 'América' },
  { code: 'HAV', name: 'José Martí', city: 'La Habana', country: 'Cuba', region: 'América' },
  { code: 'SJO', name: 'Juan Santamaría', city: 'San José', country: 'Costa Rica', region: 'América' },
  // Asia & Middle East
  { code: 'NRT', name: 'Narita', city: 'Tokio', country: 'Japón', region: 'Asia' },
  { code: 'HND', name: 'Haneda', city: 'Tokio', country: 'Japón', region: 'Asia' },
  { code: 'ICN', name: 'Incheon', city: 'Seúl', country: 'Corea del Sur', region: 'Asia' },
  { code: 'PEK', name: 'Capital International', city: 'Pekín', country: 'China', region: 'Asia' },
  { code: 'PVG', name: 'Pudong', city: 'Shanghái', country: 'China', region: 'Asia' },
  { code: 'HKG', name: 'Hong Kong International', city: 'Hong Kong', country: 'Hong Kong', region: 'Asia' },
  { code: 'SIN', name: 'Changi', city: 'Singapur', country: 'Singapur', region: 'Asia' },
  { code: 'BKK', name: 'Suvarnabhumi', city: 'Bangkok', country: 'Tailandia', region: 'Asia' },
  { code: 'KUL', name: 'Kuala Lumpur International', city: 'Kuala Lumpur', country: 'Malasia', region: 'Asia' },
  { code: 'DEL', name: 'Indira Gandhi', city: 'Nueva Delhi', country: 'India', region: 'Asia' },
  { code: 'BOM', name: 'Chhatrapati Shivaji', city: 'Bombay', country: 'India', region: 'Asia' },
  { code: 'DXB', name: 'Dubai International', city: 'Dubái', country: 'Emiratos Árabes Unidos', region: 'Oriente Medio' },
  { code: 'AUH', name: 'Abu Dhabi International', city: 'Abu Dabi', country: 'Emiratos Árabes Unidos', region: 'Oriente Medio' },
  { code: 'DOH', name: 'Hamad International', city: 'Doha', country: 'Catar', region: 'Oriente Medio' },
  { code: 'TLV', name: 'Ben Gurion', city: 'Tel Aviv', country: 'Israel', region: 'Oriente Medio' },
  // Africa & Oceania
  { code: 'JNB', name: "O.R. Tambo", city: 'Johannesburgo', country: 'Sudáfrica', region: 'África' },
  { code: 'CPT', name: 'Cape Town International', city: 'Ciudad del Cabo', country: 'Sudáfrica', region: 'África' },
  { code: 'CAI', name: 'Cairo International', city: 'El Cairo', country: 'Egipto', region: 'África' },
  { code: 'CMN', name: 'Mohammed V', city: 'Casablanca', country: 'Marruecos', region: 'África' },
  { code: 'RAK', name: 'Marrakech-Menara', city: 'Marrakech', country: 'Marruecos', region: 'África' },
  { code: 'SYD', name: 'Kingsford Smith', city: 'Sídney', country: 'Australia', region: 'Oceanía' },
  { code: 'MEL', name: 'Melbourne Airport', city: 'Melbourne', country: 'Australia', region: 'Oceanía' },
  { code: 'AKL', name: 'Auckland Airport', city: 'Auckland', country: 'Nueva Zelanda', region: 'Oceanía' },
]

// Remove duplicates and export
export const UNIQUE_AIRPORTS = AIRPORTS.filter((airport, index, self) =>
  index === self.findIndex((a) => a.code === airport.code)
)

// Group airports by region for better UX
export const AIRPORTS_BY_REGION = UNIQUE_AIRPORTS.reduce((acc, airport) => {
  const region = airport.region || 'Otros'
  if (!acc[region]) acc[region] = []
  acc[region].push(airport)
  return acc
}, {} as Record<string, Airport[]>)

export const AIRLINES = [
  { name: 'Iberia', logo: 'IB' },
  { name: 'Air Europa', logo: 'UX' },
  { name: 'Vueling', logo: 'VY' },
  { name: 'Ryanair', logo: 'FR' },
  { name: 'British Airways', logo: 'BA' },
  { name: 'Air France', logo: 'AF' },
  { name: 'Lufthansa', logo: 'LH' },
  { name: 'KLM', logo: 'KL' },
  { name: 'Emirates', logo: 'EK' },
  { name: 'American Airlines', logo: 'AA' },
  { name: 'Delta', logo: 'DL' },
  { name: 'United', logo: 'UA' },
  { name: 'LATAM', logo: 'LA' },
  { name: 'Avianca', logo: 'AV' },
]

function generateRandomTime(): string {
  const hours = Math.floor(Math.random() * 24)
  const minutes = Math.floor(Math.random() * 60)
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

function addHoursToTime(time: string, hoursToAdd: number): string {
  const [hours, minutes] = time.split(':').map(Number)
  const totalMinutes = hours * 60 + minutes + hoursToAdd * 60
  const newHours = Math.floor(totalMinutes / 60) % 24
  const newMinutes = totalMinutes % 60
  return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`
}

function formatDuration(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return `${h}h ${m}m`
}

export function generateFlights(
  origin: string,
  destination: string,
  date: Date
): Flight[] {
  const numFlights = Math.floor(Math.random() * 8) + 5
  const flights: Flight[] = []

  for (let i = 0; i < numFlights; i++) {
    const airline = AIRLINES[Math.floor(Math.random() * AIRLINES.length)]
    const departureTime = generateRandomTime()
    const baseDuration = 2 + Math.random() * 12
    const stops = Math.random() > 0.6 ? 0 : Math.random() > 0.5 ? 1 : 2
    const totalDuration = baseDuration + stops * (1 + Math.random())
    const arrivalTime = addHoursToTime(departureTime, totalDuration)
    
    const basePrice = 80 + Math.random() * 800
    const stopsDiscount = stops > 0 ? 0.7 : 1
    const price = Math.round(basePrice * stopsDiscount)

    const stopCities = stops > 0 
      ? AIRPORTS
          .filter(a => a.code !== origin && a.code !== destination)
          .sort(() => Math.random() - 0.5)
          .slice(0, stops)
          .map(a => a.city)
      : undefined

    flights.push({
      id: `${airline.logo}${Math.floor(Math.random() * 9000) + 1000}`,
      airline: airline.name,
      airlineLogo: airline.logo,
      flightNumber: `${airline.logo}${Math.floor(Math.random() * 9000) + 1000}`,
      departure: {
        airport: origin,
        time: departureTime,
        date: date.toISOString().split('T')[0],
      },
      arrival: {
        airport: destination,
        time: arrivalTime,
        date: date.toISOString().split('T')[0],
      },
      duration: formatDuration(totalDuration),
      durationMinutes: Math.round(totalDuration * 60),
      stops,
      stopCities,
      price,
      currency: 'EUR',
      seatsLeft: Math.random() > 0.7 ? Math.floor(Math.random() * 5) + 1 : undefined,
      cabinClass: 'Economy',
      source: 'demo',
    })
  }

  return flights.sort((a, b) => a.price - b.price)
}
