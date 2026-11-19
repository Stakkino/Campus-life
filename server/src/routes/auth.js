import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { query } from '../db/pool.js'
import { signToken, requireAuth } from '../middleware/auth.js'

const router = Router()
const publicUser = ({ id, full_name: name, title, email, role, status, info, program_id: programId, level_id: levelId }) => ({ id, name, title, email, role, status, info, programId, levelId })

router.post('/login', async (req, res) => {
  const { email = '', password = '' } = req.body
  const { rows } = await query('SELECT * FROM users WHERE lower(email) = lower($1)', [email.trim()])
  const user = rows[0]
  if (!user || !bcrypt.compareSync(password, user.password_hash))
    return res.status(401).json({ error: 'Email ou mot de passe incorrect.' })
  if (user.status === 'pending')
    return res.status(403).json({ error: "Votre compte est en attente de validation par l'administrateur." })
  if (user.status === 'archived')
    return res.status(403).json({ error: 'Ce compte est archivé (ancien étudiant). Contactez l\'administration.' })
  res.json({ token: signToken(user), user: publicUser(user) })
})

// Inscription : toujours un étudiant, en attente de validation par l'admin.
router.post('/signup', async (req, res) => {
  const { name = '', email = '', password = '', programId = null, levelId = null } = req.body
  if (!name.trim() || !email.trim() || password.length < 4)
    return res.status(400).json({ error: 'Nom, email et mot de passe (4 caractères min.) obligatoires.' })
  // Si l'admin a défini des filières / niveaux, l'étudiant doit en choisir un.
  const catalog = (await query('SELECT (SELECT count(*) FROM programs) AS p, (SELECT count(*) FROM levels) AS l')).rows[0]
  if ((Number(catalog.p) > 0 && !programId) || (Number(catalog.l) > 0 && !levelId))
    return res.status(400).json({ error: 'Choisissez votre filière et votre niveau.' })
  let info = ''
  if (programId && levelId) {
    const r = await query("SELECT l.name || ' ' || p.name AS label FROM programs p, levels l WHERE p.id = $1 AND l.id = $2", [programId, levelId])
    if (!r.rows[0]) return res.status(400).json({ error: 'Filière ou niveau invalide.' })
    info = r.rows[0].label
  }
  const exists = await query('SELECT 1 FROM users WHERE lower(email) = lower($1)', [email.trim()])
  if (exists.rowCount) return res.status(409).json({ error: 'Cet email est déjà utilisé.' })
  await query(
    "INSERT INTO users (name,email,password_hash,role,status,info,program_id,level_id) VALUES ($1,$2,$3,'student','pending',$4,$5,$6)",
    [name.trim(), email.trim(), bcrypt.hashSync(password, 10), info, programId || null, levelId || null],
  )
  res.status(201).json({ ok: true })
})

router.get('/me', requireAuth, (req, res) => res.json({ user: req.user }))

export default router
