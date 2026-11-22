import { query } from './db/pool.js'
import { HttpError } from './httpError.js'

// Le « public » d'un contenu (cours, annonce, ressource) = une filière et/ou un niveau. Vide = tous.
//   rien              → tout le campus        filière seule → toute la filière
//   niveau seul       → tous les L1…          les deux      → une classe (L1 Informatique)

// Colonnes à ajouter dans un SELECT : programId, levelId et un libellé lisible (« L1 Informatique »).
export const audienceColumns = (a) => `${a}.program_id AS "programId", ${a}.level_id AS "levelId",
  CASE WHEN ${a}.program_id IS NULL AND ${a}.level_id IS NULL THEN 'Tout le campus'
       WHEN ${a}.level_id IS NULL THEN 'Filière ' || (SELECT name FROM programs WHERE id = ${a}.program_id)
       WHEN ${a}.program_id IS NULL THEN 'Niveau ' || (SELECT name FROM levels WHERE id = ${a}.level_id)
       ELSE (SELECT name FROM levels WHERE id = ${a}.level_id) || ' ' || (SELECT name FROM programs WHERE id = ${a}.program_id) END AS audience`

// Condition SQL « cet étudiant est concerné » (utilise deux paramètres : $p = filière, $p+1 = niveau).
export const visibleTo = (a, p) =>
  `(${a}.program_id IS NULL OR ${a}.program_id = $${p}) AND (${a}.level_id IS NULL OR ${a}.level_id = $${p + 1})`
export const studentParams = (user) => [user.programId ?? null, user.levelId ?? null]

// Lit le public envoyé par un formulaire. Un étudiant ne peut viser que ce qui l'inclut lui-même.
export async function readAudience(user, body = {}) {
  const programId = body.programId || null
  const levelId = body.levelId || null
  if (user.role === 'student' && ((programId && programId !== user.programId) || (levelId && levelId !== user.levelId)))
    throw new HttpError(403, 'Vous ne pouvez publier que pour votre propre filière, niveau ou classe.')
  if (programId && !(await query('SELECT 1 FROM programs WHERE id = $1', [programId])).rowCount) throw new HttpError(400, 'Filière inconnue.')
  if (levelId && !(await query('SELECT 1 FROM levels WHERE id = $1', [levelId])).rowCount) throw new HttpError(400, 'Niveau inconnu.')
  return { programId, levelId }
}
