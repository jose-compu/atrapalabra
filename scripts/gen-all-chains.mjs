import { buildWord, planCollapse, findAnyWordPath } from '../src/game/engine.js'

const pool = 'AEIOUNRSTLMPCDG'
const base = [
  'CASAROLN','PQLUNARE','MNUBETOD','MESALIOS','PATOGATO','FLORRIOS','PERANUBE','SOLCASAR',
].map((l) => l.split(''))
const trans = Array.from({ length: 8 }, (_, r) => Array.from({ length: 8 }, (_, c) => base[c][r]))
const vflip = Array.from({ length: 8 }, (_, r) => [...base[7 - r]])
const hflip = base.map((row) => [...row].reverse())

function copy(b) { return b.map((r) => [...r]) }

function countRefill(bd, path) {
  const rows = bd.length, cols = bd[0].length
  const cleared = copy(bd)
  for (const { row, col } of path) cleared[row][col] = null
  let need = 0
  for (let c = 0; c < cols; c++) {
    let stack = 0
    for (let r = rows - 1; r >= 0; r--) if (cleared[r][c] !== null) stack++
    need += rows - stack
  }
  return need
}

function randomFill(n) {
  let s = ''
  for (let i = 0; i < n; i++) s += pool[Math.floor(Math.random() * pool.length)]
  return s
}

function findRefills(board, solution, attempts) {
  let bd = copy(board)
  const refills = []
  for (let s = 0; s < solution.length; s++) {
    const { word, path } = solution[s]
    if (buildWord(bd, path) !== word) return null
    const n = countRefill(bd, path)
    if (s === solution.length - 1) { refills.push('A'.repeat(n)); return refills }
    const next = solution[s + 1]
    let found = null
    for (let t = 0; t < attempts; t++) {
      const fill = randomFill(n)
      const nb = planCollapse(bd, path, pool, { fixedFill: fill }).finalBoard
      if (buildWord(nb, next.path) === next.word) { found = fill; break }
    }
    if (!found) return null
    refills.push(found)
    bd = planCollapse(bd, path, pool, { fixedFill: found }).finalBoard
  }
  return refills
}

function sol(board, words) {
  return words.map((w) => {
    const p = findAnyWordPath(board, [w], 3)
    if (!p || buildWord(board, p) !== w) return null
    return { word: w, path: p }
  })
}

function tryChain(board, words, retries = 8, attempts = 500000) {
  const solution = sol(board, words)
  if (solution.some((s) => !s)) return null
  for (let r = 0; r < retries; r++) {
    const refills = findRefills(board, solution, attempts)
    if (refills) return { solution, refills }
  }
  return null
}

const dict = ['CASA','LUNA','SOL','RIO','FLOR','GATO','PATO','MESA','NUBE','PERA']

const boardMap = { base, trans, vflip, hflip }
const results = []
const seen = new Set()

function tryMany(bname, board, wordSets) {
  for (const words of wordSets) {
    const key = bname + ':' + words.join(',')
    if (seen.has(key)) continue
    seen.add(key)
    const r = tryChain(board, words, 5, 600000)
    if (r) {
      results.push({
        boardName: bname,
        board: board.map((row) => row.join('')),
        words,
        solution: r.solution,
        refills: r.refills,
      })
      process.stderr.write(`OK #${results.length} ${bname} ${words.join('->')}\n`)
      if (results.length >= 20) return true
    }
  }
  return false
}

function shuffles(arr, count = 60) {
  const out = []
  for (let i = 0; i < count; i++) {
    const sh = arr.slice().sort(() => Math.random() - 0.5)
    out.push(sh.slice(0, 5))
  }
  return out
}

function combos3(arr) {
  const out = []
  for (let i = 0; i < arr.length; i++)
    for (let j = 0; j < arr.length; j++)
      for (let k = 0; k < arr.length; k++)
        if (i !== j && j !== k && i !== k) out.push([arr[i], arr[j], arr[k]])
  return out
}

const fixed5 = [
  ['CASA','LUNA','NUBE','MESA','PATO'],
  ['LUNA','SOL','FLOR','CASA','RIO'],
  ['CASA','LUNA','FLOR','PERA','RIO'],
  ['PATO','GATO','MESA','LUNA','SOL'],
  ['GATO','FLOR','PERA','RIO','CASA'],
  ['NUBE','LUNA','PATO','SOL','MESA'],
  ['SOL','RIO','CASA','LUNA','FLOR'],
  ['PERA','MESA','GATO','NUBE','LUNA'],
  ['FLOR','CASA','PATO','LUNA','SOL'],
  ['RIO','SOL','MESA','GATO','LUNA'],
  ['MESA','PERA','FLOR','CASA','LUNA'],
  ['LUNA','GATO','RIO','PATO','CASA'],
]

const fixed4 = [
  ['CASA','LUNA','SOL','MESA'],
  ['GATO','PATO','FLOR','RIO'],
  ['NUBE','PERA','LUNA','CASA'],
  ['SOL','MESA','GATO','LUNA'],
  ['FLOR','PERA','CASA','RIO'],
  ['MESA','LUNA','PATO','SOL'],
  ['RIO','GATO','NUBE','PERA'],
]

const fixed3 = combos3(['CASA','LUNA','SOL','MESA','GATO','PATO','FLOR','RIO','NUBE','PERA'])

for (const [bname, board] of Object.entries(boardMap)) {
  if (results.length >= 20) break
  tryMany(bname, board, fixed5)
  if (results.length >= 20) break
  tryMany(bname, board, fixed4)
  if (results.length >= 20) break
  tryMany(bname, board, shuffles(dict, 80))
  if (results.length >= 20) break
}

if (results.length < 20) {
  for (const [bname, board] of Object.entries(boardMap)) {
    if (results.length >= 20) break
    tryMany(bname, board, fixed3.slice(0, 200))
  }
}

console.log(JSON.stringify(results, null, 2))
process.stderr.write(`Total: ${results.length}\n`)
