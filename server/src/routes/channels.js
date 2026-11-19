import { Router } from 'express'
import { query } from '../db/pool.js'
import { requireAuth } from '../middleware/auth.js'
import { visibleTo, studentParams } from '../audience.js'

const router = Router()

// Salons de discussion visibles par un utilisateur :
//   • Général            → tout le monde
//   • Filière / Classe   → l'étudiant voit sa filière et sa classe ; l'enseignant ceux de ses cours ; l'admin TOUS
//   • Cours              → les cours qui concernent l'étudiant, les cours de l'enseignant, tous pour l'admin
export async function channelsFor(user) {
  const list = [{ id: 'general', name: 'Général', kind: 'general' }]
  const [programs, levels] = await Promise.all([
    query('SELECT id, name FROM programs ORDER BY name'),
    query('SELECT id, name FROM levels ORDER BY name'),
  ])
  const program = (id) => programs.rows.find((p) => p.id === id)
  const level = (id) => levels.rows.find((l) => l.id === id)
  const addProgram = (p) => p && !list.some((c) => c.id === `program:${p.id}`) && list.push({ id: `program:${p.id}`, name: p.name, kind: 'program' })
  const addClass = (p, l) => p && l && !list.some((c) => c.id === `class:${p.id}:${l.id}`) && list.push({ id: `class:${p.id}:${l.id}`, name: `${l.name} ${p.name}`, kind: 'class' })

  let courses
  if (user.role === 'admin') {
    programs.rows.forEach(addProgram)
    programs.rows.forEach((p) => levels.rows.forEach((l) => addClass(p, l)))
    courses = (await query('SELECT id, title FROM courses ORDER BY title')).rows
  } else if (user.role === 'student') {
    addProgram(program(user.programId))
    addClass(program(user.programId), level(user.levelId))
    courses = (await query(`SELECT c.id, c.title FROM courses c WHERE ${visibleTo('c', 1)} ORDER BY c.title`, studentParams(user))).rows
  } else {
    const own = (await query('SELECT id, title, program_id, level_id FROM courses WHERE teacher_id = $1 ORDER BY title', [user.id])).rows
    own.forEach((c) => { addProgram(c.level_id ? null : program(c.program_id)); addClass(program(c.program_id), level(c.level_id)) })
    courses = own
  }
  courses.forEach((c) => list.push({ id: `course:${c.id}`, name: c.title, kind: 'course' }))
  const order = { general: 0, program: 1, class: 2, course: 3 }
  return list.sort((a, b) => order[a.kind] - order[b.kind] || a.name.localeCompare(b.name, 'fr'))
}

router.get('/', requireAuth, async (req, res) => res.json(await channelsFor(req.user)))

export default router
