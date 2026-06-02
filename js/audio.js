let _ctx = null
let _masterGain = null
let _muted = false
let _maxVolume = 1

export function setMuted(v) { _muted = !!v }
export function isMuted() { return _muted }

export function setMaxVolume(v) {
  _maxVolume = Math.max(0, Math.min(1, Number(v) || 0))
  if (_masterGain) _masterGain.gain.value = _maxVolume
}

export function resumeContext() {
  if (!_ctx) {
    _ctx = new (window.AudioContext || window.webkitAudioContext)()
    _masterGain = _ctx.createGain()
    _masterGain.gain.value = _maxVolume
    _masterGain.connect(_ctx.destination)
  }
  if (_ctx.state === 'suspended') _ctx.resume()
}

function _dest() { return _masterGain || (_ctx && _ctx.destination) }

// Tap cycles through a pentatonic scale so repeated hits feel musical
const PENTA = [523, 587, 659, 784, 880] // C5 D5 E5 G5 A5
let _tapIdx = 0
export function resetTapCycle() { _tapIdx = 0 }

export function playTap() {
  if (_muted) return
  try {
    resumeContext()
    const t = _ctx.currentTime
    const f = PENTA[_tapIdx % PENTA.length]
    _tapIdx++
    // Marimba: fundamental + 4th harmonic click transient
    _adsr(f,     'sine', t, 0, 0.28, 0.30)
    _adsr(f * 4, 'sine', t, 0, 0.06, 0.06)
  } catch(e) {}
}

export function playPrestige(stars) {
  if (_muted) return
  try {
    resumeContext()
    _prestige(stars, _ctx.currentTime)
  } catch(e) {}
}

// ── Primitives ───────────────────────────────────────────────────────────────

// Attack + exponential decay (no sustain) — good for marimba, piano, bells
function _adsr(freq, type, t, start, peak, dur) {
  const osc = _ctx.createOscillator()
  const g = _ctx.createGain()
  osc.type = type; osc.frequency.value = freq
  osc.connect(g); g.connect(_dest())
  const T = t + start
  g.gain.setValueAtTime(0.0001, T)
  g.gain.linearRampToValueAtTime(peak, T + 0.008)
  g.gain.exponentialRampToValueAtTime(0.0001, T + dur)
  osc.start(T); osc.stop(T + dur + 0.01)
}

// Piano note: harmonic series, each harmonic decaying at its own rate
function _piano(freq, t, start) {
  const h = [1,    2,    3,    4,    5   ]
  const a = [0.24, 0.12, 0.07, 0.04, 0.02]
  const d = [0.95, 0.62, 0.40, 0.26, 0.16]
  for (let i = 0; i < h.length; i++) _adsr(freq * h[i], 'sine', t, start, a[i], d[i])
}

// Vibraphone note: pure sine + tiny 2nd harmonic for slight metallic shimmer
function _vib(freq, t, start, peak, dur) {
  _adsr(freq,     'sine', t, start, peak,        dur)
  _adsr(freq * 2, 'sine', t, start, peak * 0.04, dur * 0.30)
}

// Brass note: sawtooth through lowpass with a filter-opening sweep on attack
function _brass(freq, t, start, dur) {
  const osc = _ctx.createOscillator()
  const flt = _ctx.createBiquadFilter()
  const g   = _ctx.createGain()
  osc.type = 'sawtooth'; osc.frequency.value = freq
  flt.type = 'lowpass'; flt.Q.value = 1.8
  flt.frequency.setValueAtTime(freq * 2.5, t + start)
  flt.frequency.linearRampToValueAtTime(freq * 6,   t + start + 0.06)
  flt.frequency.linearRampToValueAtTime(freq * 3.5, t + start + 0.28)
  osc.connect(flt); flt.connect(g); g.connect(_dest())
  g.gain.setValueAtTime(0.0001, t + start)
  g.gain.linearRampToValueAtTime(0.15, t + start + 0.04)
  g.gain.setValueAtTime(0.15, t + start + dur * 0.72)
  g.gain.exponentialRampToValueAtTime(0.0001, t + start + dur)
  osc.start(t + start); osc.stop(t + start + dur + 0.01)
}

