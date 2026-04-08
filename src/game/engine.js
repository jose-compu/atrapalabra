function randomLetter(letterPool) {
  const idx = Math.floor(Math.random() * letterPool.length)
  return letterPool[idx]
}

function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a += 0x6d2b79f5
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const VOWELS = new Set('AEIOU'.split(''))
const VOWEL_LIST = 'AEIOU'.split('')
const MIN_VOWEL_RATIO = 0.35

function enforceVowelFloor(board, rng) {
  const rows = board.length
  const cols = board[0].length
  const total = rows * cols
  let vowelCount = 0
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if (VOWELS.has(board[r][c])) vowelCount += 1
    }
  }
  const needed = Math.ceil(total * MIN_VOWEL_RATIO) - vowelCount
  if (needed <= 0) return
  const consonantCells = []
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if (!VOWELS.has(board[r][c])) consonantCells.push({ r, c })
    }
  }
  if (rng) consonantCells.sort(() => rng() - 0.5)
  else consonantCells.sort(() => Math.random() - 0.5)
  for (let i = 0; i < needed && i < consonantCells.length; i += 1) {
    const { r, c } = consonantCells[i]
    board[r][c] = rng
      ? VOWEL_LIST[Math.floor(rng() * VOWEL_LIST.length)]
      : VOWEL_LIST[Math.floor(Math.random() * VOWEL_LIST.length)]
  }
}

export function createInitialBoard(level) {
  if (level.initialBoard) {
    return level.initialBoard.map((row) => [...row])
  }
  const rows = level.rows
  const cols = level.cols
  const pool = level.letterPool

  let board
  let rng = null
  if (level.boardSeed != null && Number.isFinite(level.boardSeed)) {
    rng = mulberry32(level.boardSeed >>> 0)
    board = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => pool[Math.floor(rng() * pool.length)]),
    )
  } else {
    board = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => randomLetter(pool)),
    )
  }

  enforceVowelFloor(board, rng)

  if (level.guaranteedWords && level.guaranteedWords.length > 0) {
    seedGuaranteedWords(board, level.guaranteedWords, level.level ?? 1)
  }
  return board
}

export function isAdjacent(a, b) {
  const dr = Math.abs(a.row - b.row)
  const dc = Math.abs(a.col - b.col)
  return dr <= 1 && dc <= 1 && !(dr === 0 && dc === 0)
}

export function buildWord(board, path) {
  return path.map(({ row, col }) => board[row][col]).join('')
}

export function isPathValid(path) {
  if (path.length < 2) {
    return true
  }
  for (let i = 1; i < path.length; i += 1) {
    if (!isAdjacent(path[i - 1], path[i])) {
      return false
    }
  }
  return true
}

function copyBoard(board) {
  return board.map((row) => [...row])
}

/**
 * Semilla alineada con la partida: misma palabra-n (0-based) usa la misma recarga en test y en UI.
 */
export function collapseRNGSeed(levelNumber, wordIndexInLevel) {
  return (levelNumber * 1000003 + wordIndexInLevel * 104729) >>> 0
}

export function countRefillLetters(board, path) {
  const rows = board.length
  const cols = board[0].length
  const cleared = copyBoard(board)
  for (const { row, col } of path) {
    cleared[row][col] = null
  }
  let need = 0
  for (let col = 0; col < cols; col += 1) {
    let stack = 0
    for (let row = rows - 1; row >= 0; row -= 1) {
      if (cleared[row][col] !== null) {
        stack += 1
      }
    }
    need += rows - stack
  }
  return need
}

export function collapseBoard(board, path, letterPool, options) {
  const { finalBoard } = planCollapse(board, path, letterPool, options)
  return finalBoard
}

/**
 * Misma fisica que collapseBoard, pero devuelve cada ficha con fila origen y destino
 * (fromRow negativo = nueva letra entrando desde arriba).
 * options: { seed?: number, fixedFill?: string } — fixedFill consume letras en orden de columna 0..cols-1,
 * dentro de cada columna de arriba hacia abajo para las casillas nuevas.
 */
