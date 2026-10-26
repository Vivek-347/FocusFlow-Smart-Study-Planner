import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { pool } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
const makeToken = (user) => jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'development_only_change_me', { expiresIn: '7d' })
const publicUser = (user) => ({ id: user.id, name: user.name, email: user.email })

router.post('/register', async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim()
    const email = String(req.body.email || '').trim().toLowerCase()
    const password = String(req.body.password || '')
    if (name.length < 2 || name.length > 80) return res.status(400).json({ message: 'Name must be between 2 and 80 characters.' })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 190) return res.status(400).json({ message: 'Enter a valid email address.' })
    if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' })
    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email])
    if (existing.length) return res.status(409).json({ message: 'An account with this email already exists.' })
    const passwordHash = await bcrypt.hash(password, 12)
    const [result] = await pool.execute('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)', [name, email, passwordHash])
    const user = { id: result.insertId, name, email }
    await pool.execute('INSERT INTO user_data (user_id, data_json) VALUES (?, ?)', [user.id, JSON.stringify(null)])
    return res.status(201).json({ token: makeToken(user), user })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'An account with this email already exists.' })
    next(error)
  }
})

router.post('/login', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase()
    const password = String(req.body.password || '')
    const [rows] = await pool.execute('SELECT id, name, email, password_hash FROM users WHERE email = ?', [email])
    if (!rows.length || !(await bcrypt.compare(password, rows[0].password_hash))) return res.status(401).json({ message: 'Email or password is incorrect.' })
    const user = publicUser(rows[0])
    return res.json({ token: makeToken(user), user })
  } catch (error) { next(error) }
})

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT id, name, email FROM users WHERE id = ?', [req.user.id])
    if (!rows.length) return res.status(401).json({ message: 'Account not found.' })
    res.json({ user: publicUser(rows[0]) })
  } catch (error) { next(error) }
})

router.post('/logout', (_req, res) => res.json({ message: 'Signed out. You can now clear the token on the client.' }))
export default router
