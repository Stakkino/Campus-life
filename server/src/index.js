import express from 'express'
import cors from 'cors'
import { config } from './config.js'
import { pool } from './db/pool.js'
import auth from './routes/auth.js'
import users from './routes/users.js'
import courses from './routes/courses.js'
import tasks from './routes/tasks.js'
import announcements from './routes/announcements.js'
import feedbacks from './routes/feedbacks.js'
import resources from './routes/resources.js'
import messages from './routes/messages.js'
import exams from './routes/exams.js'
import stats from './routes/stats.js'
import catalog from './routes/catalog.js'
import channels from './routes/channels.js'

const app = express()
app.use(cors({ origin: config.clientOrigin }))
app.use(express.json())

app.get('/api/health', async (_req, res) => {
  await pool.query('SELECT 1')
  res.json({ ok: true })
})
app.use('/api/auth', auth)
app.use('/api/users', users)
app.use('/api/courses', courses)
app.use('/api/tasks', tasks)
app.use('/api/announcements', announcements)
app.use('/api/feedbacks', feedbacks)
app.use('/api/resources', resources)
app.use('/api/messages', messages)
app.use('/api/exams', exams)
app.use('/api/stats', stats)
app.use('/api/catalog', catalog)
app.use('/api/channels', channels)

// Toute erreur inattendue (base injoignable, SQL invalide…) renvoie un JSON propre.
app.use((err, _req, res, _next) => {
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Fichier trop lourd (15 Mo maximum).' })
  if (err.status) return res.status(err.status).json({ error: err.message }) // erreur « attendue » (403, 404…)
  console.error(err)
  res.status(500).json({ error: 'Erreur serveur.' })
})

app.listen(config.port, () => console.log(`API CAMPUS LIFE sur http://localhost:${config.port}`))
