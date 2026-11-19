import { Router } from 'express'
import { query } from '../db/pool.js'
import { requireAuth, requireRole, isStaff } from '../middleware/auth.js'
import { socialColumns, socialRoutes } from './social.js'
import { visibleTo, studentParams } from '../audience.js'
import { HttpError } from '../httpError.js'

const router = Router()
router.use(requireAuth)

const SELECT = `SELECT f.id, f.course_id AS "courseId", c.title AS course, f.status, f.message, f.resolved,
  f.author_id AS "authorId", COALESCE(u.full_name,'Anonyme') AS author, f.created_at AS date, ${socialColumns('feedback', 'f')}
  FROM feedbacks f JOIN courses c ON c.id = f.course_id LEFT JOIN users u ON u.id = f.author_id`

// Confidentialité : un étudiant ne voit QUE ses propres retours ; un enseignant ceux de SES cours ; l'admin tout.
router.get('/', async (req, res) => {
  const { role, id } = req.user
  const where = role === 'student' ? 'WHERE f.author_id = $1' : role === 'teacher' ? 'WHERE c.teacher_id = $1' : ''
  const { rows } = await query(`${SELECT} ${where} ORDER BY f.created_at DESC`, where ? [id] : [])
  res.json(rows)
})

router.post('/', async (req, res) => {
  const { courseId, status, message } = req.body
  if (!courseId || !message?.trim()) return res.status(400).json({ error: 'Cours et message obligatoires.' })
  if (req.user.role === 'student') {
    const ok = await query(`SELECT 1 FROM courses c WHERE c.id = $3 AND ${visibleTo('c', 1)}`, [...studentParams(req.user), courseId])
    if (!ok.rowCount) throw new HttpError(403, 'Ce cours ne fait pas partie de votre emploi du temps.')
  }
  const { rows } = await query('INSERT INTO feedbacks (course_id,author_id,status,message) VALUES ($1,$2,$3,$4) RETURNING id', [courseId, req.user.id, status, message.trim()])
  res.status(201).json((await query(`${SELECT} WHERE f.id = $1`, [rows[0].id])).rows[0])
})

// Marquer comme traité : réservé au personnel.
router.patch('/:id', requireRole('admin', 'teacher'), async (req, res) => {
  await query('UPDATE feedbacks SET resolved = COALESCE($2, resolved) WHERE id = $1', [req.params.id, req.body.resolved])
  res.json((await query(`${SELECT} WHERE f.id = $1`, [req.params.id])).rows[0])
})

router.delete('/:id', async (req, res) => {
  await query('DELETE FROM feedbacks WHERE id=$1 AND ($2 OR author_id=$3)', [req.params.id, isStaff(req.user), req.user.id])
  res.status(204).end()
})

socialRoutes(router, 'feedback', 'feedbacks')
export default router
