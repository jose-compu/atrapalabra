import { getDb, initDb } from '../db.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userId, cookieProfile } = req.body ?? {}

  if (!userId || !cookieProfile) {
    return res.status(400).json({ error: 'userId and cookieProfile are required' })
  }

  try {
    await initDb()
    const db = getDb()

    const existing = await db.execute({
      sql: 'SELECT * FROM progress WHERE user_id = ?',
      args: [Number(userId)],
    })

    const remote = existing.rows.length > 0 ? existing.rows[0] : null
    const remoteLevels = remote ? JSON.parse(remote.levels_json || '{}') : {}
    const cookieLevels = cookieProfile.levels ?? {}

    const merged = { ...remoteLevels }
    for (const [key, cookieLv] of Object.entries(cookieLevels)) {
      const remoteLv = merged[key] ?? { bestScore: 0, completed: false, attempts: 0, foundWords: [] }
      merged[key] = {
        bestScore: Math.max(remoteLv.bestScore ?? 0, cookieLv.bestScore ?? 0),
        completed: remoteLv.completed || cookieLv.completed || false,
        attempts: Math.max(remoteLv.attempts ?? 0, cookieLv.attempts ?? 0),
        foundWords: [...new Set([...(remoteLv.foundWords ?? []), ...(cookieLv.foundWords ?? [])])],
      }
    }

    const unlockedLevel = Math.max(
      remote?.unlocked_level ?? 1,
      cookieProfile.unlockedLevel ?? 1,
    )
    const lastPlayedLevel = Math.max(
      remote?.last_played_level ?? 1,
      cookieProfile.lastPlayedLevel ?? 1,
    )
    const highestCompleted = Math.max(
      remote?.highest_completed ?? 0,
      cookieProfile.highestCompletedLevel ?? 0,
    )
    const bestScore = Math.max(
      remote?.best_score ?? 0,
      cookieProfile.bestScore ?? 0,
    )

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
        unlockedLevel,
        lastPlayedLevel,
        highestCompleted,
        bestScore,
        JSON.stringify(merged),
      ],
    })

    return res.json({
      ok: true,
      unlockedLevel,
      lastPlayedLevel,
      highestCompleted,
      bestScore,
      levels: merged,
    })
  } catch (err) {
    console.error('Migrate error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
