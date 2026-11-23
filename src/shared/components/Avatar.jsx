import { TITLES } from '../utils/constants.js'

// Les civilités (Dr, Mme…) ne comptent pas dans les initiales : « Dr Rakoto Jean » → RJ.
export const initials = (name = '?') => {
  const words = name.split(/\s+/).filter(Boolean)
  const clean = TITLES.includes(words[0]) && words.length > 1 ? words.slice(1) : words
  return clean.slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?'
}

// La couleur (vert ou bleu) dépend du nom : toujours la même pour une même personne.
export default function Avatar({ name, size }) {
  const blue = [...(name || '')].reduce((s, c) => s + c.charCodeAt(0), 0) % 2 === 1
  return <span className={`avatar ${blue ? 'avatar-blue' : ''} ${size === 'sm' ? 'avatar-sm' : ''}`} aria-hidden="true">{initials(name)}</span>
}