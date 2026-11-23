const fmt = (options) => (value) => new Intl.DateTimeFormat('fr-FR', options).format(new Date(value))
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)

export const formatLongDate = (d = new Date()) => cap(fmt({ weekday: 'long', day: 'numeric', month: 'long' })(d))
export const formatShortDate = fmt({ day: 'numeric', month: 'short' })
export const formatDateTime = fmt({ day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

// "AAAA-MM-JJ" → Date locale (évite le décalage de fuseau horaire).
export const parseISO = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d) }

// Nombre de jours entre aujourd'hui et une date "AAAA-MM-JJ" (négatif = passé).
export function daysUntil(iso) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  return Math.round((parseISO(iso) - today) / 86400000)
}

export function relativeDays(iso) {
  const n = daysUntil(iso)
  if (n === 0) return "Aujourd'hui"
  if (n === 1) return 'Demain'
  if (n === -1) return 'Hier'
  return n > 0 ? `Dans ${n} jours` : `Il y a ${-n} jours`
}

// "Il y a 2 h", "Hier"… à partir d'une date ISO complète.
export function timeAgo(iso) {
  const min = Math.round((Date.now() - new Date(iso)) / 60000)
  if (min < 1) return "À l'instant"
  if (min < 60) return `Il y a ${min} min`
  if (min < 1440) return `Il y a ${Math.round(min / 60)} h`
  const d = Math.round(min / 1440)
  return d === 1 ? 'Hier' : `Il y a ${d} jours`
}