// Strings: 3 detuned sawtooth voices through a soft lowpass, slow bow attack
function _strings(freq, t, start, dur) {
  ;[-7, 0, 7].forEach(det => {
    const osc = _ctx.createOscillator()
    const flt = _ctx.createBiquadFilter()
    const g   = _ctx.createGain()
    osc.type = 'sawtooth'; osc.frequency.value = freq; osc.detune.value = det
    flt.type = 'lowpass'; flt.frequency.value = freq * 4; flt.Q.value = 0.4
    osc.connect(flt); flt.connect(g); g.connect(_dest())
    g.gain.setValueAtTime(0.0001, t + start)
    g.gain.linearRampToValueAtTime(0.052, t + start + 0.18) // bow attack
    g.gain.setValueAtTime(0.052, t + start + dur * 0.72)
    g.gain.exponentialRampToValueAtTime(0.0001, t + start + dur)
    osc.start(t + start); osc.stop(t + start + dur + 0.01)
  })
}

// Timpani: sine with descending pitch glide
function _timpani(t) {
  const osc = _ctx.createOscillator()
  const g   = _ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(155, t)
  osc.frequency.exponentialRampToValueAtTime(78, t + 0.9)
  osc.connect(g); g.connect(_dest())
  g.gain.setValueAtTime(0.0001, t)
  g.gain.linearRampToValueAtTime(0.42, t + 0.008)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1)
  osc.start(t); osc.stop(t + 1.15)
}

// Cymbal crash: white noise through highpass
function _cymbal(t, dur) {
  const len  = Math.ceil(_ctx.sampleRate * dur)
  const buf  = _ctx.createBuffer(1, len, _ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
  const src = _ctx.createBufferSource()
  src.buffer = buf
  const flt = _ctx.createBiquadFilter()
  flt.type = 'highpass'; flt.frequency.value = 5500
  const g = _ctx.createGain()
  src.connect(flt); flt.connect(g); g.connect(_dest())
  g.gain.setValueAtTime(0.11, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  src.start(t); src.stop(t + dur + 0.01)
}

// ── Prestige sounds ──────────────────────────────────────────────────────────

function _prestige(stars, t) {
  if (stars === 1) {
    // Celesta: delicate ascending arpeggio in high register
    _vib(1047, t, 0.00, 0.20, 0.55)
    _vib(1319, t, 0.17, 0.20, 0.55)
    _vib(1568, t, 0.34, 0.20, 0.55)
    _vib(2093, t, 0.51, 0.18, 0.48)

  } else if (stars === 2) {
    // Vibraphone chord: C5 E5 G5 C6 lightly staggered
    _vib(523,  t, 0.00, 0.22, 0.82)
    _vib(659,  t, 0.04, 0.20, 0.82)
    _vib(784,  t, 0.08, 0.18, 0.80)
    _vib(1047, t, 0.12, 0.16, 0.76)

  } else if (stars === 3) {
    // Piano: full C major chord, bass + two hands
    _piano(131, t, 0.00)
    _piano(262, t, 0.02)
    _piano(330, t, 0.03)
    _piano(392, t, 0.04)
    _piano(523, t, 0.05)
    _piano(659, t, 0.06)

  } else if (stars === 4) {
    // Brass fanfare: two-phrase trumpet call
    _brass(196,  t, 0.00, 0.72)
    _brass(262,  t, 0.04, 0.68)
    _brass(330,  t, 0.08, 0.65)
    _brass(392,  t, 0.12, 0.62)
    _brass(523,  t, 0.42, 0.52)
    _brass(659,  t, 0.46, 0.48)
    _brass(784,  t, 0.50, 0.44)
    _brass(1047, t, 0.54, 0.40)

  } else {
    // Full orchestra: timpani + cymbal crash + strings swell + brass fanfare
    _timpani(t)
    _cymbal(t, 2.0)
    // String swell on C major
    _strings(131, t, 0.00, 2.0)
    _strings(262, t, 0.05, 1.9)
    _strings(330, t, 0.08, 1.85)
    _strings(392, t, 0.10, 1.80)
    _strings(523, t, 0.12, 1.75)
    // Brass first phrase
    _brass(196, t, 0.00, 1.80)
    _brass(262, t, 0.04, 1.75)
    _brass(330, t, 0.08, 1.70)
    _brass(392, t, 0.12, 1.65)
    // Ascending second phrase
    _brass(523, t, 0.52, 1.35)
    _brass(659, t, 0.57, 1.28)
    _brass(784, t, 0.62, 1.22)
    _brass(988, t, 0.67, 1.12)
    // Final sustained chord
    _brass(523,  t, 0.92, 1.00)
    _brass(659,  t, 0.92, 1.00)
    _brass(784,  t, 0.92, 1.00)
    _brass(1047, t, 0.92, 0.95)
    _strings(262, t, 0.82, 1.10)
    _strings(330, t, 0.82, 1.10)
    _strings(392, t, 0.82, 1.10)
    _strings(523, t, 0.82, 1.10)
  }
}
