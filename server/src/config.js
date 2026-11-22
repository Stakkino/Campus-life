import 'dotenv/config'

// Toute la configuration vient du fichier .env (jamais écrite en dur dans le code).
export const config = {
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  port: Number(process.env.PORT) || 4000,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
}

for (const key of ['databaseUrl', 'jwtSecret']) {
  if (!config[key]) {
    console.error(`Variable manquante dans server/.env : ${key}`)
    process.exit(1)
  }
}
