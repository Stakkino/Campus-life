import { Router } from 'express'
import { query } from '../db/pool.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { audienceColumns, visibleTo, studentParams } from '../audience.js'

const router = Router()
router.use(requireAuth)

const SELECT = `SELECT e.id, e.title, e.course_id AS "courseId", c.title AS course, to_char(e.exam_date,'YYYY-MM-DD') AS date,
  to_char(e.start_time,'HH24:MI') AS "startTime", e.room, (e.exam_date - current_date) AS "daysLeft", c.teacher_id AS "teacherId",
  ${audienceColumns('c')}
  FROM exams e JOIN courses c ON c.id = e.course_id`

// Un étudiant ne voit que les examens des cours qui le concernent ; l'enseignant et l'admin gèrent les leurs.
router.get('/', async (req, res) => {
  const student = req.user.role === 'student'
  const { rows } = await query(
    `${SELECT} WHERE e.exam_date >= current_date ${student ? `AND ${visibleTo('c', 1)}` : ''} ORDER BY e.exam_date, e.start_time`,
    student ? studentParams(req.user) : [],
  )
  res.json(rows)
})

async function canEditCourse(req, courseId) {
  if (req.user.role === 'admin') return true
  const { rows } = await query('SELECT 1 FROM courses WHERE id=$1 AND teacher_id=$2', [courseId, req.user.id])
  return rows.length > 0
}

router.post('/', requireRole('admin', 'teacher'), async (req, res) => {
  const { courseId, title, date, startTime, room = '' } = req.body
  if (!courseId || !title?.trim() || !date || !startTime) return res.status(400).json({ error: 'Cours, intitulé, date et heure obligatoires.' })
  if (!(await canEditCourse(req, courseId))) return res.status(403).json({ error: 'Ce cours ne vous appartient pas.' })
  const { rows } = await query('INSERT INTO exams (course_id,title,exam_date,start_time,room,created_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id', [courseId, title.trim(), date, startTime, room, req.user.id])
  const course = (await query('SELECT title, program_id, level_id FROM courses WHERE id=$1', [courseId])).rows[0]
  // Annonce automatique, adressée au même public que le cours.
  await query("INSERT INTO announcements (title,content,category,author_id,program_id,level_id) VALUES ($1,$2,'Examens',$3,$4,$5)", [
    `Examen : ${course.title}`, `${title.trim()} le ${date} à ${startTime}${room ? ` · ${room}` : ''}.`, req.user.id, course.program_id, course.level_id])
  res.status(201).json((await query(`${SELECT} WHERE e.id = $1`, [rows[0].id])).rows[0])
})

router.delete('/:id', requireRole('admin', 'teacher'), async (req, res) => {
  const { rows } = await query('SELECT course_id FROM exams WHERE id=$1', [req.params.id])
  if (rows[0] && (await canEditCourse(req, rows[0].course_id))) await query('DELETE FROM exams WHERE id=$1', [req.params.id])
  res.status(204).end()
})

export default router
