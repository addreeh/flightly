type FetchMode = 'common' | 'fallback' | 'force-fallback' | 'local'

/**
 * Obtiene el fetch_mode para google-flights-ts desde variables de entorno.
 * Permite cambiar la estrategia de scraping sin tocar código.
 *
 * IMPORTANTE: Esta utilidad solo se usa en el backend (rutas y librerías server-side).
 */
export function getGoogleFlightsFetchMode(): FetchMode {
  if (typeof process === 'undefined') {
    return 'common'
  }

  const raw = process.env.GOOGLE_FLIGHTS_FETCH_MODE ?? 'common'

  if (raw === 'fallback' || raw === 'force-fallback' || raw === 'local') {
    return raw
  }

  return 'common'
}


