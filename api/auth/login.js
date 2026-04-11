import bcrypt from 'bcryptjs'
import { getDb, initDb } from '../db.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { username, passwordHash } = req.body ?? {}

  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'Username is required' })
  }
  if (!passwordHash || typeof passwordHash !== 'string') {
    return res.status(400).json({ error: 'Password is required' })
  }

  try {
    await initDb()
    const db = getDb()

    const result = await db.execute({
      sql: 'SELECT id, username, password FROM users WHERE username = ?',
      args: [username.trim()],
    })

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' })
    }

    const user = result.rows[0]
    const valid = await bcrypt.compare(passwordHash, user.password)
    if (!valid) {
      return res.status(401).json({ error: 'Invalid username or password' })
    }

    return res.json({ ok: true, userId: Number(user.id), username: user.username })
  } catch (err) {
    console.error('Login error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
