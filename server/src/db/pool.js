import pg from 'pg'
import { config } from '../config.js'

// Un "pool" réutilise les connexions vers Neon au lieu d'en ouvrir une par requête.
export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  max: 8,
  keepAlive: true,
  idleTimeoutMillis: 10_000,      // Neon coupe les connexions inactives : on les ferme avant lui
  connectionTimeoutMillis: 15_000, // laisse à Neon le temps de se réveiller après une pause
})

// Sans ce gestionnaire, une connexion coupée par Neon pendant l'inactivité ferait planter le serveur.
pool.on('error', (e) => console.warn('Connexion inactive fermée par la base (normal) :', e.code || e.message))

const TRANSIENT = ['ECONNRESET', 'ETIMEDOUT', 'EPIPE', '57P01', '08006', '08003']

// Une requête qui tombe sur une connexion morte est rejouée une fois sur une connexion neuve.
export async function query(text, params) {
  try {
    return await pool.query(text, params)
  } catch (e) {
    if (TRANSIENT.includes(e.code)) return pool.query(text, params)
    throw e
  }
}