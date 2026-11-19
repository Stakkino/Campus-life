import { Router, raw } from 'express'
import { query } from '../db/pool.js'
import { requireAuth, isStaff } from '../middleware/auth.js'
import { audienceColumns, visibleTo, studentParams, readAudience } from '../audience.js'
import { HttpError } from '../httpError.js'

const router = Router()
router.use(requireAuth)

const MAX_MB = 15
// Extensions acceptées → type MIME servi au téléchargement.
const MIME = {
  pdf: 'application/pdf', doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', txt: 'text/plain; charset=utf-8',
}

// Le fichier lui-même n'est jamais renvoyé dans la liste, seulement son nom et sa taille.
const SELECT = `SELECT r.id, r.title, r.subject, r.type, r.url, r.description, r.author_id AS "authorId",
  r.file_name AS "fileName", r.file_size AS "fileSize", (r.file_name IS NOT NULL) AS "hasFile", ${audienceColumns('r')}
  FROM resources r`

router.get('/', async (req, res) => {
  const student = req.user.role === 'student'
  const { rows } = await query(
    `${SELECT} ${student ? `WHERE (${visibleTo('r', 1)} OR r.author_id = $3)` : ''} ORDER BY r.created_at DESC`,
    student ? [...studentParams(req.user), req.user.id] : [],
  )
  res.json(rows)
})

// Téléchargement : l'étudiant ne reçoit que les fichiers de sa classe (ou les siens).
router.get('/:id/file', async (req, res) => {
  const student = req.user.role === 'student'
  const { rows } = await query(
    `SELECT r.file_name, r.file_mime, r.file_data FROM resources r
     WHERE r.id = $${student ? 4 : 1} AND r.file_name IS NOT NULL ${student ? `AND (${visibleTo('r', 1)} OR r.author_id = $3)` : ''}`,
    student ? [...studentParams(req.user), req.user.id, req.params.id] : [req.params.id],
  )
  if (!rows.length) throw new HttpError(404, 'Fichier introuvable.')
  const f = rows[0]
  res.setHeader('Content-Type', f.file_mime)
  res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(f.file_name)}`)
  res.send(f.file_data)
})

router.post('/', async (req, res) => {
  const { title, subject = '', type = 'Lien', url = '', description = '', kind = 'link' } = req.body
  if (!title?.trim()) return res.status(400).json({ error: 'Le titre est obligatoire.' })
  if (kind !== 'file' && !url.trim()) return res.status(400).json({ error: 'Le lien est obligatoire.' })
  const { programId, levelId } = await readAudience(req.user, req.body)
  const { rows } = await query(
    'INSERT INTO resources (title,subject,type,url,description,author_id,program_id,level_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id',
    [title.trim(), subject, kind === 'file' ? 'Document' : type, kind === 'file' ? '' : url.trim(), description, req.user.id, programId, levelId],
  )
  res.status(201).json((await query(`${SELECT} WHERE r.id = $1`, [rows[0].id])).rows[0])
})

// Corps brut : le navigateur envoie le fichier tel quel, son nom est dans ?name=
router.put('/:id/file', raw({ type: () => true, limit: `${MAX_MB}mb` }), async (req, res) => {
  const name = String(req.query.name || '').trim().slice(0, 200)
  const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : ''
  if (!MIME[ext]) throw new HttpError(400, 'Format non accepté (PDF, Word, PowerPoint, Excel, image ou texte).')
  if (!Buffer.isBuffer(req.body) || !req.body.length) throw new HttpError(400, 'Fichier vide.')
  const done = await query(
    `UPDATE resources SET file_name=$2, file_mime=$3, file_size=$4, file_data=$5, url='', type=$6
     WHERE id=$1 AND ($7 OR author_id=$8)`,
    [req.params.id, name, MIME[ext], req.body.length, req.body, ext === 'pdf' ? 'PDF' : 'Document', isStaff(req.user), req.user.id],
  )
  if (!done.rowCount) throw new HttpError(404, 'Ressource introuvable.')
  res.json((await query(`${SELECT} WHERE r.id = $1`, [req.params.id])).rows[0])
})

router.put('/:id', async (req, res) => {
  const { title, subject = '', type = 'Lien', url = '', description = '', kind = 'link' } = req.body
  if (!title?.trim()) return res.status(400).json({ error: 'Le titre est obligatoire.' })
  if (kind !== 'file' && !url.trim()) return res.status(400).json({ error: 'Le lien est obligatoire.' })
  const { programId, levelId } = await readAudience(req.user, req.body)
  // Passer en mode « lien » efface le fichier ; en mode « fichier » on garde l'existant.
  const link = kind !== 'file'
  const done = await query(
    `UPDATE resources SET title=$2, subject=$3, description=$6, program_id=$7, level_id=$8,
       type = CASE WHEN $11 THEN $4 ELSE type END,
       url = CASE WHEN $11 THEN $5 ELSE url END,
       file_name = CASE WHEN $11 THEN NULL ELSE file_name END,
       file_mime = CASE WHEN $11 THEN NULL ELSE file_mime END,
       file_size = CASE WHEN $11 THEN NULL ELSE file_size END,
       file_data = CASE WHEN $11 THEN NULL ELSE file_data END
     WHERE id=$1 AND ($9 OR author_id=$10)`,
    [req.params.id, title.trim(), subject, type, url.trim(), description, programId, levelId, isStaff(req.user), req.user.id, link],
  )
  if (!done.rowCount) throw new HttpError(404, 'Ressource introuvable.')
  res.json((await query(`${SELECT} WHERE r.id = $1`, [req.params.id])).rows[0])
})

router.delete('/:id', async (req, res) => {
  await query('DELETE FROM resources WHERE id=$1 AND ($2 OR author_id=$3)', [req.params.id, isStaff(req.user), req.user.id])
  res.status(204).end()
})

export default router