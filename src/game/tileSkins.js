export const TILE_SKIN_COUNT = 14
export const PATH_THEME_COUNT = 7

export function randomSkin() {
  return Math.floor(Math.random() * TILE_SKIN_COUNT)
}

export function makeSkinGrid(rows, cols) {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => randomSkin()))
}

/** Nueva textura solo donde la letra cambio (p. ej. tras colapsar o letras nuevas). */
export function skinsAfterBoardUpdate(prevBoard, nextBoard, prevSkins) {
  const rows = nextBoard.length
  const cols = nextBoard[0]?.length ?? 0
  if (!prevBoard || prevBoard.length !== rows || !prevBoard[0] || prevBoard[0].length !== cols) {
    return makeSkinGrid(rows, cols)
  }
  const next = prevSkins.map((row) => [...row])
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if (prevBoard[r][c] !== nextBoard[r][c]) {
        next[r][c] = randomSkin()
      }
    }
  }
  return next
}

export function randomPathTheme() {
  return Math.floor(Math.random() * PATH_THEME_COUNT)
}

export function boardsLetterEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false
  for (let r = 0; r < a.length; r += 1) {
    if (!b[r] || a[r].length !== b[r].length) return false
    for (let c = 0; c < a[r].length; c += 1) {
      if (a[r][c] !== b[r][c]) return false
    }
  }
  return true
}
