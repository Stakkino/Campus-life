import { Router } from 'express'
import { query } from '../db/pool.js'
import { requireAuth, isStaff } from '../middleware/auth.js'
import { audienceColumns, visibleTo, studentParams, readAudience } from '../audience.js'
import { socialColumns, socialRoutes } from './social.js'

const router = Router()
router.use(requireAuth)

const SELECT = `SELECT a.id, a.title, a.content, a.category, a.author_id AS "authorId",
  COALESCE(u.full_name, 'Anonyme') AS author, u.role AS "authorRole", a.created_at AS date,
  ${audienceColumns('a')}, ${socialColumns('announcement', 'a')}
  FROM announcements a LEFT JOIN users u ON u.id = a.author_id`

// Un étudiant voit les annonces de son public (campus, sa filière, son niveau, sa classe) et les siennes.
router.get('/', async (req, res) => {
  const student = req.user.role === 'student'
  const { rows } = await query(
    `${SELECT} ${student ? `WHERE (${visibleTo('a', 1)} OR a.author_id = $3)` : ''} ORDER BY a.created_at DESC`,
    student ? [...studentParams(req.user), req.user.id] : [],
  )
  res.json(rows)
})

router.post('/', async (req, res) => {
  const { title, content, category = 'Divers' } = req.body
  if (!title?.trim() || !content?.trim()) return res.status(400).json({ error: 'Titre et contenu obligatoires.' })
  const { programId, levelId } = await readAudience(req.user, req.body)
  const { rows } = await query(
    'INSERT INTO announcements (title,content,category,author_id,program_id,level_id) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
    [title.trim(), content.trim(), category, req.user.id, programId, levelId],
  )
  res.status(201).json((await query(`${SELECT} WHERE a.id = $1`, [rows[0].id])).rows[0])
})

// Un étudiant ne modifie / supprime que ses publications ; le personnel modère tout.
router.put('/:id', async (req, res) => {
  const { title, content, category } = req.body
  const { programId, levelId } = await readAudience(req.user, req.body)
  await query('UPDATE announcements SET title=$2, content=$3, category=$4, program_id=$5, level_id=$6 WHERE id=$1 AND ($7 OR author_id=$8)',
    [req.params.id, title, content, category, programId, levelId, isStaff(req.user), req.user.id])
  res.json((await query(`${SELECT} WHERE a.id = $1`, [req.params.id])).rows[0])
})

router.delete('/:id', async (req, res) => {
  await query('DELETE FROM announcements WHERE id=$1 AND ($2 OR author_id=$3)', [req.params.id, isStaff(req.user), req.user.id])
  res.status(204).end()
})

socialRoutes(router, 'announcement', 'announcements')
export default router
