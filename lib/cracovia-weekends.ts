import { FlightData, getFlights, type DecodedResult } from 'google-flights-ts'
import {
  generateFridayMondayPairs,
  isInBlackout,
  formatLocalDateYMD,
} from './weekend-utils'
import { getGoogleFlightsFetchMode } from './google-flights-utils'

type OriginCode = 'AGP' | 'SVQ'
type DestinationCode = 'KRK'

const ORIGINS: OriginCode[] = ['AGP', 'SVQ']
const DEST_LABEL = 'Cracovia'
const DEST_CODE: DestinationCode = 'KRK'

interface OneWayInfo {
  price: number
  currency: string
  airline: string
}

export interface CracoviaWeekendEntry {
  origin: OriginCode
  destination_code: DestinationCode
  destination_label: string
  depart_date: string // YYYY-MM-DD
  return_date: string
  total_price: number
  currency: string
  outbound: OneWayInfo
  inbound: OneWayInfo
}

async function cheapestOneWay(
  origin: string,
  dest: string,
  dateStr: string,
  adults: number,
): Promise<OneWayInfo | null> {
  let result: DecodedResult | null = null
  try {
    const fetchMode = getGoogleFlightsFetchMode()
    result = (await getFlights({
      flight_data: [new FlightData({ date: dateStr, from_airport: origin, to_airport: dest })],
      trip: 'one-way',
      adults,
      seat: 'economy',
      max_stops: 1,
      fetch_mode: fetchMode,
      data_source: 'js',
    })) as DecodedResult | null
  } catch (e) {
    console.warn(
      `  Error buscando ${origin}->${dest} el ${dateStr} (${adults} pax):`,
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

  return {
    price: sum.price,
    currency: sum.currency,
    airline: it.airline_names.join(', '),
  }
}

/**
 * Replica de buscarCracoviaHastaJunio.ts para Next:
 * devuelve los mejores fines de semana AGP/SVQ → KRK hasta final de junio.
 */
export async function buscarCracoviaHastaJunio(
  today = new Date(),
): Promise<CracoviaWeekendEntry[]> {
  const year = today.getFullYear()
  const start = new Date(
    Math.max(new Date(year, 0, 1).getTime(), today.getTime() + 7 * 86400000),
  )
  const end = new Date(year, 5, 30) // 30 junio

  if (start > end) {
    console.log('No hay fines de semana válidos en el rango solicitado.')
    return []
  }

  console.log(
    `Buscando fines de semana a Cracovia desde ${ORIGINS.join(
      ', ',
    )} entre ${formatLocalDateYMD(start)} y ${formatLocalDateYMD(end)}...`,
  )

  let weekendPairs = Array.from(generateFridayMondayPairs(start, end))
  weekendPairs = weekendPairs.filter(([d, r]) => !isInBlackout(d, r))

  if (!weekendPairs.length) {
    console.log('No hay fines de semana disponibles tras aplicar blackout.')
    return []
  }

  const results: CracoviaWeekendEntry[] = []

  for (const [depart, ret] of weekendPairs) {
    const departStr = formatLocalDateYMD(depart)
    const retStr = formatLocalDateYMD(ret)

    for (const origin of ORIGINS) {
      console.log(
        `Buscando ida ${origin}->${DEST_CODE} ${departStr} y vuelta ${DEST_CODE}->${origin} ${retStr}...`,
      )

      const outInfo = await cheapestOneWay(origin, DEST_CODE, departStr, 1)
      if (!outInfo) continue

      const retInfo = await cheapestOneWay(DEST_CODE, origin, retStr, 1)
      if (!retInfo) continue

      const totalPrice = outInfo.price + retInfo.price

      results.push({
        origin,
        destination_code: DEST_CODE,
        destination_label: DEST_LABEL,
        depart_date: departStr,
        return_date: retStr,
        total_price: totalPrice,
        currency: outInfo.currency,
        outbound: outInfo,
        inbound: retInfo,
      })
    }
  }

  results.sort((a, b) => a.total_price - b.total_price)
  return results
}


