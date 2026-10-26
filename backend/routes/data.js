import { Router } from 'express'
import { pool } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT data_json FROM user_data WHERE user_id = ?', [req.user.id])
    if (!rows.length) {
      await pool.execute('INSERT INTO user_data (user_id, data_json) VALUES (?, ?)', [req.user.id, JSON.stringify(null)])
      return res.json({ data: null })
    }
    let data = rows[0].data_json
    if (typeof data === 'string') { try { data = JSON.parse(data) } catch { data = null } }
    res.json({ data })
  } catch (error) { next(error) }
})

router.put('/', async (req, res, next) => {
  try {
    const data = req.body
    if (!data || typeof data !== 'object' || Array.isArray(data)) return res.status(400).json({ message: 'Invalid workspace data.' })
    const allowed = {
      subjects: Array.isArray(data.subjects) ? data.subjects : [],
      tasks: Array.isArray(data.tasks) ? data.tasks : [],
      exams: Array.isArray(data.exams) ? data.exams : [],
      theme: data.theme === 'dark' ? 'dark' : 'light',
      dailyGoal: Number.isFinite(Number(data.dailyGoal)) ? Math.max(0, Math.min(1440, Number(data.dailyGoal))) : 120,
      studyLogs: data.studyLogs && typeof data.studyLogs === 'object' && !Array.isArray(data.studyLogs) ? data.studyLogs : {},
      notes: Array.isArray(data.notes) ? data.notes : [],
      flashcards: Array.isArray(data.flashcards) ? data.flashcards : [],
    }
    await pool.execute('INSERT INTO user_data (user_id, data_json) VALUES (?, ?) ON DUPLICATE KEY UPDATE data_json = VALUES(data_json)', [req.user.id, JSON.stringify(allowed)])
    res.json({ message: 'Workspace saved.' })
  } catch (error) { next(error) }
})
export default router
