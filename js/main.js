import { THEMES, nextThemeIndex } from './themes.js'
import { update } from './physics.js'
import { draw } from './render.js'
import { resumeContext, playTap, setMuted } from './audio.js'
import { createShapes, recolorShapes } from './shapes.js'
import { state, setThemeIndex, setShapeCount, setSoundOn, addPoint, resetScore } from './state.js'
import * as ui from './ui.js'

const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')

const TAP_VY = -9
const TAP_VX_SCALE = 8

let W = 0
let H = 0
let shapes = []

// Prevent iOS edge-swipe navigation
document.addEventListener('touchstart', e => e.preventDefault(), { passive: false })
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
  }
}, { passive: false })

ui.buildUI({
  onThemeChange() {
    setThemeIndex(nextThemeIndex(state.themeIndex))
    applyTheme()
  },
  onShapeCountChange(delta) {
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

// Apply initial mute state
setMuted(!state.soundOn)

// Apply initial theme and sync UI
resize()
rebuildShapes()
applyTheme()
ui.setScore(state.score)
ui.setBest(state.highScore)
ui.setShapeCountLabel(state.shapeCount)
ui.setSoundLabel(state.soundOn)

window.addEventListener('resize', () => {
  resize()
  rebuildShapes()
})

function loop() {
  update(shapes, W, H)
  draw(ctx, shapes, W, H)
  requestAnimationFrame(loop)
}

loop()
