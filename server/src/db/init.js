import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import bcrypt from 'bcryptjs'
import { pool } from './pool.js'

// Usage :  npm run db:init            → crée les tables + ton compte administrateur (si aucun n'existe)
//          npm run db:init -- --reset → SUPPRIME tout puis recrée
// Aucune donnée de démo : tout le reste (enseignants, cours, étudiants…) s'ajoute depuis l'application.
const reset = process.argv.includes('--reset')

try {
  if (reset) {
    await pool.query('DROP TABLE IF EXISTS comments, reactions, exams, messages, feedbacks, resources, announcements, tasks, courses, users CASCADE')
    console.log('Tables supprimées.')
  }
  const sql = readFileSync(fileURLToPath(new URL('./schema.sql', import.meta.url)), 'utf8')
  await pool.query(sql)
  console.log('Tables créées.')

  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env
  const hasAdmin = (await pool.query("SELECT 1 FROM users WHERE role = 'admin'")).rowCount > 0
  if (hasAdmin) {
    console.log('Un administrateur existe déjà : rien à créer.')
  } else if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.log('Renseignez ADMIN_EMAIL et ADMIN_PASSWORD dans server/.env puis relancez : npm run db:init')
  } else {
    await pool.query(
      "INSERT INTO users (name,email,password_hash,role,status,info) VALUES ($1,$2,$3,'admin','active','Administration')",
      [ADMIN_NAME || 'Administrateur', ADMIN_EMAIL.trim(), bcrypt.hashSync(ADMIN_PASSWORD, 10)],
    )
    console.log(`Compte administrateur créé : ${ADMIN_EMAIL.trim()}`)
  }
} catch (e) {
  console.error('Erreur :', e.message)
  process.exitCode = 1
} finally {
  await pool.end()
}
