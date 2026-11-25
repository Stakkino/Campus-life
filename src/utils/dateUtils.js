// Les dates sont stockées au format "AAAA-MM-JJ" (texte).
// Avantage : on peut les comparer et les trier directement comme des chaînes.

export function toISODate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function todayISO() {
  return toISODate(new Date())
}

// Date d'aujourd'hui + n jours (n peut être négatif). Utile pour les données de démo.
export function daysFromNow(n) {
  const date = new Date()
  date.setDate(date.getDate() + n)
  return toISODate(date)
}

// "Mercredi 11 novembre 2026"
export function formatLongDate(date = new Date()) {
  const text = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// "11 nov."
export function formatShortDate(iso) {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(
    new Date(`${iso}T00:00:00`),
  )
}

// Une date limite est dépassée si elle est strictement avant aujourd'hui.
export function isOverdue(iso) {
  return Boolean(iso) && iso < todayISO()
}

export function formatDateTime(iso) {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
}
