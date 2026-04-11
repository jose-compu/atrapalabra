const AUTH_KEY = 'atrapalabra_auth'

export async function hashPassword(plaintext) {
  const encoder = new TextEncoder()
  const data = encoder.encode(plaintext)
  const buffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function apiRegister(username, plainPassword) {
  const passwordHash = await hashPassword(plainPassword)
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, passwordHash }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Registration failed')
  saveAuth(data.userId, data.username)
  return data
}

export async function apiLogin(username, plainPassword) {
  const passwordHash = await hashPassword(plainPassword)
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, passwordHash }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Login failed')
  saveAuth(data.userId, data.username)
  return data
}

export async function apiGetProgress(userId) {
  const res = await fetch(`/api/progress?userId=${userId}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to load progress')
  return data
}

export async function apiSaveProgress(userId, profile) {
  const res = await fetch('/api/progress', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      unlockedLevel: profile.unlockedLevel,
      lastPlayedLevel: profile.lastPlayedLevel,
      highestCompleted: profile.highestCompletedLevel,
      bestScore: profile.bestScore,
      levels: profile.levels,
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to save progress')
  return data
}

export async function apiGetLeaderboard(level) {
  const url = level ? `/api/leaderboard?level=${level}` : '/api/leaderboard'
  const res = await fetch(url)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to load leaderboard')
  return data
}

function saveAuth(userId, username) {
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify({ userId, username }))
  } catch {
    /* storage full or unavailable */
  }
}

export function loadAuth() {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function clearAuth() {
  try {
    localStorage.removeItem(AUTH_KEY)
  } catch {
    /* ignore */
  }
}
