import { Router } from 'express'
import { query } from '../db/pool.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

// Statistiques de l'administrateur : tout est calculé en SQL (COUNT, GROUP BY).
router.get('/admin', requireRole('admin'), async (_req, res) => {
  const [counts, activity, flou, active, week] = await Promise.all([
    query(`SELECT
      count(*) FILTER (WHERE role='student' AND status='active')::int AS students,
      count(*) FILTER (WHERE role='teacher' AND status='active')::int AS teachers,
      count(*) FILTER (WHERE status='pending')::int AS pending,
      count(*) FILTER (WHERE role='student' AND status='active' AND created_at > now() - interval '7 days')::int AS "newStudents"
      FROM users`),
    query(`SELECT to_char(d,'YYYY-MM-DD') AS date,
        (SELECT count(*)::int FROM messages WHERE created_at::date = d) AS messages,
        (SELECT count(*)::int FROM announcements WHERE created_at::date = d) AS posts
      FROM generate_series(current_date - 6, current_date, '1 day') d ORDER BY d`),
    query(`SELECT c.title, count(*)::int AS total,
        count(*) FILTER (WHERE f.status='flou')::int AS flou
      FROM courses c JOIN feedbacks f ON f.course_id = c.id GROUP BY c.id ORDER BY flou DESC, total DESC LIMIT 5`),
    query(`SELECT u.id, u.name, (
          (SELECT count(*) FROM messages WHERE author_id=u.id) + (SELECT count(*) FROM announcements WHERE author_id=u.id) +
          (SELECT count(*) FROM feedbacks WHERE author_id=u.id) + (SELECT count(*) FROM comments WHERE author_id=u.id))::int AS contributions
      FROM users u WHERE u.role='student' AND u.status='active' ORDER BY contributions DESC, u.name LIMIT 5`),
    query(`SELECT
      (SELECT count(*) FROM messages WHERE created_at > now() - interval '7 days') + (SELECT count(*) FROM announcements WHERE created_at > now() - interval '7 days') AS this_week,
      (SELECT count(*) FROM messages WHERE created_at BETWEEN now() - interval '14 days' AND now() - interval '7 days') + (SELECT count(*) FROM announcements WHERE created_at BETWEEN now() - interval '14 days' AND now() - interval '7 days') AS last_week,
      (SELECT count(*) FROM messages)+(SELECT count(*) FROM announcements) AS total`),
  ])
  const w = week.rows[0]
  const thisWeek = Number(w.this_week), lastWeek = Number(w.last_week)
  res.json({
    ...counts.rows[0],
    activity: activity.rows,
    flouCourses: flou.rows,
    topStudents: active.rows,
    publications: { total: Number(w.total), thisWeek, evolution: lastWeek ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : null },
  })
})

// Tableau de bord enseignant : ses cours, ses retours et son prochain examen.
router.get('/teacher', requireRole('teacher', 'admin'), async (req, res) => {
  const scope = req.user.role === 'admin' ? null : req.user.id
  const [courses, feedback, next, clarity] = await Promise.all([
    query('SELECT count(*)::int AS n FROM courses WHERE $1::uuid IS NULL OR teacher_id = $1', [scope]),
    query(`SELECT count(*) FILTER (WHERE f.status='flou' AND NOT f.resolved)::int AS flou,
        count(*) FILTER (WHERE f.status='question' AND NOT f.resolved)::int AS questions
      FROM feedbacks f JOIN courses c ON c.id=f.course_id WHERE $1::uuid IS NULL OR c.teacher_id = $1`, [scope]),
    query(`SELECT e.title, c.title AS course, to_char(e.exam_date,'YYYY-MM-DD') AS date, (e.exam_date - current_date) AS "daysLeft"
      FROM exams e JOIN courses c ON c.id=e.course_id WHERE e.exam_date >= current_date AND ($1::uuid IS NULL OR c.teacher_id = $1)
      ORDER BY e.exam_date LIMIT 1`, [scope]),
    query(`SELECT c.title, count(f.id)::int AS total, count(*) FILTER (WHERE f.status='flou')::int AS flou
      FROM courses c LEFT JOIN feedbacks f ON f.course_id=c.id WHERE $1::uuid IS NULL OR c.teacher_id = $1
      GROUP BY c.id HAVING count(f.id) > 0 ORDER BY count(*) FILTER (WHERE f.status='flou') DESC`, [scope]),
  ])
  res.json({ courses: courses.rows[0].n, ...feedback.rows[0], nextExam: next.rows[0] || null, clarity: clarity.rows })
})

export default router