export function planCollapse(board, path, letterPool, options = {}) {
  const { seed, fixedFill } = options
  let fillIndex = 0
  const rng = seed !== undefined ? mulberry32(seed) : null

  function nextLetter() {
    if (fixedFill !== undefined && fillIndex < fixedFill.length) {
      const ch = fixedFill[fillIndex]
      fillIndex += 1
      return ch
    }
    if (rng) {
      return letterPool[Math.floor(rng() * letterPool.length)]
    }
    return randomLetter(letterPool)
  }

  const rows = board.length
  const cols = board[0].length
  const cleared = copyBoard(board)
  for (const { row, col } of path) {
    cleared[row][col] = null
  }

  const transitions = []
  const finalBoard = copyBoard(cleared)

  for (let col = 0; col < cols; col += 1) {
    const stack = []
    const fromRows = []
    for (let row = rows - 1; row >= 0; row -= 1) {
      if (cleared[row][col] !== null) {
        stack.push(cleared[row][col])
        fromRows.push(row)
      }
    }
    const needNew = rows - stack.length
    const newLetters = []
    for (let i = 0; i < needNew; i += 1) {
      newLetters.push(nextLetter())
    }

    let toRow = rows - 1
    for (let i = 0; i < stack.length; i += 1) {
      const letter = stack[i]
      const fromRow = fromRows[i]
      transitions.push({ col, toRow, fromRow, letter, isNew: false })
      finalBoard[toRow][col] = letter
      toRow -= 1
    }
    for (let i = 0; i < newLetters.length; i += 1) {
      const letter = newLetters[i]
      const fromRow = -(i + 1)
      transitions.push({ col, toRow, fromRow, letter, isNew: true })
      finalBoard[toRow][col] = letter
      toRow -= 1
    }
  }

  return { finalBoard, transitions, refillConsumed: fillIndex }
}

function neighbors(row, col, rows, cols) {
  const steps = []
  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      if (dr === 0 && dc === 0) continue
      const nr = row + dr
      const nc = col + dc
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        steps.push({ row: nr, col: nc })
      }
    }
  }
  return steps
}

export function findAnyWordPath(board, dictionary, minWordLength) {
  const rows = board.length
  const cols = board[0].length

  const boardLetters = new Set()
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      boardLetters.add(board[r][c])
    }
  }

  const candidates = []
  for (const word of dictionary) {
    if (word.length < minWordLength) continue
    const upper = word.toUpperCase()
    let possible = true
    for (let i = 0; i < upper.length; i += 1) {
      if (!boardLetters.has(upper[i])) { possible = false; break }
    }
    if (possible) candidates.push(upper)
  }
  candidates.sort((a, b) => a.length - b.length)

  for (const upper of candidates) {
    const starts = []
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        if (board[row][col] === upper[0]) {
          starts.push({ row, col })
        }
      }
    }

    for (const start of starts) {
      const visited = new Set([`${start.row},${start.col}`])
      const path = [start]
      if (searchPath(board, upper, 1, start, path, visited, rows, cols)) {
        return path
      }
    }
  }
  return null
}

function searchPath(board, target, index, current, path, visited, rows, cols) {
  if (index === target.length) {
    return true
  }
  const nextLetter = target[index]
  const nextSteps = neighbors(current.row, current.col, rows, cols)
  for (const step of nextSteps) {
    const key = `${step.row},${step.col}`
    if (visited.has(key)) continue
    if (board[step.row][step.col] !== nextLetter) continue
    visited.add(key)
    path.push(step)
    if (searchPath(board, target, index + 1, step, path, visited, rows, cols)) {
      return true
    }
    path.pop()
    visited.delete(key)
  }
  return false
}

const INJECT_DIRECTIONS = [
  { dr: 0, dc: 1 },
  { dr: 1, dc: 0 },
  { dr: 1, dc: 1 },
  { dr: 1, dc: -1 },
]

function placeWordOnBoard(board, word, rng) {
  const rows = board.length
  const cols = board[0].length
  const upper = word.toUpperCase()
  const slots = []
  for (const { dr, dc } of INJECT_DIRECTIONS) {
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        let ok = true
        for (let k = 0; k < upper.length; k += 1) {
          const nr = r + k * dr
          const nc = c + k * dc
          if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) { ok = false; break }
        }
        if (ok) slots.push({ r, c, dr, dc })
      }
    }
  }
  if (slots.length === 0) return false
  const pick = rng
    ? slots[Math.floor(rng() * slots.length)]
    : slots[Math.floor(Math.random() * slots.length)]
  for (let k = 0; k < upper.length; k += 1) {
    board[pick.r + k * pick.dr][pick.c + k * pick.dc] = upper[k]
  }
  return true
}

function seedGuaranteedWords(board, words, levelNumber) {
  const rng = mulberry32((levelNumber * 7919 + 104729) >>> 0)
  const shuffled = words.slice().sort(() => rng() - 0.5)
  for (const w of shuffled) {
    placeWordOnBoard(board, w, rng)
  }
}

