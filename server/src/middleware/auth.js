import jwt from 'jsonwebtoken'
import { config } from '../config.js'
import { query } from '../db/pool.js'

export function signToken(user) {
  return jwt.sign({ sub: user.id }, config.jwtSecret, { expiresIn: '7d' })
}

// Vérifie le token "Authorization: Bearer ..." et charge l'utilisateur dans req.user.
export async function requireAuth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Non connecté.' })
  let sub
  try {
    ;({ sub } = jwt.verify(token, config.jwtSecret))
  } catch {
    return res.status(401).json({ error: 'Session expirée, reconnectez-vous.' })
  }
  // Une erreur de base de données (table manquante, connexion coupée…) n'est PAS une session expirée :
  // on la laisse remonter (erreur 500) pour ne pas déconnecter l'utilisateur à tort.
  const { rows } = await query(
    `SELECT id, full_name AS name, title, email, role, status, info, program_id AS "programId", level_id AS "levelId"
     FROM users WHERE id = $1 AND status = 'active'`, [sub])
  if (!rows[0]) return res.status(401).json({ error: 'Session invalide.' })
  req.user = rows[0]
  next()
}

// Restreint une route à certains rôles : requireRole('admin', 'teacher')
export const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : res.status(403).json({ error: 'Accès refusé.' })

export const isStaff = (user) => user.role !== 'student'