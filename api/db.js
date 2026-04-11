import { createClient } from '@libsql/client'

let client = null

export function getDb() {
  if (!client) {
    client = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
  }
  return client
}

let initialized = false

export async function initDb() {
  if (initialized) return
  const db = getDb()
  await db.batch([
    `CREATE TABLE IF NOT EXISTS users (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      username   TEXT    UNIQUE NOT NULL,
      password   TEXT    NOT NULL,
      created_at TEXT    DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS progress (
      user_id           INTEGER PRIMARY KEY REFERENCES users(id),
      unlocked_level    INTEGER DEFAULT 1,
      last_played_level INTEGER DEFAULT 1,
      highest_completed INTEGER DEFAULT 0,
      best_score        INTEGER DEFAULT 0,
      levels_json       TEXT    DEFAULT '{}',
      updated_at        TEXT    DEFAULT (datetime('now'))
    )`,
  ])
  initialized = true
}