export function injectGuaranteedWord(board, word) {
  const next = copyBoard(board)
  placeWordOnBoard(next, word, null)
  return next
}

/**
 * Scoring: exponential reward for word length so short words
 * give very little and long words dominate strategy.
 * Base = length^2.2 * 8, plus combo bonus, plus rarity multiplier
 * for uncommon Spanish letters (Q, X, Z, K, V, J, Y, H, B, F).
 */
const RARE_LETTERS = new Set('QXZKVJYHBF'.split(''))
export function computeWordScore(word, combo) {
  const len = word.length
  const base = Math.round(Math.pow(len, 2.2) * 8)
  const comboBonus = Math.max(0, combo - 1) * 10
  let rarityMul = 1.0
  for (const ch of word.toUpperCase()) {
    if (RARE_LETTERS.has(ch)) rarityMul += 0.15
  }
  return Math.round((base + comboBonus) * rarityMul)
}

/** Direcciones en linea recta: horizontal, vertical, diagonal \ y diagonal / */
const STRAIGHT_DIRECTIONS = [
  { dr: 0, dc: 1, kind: 'h' },
  { dr: 1, dc: 0, kind: 'v' },
  { dr: 1, dc: 1, kind: 'd' },
  { dr: 1, dc: -1, kind: 'd' },
]

/**
 * Indice de color 0..themeCount-1 estable por palabra (alineado con temas de camino en la UI).
 */
export function wordThemeIndex(word, themeCount = 7) {
  const w = word.toUpperCase()
  let h = 0
  for (let i = 0; i < w.length; i += 1) {
    h = (Math.imul(h, 31) + w.charCodeAt(i)) >>> 0
  }
  return h % themeCount
}

/**
 * Todas las apariciones de palabras del diccionario en fila, columna o diagonal recta.
 */
export function findAllStraightLineWords(board, dictionary, minWordLength) {
  const dict = new Set(dictionary.map((x) => x.toUpperCase()))
  const rows = board.length
  const cols = board[0].length
  const out = []

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      for (const { dr, dc, kind } of STRAIGHT_DIRECTIONS) {
        let s = ''
        const cells = []
        for (let k = 0; ; k += 1) {
          const nr = r + k * dr
          const nc = c + k * dc
          if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) break
          s += board[nr][nc]
          cells.push({ row: nr, col: nc })
          if (s.length >= minWordLength && dict.has(s)) {
            out.push({ word: s, cells: cells.map((x) => ({ ...x })), kind })
          }
        }
      }
    }
  }
  return out
}

/**
 * Por celda, tema de pista (0..themeCount-1) si forma parte de una alineacion recta;
 * prioriza la palabra mas larga. null = sin pista en linea recta.
 */
export function buildStraightHintThemeGrid(board, dictionary, minWordLength, themeCount = 7) {
  const rows = board.length
  const cols = board[0].length
  const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => null))
  const matches = findAllStraightLineWords(board, dictionary, minWordLength)
  matches.sort((a, b) => b.word.length - a.word.length)
  for (const m of matches) {
    const t = wordThemeIndex(m.word, themeCount)
    for (const { row, col } of m.cells) {
      if (grid[row][col] === null) {
        grid[row][col] = t
      }
    }
  }
  return grid
}

export function straightHintStats(board, dictionary, minWordLength, themeCount = 7) {
  const grid = buildStraightHintThemeGrid(board, dictionary, minWordLength, themeCount)
  let hintedCellCount = 0
  for (let r = 0; r < grid.length; r += 1) {
    for (let c = 0; c < grid[r].length; c += 1) {
      if (grid[r][c] !== null) hintedCellCount += 1
    }
  }
  return { grid, hintedCellCount }
}

export function countStraightHintedCells(board, dictionary, minWordLength) {
  return straightHintStats(board, dictionary, minWordLength).hintedCellCount
}

/**
 * Reconstruye el tablero previo a un colapso usando las transiciones del planCollapse
 * y las letras del camino (misma longitud que path).
 */
export function invertCollapseFromTransitions(finalBoard, transitions, path, wordLetters) {
  const rows = finalBoard.length
  const cols = finalBoard[0].length
  const prior = Array.from({ length: rows }, () => Array(cols).fill(null))
  for (const t of transitions) {
    if (!t.isNew) {
      prior[t.fromRow][t.col] = t.letter
    }
  }
  for (let i = 0; i < path.length; i += 1) {
    const { row, col } = path[i]
    prior[row][col] = wordLetters[i]
  }
  return prior
}
