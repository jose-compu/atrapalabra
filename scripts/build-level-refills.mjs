/**
 * One-off: define boards + solutions here, run `node scripts/build-level-refills.mjs`
 * to print refills[] for pasting into levels.js (fixedFill per step).
 */
import { buildWord, planCollapse } from '../src/game/engine.js'

const pool = 'AEIOUNRSTLMPCDG'

function copy(b) {
  return b.map((r) => [...r])
}

function countRefill(b, path) {
  const rows = b.length
  const cols = b[0].length
  const cleared = copy(b)
  for (const { row, col } of path) cleared[row][col] = null
  let need = 0
  for (let c = 0; c < cols; c++) {
    let stack = 0
    for (let r = rows - 1; r >= 0; r--) {
      if (cleared[r][c] !== null) stack++
    }
    need += rows - stack
  }
  return need
}

function randomFill(n) {
  let s = ''
  for (let i = 0; i < n; i++) s += pool[Math.floor(Math.random() * pool.length)]
  return s
}

function findRefills(initialBoard, solution, attempts = 200000) {
  let b = copy(initialBoard)
  const refills = []
  for (let s = 0; s < solution.length; s++) {
    const { word, path } = solution[s]
    if (buildWord(b, path) !== word) {
      return { ok: false, err: `step ${s} want ${word} got ${buildWord(b, path)}` }
    }
    const n = countRefill(b, path)
    if (s === solution.length - 1) {
      refills.push('A'.repeat(n))
      break
    }
    const next = solution[s + 1]
    let found = null
    for (let t = 0; t < attempts; t++) {
      const fill = randomFill(n)
      const nb = planCollapse(b, path, pool, { fixedFill: fill }).finalBoard
      if (buildWord(nb, next.path) === next.word) {
        found = fill
        break
      }
    }
    if (!found) return { ok: false, err: `no refill step ${s}` }
    refills.push(found)
    b = planCollapse(b, path, pool, { fixedFill: found }).finalBoard
  }
  return { ok: true, refills }
}

function rows(lines) {
  return lines.map((line) => line.split(''))
}

/* --- Plantillas por nivel (8x8) --- */
const L = {
  1: {
    board: rows([
      'CASAROLN',
      'PQLUNARE',
      'MNUBETOD',
      'MESALIOS',
      'PATOGATO',
      'FLORRIOS',
      'PERANUBE',
      'SOLCASAR',
    ]),
    solution: [
      { word: 'CASA', path: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 0, col: 3 }] },
      { word: 'LUNA', path: [{ row: 1, col: 2 }, { row: 1, col: 3 }, { row: 1, col: 4 }, { row: 1, col: 5 }] },
      { word: 'NUBE', path: [{ row: 2, col: 1 }, { row: 2, col: 2 }, { row: 2, col: 3 }, { row: 2, col: 4 }] },
      { word: 'MESA', path: [{ row: 3, col: 0 }, { row: 3, col: 1 }, { row: 3, col: 2 }, { row: 3, col: 3 }] },
      { word: 'PATO', path: [{ row: 4, col: 0 }, { row: 4, col: 1 }, { row: 4, col: 2 }, { row: 4, col: 3 }] },
    ],
  },
  2: {
    board: rows([
      'MARXXXXX',
      'AXXXXXXX',
      'RXXXXXXX',
      'XXXSOLXX',
      'XXXOXXXX',
      'XXXLXXXX',
      'GATXXXXX',
      'XXXXXXXX',
    ]),
    solution: [
      { word: 'MAR', path: [{ row: 0, col: 0 }, { row: 1, col: 0 }, { row: 2, col: 0 }] },
      { word: 'SOL', path: [{ row: 3, col: 3 }, { row: 4, col: 3 }, { row: 5, col: 3 }] },
      { word: 'GATO', path: [{ row: 6, col: 0 }, { row: 6, col: 1 }, { row: 6, col: 2 }, { row: 6, col: 3 }] },
    ],
  },
}

for (const n of [1, 2]) {
  const { board, solution } = L[n]
  const r = findRefills(board, solution, 400000)
  console.log('Level', n, r)
}
