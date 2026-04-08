/**
 * Curated word bank for hints and guaranteed words, grouped by level theme.
 * Each level draws from a different slice so words don't repeat across levels.
 */
const WORD_BANK = [
  // Group 0 (level 1)
  ['SOL', 'MAR', 'LUZ', 'CASA', 'LUNA', 'FLOR', 'MESA', 'NUBE', 'SILLA', 'VERDE', 'PERRO', 'CAMPO'],
  // Group 1 (level 2)
  ['RIO', 'PAN', 'SAL', 'GATO', 'PERA', 'LAGO', 'RANA', 'ISLA', 'PLUMA', 'ARENA', 'FUEGO', 'MONTE'],
  // Group 2 (level 3)
  ['RED', 'OJO', 'FIN', 'MANO', 'TELA', 'NOTA', 'PISO', 'ROSA', 'PLATO', 'NIEVE', 'CIELO', 'TIGRE'],
  // Group 3 (level 4)
  ['VER', 'DOS', 'UNO', 'COPA', 'SOPA', 'DATO', 'SALA', 'FARO', 'DULCE', 'CREMA', 'DANZA', 'MEDIA'],
  // Group 4 (level 5)
  ['SER', 'DAR', 'MAS', 'ROPA', 'PIEL', 'CAMA', 'LEON', 'MIEL', 'GLOBO', 'CINTA', 'PRIMA', 'MOTOR'],
  // Group 5 (level 6)
  ['TAN', 'POR', 'SIN', 'MURO', 'ARCO', 'POLO', 'LOBO', 'FOCA', 'TORRE', 'PLAYA', 'CARTA', 'MUNDO'],
  // Group 6 (level 7)
  ['SOL', 'LUZ', 'RED', 'VASO', 'PINO', 'SEDA', 'PLAN', 'DEDO', 'PILAR', 'RELOJ', 'GENTE', 'PODER'],
  // Group 7 (level 8)
  ['MAR', 'FIN', 'OJO', 'OLOR', 'AZUL', 'ROJO', 'NUBE', 'FLOR', 'PALMA', 'FRESA', 'SIGLO', 'PUERTA'],
  // Group 8 (level 9)
  ['PAN', 'SAL', 'RIO', 'MESA', 'LUNA', 'GATO', 'PERA', 'ISLA', 'CAMINO', 'PIEDRA', 'SOMBRA', 'ESPADA'],
  // Group 9 (level 10)
  ['VER', 'SER', 'DAR', 'LAGO', 'RANA', 'MANO', 'TELA', 'NOTA', 'CORONA', 'MUSICA', 'COMIDA', 'PINCEL'],
  // Group 10 (level 11)
  ['DOS', 'UNO', 'TAN', 'COPA', 'SOPA', 'ROSA', 'PISO', 'DATO', 'FLECHA', 'CADENA', 'REGALO', 'MOLINO'],
  // Group 11 (level 12)
  ['MAS', 'POR', 'SIN', 'SALA', 'FARO', 'LEON', 'MIEL', 'CAMA', 'PUEBLO', 'BARRIO', 'MADERA', 'ESPEJO'],
  // Group 12 (level 13)
  ['SOL', 'MAR', 'LUZ', 'ROPA', 'PIEL', 'ARCO', 'LOBO', 'FOCA', 'PALOMA', 'NACION', 'DULZOR', 'NARANJA'],
  // Group 13 (level 14)
  ['RED', 'FIN', 'OJO', 'MURO', 'POLO', 'SEDA', 'VASO', 'PINO', 'CAMARON', 'VENTANA', 'PRADERA', 'SENDERO'],
  // Group 14 (level 15)
  ['PAN', 'RIO', 'SAL', 'PLAN', 'DEDO', 'TELA', 'NOTA', 'GATO', 'CASCADA', 'PORCION', 'HERMANO', 'DESTINO'],
  // Group 15 (level 16)
  ['SER', 'DAR', 'VER', 'LAGO', 'RANA', 'ISLA', 'PERA', 'MANO', 'MENSAJE', 'CAMPANA', 'PUERTA', 'CAMINO'],
  // Group 16 (level 17)
  ['DOS', 'MAS', 'UNO', 'COPA', 'SOPA', 'ROSA', 'DATO', 'SALA', 'PIEDRA', 'SOMBRA', 'ESPADA', 'CORONA'],
  // Group 17 (level 18)
  ['TAN', 'POR', 'SIN', 'FARO', 'LEON', 'MIEL', 'CAMA', 'ROPA', 'MUSICA', 'COMIDA', 'PINCEL', 'FLECHA'],
  // Group 18 (level 19)
  ['SOL', 'LUZ', 'MAR', 'PIEL', 'ARCO', 'LOBO', 'FOCA', 'MURO', 'NARANJA', 'VENTANA', 'PRADERA', 'CASCADA'],
  // Group 19 (level 20)
  ['RED', 'OJO', 'FIN', 'POLO', 'SEDA', 'VASO', 'PINO', 'DEDO', 'SENDERO', 'DESTINO', 'HERMANO', 'CAMPANA'],
]

