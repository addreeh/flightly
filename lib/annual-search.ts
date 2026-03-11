import { FlightData, getFlights, type DecodedResult } from 'google-flights-ts'
import { generateFridayMondayPairs, isInBlackout, formatLocalDateYMD } from './weekend-utils'
import { getGoogleFlightsFetchMode } from './google-flights-utils'

// Códigos de aeropuerto. Usamos string para poder aceptar
// cualquier selección del usuario en la búsqueda anual dinámica.
export type OriginCode = string
export type DestinationCode = string

const ORIGINS: OriginCode[] = ['AGP', 'SVQ']
const DESTINATIONS: { label: string; code: DestinationCode }[] = [
  { label: 'Edimburgo', code: 'EDI' },
  { label: 'Cracovia', code: 'KRK' },
  { label: 'Milán Malpensa', code: 'MXP' },
  { label: 'Milán Linate', code: 'LIN' },
  { label: 'Bérgamo (Milán)', code: 'BGY' },
]

export interface OneWayInfo {
  price: number
  currency: string
  airline: string
  departureTime: string
  arrivalMinutes: number
  arrivalTime: string
}

interface WeekendCombo {
  year: number
  month: number
  origin: OriginCode
  dest: DestinationCode
  depart: string // YYYY-MM-DD
  return: string // YYYY-MM-DD
}

export interface AnnualEntry {
  year: number
  month: number
  origin: OriginCode
  destination_code: DestinationCode
  destination_label: string
  depart_date: string
  return_date: string
  total_price: number
  currency: string
  outbound: OneWayInfo
  inbound: OneWayInfo
}

export interface AnnualSummary {
  allResults: AnnualEntry[]
  bestPerMonth: Record<string, AnnualEntry> // YYYY-MM -> entry
  bestPerDestAndMonth: Record<string, AnnualEntry> // DEST|YYYY-MM -> entry
  topGlobal: AnnualEntry[]
}

/**
 * Genera todas las combinaciones fin de semana (viernes-lunes) desde hoy+7d
 * hasta endMonth (o diciembre), para todos los orígenes/destinos, aplicando blackout.
 * Usa la misma lógica de fechas que buscarCracoviaHastaJunio.
 */
export function generateWeekendCombosFromToday(
  endMonth?: number,
  originFilter?: OriginCode[],
  destinationFilter?: DestinationCode[],
  excludedWeekendKeys?: string[],
): WeekendCombo[] {
  const today = new Date()
  const year = today.getFullYear()
  const startMonth = today.getMonth() + 1
  const finalMonth = endMonth ?? 12

  const combos: WeekendCombo[] = []

  for (let month = startMonth; month <= finalMonth; month++) {
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)

    const minStart = new Date(today)
    minStart.setDate(minStart.getDate() + 7)
    const start = new Date(Math.max(firstDay.getTime(), minStart.getTime()))
    const end = lastDay
    if (start > end) continue

    let weekendPairs = Array.from(generateFridayMondayPairs(start, end))
    weekendPairs = weekendPairs.filter(([d, r]) => !isInBlackout(d, r))

    const originsToUse = originFilter && originFilter.length ? originFilter : ORIGINS
    const destinationsToUse =
      destinationFilter && destinationFilter.length
        ? destinationFilter
        : DESTINATIONS.map((d) => d.code)

    for (const [depart, ret] of weekendPairs) {
      const departStr = formatLocalDateYMD(depart)
      const returnStr = formatLocalDateYMD(ret)

      const weekendKey = `${departStr}|${returnStr}`
      if (excludedWeekendKeys && excludedWeekendKeys.includes(weekendKey)) {
        continue
      }
      for (const origin of originsToUse) {
        for (const code of destinationsToUse) {
          combos.push({
            year,
            month,
            origin,
            dest: code,
            depart: departStr,
            return: returnStr,
          })
        }
      }
    }
  }

  return combos
}

async function cheapestRoundTripWithLegs(
  origin: string,
  dest: string,
  departStr: string,
  returnStr: string,
  adults: number,
): Promise<{ price: number; currency: string; outbound: OneWayInfo; inbound: OneWayInfo } | null> {
  let result: DecodedResult | null = null
  try {
    const fetchMode = getGoogleFlightsFetchMode()
    result = (await getFlights({
      flight_data: [
        new FlightData({ date: departStr, from_airport: origin, to_airport: dest }),
        new FlightData({ date: returnStr, from_airport: dest, to_airport: origin }),
      ],
      trip: 'round-trip',
      adults,
      seat: 'economy',
      max_stops: 1,
      fetch_mode: fetchMode,
      data_source: 'js',
    })) as DecodedResult | null
  } catch (e) {
    console.warn(
      `  Error buscando RT ${origin}<->${dest} ${departStr}/${returnStr} (${adults} pax):`,
      (e as Error).message,
    )
    return null
  }

  if (!result) return null
  const candidates = result.best.length ? result.best : result.other
  if (!candidates.length) return null

  const it = candidates.reduce((min, cur) =>
    cur.itinerary_summary.price < min.itinerary_summary.price ? cur : min,
  )
  const sum = it.itinerary_summary

  const flights = it.flights
  if (!flights || flights.length === 0) {
    return null
  }

  const outboundFlight = flights[0]
  const inboundFlight = flights[flights.length - 1]

  const [odH, odM] = outboundFlight.departure_time
  const [oaH, oaM] = outboundFlight.arrival_time
  const [idH, idM] = inboundFlight.departure_time
  const [iaH, iaM] = inboundFlight.arrival_time

  const formatHM = (h: number, m: number) =>
    `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`

  const outbound: OneWayInfo = {
    price: sum.price,
    currency: sum.currency,
    airline: it.airline_names.join(', '),
    departureTime: formatHM(odH, odM),
    arrivalMinutes: oaH * 60 + oaM,
    arrivalTime: formatHM(oaH, oaM),
  }

  const inbound: OneWayInfo = {
    price: sum.price,
    currency: sum.currency,
    airline: it.airline_names.join(', '),
    departureTime: formatHM(idH, idM),
    arrivalMinutes: iaH * 60 + iaM,
    arrivalTime: formatHM(iaH, iaM),
  }

  return {
    price: sum.price,
    currency: sum.currency,
    outbound,
    inbound,
  }
}

