import { loadState, saveState } from './storage.js'
import { MIN_SHAPES, MAX_SHAPES } from './shapes.js'
const persisted = loadState()
export const state = {
  themeIndex: persisted.themeIndex,
  shapeCount: persisted.shapeCount,
  soundOn: persisted.soundOn,
  highScore: persisted.highScore,
  score: 0,
}
function persist() { saveState(state) }
export function setThemeIndex(i) { state.themeIndex = i; persist() }
export function setShapeCount(n) { state.shapeCount = Math.max(MIN_SHAPES, Math.min(MAX_SHAPES, n)); persist() }
export function setSoundOn(b) { state.soundOn = !!b; persist() }
export function addPoint() {
  state.score += 1
  if (state.score > state.highScore) { state.highScore = state.score; persist(); return true }
  return false
}
export function resetScore() { state.score = 0; state.highScore = 0; persist() }
