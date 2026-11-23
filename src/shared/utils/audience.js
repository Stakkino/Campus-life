// Le « public » d'un contenu (cours, annonce, ressource) : une filière et/ou un niveau. Vide = tous.
//   rien → tout le campus · filière seule → toute la filière · niveau seul → tous les L1… · les deux → une classe
const EMPTY = { programs: [], levels: [] }

// Deux listes déroulantes pour les formulaires du personnel (EntityForm).
// Un étudiant n'y trouve que SA filière et SON niveau (il ne peut pas viser les autres).
export function audienceFields(catalog, user) {
  const { programs, levels } = catalog ?? EMPTY
  const student = user.role === 'student'
  const ps = student ? programs.filter((p) => p.id === user.programId) : programs
  const ls = student ? levels.filter((l) => l.id === user.levelId) : levels
  return [
    { name: 'programId', label: 'Filière concernée', type: 'select', half: true, options: [{ value: '', label: 'Toutes les filières' }, ...ps.map((p) => ({ value: p.id, label: p.name }))] },
    { name: 'levelId', label: 'Niveau concerné', type: 'select', half: true, options: [{ value: '', label: 'Tous les niveaux' }, ...ls.map((l) => ({ value: l.id, label: l.name }))] },
  ]
}

// Les 4 choix simples proposés à un étudiant qui publie : campus, ma filière, mon niveau, ma classe.
export function studentChoices(catalog, user) {
  const { programs, levels } = catalog ?? EMPTY
  const p = programs.find((x) => x.id === user.programId)
  const l = levels.find((x) => x.id === user.levelId)
  const choices = [{ value: 'campus', label: 'Tout le campus', programId: '', levelId: '' }]
  if (p) choices.push({ value: 'program', label: `Ma filière (${p.name})`, programId: p.id, levelId: '' })
  if (l) choices.push({ value: 'level', label: `Mon niveau (${l.name})`, programId: '', levelId: l.id })
  if (p && l) choices.push({ value: 'class', label: `Ma classe (${l.name} ${p.name})`, programId: p.id, levelId: l.id })
  return choices
}
