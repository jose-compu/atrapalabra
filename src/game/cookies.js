const COOKIE_NAME = 'atrapalabra_perfil'
const COOKIE_DAYS = 365

function readCookieRaw(name) {
  const prefix = `${name}=`
  const parts = document.cookie.split(';').map((part) => part.trim())
  const row = parts.find((part) => part.startsWith(prefix))
  return row ? decodeURIComponent(row.slice(prefix.length)) : null
}

function writeCookie(name, value, days = COOKIE_DAYS) {
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
}

export function loadProfile() {
  try {
    const raw = readCookieRaw(COOKIE_NAME)
    if (!raw) {
      return null
    }
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function saveProfile(profile) {
  writeCookie(COOKIE_NAME, JSON.stringify(profile))
}

export function clearProfile() {
  document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`
}

export function createProfile(username) {
  return {
    username,
    unlockedLevel: 1,
    lastPlayedLevel: 1,
    highestCompletedLevel: 0,
    bestScore: 0,
    levels: {},
    updatedAt: Date.now(),
  }
}

export function updateProfileStats(profile, levelNumber, score, completed) {
  if (!profile) {
    return profile
  }
  const next = structuredClone(profile)
  const key = String(levelNumber)
  const currentLevelStats = next.levels[key] ?? {
    bestScore: 0,
    completed: false,
    attempts: 0,
  }

  currentLevelStats.bestScore = Math.max(currentLevelStats.bestScore, score)
  currentLevelStats.completed = currentLevelStats.completed || completed
  currentLevelStats.attempts += 1
  next.levels[key] = currentLevelStats

  next.bestScore = Math.max(next.bestScore, score)
  if (completed) {
    next.highestCompletedLevel = Math.max(next.highestCompletedLevel, levelNumber)
    next.unlockedLevel = Math.max(next.unlockedLevel, levelNumber + 1)
    next.lastPlayedLevel = Math.min(20, levelNumber + 1)
  }
  next.updatedAt = Date.now()
  return next
}