/**
 * Letter pools with Spanish-like vowel frequency (~40-45%).
 * Vowels are repeated to boost their ratio in random fills.
 */
const POOL_BASE = 'AAEEIIOOUURRSTLNMPCDG'
const POOL_MID = 'AAEEIIOOUURRSTLNMPCDGBFHVY'
const POOL_FULL = 'AAEEIIOOUURRSTLNMPCDGBFHVYJZQ'

const LEVEL_1_BOARD = [
  ['C', 'A', 'S', 'A', 'R', 'O', 'L', 'N'],
  ['P', 'E', 'L', 'U', 'N', 'A', 'R', 'E'],
  ['M', 'A', 'U', 'B', 'E', 'T', 'O', 'D'],
  ['M', 'E', 'S', 'A', 'L', 'I', 'O', 'S'],
  ['P', 'A', 'T', 'O', 'G', 'A', 'T', 'O'],
  ['F', 'L', 'O', 'R', 'R', 'I', 'O', 'S'],
  ['P', 'E', 'R', 'A', 'N', 'U', 'B', 'E'],
  ['S', 'O', 'L', 'C', 'A', 'S', 'A', 'R'],
]

/** t en [0,1] segun nivel 1..20 */
function smoothT(level) {
  return (Math.min(20, Math.max(1, level)) - 1) / 19
}

function letterPoolFor(level) {
  const t = smoothT(level)
  if (t < 0.25) return POOL_BASE
  if (t < 0.55) return POOL_MID
  return POOL_FULL
}

function dictionaryFor(level) {
  const group = WORD_BANK[(level - 1) % WORD_BANK.length]
  return [...new Set(group)]
}

function guaranteedFor(level) {
  const group = WORD_BANK[(level - 1) % WORD_BANK.length]
  const short = group.filter((w) => w.length <= 4)
  const medium = group.filter((w) => w.length >= 5 && w.length <= 6)
  const long = group.filter((w) => w.length >= 7)
  return [...short, ...medium, ...long]
}

function targetScoreFor(level) {
  if (level === 1) return 250
  const t = smoothT(level)
  return Math.round(260 + t * 440)
}

function minWordLengthFor(level) {
  const t = smoothT(level)
  return t >= 0.78 ? 4 : 3
}

const TITLES = [
  'Inicio de palabras',
  'Primeras cadenas',
  'Rutas y refilones',
  'Columnas vivas',
  'Diagonal suave',
  'Ritmo constante',
  'Cascada abierta',
  'Diccionario amplio',
  'Palabras largas',
  'Estrategia profunda',
  'Letras raras',
  'Racha de puntos',
  'Cascada maestra',
  'Tablero denso',
  'Solo palabras largas',
  'Maestro de filas',
  'Vertigo vertical',
  'Diagonal dura',
  'Casi final',
  'Campeon del tablero',
]

function subtitleFor(level) {
  const t = smoothT(level)
  const pct = Math.round(t * 100)
  return `Dificultad ~${pct}% · objetivo ${targetScoreFor(level)} · sin limite de movimientos`
}

function buildLevel(level) {
  const dict = dictionaryFor(level)
  const guaranteed = guaranteedFor(level)

  if (level === 1) {
    return {
      level,
      title: TITLES[0],
      subtitle: 'Tutorial: busca palabras largas para mas puntos. Juega hasta agotar el tablero.',
      rows: 8,
      cols: 8,
      targetScore: targetScoreFor(1),
      minWordLength: minWordLengthFor(1),
      letterPool: letterPoolFor(1),
      dictionary: dict,
      guaranteedWords: guaranteed,
      initialBoard: LEVEL_1_BOARD.map((row) => [...row]),
      boardSeed: null,
      status: 'activo',
    }
  }

  return {
    level,
    title: TITLES[level - 1] ?? `Nivel ${level}`,
    subtitle: subtitleFor(level),
    rows: 8,
    cols: 8,
    targetScore: targetScoreFor(level),
    minWordLength: minWordLengthFor(level),
    letterPool: letterPoolFor(level),
    dictionary: dict,
    guaranteedWords: guaranteed,
    initialBoard: null,
    boardSeed: (level * 1103515245 + 12345) >>> 0,
    status: 'activo',
  }
}

export { SPANISH_DICT_SET as FULL_DICTIONARY_SET, SPANISH_DICT_ARRAY as FULL_DICTIONARY_ARRAY } from './spanishDict'

export const LEVELS = Array.from({ length: 20 }, (_, i) => buildLevel(i + 1))

export function getLevel(levelNumber) {
  return LEVELS[levelNumber - 1]
}
