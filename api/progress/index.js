import { getDb, initDb } from '../db.js'

export default async function handler(req, res) {
  try {
    await initDb()
    const db = getDb()

    if (req.method === 'GET') {
      const userId = req.query.userId
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' })
      }

      const result = await db.execute({
        sql: 'SELECT * FROM progress WHERE user_id = ?',
        args: [Number(userId)],
      })

      if (result.rows.length === 0) {
        return res.json({
          unlockedLevel: 1,
          lastPlayedLevel: 1,
          highestCompleted: 0,
          bestScore: 0,
          levels: {},
        })
      }

      const row = result.rows[0]
      return res.json({
        unlockedLevel: row.unlocked_level,
        lastPlayedLevel: row.last_played_level,
        highestCompleted: row.highest_completed,
        bestScore: row.best_score,
        levels: JSON.parse(row.levels_json || '{}'),
      })
    }

    if (req.method === 'POST') {
      const { userId, unlockedLevel, lastPlayedLevel, highestCompleted, bestScore, levels } =
        req.body ?? {}

      if (!userId) {
        return res.status(400).json({ error: 'userId is required' })
      }

      await db.execute({
        sql: `INSERT INTO progress (user_id, unlocked_level, last_played_level, highest_completed, best_score, levels_json, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
              ON CONFLICT(user_id) DO UPDATE SET
                unlocked_level    = excluded.unlocked_level,
                last_played_level = excluded.last_played_level,
                highest_completed = excluded.highest_completed,
                best_score        = excluded.best_score,
                levels_json       = excluded.levels_json,
                updated_at        = datetime('now')`,
        args: [
          Number(userId),
          unlockedLevel ?? 1,
          lastPlayedLevel ?? 1,
          highestCompleted ?? 0,
          bestScore ?? 0,
          JSON.stringify(levels ?? {}),
        ],
      })

      return res.json({ ok: true })
    }

    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('Progress error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
