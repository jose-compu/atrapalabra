let audioCtx = null

const SOUND_LEVEL = 3.2
const SOUND_GAIN_CAP = 0.38

function ctx() {
  if (!audioCtx) {
    audioCtx = new window.AudioContext()
  }
  return audioCtx
}

function playTone({ frequency, duration, type = 'sine', volume = 0.04, delay = 0 }) {
  const context = ctx()
  const now = context.currentTime + delay
  const oscillator = context.createOscillator()
  const gainNode = context.createGain()
  const peak = Math.min(SOUND_GAIN_CAP, volume * SOUND_LEVEL)

  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, now)

  gainNode.gain.setValueAtTime(0.0001, now)
  gainNode.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), now + 0.02)
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration)

  oscillator.connect(gainNode)
  gainNode.connect(context.destination)
  oscillator.start(now)
  oscillator.stop(now + duration + 0.05)
}

export function playSelectSound() {
  playTone({ frequency: 320, duration: 0.06, type: 'triangle', volume: 0.025 })
}

export function playScoreTickSound() {
  playTone({ frequency: 440, duration: 0.022, type: 'triangle', volume: 0.006 })
}

export function playErrorSound() {
  playTone({ frequency: 180, duration: 0.14, type: 'sawtooth', volume: 0.03 })
}

export function playWordFailSound() {
  playTone({ frequency: 240, duration: 0.1, type: 'sawtooth', volume: 0.03 })
  playTone({ frequency: 180, duration: 0.12, type: 'sawtooth', volume: 0.028, delay: 0.07 })
}

/**
 * Sonido de palabra valida parametrizado por longitud y combo.
 * Palabras cortas (3): arpeggio ascendente rapido.
 * Palabras medias (4-5): arpeggio + remate alto.
 * Palabras largas (6+): escalera completa + acorde final.
 * Combo alto (>=3): se añade eco grave.
 */
export function playWordSuccessSound(wordLength = 4, combo = 1) {
  const len = Math.max(3, wordLength)
  const vol = 0.033

  if (len <= 3) {
    playTone({ frequency: 392, duration: 0.07, type: 'triangle', volume: vol })
    playTone({ frequency: 523, duration: 0.09, type: 'triangle', volume: vol, delay: 0.06 })
    playTone({ frequency: 659, duration: 0.12, type: 'triangle', volume: vol, delay: 0.12 })
  } else if (len <= 5) {
    playTone({ frequency: 349, duration: 0.06, type: 'triangle', volume: vol })
    playTone({ frequency: 440, duration: 0.07, type: 'triangle', volume: vol, delay: 0.05 })
    playTone({ frequency: 523, duration: 0.07, type: 'triangle', volume: vol, delay: 0.10 })
    playTone({ frequency: 659, duration: 0.10, type: 'triangle', volume: vol, delay: 0.16 })
    playTone({ frequency: 784, duration: 0.14, type: 'square', volume: vol * 0.7, delay: 0.24 })
  } else {
    const scale = [330, 392, 440, 523, 587, 659, 784, 880]
    const steps = Math.min(len, scale.length)
    for (let i = 0; i < steps; i++) {
      playTone({
        frequency: scale[i],
        duration: 0.06 + i * 0.005,
        type: 'triangle',
        volume: vol * (0.85 + i * 0.02),
        delay: i * 0.055,
      })
    }
    const last = steps * 0.055
    playTone({ frequency: 1047, duration: 0.18, type: 'square', volume: vol * 0.65, delay: last })
    playTone({ frequency: 784, duration: 0.16, type: 'triangle', volume: vol * 0.5, delay: last })
  }

  if (combo >= 3) {
    const base = len <= 3 ? 0.16 : len <= 5 ? 0.30 : Math.min(len, 8) * 0.055 + 0.06
    playTone({ frequency: 196, duration: 0.18, type: 'sine', volume: vol * 0.55, delay: base })
    playTone({ frequency: 262, duration: 0.14, type: 'sine', volume: vol * 0.45, delay: base + 0.08 })
  }

  if (combo >= 5) {
    const base = len <= 3 ? 0.24 : len <= 5 ? 0.38 : Math.min(len, 8) * 0.055 + 0.14
    playTone({ frequency: 1175, duration: 0.08, type: 'square', volume: vol * 0.35, delay: base })
  }
}

/**
 * Sonido de cascada: un breve arpeggio descendente (mas notas si la cascada fue grande).
 */
export function playCascadeSound(cascadeBonus = 0) {
  if (cascadeBonus <= 0) return
  const vol = 0.026
  const steps = Math.min(6, Math.max(2, Math.ceil(cascadeBonus / 10)))
  const freqs = [880, 784, 659, 587, 523, 440]
  for (let i = 0; i < steps; i++) {
    playTone({
      frequency: freqs[i],
      duration: 0.07 + i * 0.01,
      type: 'triangle',
      volume: vol,
      delay: i * 0.06,
    })
  }
}

/**
 * Nivel completado: fanfarria corta original, estilo 8-bit con aire alegre.
 */
export function playWinSound() {
  const vol = 0.026
  const chip = 'square'
  const notes = [
    { f: 392.0, d: 0.07, delay: 0.0 },
    { f: 493.88, d: 0.07, delay: 0.09 },
    { f: 587.33, d: 0.08, delay: 0.18 },
    { f: 783.99, d: 0.1, delay: 0.28 },
    { f: 659.25, d: 0.06, delay: 0.42 },
    { f: 739.99, d: 0.06, delay: 0.5 },
    { f: 880.0, d: 0.11, delay: 0.58 },
    { f: 783.99, d: 0.08, delay: 0.71 },
    { f: 987.77, d: 0.09, delay: 0.81 },
    { f: 1174.66, d: 0.22, delay: 0.92 },
  ]
  for (const { f, d, delay } of notes) {
    playTone({ frequency: f, duration: d, type: chip, volume: vol, delay })
  }
  playTone({ frequency: 587.33, duration: 0.22, type: 'triangle', volume: vol * 0.5, delay: 0.92 })
}