export async function buscarAnualDinamico(options?: {
  endMonth?: number
  topN?: number
  origins?: OriginCode[]
  destinations?: DestinationCode[]
  fromDate?: string
  toDate?: string
  excludedWeekendKeys?: string[]
}): Promise<AnnualSummary> {
  const endMonth = options?.endMonth
  const topN = options?.topN ?? 10
  const originsFilter = options?.origins
  const destinationsFilter = options?.destinations
  const fromDate = options?.fromDate
  const toDate = options?.toDate
  const excludedWeekendKeys = options?.excludedWeekendKeys

  let combos: WeekendCombo[] = []

  if (fromDate && toDate) {
    // Rango explícito seleccionado por el usuario (página inicial):
    // respetamos exactamente las fechas y los fines de semana excluidos.
    const start = new Date(fromDate)
    const end = new Date(toDate)
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && start <= end) {
      let weekendPairs = Array.from(generateFridayMondayPairs(start, end))
      weekendPairs = weekendPairs.filter(([d, r]) => !isInBlackout(d, r))

      const originsToUse = originsFilter && originsFilter.length ? originsFilter : ORIGINS
      const destinationsToUse =
        destinationsFilter && destinationsFilter.length
          ? destinationsFilter
          : DESTINATIONS.map((d) => d.code)

      for (const [depart, ret] of weekendPairs) {
        const departStr = formatLocalDateYMD(depart)
        const returnStr = formatLocalDateYMD(ret)

        const weekendKey = `${departStr}|${returnStr}`
        if (excludedWeekendKeys && excludedWeekendKeys.includes(weekendKey)) {
          continue
        }

        const year = depart.getFullYear()
        const month = depart.getMonth() + 1

        for (const origin of originsToUse) {
          for (const dest of destinationsToUse) {
            combos.push({
              year,
              month,
              origin,
              dest,
              depart: departStr,
              return: returnStr,
            })
          }
        }
      }
    }
  } else {
    // Comportamiento por defecto: desde hoy+7 hasta endMonth, respetando blackout global.
    combos = generateWeekendCombosFromToday(endMonth, originsFilter, destinationsFilter, excludedWeekendKeys)
  }

  const allResults: AnnualEntry[] = []

  // Para no saturar Google Flights, limitamos la concurrencia.
  // Como ahora sólo hacemos 1 llamada round-trip por finde (en lugar de 3),
  // podemos permitir un poco más de concurrencia sin pasarnos.
  const CONCURRENCY = 5

  for (let i = 0; i < combos.length; i += CONCURRENCY) {
    const batch = combos.slice(i, i + CONCURRENCY)

    await Promise.all(
      batch.map(async (combo) => {
        const { origin, dest, depart, return: ret, year, month } = combo

        const destMeta =
          DESTINATIONS.find((d) => d.code === dest) ??
          ({
            label: dest,
            code: dest,
          } as const)

        const rt = await cheapestRoundTripWithLegs(origin, dest, depart, ret, 1)
        if (!rt) return

        allResults.push({
          year,
          month,
          origin,
          destination_code: dest,
          destination_label: destMeta.label,
          depart_date: depart,
          return_date: ret,
          total_price: rt.price,
          currency: rt.currency,
          outbound: rt.outbound,
          inbound: rt.inbound,
        })
      }),
    )
  }

  // Agregaciones
  const bestPerMonth: Record<string, AnnualEntry> = {}
  const bestPerDestAndMonth: Record<string, AnnualEntry> = {}

  for (const entry of allResults) {
    const monthKey = `${entry.year}-${String(entry.month).padStart(2, '0')}`
    const destMonthKey = `${entry.destination_code}|${monthKey}`

    const currentMonth = bestPerMonth[monthKey]
    if (!currentMonth || entry.total_price < currentMonth.total_price) {
      bestPerMonth[monthKey] = entry
    }

    const currentDestMonth = bestPerDestAndMonth[destMonthKey]
    if (!currentDestMonth || entry.total_price < currentDestMonth.total_price) {
      bestPerDestAndMonth[destMonthKey] = entry
    }
  }

  const sorted = [...allResults].sort((a, b) => a.total_price - b.total_price)
  const topGlobal = sorted.slice(0, topN)

  return {
    allResults,
    bestPerMonth,
    bestPerDestAndMonth,
    topGlobal,
  }
}

