import { Router } from 'express'
import { query } from '../db/pool.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { audienceColumns, visibleTo, studentParams, readAudience } from '../audience.js'
import { HttpError } from '../httpError.js'

const router = Router()
router.use(requireAuth)

const SELECT = `SELECT c.id, c.title, c.day, to_char(c.start_time,'HH24:MI') AS "startTime",
  to_char(c.end_time,'HH24:MI') AS "endTime", c.room, c.teacher_id AS "teacherId", u.full_name AS teacher,
  ${audienceColumns('c')}
  FROM courses c LEFT JOIN users u ON u.id = c.teacher_id`

// Un étudiant ne voit que les cours de sa classe / filière / niveau (ou ouverts à tout le campus).
router.get('/', async (req, res) => {
  const student = req.user.role === 'student'
  const { rows } = await query(
    `${SELECT} ${student ? `WHERE ${visibleTo('c', 1)}` : ''}
     ORDER BY array_position(ARRAY['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'], c.day), c.start_time`,
    student ? studentParams(req.user) : [],
  )
  res.json(rows)
})

// Un enseignant crée ses propres cours ; l'admin peut désigner l'enseignant.
router.post('/', requireRole('admin', 'teacher'), async (req, res) => {
  const { title, day, startTime, endTime, room = '', teacherId } = req.body
  const { programId, levelId } = await readAudience(req.user, req.body)
  const teacher = req.user.role === 'teacher' ? req.user.id : teacherId || null
  const { rows } = await query(
    'INSERT INTO courses (title,day,start_time,end_time,room,teacher_id,program_id,level_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id',
    [title, day, startTime, endTime, room, teacher, programId, levelId],
  )
  res.status(201).json((await query(`${SELECT} WHERE c.id = $1`, [rows[0].id])).rows[0])
})

async function ownedCourse(req) {
  const { rows } = await query('SELECT teacher_id FROM courses WHERE id = $1', [req.params.id])
  if (!rows[0]) throw new HttpError(404, 'Cours introuvable.')
  if (req.user.role === 'teacher' && rows[0].teacher_id !== req.user.id) throw new HttpError(403, 'Ce cours ne vous appartient pas.')
}

router.put('/:id', requireRole('admin', 'teacher'), async (req, res) => {
  await ownedCourse(req)
  const { title, day, startTime, endTime, room, teacherId } = req.body
  const { programId, levelId } = await readAudience(req.user, req.body)
  await query(
    `UPDATE courses SET title=$2, day=$3, start_time=$4, end_time=$5, room=$6, program_id=$7, level_id=$8,
       teacher_id = CASE WHEN $9::boolean THEN $10::uuid ELSE teacher_id END WHERE id=$1`,
    [req.params.id, title, day, startTime, endTime, room, programId, levelId, req.user.role === 'admin' && 'teacherId' in req.body, teacherId || null],
  )
  res.json((await query(`${SELECT} WHERE c.id = $1`, [req.params.id])).rows[0])
})

router.delete('/:id', requireRole('admin', 'teacher'), async (req, res) => {
  await ownedCourse(req)
  await query('DELETE FROM courses WHERE id = $1', [req.params.id])
  res.status(204).end()
})

export default router
