import { THEMES, nextThemeIndex } from './themes.js'
import { update } from './physics.js'
import { draw } from './render.js'
import { resumeContext, playTap, setMuted, playPrestige, resetTapCycle, setMaxVolume } from './audio.js'
import { createShapes, recolorShapes } from './shapes.js'
import { state, setThemeIndex, setShapeCount, setSoundOn, addPoint, resetScore, addPlayTime } from './state.js'
import * as ui from './ui.js'
import { checkPrestige } from './prestige.js'
import { speak } from './speech.js'
import { buildParentSettings, checkBudgetWarning, resetBudgetWarning } from './settings.js'

const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')

const TAP_VY = -9
const TAP_VX_SCALE = 8

let W = 0
let H = 0
let shapes = []

// Prevent iOS edge-swipe navigation
document.addEventListener('touchstart', e => { if (e.target === canvas) e.preventDefault() }, { passive: false })
document.addEventListener('touchmove', e => e.preventDefault(), { passive: false })

function resize() {
  W = canvas.width = window.innerWidth
  H = canvas.height = window.innerHeight
}

function applyTheme() {
  const theme = THEMES[state.themeIndex]
  document.body.style.background = theme.background
  recolorShapes(shapes, theme)
  ui.setThemeName(theme.name)
}

function rebuildShapes() {
  const theme = THEMES[state.themeIndex]
  shapes = createShapes(state.shapeCount, W, H, theme)
}

function getTapPos(e) {
  const rect = canvas.getBoundingClientRect()
  const sx = canvas.width / rect.width
  const sy = canvas.height / rect.height
  const src = e.changedTouches ? e.changedTouches[0] : e
  return {
    x: (src.clientX - rect.left) * sx,
    y: (src.clientY - rect.top) * sy,
  }
}

canvas.addEventListener('pointerdown', e => {
  e.preventDefault()
  resumeContext()
  const pos = getTapPos(e)

  let hit = null
  let closest = Infinity

  for (const s of shapes) {
    const dist = Math.hypot(pos.x - s.x, pos.y - s.y)
    if (dist <= s.r && dist < closest) {
      hit = s
      closest = dist
    }
  }

  if (hit) {
    const offset = Math.max(-1, Math.min(1, (pos.x - hit.x) / hit.r))
    hit.vx = -offset * TAP_VX_SCALE
    hit.vy = TAP_VY
    playTap()
    addPoint()
    ui.setScore(state.score)
    ui.setBest(state.highScore)
    const stars = checkPrestige(state.score)
    if (stars) {
      ui.showPrestige(stars)
      if (state.soundOn) playPrestige(stars)
    }
  }
}, { passive: false })

ui.buildUI({
  onThemeChange() {
    setThemeIndex(nextThemeIndex(state.themeIndex))
    applyTheme()
  },
  onShapeCountChange(delta) {
    if (state.shapeLocked) return
    setShapeCount(state.shapeCount + delta)
    ui.setShapeCountLabel(state.shapeCount)
    rebuildShapes()
  },
  onSoundToggle() {
    setSoundOn(!state.soundOn)
    setMuted(!state.soundOn)
    ui.setSoundLabel(state.soundOn)
  },
  onResetScore() {
    resetScore()
    ui.setScore(state.score)
  },
})

buildParentSettings({
  onShapeLockChange(locked) {
    ui.setShapeButtonsDisabled(locked)
  },
})

// Apply initial mute state
setMuted(!state.soundOn)
// Apply initial max volume
setMaxVolume(state.maxVolume)

// Apply initial theme and sync UI
resize()
rebuildShapes()
applyTheme()
ui.setScore(state.score)
ui.setBest(state.highScore)
ui.setShapeCountLabel(state.shapeCount)
ui.setSoundLabel(state.soundOn)
ui.setShapeButtonsDisabled(state.shapeLocked)

window.addEventListener('resize', () => {
  resize()
  rebuildShapes()
})

let _lastFrameTime = performance.now()

function loop() {
  const now = performance.now()
  const elapsed = now - _lastFrameTime
  _lastFrameTime = now

  // Playtime tracking — accumulate per animation frame
  addPlayTime(elapsed)
  checkBudgetWarning(state.playTimeMs)

  if (update(shapes, W, H) && state.score > 0) {
    const name = state.childName ? `${state.childName}, g` : 'G'
    speak(`${name}ood try! Let's go again!`)
    resetScore()
    resetTapCycle()
    resetBudgetWarning()
    ui.setScore(state.score)
  }
  draw(ctx, shapes, W, H)
  requestAnimationFrame(loop)
}

loop()
