import { Router } from 'express'
import { pool, query } from '../db/pool.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { HttpError } from '../httpError.js'

// Filières (programs) et niveaux (levels) : définis une fois par l'administrateur,
// puis choisis dans des listes déroulantes (plus de « l1 info », « L1 informatique »…).
const router = Router()

// Public : l'inscription a besoin des listes avant la connexion.
router.get('/', async (_req, res) => {
  const [programs, levels] = await Promise.all([
    query('SELECT p.id, p.name, (SELECT count(*)::int FROM users u WHERE u.program_id = p.id AND u.status <> \'archived\') AS students FROM programs p ORDER BY p.name'),
    query(`SELECT l.id, l.name, l.next_level_id AS "nextLevelId", l.graduates,
             (SELECT count(*)::int FROM users u WHERE u.level_id = l.id AND u.status <> 'archived') AS students
           FROM levels l ORDER BY l.name`),
  ])
  res.json({ programs: programs.rows, levels: levels.rows })
})

// Recalcule le libellé « L1 Informatique » des étudiants (après un renommage ou un passage d'année).
export async function syncStudentLabels(db = pool) {
  await db.query(`UPDATE users u SET info = l.name || ' ' || p.name
    FROM programs p, levels l WHERE u.role = 'student' AND u.program_id = p.id AND u.level_id = l.id`)
}

const duplicate = (e, name) => { if (e.code === '23505') throw new HttpError(409, `« ${name} » existe déjà.`); throw e }

// Combien d'éléments utilisent encore cette filière / ce niveau (on refuse de supprimer dans ce cas).
async function usage(column, id) {
  const sql = ['users', 'courses', 'announcements', 'resources'].map((t) => `(SELECT count(*) FROM ${t} WHERE ${column} = $1)`).join(' + ')
  return Number((await query(`SELECT ${sql} AS n`, [id])).rows[0].n)
}

function crud(path, table, column, noun) {
  router.post(`/${path}`, requireAuth, requireRole('admin'), async (req, res) => {
    const name = (req.body.name || '').trim()
    if (!name) return res.status(400).json({ error: 'Le nom est obligatoire.' })
    try {
      res.status(201).json((await query(`INSERT INTO ${table} (name) VALUES ($1) RETURNING id, name`, [name])).rows[0])
    } catch (e) { duplicate(e, name) }
  })

  router.delete(`/${path}/:id`, requireAuth, requireRole('admin'), async (req, res) => {
    const used = await usage(column, req.params.id)
    if (used > 0) throw new HttpError(409, `Impossible : ${used} élément(s) (comptes, cours, annonces ou ressources) utilisent encore « ${noun} ». Changez-les d'abord.`)
    await query(`DELETE FROM ${table} WHERE id = $1`, [req.params.id])
    res.status(204).end()
  })
}
crud('programs', 'programs', 'program_id', 'cette filière')
crud('levels', 'levels', 'level_id', 'ce niveau')

router.patch('/programs/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const name = (req.body.name || '').trim()
  if (!name) return res.status(400).json({ error: 'Le nom est obligatoire.' })
  try {
    const { rows } = await query('UPDATE programs SET name = $2 WHERE id = $1 RETURNING id, name', [req.params.id, name])
    if (!rows[0]) throw new HttpError(404, 'Filière introuvable.')
    await syncStudentLabels()
    res.json(rows[0])
  } catch (e) { duplicate(e, name) }
})

// Niveau : renommer et/ou définir l'année suivante { nextLevelId } ou { graduates: true } (sort diplômé).
router.patch('/levels/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const b = req.body
  const name = b.name === undefined ? null : String(b.name).trim()
  if (name === '') return res.status(400).json({ error: 'Le nom est obligatoire.' })
  const setNext = 'nextLevelId' in b || 'graduates' in b
  const graduates = b.graduates === true
  const next = graduates ? null : b.nextLevelId || null
  if (next === req.params.id) return res.status(400).json({ error: "Un niveau ne peut pas être son propre niveau suivant." })
  try {
    const { rows } = await query(
      `UPDATE levels SET name = COALESCE($2, name),
         next_level_id = CASE WHEN $3::boolean THEN $4::uuid ELSE next_level_id END,
         graduates = CASE WHEN $3::boolean THEN $5::boolean ELSE graduates END
       WHERE id = $1 RETURNING id, name, next_level_id AS "nextLevelId", graduates`,
      [req.params.id, name, setNext, next, graduates],
    )
    if (!rows[0]) throw new HttpError(404, 'Niveau introuvable.')
    await syncStudentLabels()
    res.json(rows[0])
  } catch (e) { duplicate(e, name) }
})

// ---------- Passage d'année ----------
// Aperçu : pour chaque niveau, où iront ses étudiants. Bloqué tant qu'un niveau contenant des étudiants n'est pas configuré.
async function promotionPlan() {
  const levels = (await query(
    `SELECT l.id, l.name, l.graduates, l.next_level_id AS "nextLevelId", n.name AS "nextName"
     FROM levels l LEFT JOIN levels n ON n.id = l.next_level_id ORDER BY l.name`)).rows
  const students = (await query(
    `SELECT u.id, u.name, u.level_id AS "levelId", p.name AS program
     FROM users u LEFT JOIN programs p ON p.id = u.program_id
     WHERE u.role = 'student' AND u.status = 'active' AND u.level_id IS NOT NULL ORDER BY p.name, u.name`)).rows
  const plan = levels.map((l) => ({ ...l, configured: l.graduates || Boolean(l.nextLevelId), students: students.filter((s) => s.levelId === l.id) }))
  const unassigned = (await query("SELECT count(*)::int AS n FROM users WHERE role = 'student' AND status = 'active' AND level_id IS NULL")).rows[0].n
  return { levels: plan.filter((l) => l.students.length > 0), ready: plan.every((l) => l.students.length === 0 || l.configured), unassigned }
}

router.get('/promotion', requireAuth, requireRole('admin'), async (_req, res) => res.json(await promotionPlan()))

// Exécution : { excludeIds: [...] } = étudiants qui redoublent (restent dans leur niveau).
router.post('/promotion', requireAuth, requireRole('admin'), async (req, res) => {
  if (!(await promotionPlan()).ready) throw new HttpError(409, "Définissez d'abord l'année suivante de chaque niveau (page Filières & niveaux).")
  const exclude = Array.isArray(req.body.excludeIds) ? req.body.excludeIds : []
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    // 1) les derniers niveaux sortent diplômés (archivés) — AVANT de faire monter les autres
    const graduated = await client.query(
      `UPDATE users SET status = 'archived' WHERE role = 'student' AND status = 'active' AND id <> ALL($1::uuid[])
         AND level_id IN (SELECT id FROM levels WHERE graduates)`, [exclude])
    // 2) les autres passent au niveau suivant (une seule requête : personne ne monte deux fois)
    const promoted = await client.query(
      `UPDATE users u SET level_id = l.next_level_id FROM levels l
       WHERE u.level_id = l.id AND l.next_level_id IS NOT NULL AND u.role = 'student' AND u.status = 'active' AND u.id <> ALL($1::uuid[])`, [exclude])
    await syncStudentLabels(client)
    await client.query('COMMIT')
    res.json({ graduated: graduated.rowCount, promoted: promoted.rowCount, repeating: exclude.length })
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
})

export default router