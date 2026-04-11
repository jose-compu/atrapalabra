import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import './tileBoard.css'
import {
  clearProfile,
  createProfile,
  loadProfile,
  saveProfile,
  updateProfileStats,
} from './game/cookies'
import {
  apiGetLeaderboard,
  apiGetProgress,
  apiLogin,
  apiRegister,
  apiSaveProgress,
  clearAuth,
  loadAuth,
} from './game/api'
import {
  buildWord,
  computeWordScore,
  createInitialBoard,
  findAnyWordPath,
  injectGuaranteedWord,
  isAdjacent,
  isPathValid,
  planCollapse,
  straightHintStats,
  wordThemeIndex,
} from './game/engine'
import { FULL_DICTIONARY_ARRAY, FULL_DICTIONARY_SET, getLevel, LEVELS } from './game/levels'
import {
  boardsLetterEqual,
  makeSkinGrid,
  randomPathTheme,
  skinsAfterBoardUpdate,
} from './game/tileSkins'
import {
  playCascadeSound,
  playErrorSound,
  playRankUpSound,
  playScoreTickSound,
  playSelectSound,
  playWinSound,
  playWordFailSound,
  playWordSuccessSound,
} from './game/sound'

const GAME_URL = 'https://example.com/atrapalabra' // TODO: replace with real URL

function totalScoreFromProfile(prof) {
  if (!prof || !prof.levels) return 0
  return Object.values(prof.levels).reduce((sum, lv) => sum + (lv.bestScore ?? 0), 0)
}

function completedLevelsCount(prof) {
  if (!prof || !prof.levels) return 0
  return Object.values(prof.levels).filter((lv) => lv.completed).length
}

function shareOnWhatsApp(text) {
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
}

