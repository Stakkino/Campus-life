import { Router } from 'express'
import { query } from '../db/pool.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

// Chaque utilisateur ne voit et ne modifie QUE ses propres tâches.
const COLS = `id, title, description, priority, to_char(due_date,'YYYY-MM-DD') AS "dueDate", done`

router.get('/', async (req, res) => {
  const { rows } = await query(`SELECT ${COLS} FROM tasks WHERE owner_id = $1 ORDER BY done, due_date NULLS LAST`, [req.user.id])
  res.json(rows)
})

router.post('/', async (req, res) => {
  const { title, description = '', priority = 'medium', dueDate = null } = req.body
  if (!title?.trim()) return res.status(400).json({ error: 'Le titre est obligatoire.' })
  const { rows } = await query(
    `INSERT INTO tasks (owner_id,title,description,priority,due_date) VALUES ($1,$2,$3,$4,$5) RETURNING ${COLS}`,
    [req.user.id, title.trim(), description, priority, dueDate || null],
  )
  res.status(201).json(rows[0])
})

router.patch('/:id', async (req, res) => {
  const { title, description, priority, dueDate, done } = req.body
  const { rows } = await query(
    `UPDATE tasks SET title = COALESCE($3,title), description = COALESCE($4,description), priority = COALESCE($5,priority),
       due_date = CASE WHEN $6::boolean THEN $7::date ELSE due_date END, done = COALESCE($8,done)
     WHERE id = $1 AND owner_id = $2 RETURNING ${COLS}`,
    [req.params.id, req.user.id, title, description, priority, 'dueDate' in req.body, dueDate || null, done],
  )
  rows[0] ? res.json(rows[0]) : res.status(404).json({ error: 'Tâche introuvable.' })
})

router.delete('/:id', async (req, res) => {
  await query('DELETE FROM tasks WHERE id = $1 AND owner_id = $2', [req.params.id, req.user.id])
  res.status(204).end()
})

export default router
