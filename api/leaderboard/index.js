import { getDb, initDb } from '../db.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    await initDb()
    const db = getDb()
    const level = req.query.level

    if (level) {
      const key = `$.${level}`
      const result = await db.execute({
        sql: `SELECT u.username,
                     json_extract(p.levels_json, ?) AS level_data
              FROM progress p
              JOIN users u ON u.id = p.user_id
              WHERE json_extract(p.levels_json, ?) IS NOT NULL
              ORDER BY CAST(json_extract(json_extract(p.levels_json, ?), '$.bestScore') AS INTEGER) DESC
              LIMIT 10`,
        args: [key, key, key],
      })

      const ranking = result.rows
        .map((row) => {
          try {
            const data = JSON.parse(row.level_data)
            return { username: row.username, bestScore: data.bestScore ?? 0 }
          } catch {
            return null
          }
        })
        .filter((r) => r && r.bestScore > 0)

      return res.json({ level: Number(level), ranking })
    }

    const result = await db.execute(
      `SELECT u.username, p.best_score, p.levels_json
       FROM progress p
       JOIN users u ON u.id = p.user_id
       WHERE p.best_score > 0
       ORDER BY p.best_score DESC
       LIMIT 10`,
    )

    const ranking = result.rows.map((row) => {
      let totalScore = 0
      try {
        const levels = JSON.parse(row.levels_json || '{}')
        totalScore = Object.values(levels).reduce((sum, lv) => sum + (lv.bestScore ?? 0), 0)
      } catch {
        totalScore = row.best_score ?? 0
      }
      return { username: row.username, totalScore }
    })

    ranking.sort((a, b) => b.totalScore - a.totalScore)

    return res.json({ ranking })
  } catch (err) {
    console.error('Leaderboard error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