function shareOnFacebook(text) {
  const fullText = `${text}\n${GAME_URL}`
  if (navigator.clipboard) {
    navigator.clipboard.writeText(fullText).catch(() => {})
  }
  window.open(
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(GAME_URL)}&quote=${encodeURIComponent(text)}`,
    '_blank',
    'width=600,height=450',
  )
  return fullText
}

const WhatsAppIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

const FacebookIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
)

function readInitialLevelNumber() {
  if (typeof window === 'undefined') return 1
  const p = loadProfile()
  if (!p) return 1
  const cap = Math.min(20, p.unlockedLevel ?? 1)
  const saved = typeof p.lastPlayedLevel === 'number' ? p.lastPlayedLevel : 1
  return Math.min(cap, Math.max(1, saved))
}

function App() {
  const gameName = 'Atrapalabra'
  const [levelNumber, setLevelNumber] = useState(readInitialLevelNumber)
  const level = useMemo(() => getLevel(levelNumber), [levelNumber])
  const dictionarySet = FULL_DICTIONARY_SET

  const [profile, setProfile] = useState(() => loadProfile())
  const [usernameInput, setUsernameInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [authMode, setAuthMode] = useState('login') // 'login' | 'register'
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [authUser, setAuthUser] = useState(() => loadAuth()) // { userId, username } | null
  const saveTimerRef = useRef(null)
  const [board, setBoard] = useState(() => createInitialBoard(getLevel(readInitialLevelNumber())))
  const [path, setPath] = useState([])
  const [score, setScore] = useState(0)
  const [message, setMessage] = useState(
    'Toca letras vecinas para formar palabras. Palabras largas dan muchos más puntos.',
  )
  const [usedWords, setUsedWords] = useState(new Set())
  const [wordLog, setWordLog] = useState([])
  const [combo, setCombo] = useState(1)
  const [completed, setCompleted] = useState(false)
  const [targetReached, setTargetReached] = useState(false)
  const [exhausted, setExhausted] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem('atrapalabra_theme') === 'dark'
  })
  const [fallAnim, setFallAnim] = useState(null)
  const [skinGrid, setSkinGrid] = useState(() => {
    const L = getLevel(readInitialLevelNumber())
    return makeSkinGrid(L.rows, L.cols)
  })
  const [pathTheme, setPathTheme] = useState(0)
  const boardRef = useRef(null)
  const prevBoardRef = useRef(null)

  const totalScore = useMemo(() => totalScoreFromProfile(profile), [profile])
  const completedCount = useMemo(() => completedLevelsCount(profile), [profile])
  const levelBest = profile?.levels?.[String(levelNumber)]?.bestScore ?? 0
  const levelCompleted = profile?.levels?.[String(levelNumber)]?.completed ?? false

  const userName = profile?.username ?? ''

  function shareLevelWhatsApp() {
    const text = `${userName} en Atrapalabra — Nivel ${level.level}: ${score} puntos! Puedes superarlo?\n${GAME_URL}`
    shareOnWhatsApp(text)
  }
  function shareLevelFacebook() {
    const text = `${userName} en Atrapalabra — Nivel ${level.level}: ${score} puntos! Puedes superarlo?`
    shareOnFacebook(text)
    setMessage('Texto copiado. Pega (Ctrl+V) en Facebook.')
  }
  function shareLevelBestWhatsApp() {
    const text = `${userName} en Atrapalabra — Mi record en Nivel ${level.level}: ${levelBest} puntos! Puedes superarlo?\n${GAME_URL}`
    shareOnWhatsApp(text)
  }
  function shareLevelBestFacebook() {
    const text = `${userName} en Atrapalabra — Mi record en Nivel ${level.level}: ${levelBest} puntos! Puedes superarlo?`
    shareOnFacebook(text)
    setMessage('Texto copiado. Pega (Ctrl+V) en Facebook.')
  }
  function shareTotalWhatsApp() {
    const text = `${userName} en Atrapalabra — Puntuación total: ${totalScore} puntos en ${completedCount} niveles!\n${GAME_URL}`
    shareOnWhatsApp(text)
  }
  function shareTotalFacebook() {
    const text = `${userName} en Atrapalabra — Puntuación total: ${totalScore} puntos en ${completedCount} niveles!`
    shareOnFacebook(text)
    setMessage('Texto copiado. Pega (Ctrl+V) en Facebook.')
  }

  const [displayScore, setDisplayScore] = useState(0)
  const displayScoreRef = useRef(0)

  useEffect(() => {
    if (displayScoreRef.current === score) return undefined
    const target = score
    const diff = target - displayScoreRef.current
    if (diff <= 0) {
      displayScoreRef.current = target
      /* eslint-disable react-hooks/set-state-in-effect -- snap display to target on reset */
      setDisplayScore(target)
      /* eslint-enable react-hooks/set-state-in-effect */
      return undefined
    }
    const steps = Math.min(diff, 28)
    const stepSize = diff / steps
    let step = 0
    const id = window.setInterval(() => {
      step += 1
      if (step >= steps) {
        displayScoreRef.current = target
        setDisplayScore(target)
        playScoreTickSound()
        window.clearInterval(id)
        return
      }
      const v = Math.round(displayScoreRef.current + stepSize)
      displayScoreRef.current = v
      setDisplayScore(v)
      if (step % 2 === 0) playScoreTickSound()
    }, 32)
    return () => window.clearInterval(id)
  }, [score])

  const currentWord = buildWord(board, path)
  const progress = Math.min(100, Math.round((displayScore / level.targetScore) * 100))

  const showHints = levelNumber <= 3
  const { grid: hintThemeGrid } = useMemo(
    () => showHints
      ? straightHintStats(board, level.dictionary, level.minWordLength)
      : { grid: Array.from({ length: level.rows }, () => Array(level.cols).fill(null)), hintedCellCount: 0 },
    [board, level.dictionary, level.minWordLength, level.rows, level.cols, showHints],
  )

  useEffect(() => {
    if (path.length === 0) return
    const w = buildWord(board, path).toUpperCase()
    if (dictionarySet.has(w) && isPathValid(path)) {
      const next = wordThemeIndex(w)
      /* eslint-disable react-hooks/set-state-in-effect -- color unificado para palabra completa en el camino */
      setPathTheme((prev) => (prev === next ? prev : next))
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [path, board])

  const hasProfile = Boolean(profile)

  useEffect(() => {
    if (profile) {
      saveProfile(profile)
    }
  }, [profile])

  useEffect(() => {
    if (!authUser) return
    apiGetProgress(authUser.userId)
      .then((remote) => {
        const merged = {
          username: authUser.username,
          unlockedLevel: remote.unlockedLevel ?? 1,
          lastPlayedLevel: remote.lastPlayedLevel ?? 1,
          highestCompletedLevel: remote.highestCompleted ?? 0,
          bestScore: remote.bestScore ?? 0,
          levels: remote.levels ?? {},
          updatedAt: Date.now(),
        }
        setProfile(merged)
        const cap = Math.min(20, merged.unlockedLevel)
        const saved = typeof merged.lastPlayedLevel === 'number' ? merged.lastPlayedLevel : 1
        setLevelNumber(Math.min(cap, Math.max(1, saved)))
      })
      .catch(() => {})
  }, [authUser])

  useEffect(() => {
    if (!authUser || !profile) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      apiSaveProgress(authUser.userId, profile).catch(() => {})
    }, 1200)
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [profile, authUser])

  const [overallRanking, setOverallRanking] = useState([])
  const [levelRanking, setLevelRanking] = useState([])
  const [rankingLevel, setRankingLevel] = useState(null)
  const [rankUpPopup, setRankUpPopup] = useState(null)
  const prevOverallPosRef = useRef(null)
  const prevLevelPosRef = useRef(null)

  function checkRankUp(oldPos, newPos, label) {
    if (oldPos === null || newPos >= oldPos || newPos < 1) return
    setRankUpPopup({ from: oldPos, to: newPos, label })
    playRankUpSound()
  }

  const refreshLeaderboard = useCallback(() => {
    apiGetLeaderboard().then((d) => {
      const ranking = d.ranking ?? []
      const oldPos = prevOverallPosRef.current
      const newPos = profile ? ranking.findIndex((r) => r.username === profile.username) + 1 : -1
      if (newPos > 0) {
        if (oldPos !== null) checkRankUp(oldPos, newPos, 'ranking global')
        prevOverallPosRef.current = newPos
      }
      setOverallRanking(ranking)
    }).catch(() => {})
  }, [profile])

  useEffect(() => {
    if (!profile) return
    refreshLeaderboard()
  }, [profile, refreshLeaderboard])

  useEffect(() => {
    if (!profile) return
    setRankingLevel(levelNumber)
    prevLevelPosRef.current = null
    apiGetLeaderboard(levelNumber).then((d) => {
      const ranking = d.ranking ?? []
      const pos = ranking.findIndex((r) => r.username === profile.username) + 1
      if (pos > 0) prevLevelPosRef.current = pos
      setLevelRanking(ranking)
    }).catch(() => {})
  }, [levelNumber, profile])

  useEffect(() => {
    if (!profile || !completed) return
    const lvl = levelNumber
    const timer = setTimeout(() => {
      apiGetLeaderboard(lvl).then((d) => {
        const ranking = d.ranking ?? []
        const newPos = ranking.findIndex((r) => r.username === profile.username) + 1
        if (newPos > 0) {
          checkRankUp(prevLevelPosRef.current, newPos, `nivel ${lvl}`)
          prevLevelPosRef.current = newPos
        }
        setLevelRanking(ranking)
      }).catch(() => {})
      refreshLeaderboard()
    }, 2000)
    return () => clearTimeout(timer)
  }, [completed, levelNumber, profile, refreshLeaderboard])

  useEffect(() => {
    if (!rankUpPopup) return
    const t = setTimeout(() => setRankUpPopup(null), 4000)
    return () => clearTimeout(t)
  }, [rankUpPopup])

  const maxPlayableLevel = profile ? Math.min(20, profile.unlockedLevel) : 1

  useEffect(() => {
    if (!profile || levelNumber <= maxPlayableLevel) return
    /* eslint-disable react-hooks/set-state-in-effect */
    setLevelNumber(maxPlayableLevel)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [profile, maxPlayableLevel, levelNumber])

  useEffect(() => {
    if (!hasProfile) return
    const L = getLevel(levelNumber)
    const nextBoard = createInitialBoard(L)
    prevBoardRef.current = nextBoard.map((row) => [...row])
    /* eslint-disable react-hooks/set-state-in-effect -- reinicio de tablero al cambiar nivel */
    setBoard(nextBoard)
    setSkinGrid(makeSkinGrid(L.rows, L.cols))
    setPath([])
    setScore(0)
    setDisplayScore(0)
    displayScoreRef.current = 0
    setUsedWords(new Set())
    setWordLog([])
    setCombo(1)
    setCompleted(false)
    setTargetReached(false)
    setExhausted(false)
    setFallAnim(null)
    setMessage('Toca letras vecinas para formar palabras. Palabras largas dan muchos más puntos.')
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [levelNumber, hasProfile])

  useEffect(() => {
    const theme = isDarkMode ? 'dark' : 'light'
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem('atrapalabra_theme', theme)
  }, [isDarkMode])

  useLayoutEffect(() => {
    const el = boardRef.current
    if (!el) return undefined
    const rows = level.rows
    function measure() {
      const rect = el.getBoundingClientRect()
      const cs = window.getComputedStyle(el)
      const gap = Number.parseFloat(cs.rowGap || cs.gap || '0') || 0
      const inner = rect.height - gap * (rows - 1)
      const step = rows > 0 ? inner / rows + gap : 48
      el.style.setProperty('--cell-shift', `${step}px`)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [level.rows, board])

  useEffect(() => {
    if (!fallAnim) return undefined
    /** Cubrir `cellFallDrop`: hasta ~1.38s si caen muchas filas (App.css) + margen. */
    const ms = 1480
    const t = window.setTimeout(() => setFallAnim(null), ms)
    return () => window.clearTimeout(t)
  }, [fallAnim])

  useEffect(() => {
    if (prevBoardRef.current === null) {
      prevBoardRef.current = board.map((row) => [...row])
      return
    }
    if (boardsLetterEqual(prevBoardRef.current, board)) {
      return
    }
    const prev = prevBoardRef.current
    prevBoardRef.current = board.map((row) => [...row])
    setSkinGrid((skins) => skinsAfterBoardUpdate(prev, board, skins))
  }, [board])

  async function startProfile(event) {
    event.preventDefault()
    const clean = usernameInput.trim()
    if (!clean) return
    if (!passwordInput) {
      setAuthError('Introduce una contraseña.')
      return
    }
    setAuthError('')
    setAuthLoading(true)
    try {
      if (authMode === 'register') {
        const data = await apiRegister(clean, passwordInput)
        setAuthUser({ userId: data.userId, username: data.username })
        setLevelNumber(1)
        setProfile(createProfile(data.username))
      } else {
        const data = await apiLogin(clean, passwordInput)
        setAuthUser({ userId: data.userId, username: data.username })
      }
      setPasswordInput('')
    } catch (err) {
      setAuthError(err.message || 'Error de autenticación')
    } finally {
      setAuthLoading(false)
    }
  }

  function resetLevel() {
    const nextBoard = createInitialBoard(level)
    prevBoardRef.current = nextBoard.map((row) => [...row])
    setBoard(nextBoard)
    setSkinGrid(makeSkinGrid(level.rows, level.cols))
    setPath([])
    setScore(0)
    setDisplayScore(0)
    displayScoreRef.current = 0
    setUsedWords(new Set())
    setWordLog([])
    setCombo(1)
    setCompleted(false)
    setTargetReached(false)
    setExhausted(false)
    setMessage('Toca letras vecinas para formar palabras. Palabras largas dan muchos más puntos.')
  }

  function resetUser() {
    clearProfile()
    clearAuth()
    setAuthUser(null)
    setProfile(null)
    setUsernameInput('')
    setPasswordInput('')
    setAuthError('')
    setLevelNumber(1)
    const L = getLevel(1)
    const nextBoard = createInitialBoard(L)
    prevBoardRef.current = nextBoard.map((row) => [...row])
    setBoard(nextBoard)
    setSkinGrid(makeSkinGrid(L.rows, L.cols))
    setPath([])
    setScore(0)
    setDisplayScore(0)
    displayScoreRef.current = 0
    setUsedWords(new Set())
    setWordLog([])
    setCombo(1)
    setCompleted(false)
    setTargetReached(false)
    setExhausted(false)
    setMessage('Sesión cerrada. Inicia sesión para continuar.')
  }

  function confirmResetUser() {
    const ok = window.confirm(
      '¿Cerrar sesión? Se borrarán los datos locales. Tu progreso queda guardado en tu cuenta.',
    )
    if (!ok) return
    resetUser()
  }

  function goToNextLevel() {
    if (!completed || level.level >= 20) return
    setLevelNumber(level.level + 1)
  }

  function clearSelection() {
    setPath([])
    setMessage('Toca la primera letra de la palabra.')
  }

  /**
   * Modo simple: un clic por letra, solo celdas contiguas.
   * Clic en la penúltima celda = retroceder un paso.
   */
  function onCellClick(row, col) {
    if (!profile || completed || exhausted || fallAnim) return

    if (path.length === 0) {
      const hintT = hintThemeGrid[row]?.[col]
      setPathTheme(hintT != null ? hintT : randomPathTheme())
      setPath([{ row, col }])
      playSelectSound()
      setMessage('Sigue tocando letras vecinas. Validar cuando termines.')
      return
    }

    const last = path[path.length - 1]
    if (last.row === row && last.col === col) {
      return
    }

    if (path.length >= 2) {
      const prev = path[path.length - 2]
      if (prev.row === row && prev.col === col) {
        setPath((p) => p.slice(0, -1))
        playSelectSound()
        return
      }
    }

    if (!isAdjacent(last, { row, col })) {
      setMessage('Toca una letra que toque a la última seleccionada (arriba, abajo, diagonal o lado).')
      playErrorSound()
      return
    }

    const already = path.some((step) => step.row === row && step.col === col)
    if (already) {
      setMessage('No puedes repetir la misma casilla. Retrocede tocando la penúltima letra.')
      playErrorSound()
      return
    }

    setPath((p) => [...p, { row, col }])
    playSelectSound()
  }

  function onCellDoubleClick(row, col, event) {
    event.preventDefault()
    if (!profile || completed || exhausted || fallAnim) return
    if (path.length === 0) return
    const last = path[path.length - 1]
    if (last.row !== row || last.col !== col) return
    submitWord()
  }

  function submitLevel() {
    if (!targetReached || completed) return
    setCompleted(true)
    setMessage(
      level.level < 20
        ? `Nivel ${level.level} enviado con ${score} puntos. Pulsa «Siguiente nivel».`
        : `Nivel 20 completado con ${score} puntos.`,
    )
    playWinSound()
    setProfile((prev) => updateProfileStats(prev, level.level, score, true, [...usedWords]))
  }

  const submitWord = useCallback(() => {
    if (!profile || completed || exhausted || fallAnim) return
    const selectedPath = path
    const word = buildWord(board, selectedPath).toUpperCase()

    if (word.length < level.minWordLength) {
      setMessage(`La palabra debe tener al menos ${level.minWordLength} letras.`)
      setPath([])
      playWordFailSound()
      return
    }
    if (!dictionarySet.has(word)) {
      setMessage(`"${word}" no está en el diccionario.`)
      setPath([])
      playWordFailSound()
      return
    }
    if (usedWords.has(word)) {
      setMessage(`"${word}" ya fue usada en esta partida.`)
      setPath([])
      playWordFailSound()
      return
    }

    const hintedBefore = straightHintStats(board, level.dictionary, level.minWordLength).hintedCellCount

    const { finalBoard: collapsedBoard, transitions } = planCollapse(board, selectedPath, level.letterPool)
    let nextBoard = collapsedBoard
    let animTransitions = transitions

    const hasFutureWord = findAnyWordPath(nextBoard, FULL_DICTIONARY_ARRAY, level.minWordLength)
    if (!hasFutureWord) {
      const guaranteed = level.guaranteedWords[Math.floor(Math.random() * level.guaranteedWords.length)]
      const injected = injectGuaranteedWord(nextBoard, guaranteed)
      const stillHas = findAnyWordPath(injected, FULL_DICTIONARY_ARRAY, level.minWordLength)
      if (stillHas) {
        nextBoard = injected
        animTransitions = []
      }
    }

    const hintedAfter = straightHintStats(nextBoard, level.dictionary, level.minWordLength).hintedCellCount
    const cascadeBonus = Math.min(Math.max(0, hintedAfter - hintedBefore) * 5, 45)

    const baseGain = computeWordScore(word, combo)
    const gained = baseGain + cascadeBonus
    const nextScore = score + gained
    const reachedTarget = nextScore >= level.targetScore

    if (animTransitions.length > 0) {
      setFallAnim({ id: Date.now(), list: animTransitions })
    } else {
      setFallAnim(null)
    }
    setBoard(nextBoard)
    setPath([])
    setScore(nextScore)
    setUsedWords((prev) => new Set(prev).add(word))
    setWordLog((prev) => [...prev, { word, pts: gained }])
    setCombo((prev) => prev + 1)

    const lenLabel = word.length >= 7 ? ' (excelente)' : word.length >= 5 ? ' (buena)' : ''
    setMessage(
      cascadeBonus > 0
        ? `${word}${lenLabel} +${baseGain} palabra +${cascadeBonus} cascada = ${gained} pts`
        : `${word}${lenLabel} +${gained} pts`,
    )
    playWordSuccessSound(word.length, combo)
    if (cascadeBonus > 0) {
      playCascadeSound(cascadeBonus)
    }

    if (reachedTarget && !targetReached) {
      setTargetReached(true)
      setMessage(
        (prev) => `${prev} — Objetivo alcanzado. Puedes enviar el nivel o seguir jugando para más puntos.`,
      )
    }

    const boardHasWords = findAnyWordPath(nextBoard, FULL_DICTIONARY_ARRAY, level.minWordLength)
    if (!boardHasWords) {
      setExhausted(true)
      if (reachedTarget || targetReached) {
        setCompleted(true)
        setMessage(`No quedan palabras. Nivel enviado automáticamente con ${nextScore} puntos.`)
        playWinSound()
        const allWords = [...new Set([...usedWords, word])]
        setProfile((prev) => updateProfileStats(prev, level.level, nextScore, true, allWords))
      } else {
        setMessage(`No quedan palabras formables. Puntuación: ${nextScore}. Reinicia para intentar de nuevo.`)
        const allWords = [...new Set([...usedWords, word])]
        setProfile((prev) => updateProfileStats(prev, level.level, nextScore, false, allWords))
      }
    }
  }, [
    path,
    profile,
    completed,
    exhausted,
    targetReached,
    board,
    level,
    usedWords,
    combo,
    score,
    fallAnim,
  ])

  return (
    <main className={`app ${profile ? 'app--playing' : ''}`}>
      {rankUpPopup && (
        <div className="rankup-overlay" key={`${rankUpPopup.label}-${rankUpPopup.to}`}>
          <div className="rankup-popup">
            <span className="rankup-star">&#9733;</span>
            <span className="rankup-title">Subiste en el ranking</span>
            <span className="rankup-detail">
              {rankUpPopup.label}: #{rankUpPopup.from} &rarr; <strong>#{rankUpPopup.to}</strong>
            </span>
            {rankUpPopup.to === 1 && <span className="rankup-first">&#127942; Primer lugar</span>}
          </div>
        </div>
      )}
      <div className="top-bar">
        {profile && (
          <button className="top-bar-btn danger" type="button" onClick={confirmResetUser}>
            Cerrar sesión
          </button>
        )}
        <button className="top-bar-btn" onClick={() => setIsDarkMode((prev) => !prev)}>
          {isDarkMode ? 'Claro' : 'Oscuro'}
        </button>
      </div>
      <header className="hero">
        <h1>{gameName}</h1>
        <p className="subtitle">Juego de palabras por niveles en español</p>
      </header>

      {!profile ? (
        <form className="card login" onSubmit={startProfile}>
          <h2>{authMode === 'register' ? 'Crear cuenta' : 'Iniciar sesión'}</h2>
          <label htmlFor="username">Nombre de jugador</label>
          <input
            id="username"
            value={usernameInput}
            onChange={(event) => setUsernameInput(event.target.value)}
            placeholder="Escribe tu nombre"
            maxLength={28}
            disabled={authLoading}
          />
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            value={passwordInput}
            onChange={(event) => setPasswordInput(event.target.value)}
            placeholder="Escribe tu contraseña"
            maxLength={64}
            disabled={authLoading}
          />
          {authError && <p className="auth-error">{authError}</p>}
          <button type="submit" disabled={authLoading}>
            {authLoading ? 'Cargando...' : authMode === 'register' ? 'Registrarse' : 'Entrar'}
          </button>
          <p className="auth-toggle">
            {authMode === 'login' ? (
              <>No tienes cuenta? <button type="button" className="link-btn" onClick={() => { setAuthMode('register'); setAuthError('') }}>Registrarse</button></>
            ) : (
              <>Ya tienes cuenta? <button type="button" className="link-btn" onClick={() => { setAuthMode('login'); setAuthError('') }}>Iniciar sesión</button></>
            )}
          </p>
        </form>
      ) : (
        <>
          <div className="score-float-cluster">
            <div className="score-float score-float--total" aria-label="Puntaje total">
              <div className="score-float-inner">
                <span className="score-float-label">Total</span>
                <span className="score-float-values">
                  <strong className="score-float-current score-float-current--total">{totalScore}</strong>
                  <span className="score-float-sep"> pts</span>
                </span>
              </div>
              {completedCount > 0 && (
                <div className="share-row">
                  <span className="share-row-label">Compartir en:</span>
                  <button type="button" className="share-btn share-btn--sm share-btn--wa" onClick={shareTotalWhatsApp} title="WhatsApp"><WhatsAppIcon /></button>
                  <button type="button" className="share-btn share-btn--sm share-btn--fb" onClick={shareTotalFacebook} title="Facebook"><FacebookIcon /></button>
                </div>
              )}
            </div>
            <div className={`score-float ${targetReached ? 'score-float--reached' : ''}`} role="status" aria-live="polite" aria-label="Puntaje del nivel">
              <div className="score-float-inner">
                <span className="score-float-label">{targetReached ? 'Objetivo alcanzado' : 'Puntaje'}</span>
                <span className="score-float-values">
                  <strong className={`score-float-current ${targetReached ? 'score-float-current--reached' : ''} ${displayScore !== score ? 'score-float-current--counting' : ''}`}>{displayScore}</strong>
                  <span className="score-float-sep"> / </span>
                  <span className="score-float-target">{level.targetScore}</span>
                </span>
              </div>
              <div className={`score-float-bar ${targetReached ? 'score-float-bar--reached' : ''}`} aria-hidden>
                <div className="score-float-bar-fill" style={{ width: `${progress}%` }} />
              </div>
              {levelBest > 0 && (
                <div className="score-float-best">
                  Record: <strong>{levelBest}</strong> pts
                  {levelCompleted && (
                    <>
                      {' · '}
                      <button type="button" className="share-btn share-btn--wa share-btn--inline" onClick={shareLevelBestWhatsApp} title="WhatsApp"><WhatsAppIcon /></button>
                      <button type="button" className="share-btn share-btn--fb share-btn--inline" onClick={shareLevelBestFacebook} title="Facebook"><FacebookIcon /></button>
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="score-float-actions">
              {completed && level.level < 20 ? (
                <button
                  type="button"
                  className="score-float-btn score-float-btn--primary score-float-btn--next"
                  onClick={goToNextLevel}
                  disabled={Boolean(fallAnim)}
                >
                  Siguiente nivel &raquo;
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="score-float-btn score-float-btn--primary"
                    onClick={submitWord}
                    disabled={path.length === 0 || completed || exhausted || Boolean(fallAnim)}
                  >
                    Validar palabra
                  </button>
                  {targetReached && !completed && (
                    <button
                      type="button"
                      className="score-float-btn score-float-btn--submit"
                      onClick={submitLevel}
                      disabled={Boolean(fallAnim)}
                    >
                      Enviar nivel ({score} pts)
                    </button>
                  )}
                </>
              )}
              <button
                type="button"
                className="score-float-btn secondary danger"
                onClick={resetLevel}
                disabled={Boolean(fallAnim)}
              >
                Reiniciar nivel
              </button>
              {completed && (
                <div className="share-row share-row--float">
                  <span className="share-row-label">Compartir en:</span>
                  <button type="button" className="share-btn share-btn--sm share-btn--wa" onClick={shareLevelWhatsApp} title="WhatsApp"><WhatsAppIcon /></button>
                  <button type="button" className="share-btn share-btn--sm share-btn--fb" onClick={shareLevelFacebook} title="Facebook"><FacebookIcon /></button>
                </div>
              )}
            </div>
          </div>

          <section className="card scoreboard">
            <p>
              Jugador: <strong>{profile.username}</strong>
              <br />
              Puntuación total: <strong>{totalScore}</strong> pts ({completedCount} niveles)
              {completedCount > 0 && (
                <>
                  {' '}
                  <button type="button" className="share-btn share-btn--wa share-btn--inline" onClick={shareTotalWhatsApp} title="WhatsApp"><WhatsAppIcon /></button>
                  <button type="button" className="share-btn share-btn--fb share-btn--inline" onClick={shareTotalFacebook} title="Facebook"><FacebookIcon /></button>
                </>
              )}
            </p>
            <p>
              <label htmlFor="level-pick" className="level-pick-label">
                Nivel:{' '}
              </label>
              <select
                id="level-pick"
                className="level-pick"
                value={levelNumber}
                onChange={(e) => {
                  const n = Number(e.target.value)
                  setLevelNumber(n)
                  setProfile((prev) => {
                    if (!prev || prev.lastPlayedLevel === n) return prev
                    const next = structuredClone(prev)
                    next.lastPlayedLevel = n
                    next.updatedAt = Date.now()
                    return next
                  })
                }}
                disabled={Boolean(fallAnim)}
                aria-label="Elegir nivel"
              >
                {Array.from({ length: maxPlayableLevel }, (_, i) => i + 1).map((n) => {
                  const best = profile?.levels?.[String(n)]?.bestScore ?? 0
                  return (
                    <option key={n} value={n}>
                      {n} / 20 · obj {LEVELS[n - 1].targetScore}{best > 0 ? ` · rec ${best}` : ''}
                    </option>
                  )
                })}
              </select>
            </p>
            <p>
              Puntaje: <strong>{displayScore}</strong> / {level.targetScore}
              {targetReached && !completed ? ' — Objetivo alcanzado' : ''}
            </p>
            {levelBest > 0 && (
              <p>
                Record nivel {levelNumber}: <strong>{levelBest}</strong> pts
                {levelCompleted && (
                  <>
                    {' '}
                    <span className="share-row-label">Compartir en:</span>{' '}
                    <button type="button" className="share-btn share-btn--wa share-btn--inline" onClick={shareLevelBestWhatsApp} title="WhatsApp"><WhatsAppIcon /></button>
                    <button type="button" className="share-btn share-btn--fb share-btn--inline" onClick={shareLevelBestFacebook} title="Facebook"><FacebookIcon /></button>
                  </>
                )}
              </p>
            )}
            <p>
              Palabras: <strong>{usedWords.size}</strong> · Combo: <strong>{combo}</strong>
              {currentWord ? <> · Actual: <strong>{currentWord}</strong></> : null}
            </p>
            <div className="progress-wrap" aria-label="Progreso de nivel">
              <div className="progress" style={{ width: `${progress}%` }} />
            </div>
            <p className="message">{message}</p>
            {wordLog.length > 0 && (
              <details className="word-log-details" open>
                <summary className="word-log-summary">
                  Palabras encontradas ({wordLog.length})
                </summary>
                <ul className="word-log">
                  {[...wordLog].reverse().map((entry, i) => (
                    <li key={i} className={`word-log-item ${entry.word.length >= 7 ? 'word-log-item--epic' : entry.word.length >= 5 ? 'word-log-item--good' : ''}`}>
                      <span className="word-log-word">{entry.word}</span>
                      <span className="word-log-pts">+{entry.pts}</span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
            <div className="actions">
              {targetReached && !completed ? (
                <button type="button" onClick={submitLevel} disabled={Boolean(fallAnim)}>
                  Enviar nivel ({score} pts)
                </button>
              ) : null}
              {completed && level.level < 20 ? (
                <button type="button" onClick={goToNextLevel} disabled={Boolean(fallAnim)}>
                  Siguiente nivel
                </button>
              ) : null}
            </div>
          </section>

          <section className="card level">
            <h2>
              Nivel {level.level} — {level.title}
            </h2>
            <p className="small">{level.subtitle}</p>
            <p className="small instruction-strong">
              Busca palabras largas: dan muchos más puntos que las cortas.
              Las casillas con borde de color son pistas de palabras en linea recta.
              <br />
              Juega hasta agotar el tablero. Alcanza el objetivo para poder enviar el nivel, pero sigue jugando para maximizar tu puntuación.
            </p>
            <div
              ref={boardRef}
              className={`board ${fallAnim ? 'board--falling' : ''}`}
              role="grid"
              aria-label="Tablero de letras"
            >
              {board.map((row, rowIndex) =>
                row.map((letter, colIndex) => {
                  const selectedIndex = path.findIndex(
                    (step) => step.row === rowIndex && step.col === colIndex,
                  )
                  const inPath = selectedIndex !== -1
                  const skin = skinGrid[rowIndex]?.[colIndex] ?? 0
                  const hintT = !inPath ? hintThemeGrid[rowIndex]?.[colIndex] : null
                  const hasStraightHint = hintT != null
                  const tr = fallAnim?.list?.find((t) => t.toRow === rowIndex && t.col === colIndex)
                  const fallRows = tr ? tr.toRow - tr.fromRow : 0
                  const doFall = Boolean(tr && fallRows !== 0)
                  return (
                    <button
                      key={`${rowIndex}-${colIndex}-${fallAnim ? fallAnim.id : 'idle'}`}
                      type="button"
                      className={`cell ${inPath ? 'cell--in-path' : ''} ${hasStraightHint ? 'cell--straight-hint' : ''} ${completed || exhausted ? 'disabled' : ''} ${doFall ? 'cell--falling' : ''}`}
                      data-skin={String(skin)}
                      data-path-theme={inPath ? String(pathTheme) : undefined}
                      data-hint-theme={hasStraightHint ? String(hintT) : undefined}
                      style={
                        doFall
                          ? {
                              '--fall-rows': String(fallRows),
                              '--fall-start-op': tr.isNew ? '0.55' : '1',
                            }
                          : undefined
                      }
                      onClick={() => onCellClick(rowIndex, colIndex)}
                      onDoubleClick={(event) => onCellDoubleClick(rowIndex, colIndex, event)}
                      disabled={completed || exhausted || Boolean(fallAnim)}
                    >
                      {letter}
                    </button>
                  )
                }),
              )}
            </div>

            {(completed || (exhausted && !targetReached)) && (
              <div className="level-complete-overlay">
                <p className="level-complete-msg">
                  {completed
                    ? level.level < 20
                      ? `Nivel ${level.level} superado — ${score} pts`
                      : `Juego completado — ${score} pts`
                    : `Tablero agotado — ${score} / ${level.targetScore} pts`}
                </p>
                {completed && level.level < 20 ? (
                  <button
                    type="button"
                    className="level-complete-btn"
                    onClick={goToNextLevel}
                    disabled={Boolean(fallAnim)}
                  >
                    Siguiente nivel &raquo;
                  </button>
                ) : null}
                <button
                  type="button"
                  className="level-complete-btn secondary"
                  onClick={resetLevel}
                >
                  {completed ? 'Repetir nivel' : 'Reintentar nivel'}
                </button>
                {completed && (
                  <div className="share-row share-row--overlay">
                    <span className="share-row-label">Compartir en:</span>
                    <button type="button" className="share-btn share-btn--sm share-btn--wa" onClick={shareLevelWhatsApp} title="WhatsApp"><WhatsAppIcon /></button>
                    <button type="button" className="share-btn share-btn--sm share-btn--fb" onClick={shareLevelFacebook} title="Facebook"><FacebookIcon /></button>
                  </div>
                )}
              </div>
            )}

            <div className="actions">
              <button
                onClick={submitWord}
                disabled={path.length === 0 || completed || exhausted || Boolean(fallAnim)}
              >
                Validar palabra
              </button>
              {targetReached && !completed && (
                <button onClick={submitLevel} disabled={Boolean(fallAnim)}>
                  Enviar nivel ({score} pts)
                </button>
              )}
              <button className="secondary" onClick={clearSelection} disabled={path.length === 0}>
                Limpiar selección
              </button>
              <button className="secondary danger" onClick={resetLevel}>
                Reiniciar nivel
              </button>
            </div>
      </section>

          <section className="card schema">
            <h2>Plan de 20 niveles</h2>
            <div className="levels">
              {LEVELS.map((item) => {
                const lvStats = profile?.levels?.[String(item.level)]
                const done = lvStats?.completed ?? false
                const best = lvStats?.bestScore ?? 0
                return (
                  <article key={item.level} className={`level-chip ${done ? 'level-chip--done' : 'active'} ${item.level === levelNumber ? 'level-chip--current' : ''}`}>
                    <h3>Nivel {item.level}</h3>
                    <p>{item.title}</p>
                    <p>Objetivo: {item.targetScore} pts</p>
                    {done ? <p className="level-chip-best">Record: {best} pts</p> : null}
                  </article>
                )
              })}
            </div>
          </section>

          {levelRanking.length > 0 && (
            <section className="card leaderboard">
              <h2>Top 10 — Nivel {rankingLevel}</h2>
              <ol className="ranking-list">
                {levelRanking.map((entry, i) => (
                  <li key={entry.username} className={`ranking-item ${i === 0 ? 'ranking-item--gold' : i === 1 ? 'ranking-item--silver' : i === 2 ? 'ranking-item--bronze' : ''} ${entry.username === profile?.username ? 'ranking-item--you' : ''}`}>
                    <span className="ranking-pos">{i + 1}</span>
                    <span className="ranking-name">{entry.username}</span>
                    <span className="ranking-score">{entry.bestScore} pts</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {overallRanking.length > 0 && (
            <section className="card leaderboard leaderboard--overall">
              <div className="champion-banner">
                <span className="champion-crown">&#9733;</span>
                <span className="champion-name">{overallRanking[0].username}</span>
                <span className="champion-score">{overallRanking[0].totalScore} pts</span>
                <span className="champion-title">Mejor jugador global</span>
              </div>
              <h2>Top 10 — Puntuación global</h2>
              <ol className="ranking-list">
                {overallRanking.map((entry, i) => (
                  <li key={entry.username} className={`ranking-item ${i === 0 ? 'ranking-item--gold' : i === 1 ? 'ranking-item--silver' : i === 2 ? 'ranking-item--bronze' : ''} ${entry.username === profile?.username ? 'ranking-item--you' : ''}`}>
                    <span className="ranking-pos">{i + 1}</span>
                    <span className="ranking-name">{entry.username}</span>
                    <span className="ranking-score">{entry.totalScore} pts</span>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </>
      )}
    </main>
  )
}

export default App
