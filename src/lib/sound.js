// ---------------------------------------------------------------------------
// Tiny WebAudio sound kit — no asset files, synthesized on the fly.
// All playback is gated behind the user's soundEnabled setting.
// ---------------------------------------------------------------------------
let ctx = null

function getCtx() {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  return ctx
}

function tone(freq, start, dur, { type = 'sine', gain = 0.12 } = {}) {
  const ac = getCtx()
  if (!ac) return
  const osc = ac.createOscillator()
  const g = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, ac.currentTime + start)
  g.gain.setValueAtTime(0, ac.currentTime + start)
  g.gain.linearRampToValueAtTime(gain, ac.currentTime + start + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + start + dur)
  osc.connect(g).connect(ac.destination)
  osc.start(ac.currentTime + start)
  osc.stop(ac.currentTime + start + dur + 0.02)
}

export const sounds = {
  tick(enabled) {
    if (!enabled) return
    tone(620, 0, 0.07, { type: 'triangle', gain: 0.07 })
  },
  score(enabled) {
    if (!enabled) return
    tone(523.25, 0, 0.12, { type: 'triangle', gain: 0.09 })
    tone(783.99, 0.06, 0.14, { type: 'triangle', gain: 0.08 })
  },
  undo(enabled) {
    if (!enabled) return
    tone(330, 0, 0.1, { type: 'sine', gain: 0.08 })
    tone(220, 0.05, 0.12, { type: 'sine', gain: 0.07 })
  },
  win(enabled) {
    if (!enabled) return
    const notes = [523.25, 659.25, 783.99, 1046.5]
    notes.forEach((n, i) => tone(n, i * 0.12, 0.32, { type: 'triangle', gain: 0.11 }))
    tone(1318.5, 0.5, 0.5, { type: 'triangle', gain: 0.09 })
  },
  bust(enabled) {
    if (!enabled) return
    tone(311.13, 0, 0.18, { type: 'sawtooth', gain: 0.08 })
    tone(207.65, 0.1, 0.3, { type: 'sawtooth', gain: 0.08 })
  },
}
