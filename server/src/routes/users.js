import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { query } from '../db/pool.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

const TITLES = ['', 'Mr', 'Mme', 'Mlle', 'Dr', 'Prof']

// `name` = nom affiché (« Dr Rakoto ») ; `baseName` = nom seul, utile pour le formulaire de modification.
const COLS = `u.id, u.full_name AS name, u.name AS "baseName", u.title, u.email, u.role, u.status, u.info,
  u.program_id AS "programId", u.level_id AS "levelId", u.created_at AS "createdAt"`

async function getUser(id) {
  return (await query(`SELECT ${COLS} FROM users u WHERE u.id = $1`, [id])).rows[0]
}

// « L1 Informatique » à partir des deux listes déroulantes (vide si l'un des deux manque).
async function studentLabel(programId, levelId) {
  if (!programId || !levelId) return ''
  const { rows } = await query('SELECT l.name || \' \' || p.name AS label FROM programs p, levels l WHERE p.id = $1 AND l.id = $2', [programId, levelId])
  return rows[0]?.label || ''
}

// Admin : liste complète. Autres rôles : liste réduite (nom + rôle) pour afficher les auteurs.
router.get('/', async (req, res) => {
  if (req.user.role === 'admin') {
    const { rows } = await query(`SELECT ${COLS} FROM users u ORDER BY u.created_at DESC`)
    return res.json(rows)
  }
  const { rows } = await query("SELECT id, full_name AS name, role FROM users WHERE status = 'active' ORDER BY name")
  res.json(rows)
})

// L'admin crée directement un compte (enseignant, étudiant ou autre admin), actif tout de suite.
router.post('/', requireRole('admin'), async (req, res) => {
  const { name = '', email = '', password = '', role = 'student', info = '', title = '', programId = null, levelId = null } = req.body
  if (!name.trim() || !email.trim() || password.length < 4 || !['admin', 'teacher', 'student'].includes(role))
    return res.status(400).json({ error: 'Nom, email, rôle et mot de passe (4 caractères min.) obligatoires.' })
  if (!TITLES.includes(title)) return res.status(400).json({ error: 'Civilité inconnue.' })
  if ((await query('SELECT 1 FROM users WHERE lower(email) = lower($1)', [email.trim()])).rowCount)
    return res.status(409).json({ error: 'Cet email est déjà utilisé.' })

  const isStudent = role === 'student'
  const label = isStudent ? await studentLabel(programId, levelId) : ''
  const { rows } = await query(
    `INSERT INTO users (name,email,password_hash,role,status,info,title,program_id,level_id)
     VALUES ($1,$2,$3,$4,'active',$5,$6,$7,$8) RETURNING id`,
    [name.trim(), email.trim(), bcrypt.hashSync(password, 10), role, isStudent ? label || info.trim() : info.trim(),
      isStudent ? '' : title, isStudent ? programId || null : null, isStudent ? levelId || null : null],
  )
  res.status(201).json(await getUser(rows[0].id))
})

// Modifier un compte (valider, changer civilité, filière, niveau, email, mot de passe…).
router.patch('/:id', requireRole('admin'), async (req, res) => {
  const current = await getUser(req.params.id)
  if (!current) return res.status(404).json({ error: 'Utilisateur introuvable.' })
  const b = req.body
  if (b.status !== undefined && !['active', 'pending', 'archived'].includes(b.status)) return res.status(400).json({ error: 'Statut inconnu.' })
  if (b.title !== undefined && !TITLES.includes(b.title)) return res.status(400).json({ error: 'Civilité inconnue.' })
  if (b.password !== undefined && b.password !== '' && b.password.length < 4) return res.status(400).json({ error: 'Mot de passe : 4 caractères minimum.' })
  if (b.email && b.email.trim().toLowerCase() !== current.email.toLowerCase()) {
    if ((await query('SELECT 1 FROM users WHERE lower(email) = lower($1) AND id <> $2', [b.email.trim(), req.params.id])).rowCount)
      return res.status(409).json({ error: 'Cet email est déjà utilisé.' })
  }

  const role = b.role ?? current.role
  const isStudent = role === 'student'
  const programId = 'programId' in b ? b.programId || null : current.programId
  const levelId = 'levelId' in b ? b.levelId || null : current.levelId
  let info = b.info ?? current.info
  if (isStudent && ('programId' in b || 'levelId' in b)) info = (await studentLabel(programId, levelId)) || info

  await query(
    `UPDATE users SET name = $2, email = $3, role = $4, status = $5, info = $6, title = $7,
       program_id = $8, level_id = $9, password_hash = COALESCE($10, password_hash) WHERE id = $1`,
    [req.params.id, (b.name ?? current.baseName).trim(), (b.email ?? current.email).trim(), role, b.status ?? current.status, info,
      isStudent ? '' : b.title ?? current.title, isStudent ? programId : null, isStudent ? levelId : null,
      b.password ? bcrypt.hashSync(b.password, 10) : null],
  )
  res.json(await getUser(req.params.id))
})

router.delete('/:id', requireRole('admin'), async (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte.' })
  await query('DELETE FROM users WHERE id = $1', [req.params.id])
  res.status(204).end()
})

export default router
