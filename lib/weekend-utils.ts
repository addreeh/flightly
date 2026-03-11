// Utilidades compartidas para generar fines de semana viernes-lunes
// y aplicar el mismo blackout en todos los scripts (TS, Python, Next).

export const BLACKOUT_RANGES = [
  // 23/04/2026–15/05/2026 (mismas fechas que en los scripts originales)
  { start: new Date(2026, 3, 23), end: new Date(2026, 4, 15) },
]

export function isInBlackout(depart: Date, ret: Date): boolean {
  return BLACKOUT_RANGES.some(({ start, end }) => depart <= end && ret >= start)
}

export function* generateFridayMondayPairs(
  start: Date,
  end: Date,
): Generator<[Date, Date]> {
  let current = new Date(start)
  while (current <= end) {
    const weekday = current.getDay() // 0=dom, 1=lun, ..., 5=vie
    const daysToFriday = (5 - weekday + 7) % 7
    const friday = new Date(current)
    friday.setDate(friday.getDate() + daysToFriday)
    if (friday > end) break
    const monday = new Date(friday)
    monday.setDate(monday.getDate() + 3)
    if (monday <= end) yield [friday, monday]
    current = new Date(friday)
    current.setDate(current.getDate() + 7)
  }
}

// Formatea una fecha como YYYY-MM-DD en hora local
// para evitar los desfases de toISOString() (UTC -> día anterior).
export function formatLocalDateYMD(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

