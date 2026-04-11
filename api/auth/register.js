import bcrypt from 'bcryptjs'
import { getDb, initDb } from '../db.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { username, passwordHash } = req.body ?? {}

  if (!username || typeof username !== 'string' || username.trim().length === 0) {
    return res.status(400).json({ error: 'Username is required' })
  }
  if (!passwordHash || typeof passwordHash !== 'string' || passwordHash.length !== 64) {
    return res.status(400).json({ error: 'Invalid password hash' })
  }

  try {
    await initDb()
    const db = getDb()

    const existing = await db.execute({
      sql: 'SELECT id FROM users WHERE username = ?',
      args: [username.trim()],
    })
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Username already taken' })
    }

    const hashed = await bcrypt.hash(passwordHash, 10)
    const result = await db.execute({
      sql: 'INSERT INTO users (username, password) VALUES (?, ?)',
      args: [username.trim(), hashed],
    })

    const userId = Number(result.lastInsertRowid)

    await db.execute({
      sql: 'INSERT INTO progress (user_id) VALUES (?)',
      args: [userId],
    })

    return res.status(201).json({ ok: true, userId, username: username.trim() })
  } catch (err) {
    console.error('Register error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
