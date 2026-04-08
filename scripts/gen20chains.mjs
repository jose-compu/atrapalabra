import { buildWord, planCollapse, findAnyWordPath } from '../src/game/engine.js'

const pool = 'AEIOUNRSTLMPCDG'
const board = [
  ['C', 'A', 'S', 'A', 'R', 'O', 'L', 'N'],
  ['P', 'Q', 'L', 'U', 'N', 'A', 'R', 'E'],
  ['M', 'N', 'U', 'B', 'E', 'T', 'O', 'D'],
  ['M', 'E', 'S', 'A', 'L', 'I', 'O', 'S'],
  ['P', 'A', 'T', 'O', 'G', 'A', 'T', 'O'],
  ['F', 'L', 'O', 'R', 'R', 'I', 'O', 'S'],
  ['P', 'E', 'R', 'A', 'N', 'U', 'B', 'E'],
  ['S', 'O', 'L', 'C', 'A', 'S', 'A', 'R'],
]

const dict = [
  'CASA',
  'LUNA',
  'NUBE',
  'MESA',
  'PATO',
  'GATO',
  'FLOR',
  'SOL',
  'RIO',
  'PERA',
]

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

function findRefills(initial, solution, attempts) {
  let b = copy(initial)
  const refills = []
  for (let s = 0; s < solution.length; s++) {
    const { word, path } = solution[s]
    if (buildWord(b, path) !== word) {
      return { ok: false }
    }
    const n = countRefill(b, path)
    if (s === solution.length - 1) {
      refills.push('A'.repeat(n))
      return { ok: true, refills }
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
    if (!found) return { ok: false }
    refills.push(found)
    b = planCollapse(b, path, pool, { fixedFill: found }).finalBoard
  }
  return { ok: true, refills }
}

const paths = {}
for (const w of dict) {
  const p = findAnyWordPath(board, [w], 3)
  if (p && buildWord(board, p) === w) paths[w] = p
}

const keys = Object.keys(paths)
const seen = new Set()
const out = []
let iter = 0
const maxIter = 80000
const attempts = 350000

while (out.length < 20 && iter < maxIter) {
  iter++
  const shuffled = keys.slice().sort(() => Math.random() - 0.5).slice(0, 5)
  const key = shuffled.join(',')
  if (seen.has(key)) continue
  const solution = shuffled.map((w) => ({ word: w, path: paths[w] }))
  const r = findRefills(board, solution, attempts)
  if (r.ok) {
    seen.add(key)
    out.push({ words: shuffled, refills: r.refills, solution })
  }
}

console.log(JSON.stringify(out, null, 2))
console.error('chains', out.length, 'iters', iter)
