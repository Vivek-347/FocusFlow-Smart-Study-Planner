import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import dataRoutes from './routes/data.js'
import { pool } from './db.js'

dotenv.config()
const app = express()
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }))
app.use(express.json({ limit: '2mb' }))
app.get('/api/health', async (_req, res) => {
  try { await pool.query('SELECT 1'); res.json({ status: 'ok', database: 'connected' }) }
  catch { res.status(503).json({ status: 'error', database: 'disconnected' }) }
})
app.use('/api/auth', authRoutes)
app.use('/api/data', dataRoutes)
app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ message: 'Server error. Check the backend terminal and database configuration.' })
})
const port = Number(process.env.PORT || 5000)
try {
  await pool.query('SELECT 1')
  console.log('✅ MySQL connected')
} catch (error) {
  console.error('❌ Could not connect to MySQL. Check backend/.env and make sure MySQL is running.', error.message)
}
app.listen(port, () => console.log(`🚀 FocusFlow API running at http://localhost:${port}`))
