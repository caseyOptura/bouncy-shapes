let _ctx = null
let _muted = false
export function setMuted(v) { _muted = !!v }
export function isMuted() { return _muted }
export function resumeContext() {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (_ctx.state === 'suspended') _ctx.resume()
}
export function playTap() {
  if (_muted) return
  try {
    resumeContext()
    const osc = _ctx.createOscillator()
    const gain = _ctx.createGain()
    osc.connect(gain)
    gain.connect(_ctx.destination)
    osc.frequency.value = 520
    gain.gain.setValueAtTime(0.0001, _ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.25, _ctx.currentTime + 0.005)
    gain.gain.exponentialRampToValueAtTime(0.0001, _ctx.currentTime + 0.13)
    osc.start(_ctx.currentTime)
    osc.stop(_ctx.currentTime + 0.13)
  } catch(e) {}
}
