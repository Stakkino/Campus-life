import { query } from '../db/pool.js'

// Outils partagés par les annonces et les retours de cours :
// chaque élément renvoie ses réactions ({like:[userIds], love:[userIds]}) et ses commentaires.
export const socialColumns = (type, alias) => `
  COALESCE((SELECT json_object_agg(k.kind, k.ids) FROM (
     SELECT kind, json_agg(user_id) AS ids FROM reactions
     WHERE target_type = '${type}' AND target_id = ${alias}.id GROUP BY kind) k), '{}'::json) AS reactions,
  COALESCE((SELECT json_agg(json_build_object('id', c.id, 'authorId', c.author_id, 'author', u.full_name, 'role', u.role,
       'text', c.content, 'date', c.created_at) ORDER BY c.created_at)
     FROM comments c LEFT JOIN users u ON u.id = c.author_id
     WHERE c.target_type = '${type}' AND c.target_id = ${alias}.id), '[]'::json) AS comments`

export function socialRoutes(router, type, table) {
  router.post('/:id/react', async (req, res) => {
    const kind = req.body.type
    if (!['like', 'love'].includes(kind)) return res.status(400).json({ error: 'Réaction inconnue.' })
    const del = await query('DELETE FROM reactions WHERE target_type=$1 AND target_id=$2 AND user_id=$3 AND kind=$4', [type, req.params.id, req.user.id, kind])
    if (!del.rowCount) await query('INSERT INTO reactions (target_type,target_id,user_id,kind) VALUES ($1,$2,$3,$4)', [type, req.params.id, req.user.id, kind])
    const { rows } = await query(`SELECT ${socialColumns(type, 't')} FROM ${table} t WHERE t.id = $1`, [req.params.id])
    res.json(rows[0])
  })
  router.post('/:id/comments', async (req, res) => {
    if (!req.body.text?.trim()) return res.status(400).json({ error: 'Commentaire vide.' })
    await query('INSERT INTO comments (target_type,target_id,author_id,content) VALUES ($1,$2,$3,$4)', [type, req.params.id, req.user.id, req.body.text.trim()])
    const { rows } = await query(`SELECT ${socialColumns(type, 't')} FROM ${table} t WHERE t.id = $1`, [req.params.id])
    res.status(201).json(rows[0])
  })
  router.delete('/:id/comments/:commentId', async (req, res) => {
    const staff = req.user.role !== 'student'
    await query('DELETE FROM comments WHERE id=$1 AND target_id=$2 AND ($3 OR author_id=$4)', [req.params.commentId, req.params.id, staff, req.user.id])
    const { rows } = await query(`SELECT ${socialColumns(type, 't')} FROM ${table} t WHERE t.id = $1`, [req.params.id])
    res.json(rows[0])
  })
}
