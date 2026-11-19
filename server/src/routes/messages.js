import { Router } from 'express'
import { query } from '../db/pool.js'
import { requireAuth, isStaff } from '../middleware/auth.js'
import { channelsFor } from './channels.js'
import { HttpError } from '../httpError.js'

const router = Router()
router.use(requireAuth)

const SELECT = `SELECT m.id, m.channel, m.author_id AS "authorId", COALESCE(u.full_name,'Anonyme') AS author, u.role,
  m.content AS text, m.created_at AS date FROM messages m LEFT JOIN users u ON u.id = m.author_id`

// On ne lit et n'écrit que dans les salons qu'on a le droit de voir.
async function assertChannel(user, channel) {
  if (!(await channelsFor(user)).some((c) => c.id === channel)) throw new HttpError(403, "Vous n'avez pas accès à ce salon.")
}

// GET /api/messages?channel=general
router.get('/', async (req, res) => {
  const channel = req.query.channel || 'general'
  await assertChannel(req.user, channel)
  res.json((await query(`${SELECT} WHERE m.channel = $1 ORDER BY m.created_at LIMIT 300`, [channel])).rows)
})

router.post('/', async (req, res) => {
  const { channel = 'general', text } = req.body
  if (!text?.trim()) return res.status(400).json({ error: 'Message vide.' })
  await assertChannel(req.user, channel)
  const { rows } = await query('INSERT INTO messages (channel,author_id,content) VALUES ($1,$2,$3) RETURNING id', [channel, req.user.id, text.trim()])
  res.status(201).json((await query(`${SELECT} WHERE m.id = $1`, [rows[0].id])).rows[0])
})

router.put('/:id', async (req, res) => {
  await query('UPDATE messages SET content=$2 WHERE id=$1 AND ($3 OR author_id=$4)', [req.params.id, req.body.text, isStaff(req.user), req.user.id])
  res.json((await query(`${SELECT} WHERE m.id = $1`, [req.params.id])).rows[0])
})

router.delete('/:id', async (req, res) => {
  await query('DELETE FROM messages WHERE id=$1 AND ($2 OR author_id=$3)', [req.params.id, isStaff(req.user), req.user.id])
  res.status(204).end()
})

export default router
